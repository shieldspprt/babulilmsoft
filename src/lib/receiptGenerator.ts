import { supabase } from './supabase';
import type { ReceiptData, ReceiptStudent, FeeReceipt } from './supabase';

/**
 * Generate receipt data from payment record
 */
export async function generateReceiptData(
  paymentId: string,
  schoolId: string
): Promise<ReceiptData | null> {
  try {
    // Fetch payment
    const { data: payment } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    if (!payment) return null;

    // Fetch school
    const { data: school } = await supabase
      .from('schools')
      .select('school_name, contact')
      .eq('id', schoolId)
      .single();

    // Fetch parent
    const { data: parent } = await supabase
      .from('parents')
      .select('first_name, last_name, contact, cnic')
      .eq('id', payment.parent_id)
      .single();

    // Fetch students with classes
    const { data: students } = await supabase
      .from('students')
      .select('first_name, last_name, monthly_fee, discount_type, discount_value, classes(name)')
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
        monthly_fee: baseFee,
        discount_type: s.discount_type,
        discount_value: discount,
        final_fee: Math.max(0, baseFee - discount)
      };
    });

    // Calculate totals
    const grossFee = receiptStudents.reduce((sum, s) => sum + s.monthly_fee, 0);
    const totalDiscount = receiptStudents.reduce((sum, s) => sum + s.discount_value, 0);
    const netMonthly = grossFee - totalDiscount;

        // CORRECT BALANCE CALCULATION
    // Step 1: Calculate payable months from admission to current month
    const { data: studentsWithAdmissions } = await supabase
      .from('students')
      .select('date_of_admission, monthly_fee, discount_type, discount_value, classes(name)')
      .eq('parent_id', payment.parent_id)
      .eq('active', true)
      .eq('school_id', schoolId);
    
    // Get earliest admission month
    const admissionMonths = (studentsWithAdmissions || [])
      .map((s: any) => s.date_of_admission?.slice(0, 7))
      .filter((m: string | null): m is string => !!m)
      .sort();
    const firstAdmissionMonth = admissionMonths[0] || new Date().toISOString().slice(0, 7);
    
    // Calculate months from admission to now
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [startY, startM] = firstAdmissionMonth.split('-').map(Number);
    const [endY, endM] = currentMonth.split('-').map(Number);
    let payableMonthsCount = 0;
    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      payableMonthsCount++;
      m++;
      if (m > 12) { m = 1; y++; }
    }
    
    // Step 2: Get all payments before this one
    const { data: allPayments } = await supabase
      .from('fee_payments')
      .select('id, amount, created_at')
      .eq('parent_id', payment.parent_id)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: true });
    
    // Calculate total paid BEFORE this payment (by ID or by creation time)
    const currentPaymentIndex = allPayments?.findIndex((p: any) => p.id === payment.id) ?? -1;
    const paymentsBefore = currentPaymentIndex >= 0 
      ? allPayments?.slice(0, currentPaymentIndex) 
      : allPayments?.filter((p: any) => new Date(p.created_at) < new Date(payment.created_at));
    
    const totalPaidBefore = paymentsBefore?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    
    // Step 3: Calculate balances
    const totalPaymentReceived = Number(payment.amount);
    const totalOwedTillNow = payableMonthsCount * netMonthly;
    const previousBalance = totalOwedTillNow - totalPaidBefore;
    const totalPayable = previousBalance;
    const newBalance = previousBalance - totalPaymentReceived;

    const receiptData: ReceiptData = {
      receipt_no: '',
      date: payment.payment_date || new Date().toISOString().split('T')[0],
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
