import { supabase } from './supabase';
import type { ReceiptData, ReceiptStudent, FeeReceipt } from './supabase';

/** Safe numeric coercion */
function N(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return Number.isNaN(n) ? 0 : n; }
  return 0;
}

/**
 * Generate receipt data from a saved payment record.
 * All fee/balance math matches FeeManager exactly.
 */
export async function generateReceiptData(
  paymentId: string,
  schoolId: string,
): Promise<ReceiptData | null> {
  if (!paymentId?.trim() || !schoolId?.trim()) {
    console.error('[generateReceiptData] Invalid paymentId or schoolId');
    return null;
  }

  try {
    // 1. Payment — use the current 'payments' table
    const { data: payment, error: payErr } = await supabase
      .from('payments').select('*').eq('id', paymentId).single();
    if (payErr || !payment) return null;

    // 2. School + Parent + Balance in parallel
    const [{ data: school }, { data: parent }, { data: balanceRow }] = await Promise.all([
      supabase.from('schools').select('school_name, contact, logo_url').eq('id', schoolId).single(),
      supabase.from('parents').select('first_name, last_name, contact, cnic').eq('id', payment.parent_id).single(),
      supabase.from('parent_balances').select('balance, total_charged, total_paid').eq('parent_id', payment.parent_id).single(),
    ]);

    // 3. Students + Classes in parallel
    const [{ data: students }, { data: classesRows }] = await Promise.all([
      supabase
        .from('students')
        .select('id, first_name, last_name, monthly_fee, current_monthly_fee, discount_type, discount_value, admission_class_id')
        .eq('parent_id', payment.parent_id)
        .eq('school_id', schoolId)
        .eq('active', true),
      supabase.from('classes').select('id, name, monthly_fee').eq('school_id', schoolId),
    ]);

    // Build class fee map by class id
    const classMap = new Map<string, { name: string; monthly_fee: number }>();
    (classesRows || []).forEach((c: any) => classMap.set(c.id, { name: c.name, monthly_fee: N(c.monthly_fee) }));

    // Build receipt students — use current_monthly_fee from DB (already discounted)
    const receiptStudents: ReceiptStudent[] = (students || []).map((s: any) => {
      const cls = classMap.get(s.admission_class_id);
      const classFee = cls?.monthly_fee || N(s.monthly_fee) || 0;
      const finalFee = N(s.current_monthly_fee) || classFee;
      const discount = Math.max(0, classFee - finalFee);
      return {
        name: `${s.first_name} ${s.last_name}`.trim(),
        class_name: cls?.name || '—',
        monthly_fee: classFee,
        discount_type: s.discount_type,
        discount_value: discount,
        final_fee: finalFee,
      };
    });

    // Summary totals
    const grossFee = receiptStudents.reduce((sum, s) => sum + s.monthly_fee, 0);
    const totalDiscount = receiptStudents.reduce((sum, s) => sum + (s.discount_value || 0), 0);
    const netMonthly = receiptStudents.reduce((sum, s) => sum + s.final_fee, 0);

    // Balance — use parent_balances view (single source of truth from ledger)
    const thisPayment = N(payment.received_amount);
    // The balance in parent_balances is AFTER this payment (ledger already has this credit entry)
    // balance = total_paid - total_charged (negative = owes money)
    const currentBalance = N(balanceRow?.balance) || 0;
    const previousBalance = currentBalance + thisPayment; // What it was BEFORE this payment
    const newBalance = currentBalance;

    return {
      receipt_no: '',
      date: new Date(payment.received_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
      school: { name: school?.school_name || '—', address: school?.contact || '—', contact: school?.contact || '—', logo_url: school?.logo_url || '' },
      parent: { name: `${parent?.first_name || ''} ${parent?.last_name || ''}`.trim(), contact: parent?.contact || '—', cnic: parent?.cnic || '—' },
      students: receiptStudents,
      summary: {
        gross_fee: grossFee,
        total_discount: totalDiscount,
        net_monthly: netMonthly,
        previous_balance: Math.abs(previousBalance),
        total_payable: Math.abs(previousBalance),
        payment_received: thisPayment,
        new_balance: Math.abs(newBalance),
        is_cleared: newBalance >= 0,
      },
      payment: {
        method: payment.payment_method || 'Cash',
        months_paid: [],
        months_count: 0,
      },
    };
  } catch (error) {
    console.error('[generateReceiptData] error:', error);
    return null;
  }
}

/**
 * Save receipt to database and return it with a generated receipt_no.
 */
export async function saveReceipt(
  receiptData: ReceiptData,
  paymentId: string,
  schoolId: string,
  parentId: string,
): Promise<FeeReceipt | null> {
  if (!paymentId?.trim() || !schoolId?.trim() || !parentId?.trim() || !receiptData) {
    console.error('[saveReceipt] Missing required fields');
    return null;
  }

  try {
    let nextNum = 1;
    try {
      const { data: last } = await supabase
        .from('fee_receipts').select('receipt_no')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false }).limit(1);
      if (last?.length && last[0]?.receipt_no) {
        const m = last[0].receipt_no.match(/\d+$/);
        if (m) nextNum = parseInt(m[0], 10) + 1;
      }
    } catch (_) {}

    const receiptNo = `R${String(nextNum).padStart(5, '0')}`;
    const finalData = { ...receiptData, receipt_no: receiptNo };

    await supabase.from('fee_receipts').insert({
      receipt_no: receiptNo,
      school_id: schoolId,
      parent_id: parentId,
      payment_id: paymentId,
      receipt_data: finalData,
      sent_via: [],
    });

    return {
      id: paymentId,
      receipt_no: receiptNo,
      school_id: schoolId,
      parent_id: parentId,
      payment_id: paymentId,
      receipt_data: finalData,
      sent_via: [],
      created_at: new Date().toISOString(),
    } as FeeReceipt;
  } catch (error) {
    console.error('[saveReceipt] error:', error);
    return null;
  }
}

/** Format number as Pakistani Rupees */
export function formatCurrency(value: number): string {
  return `Rs ${value.toLocaleString()}`;
}

/** Format "YYYY-MM" as "Mar 2026" */
export function formatMonth(ym: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(ym.slice(5, 7), 10) - 1] || '?'} ${ym.slice(0, 4)}`;
}

/** Fetch existing receipt for a payment from DB */
export async function getReceiptByPayment(paymentId: string): Promise<FeeReceipt | null> {
  if (!paymentId?.trim()) return null;
  try {
    const { data, error } = await supabase
      .from('fee_receipts').select('*').eq('payment_id', paymentId.trim()).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as FeeReceipt;
  } catch (error) {
    console.error('[getReceiptByPayment] error:', error);
    return null;
  }
}
