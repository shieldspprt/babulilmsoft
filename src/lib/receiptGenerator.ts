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
        .select('school_name, contact, logo_url')
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
      .select('first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, classes(name, monthly_fee)')
      .eq('parent_id', payment.parent_id)
      .eq('active', true)
      .eq('school_id', schoolId);

    // Build student array
    // Discount is calculated on the CLASS fee — same as FeeManager (line 728-729)
    const receiptStudents: ReceiptStudent[] = (students || []).map((s: any) => {
      const classFee = Number(s.classes?.monthly_fee) || Number(s.monthly_fee) || 0;
      const baseFee = Number(s.monthly_fee) || 0;
      let discount = 0;
      if (s.discount_type === 'percentage') {
        // Percentage of CLASS fee (matches FeeManager's calculation)
        discount = classFee * (Number(s.discount_value) || 0) / 100;
      } else if (s.discount_type === 'fixed' || s.discount_type === 'amount') {
        discount = Number(s.discount_value) || 0;
      }
      return {
        name: `${s.first_name} ${s.last_name}`,
        class_name: s.classes?.name || '—',
        monthly_fee: classFee,
        discount_type: s.discount_type,
        discount_value: discount,
        final_fee: baseFee  // Student's actual monthly fee
      };
    });

    // Calculate totals
    const grossFee = receiptStudents.reduce((sum, s) => sum + s.monthly_fee, 0);
    const totalDiscount = receiptStudents.reduce((sum, s) => sum + (s.discount_value || 0), 0);
    // netMonthly uses the student's actual fees (sum of final_fee)
    // This matches FeeManager's: monthlyFee = children.reduce((s, c) => s + N(c.monthly_fee), 0)
    const netMonthly = receiptStudents.reduce((sum, s) => sum + s.final_fee, 0);

    // ═══ BALANCE CALCULATION — Matches FeeManager's fee-balance-badge exactly ═══
    //
    // FeeManager displays: runningBalance = totalOwed − totalPaid
    //   where  totalOwed   = payableMonths.length × netMonthly
    //          totalPaid   = Σ(all payment amounts)
    //
    // The receipt is generated AFTER the payment is inserted, so allPayments
    // already includes this payment.  To recover the balance the user saw
    // on the parent page BEFORE paying, we subtract this payment back out.
    //
    //   previousBalance  = totalOwed − (totalPaid − thisPayment)
    //                    = totalOwed − totalPaid + thisPayment
    //   newBalance       = previousBalance − thisPayment
    //                    = totalOwed − totalPaid   ← what badge shows after refresh

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

    // Get ALL payments for this parent (includes the payment just recorded)
    const { data: allPayments } = await supabase
      .from('fee_payments')
      .select('amount')
      .eq('parent_id', payment.parent_id)
      .eq('school_id', schoolId);

    // Safe numeric coercion (PostgreSQL numeric comes as string)
    const toNum = (v: unknown): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') { const n = parseFloat(v); return Number.isNaN(n) ? 0 : n; }
      return 0;
    };

    const totalOwed = payableMonths.length * netMonthly;
    const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + toNum(p.amount), 0);
    const totalPaymentReceived = toNum(payment.amount);

    // Previous balance = what the fee-balance-badge showed BEFORE this payment
    const previousBalance = totalOwed - totalPaid + totalPaymentReceived;

    // New balance = what the badge will show AFTER this payment
    const newBalance = previousBalance - totalPaymentReceived;

    // Total payable = previous balance (the amount that was due before payment)
    const totalPayable = previousBalance;


    const receiptData: ReceiptData = {
      receipt_no: '',
      date: payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
      school: { name: school?.school_name || '—', address: school?.contact || '—', contact: school?.contact || '—', logo_url: school?.logo_url || '' },
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
  // Input validation
  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
    console.error('Invalid paymentId: must be a non-empty string');
    return null;
  }
  if (!schoolId || typeof schoolId !== 'string' || schoolId.trim() === '') {
    console.error('Invalid schoolId: must be a non-empty string');
    return null;
  }
  if (!parentId || typeof parentId !== 'string' || parentId.trim() === '') {
    console.error('Invalid parentId: must be a non-empty string');
    return null;
  }
  if (!receiptData || typeof receiptData !== 'object') {
    console.error('Invalid receiptData: must be an object');
    return null;
  }

  try {
    // Generate receipt number client-side (no RPC needed)
    let nextNum = 1;
    try {
      const { data: lastReceipt, error: lastErr } = await supabase
        .from('fee_receipts')
        .select('receipt_no')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(1);
      console.log('[saveReceipt] last receipts:', lastReceipt, 'error:', lastErr);
      if (lastReceipt && lastReceipt.length > 0 && lastReceipt[0].receipt_no) {
        const match = lastReceipt[0].receipt_no.match(/\d+$/);
        if (match) nextNum = parseInt(match[0], 10) + 1;
      }
    } catch (e) { console.error('[saveReceipt] error fetching last receipt:', e); }

    const receiptNo = `R${String(nextNum).padStart(5, '0')}`;
    console.log('[saveReceipt] inserting with receiptNo:', receiptNo);
    const finalData = { ...receiptData, receipt_no: receiptNo };
    const { data, error } = await supabase.from('fee_receipts').insert({
      receipt_no: receiptNo, school_id: schoolId, parent_id: parentId, payment_id: paymentId, receipt_data: finalData, sent_via: []
    }).select();

    console.log('[saveReceipt] insert result:', data, 'error:', error);
    if (error) throw error;
    // Return a minimal FeeReceipt object — the important thing is receipt_no is set
    return { id: paymentId, receipt_no: receiptNo, school_id: schoolId, parent_id: parentId, payment_id: paymentId, receipt_data: finalData, sent_via: [], created_at: new Date().toISOString() } as FeeReceipt;
  } catch (error) {
    console.error('[saveReceipt] final error:', error);
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
  // Input validation
  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim() === '') {
    console.error('Invalid paymentId: must be a non-empty string');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('fee_receipts')
      .select('*')
      .eq('payment_id', paymentId.trim())
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
