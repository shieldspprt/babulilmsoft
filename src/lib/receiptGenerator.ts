import { supabase } from './supabase';
import type { ReceiptData, ReceiptStudent, FeeReceipt } from './supabase';

/**
 * Generate receipt data from payment record
 */
export async function generateReceiptData(
  paymentId: string,
  schoolId: string
): Promise<ReceiptData | null> {
  // Input validation
  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
    console.error('Invalid paymentId: must be a non-empty string');
    return null;
  }
  if (!schoolId || typeof schoolId !== 'string' || schoolId.trim() === '') {
    console.error('Invalid schoolId: must be a non-empty string');
    return null;
  }

  try {
    // Fetch payment first since we need it for parent_id lookup
    const { data: payment, error: paymentError } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (paymentError || !payment) return null;

    // Fetch school and parent in parallel now that we have payment.parent_id
    const [{ data: school }, { data: parent }] = await Promise.all([
      supabase
        .from('schools')
        .select('school_name, contact')
        .eq('id', schoolId)
        .single(),
      supabase
        .from('parents')
        .select('first_name, last_name, contact, cnic')
        .eq('id', payment.parent_id)
        .single()
    ]);
    
    // Fetch students with classes
    const { data: students } = await supabase
      .from('students')
      .select('first_name, last_name, monthly_fee, discount_type, discount_value, classes(name, monthly_fee)')
      .eq('parent_id', payment.parent_id)
      .eq('active', true)
      .eq('school_id', schoolId);

    // Build student array
    const receiptStudents: ReceiptStudent[] = (students || []).map((s: any) => {
      const baseFee = Number(s.monthly_fee) || 0;
      let discount = 0;
      if (s.discount_type === 'percentage') {
        discount = baseFee * (Number(s.discount_value) || 0) / 100;
      } else if (s.discount_type === 'fixed') {
        discount = Number(s.discount_value) || 0;
      }
      return {
        name: `${s.first_name} ${s.last_name}`,
        class_name: s.classes?.name || '—',
        monthly_fee: Number(s.classes?.monthly_fee) || baseFee,
        discount_type: s.discount_type,
        discount_value: discount,
        final_fee: baseFee  // Student's actual monthly fee
      };
    });

    // Calculate totals
    const grossFee = receiptStudents.reduce((sum, s) => sum + s.monthly_fee, 0);
    const totalDiscount = receiptStudents.reduce((sum, s) => sum + s.discount_value, 0);
    const netMonthly = grossFee - totalDiscount;

        // CORRECT BALANCE CALCULATION - Match FeeManager exactly
    // Get admission months from all students
    const admissionMonths = (students || [])
      .map((s: any) => s.date_of_admission?.slice(0, 7))
      .filter((m: string | null): m is string => !!m)
      .sort();
    const firstAdmissionMonth = admissionMonths[0] || new Date().toISOString().slice(0, 7);
    
    // Calculate payable months (same as FeeManager's getBillableMonths)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [startY, startM] = firstAdmissionMonth.split('-').map(Number);
    const [endY, endM] = currentMonth.split('-').map(Number);
    const payableMonths: string[] = [];
    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      payableMonths.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    
    // Get ALL payments for this parent (same logic as FeeManager)
    const { data: allPayments } = await supabase
      .from('fee_payments')
      .select('amount, months_paid')
      .eq('parent_id', payment.parent_id)
      .eq('school_id', schoolId);

    // Same calculation as FeeManager:
    // touched months = union of all months paid across all payments
    const touchedMonths = new Set<string>();
    allPayments?.forEach((p: any) => {
      (p.months_paid || []).forEach((m: string) => touchedMonths.add(m));
    });
    
    // unpaid months = payable months not in touchedMonths
    const unpaidMonths = payableMonths.filter(m => !touchedMonths.has(m));
    
    // paidMonthsBalance = unpaid months × netMonthly (what's still owed)
    // THIS is the previous balance - same as FeeManager shows
    const paidMonthsBalance = unpaidMonths.length * netMonthly;
    
    // Previous balance = what parent owes (paidMonthsBalance)
    const previousBalance = paidMonthsBalance;
    
    // This payment
    const totalPaymentReceived = Number(payment.amount);
    
    // Total Payable = previous balance (before this payment)
    const totalPayable = previousBalance;
    
    // New Balance = previous balance - this payment
    const newBalance = previousBalance - totalPaymentReceived;


    const receiptData: ReceiptData = {
      receipt_no: '',
      date: payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
      school: { name: school?.school_name || '—', address: school?.contact || '—', contact: school?.contact || '—' },
      parent: { name: `${parent?.first_name || ''} ${parent?.last_name || ''}`.trim(), contact: parent?.contact || '—', cnic: parent?.cnic || '—' },
      students: receiptStudents,
      summary: { gross_fee: grossFee, total_discount: totalDiscount, net_monthly: netMonthly, previous_balance: previousBalance, total_payable: totalPayable, payment_received: totalPaymentReceived, new_balance: newBalance, is_cleared: newBalance <= 0 },
      payment: { method: payment.payment_method || 'Cash', months_paid: payment.months_paid || [], months_count: payment.months_count || (payment.months_paid || []).length }
    };

    return receiptData;
  } catch (error) {
    console.error('Error generating receipt:', error);
    return null;
  }
}

/**
 * Save receipt to database
 */
export async function saveReceipt(receiptData: ReceiptData, paymentId: string, schoolId: string, parentId: string): Promise<FeeReceipt | null> {
  try {
    const { data: receiptNo, error: rpcError } = await supabase.rpc('generate_receipt_no', { p_school_id: schoolId });
    if (rpcError) throw rpcError;

    const finalData = { ...receiptData, receipt_no: receiptNo };
    const { data, error } = await supabase.from('fee_receipts').insert({
      receipt_no: receiptNo, school_id: schoolId, parent_id: parentId, payment_id: paymentId, receipt_data: finalData, sent_via: []
    }).select().single();

    if (error) throw error;
    return data as FeeReceipt;
  } catch (error) {
    console.error('Error saving receipt:', error);
    return null;
  }
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return `Rs ${value.toLocaleString()}`;
}

/**
 * Format month
 */
export function formatMonth(ym: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(ym.slice(5, 7)) - 1;
  return `${months[m]} ${ym.slice(0, 4)}`;
}

/**
 * Fetch existing receipt by payment ID
 */
export async function getReceiptByPayment(paymentId: string): Promise<FeeReceipt | null> {
  try {
    const { data, error } = await supabase
      .from('fee_receipts')
      .select('*')
      .eq('payment_id', paymentId)
      .single();
    
    if (error) {
      // No receipt found (PGRST116 = no rows)
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data as FeeReceipt;
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return null;
  }
}
