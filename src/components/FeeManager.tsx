import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { Button } from './ui/Button';
import {
  Search, Receipt, X, Trash2, Phone, CreditCard,
  CheckCircle, ArrowLeft, ChevronRight
} from 'lucide-react';
import './FeeManager.css';

/* ── Types ────────────────────────────────────────────────────── */

type FeeBill = {
  id: string;
  school_id: string;
  parent_id: string;
  billing_month: string;
  children_data: {
    student_id: string;
    name: string;
    class_name: string;
    date_of_admission: string;
    original_fee: number;
    discount_type: string | null;
    discount_value: number | null;
    monthly_fee: number;
  }[];
  total_fee: number;
  carried_forward: number;
  amount_paid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overpaid';
  payment_id: string | null;
  created_at: string;
  updated_at: string;
};

type FeePayment = {
  id: string;
  school_id: string;
  parent_id: string;
  amount: number;
  months_paid: string[];
  months_count: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
};

type Parent = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  cnic: string;
  contact: string;
  address: string | null;
};

type StudentWithClass = {
  id: string;
  school_id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  monthly_fee: number;
  discount_type: string | null;
  discount_value: number | null;
  date_of_admission: string | null;
  admission_class_id: string | null;
  active: boolean;
  classes: { name: string; monthly_fee: number } | null;
};

/* ── Helpers ──────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).toISOString().split('T')[0];
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shortMonth(ym: string): string {
  const m = parseInt(ym.split('-')[1], 10) - 1;
  return MONTH_NAMES[m];
}

function getMonthWindow(): string[] {
  const now = new Date();
  const cm = now.getMonth();
  const cy = now.getFullYear();
  const months: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(cy, cm + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

/* ── Component ──────────────────────────────────────────────────── */

export const FeeManager = ({ schoolId }: { schoolId: string }) => {
  const { flash, showFlash } = useFlashMessage(4000);

  /* State */
  const [parents, setParents]           = useState<Parent[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [bills, setBills]                 = useState<FeeBill[]>([]);
  const [payments, setPayments]           = useState<FeePayment[]>([]);
  const [children, setChildren]           = useState<StudentWithClass[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate]     = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes]   = useState('');
  const [saving, setSaving]               = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<FeePayment | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [focusedMonth, setFocusedMonth]   = useState<string | null>(null);

  /* ── Load parents ──────────────────────────────────────────── */

  const loadParents = async () => {
    setLoading(true);
    const [{ data: pData }, { data: sData }] = await Promise.all([
      supabase.from('parents').select('*').eq('school_id', schoolId).order('first_name'),
      supabase.from('students').select('parent_id').eq('school_id', schoolId).eq('active', true),
    ]);
    const pList = pData || [];
    setParents(pList);
    const counts: Record<string, number> = {};
    (sData || []).forEach((s: any) => { counts[s.parent_id] = (counts[s.parent_id] || 0) + 1; });
    setStudentCounts(counts);
    setLoading(false);
  };

  useEffect(() => { loadParents(); }, [schoolId]);

  /* ── Derived: month window ────────────────────────────────── */

  const monthWindow = useMemo(getMonthWindow, []);

  /* ── Load parent detail ─────────────────────────────────────── */

  const loadParentDetail = useCallback(async (parent: Parent) => {
    setSelectedParent(parent);
    setBills([]);
    setPayments([]);
    setChildren([]);
    setFocusedMonth(null);

    const [billsRes, paymentsRes, childrenRes] = await Promise.all([
      supabase.from('fee_bills').select('*').eq('parent_id', parent.id).eq('school_id', schoolId).order('billing_month'),
      supabase.from('fee_payments').select('*').eq('parent_id', parent.id).eq('school_id', schoolId).order('created_at', { ascending: false }),
      supabase.from('students').select('*, classes:admission_class_id(name, monthly_fee)').eq('parent_id', parent.id).eq('school_id', schoolId).eq('active', true),
    ]);

    const bList = (billsRes.data || []) as FeeBill[];
    setBills(bList);
    setPayments(paymentsRes.data || []);
    setChildren((childrenRes.data || []) as StudentWithClass[]);

    // Ensure bills exist for the 7-month window
    await ensureBillsForWindow(parent.id, bList);
  }, [schoolId]);

  /* ── Ensure bills exist for month window ──────────────────── */

  const ensureBillsForWindow = async (parentId: string, existingBills: FeeBill[]) => {
    const existingMap: Record<string, FeeBill> = {};
    existingBills.forEach(b => { existingMap[b.billing_month] = b; });

    // Months that need bills: missing entirely OR pending (stale data from before students existed)
    const monthsToProcess = monthWindow.filter(m => {
      const existing = existingMap[m];
      return !existing || existing.status === 'pending';
    });

    // Fetch all active students for this parent
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, admission_class_id, school_id, parent_id')
      .eq('parent_id', parentId)
      .eq('school_id', schoolId)
      .eq('active', true);

    // Fetch class info for fee display
    const classIds = [...new Set((allStudents || []).map((s: any) => s.admission_class_id).filter(Boolean))];
    let classNameMap: Record<string, string> = {};
    let classFeeMap: Record<string, number> = {};
    if (classIds.length > 0) {
      const { data: classRows } = await supabase
        .from('classes').select('id, name, monthly_fee').in('id', classIds);
      (classRows || []).forEach((c: any) => {
        classNameMap[c.id] = c.name || '';
        classFeeMap[c.id] = parseInt(c.monthly_fee || '0', 10);
      });
    }

    for (const month of monthsToProcess) {
      const cutoff = lastDayOfMonth(month);
      const existing = existingMap[month];

      // Filter students admitted on or before this month
      const admitted = (allStudents || []).filter((s: any) => {
        if (!s.date_of_admission) return true; // no date = include
        return s.date_of_admission <= cutoff;
      });

      if (admitted.length === 0) {
        // Empty bill — no children admitted yet
        const emptyPayload = {
          school_id: schoolId,
          parent_id: parentId,
          billing_month: month,
          children_data: [],
          total_fee: 0,
          carried_forward: 0,
          amount_paid: 0,
          balance: 0,
          status: 'pending' as const,
        };
        if (existing) {
          await supabase.from('fee_bills').update(emptyPayload).eq('id', existing.id);
        } else {
          await supabase.from('fee_bills').insert(emptyPayload);
        }
        continue;
      }

      // Build children_data
      const childrenData = admitted.map((s: any) => {
        const originalFee = classFeeMap[s.admission_class_id] || 0;
        return {
          student_id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          class_name: classNameMap[s.admission_class_id] || '—',
          date_of_admission: s.date_of_admission || '',
          original_fee: originalFee,
          discount_type: s.discount_type,
          discount_value: s.discount_value,
          monthly_fee: s.monthly_fee || 0,
        };
      });

      const totalFee = admitted.reduce((sum: number, s: any) => sum + (s.monthly_fee || 0), 0);

      // Compute carried_forward from previous month's bill
      const pm = prevMonth(month);
      const prevBill = existingBills.find(b => b.billing_month === pm);
      let cf = 0;
      if (prevBill) {
        cf = prevBill.balance;
      }

      const billPayload = {
        school_id: schoolId,
        parent_id: parentId,
        billing_month: month,
        children_data: childrenData,
        total_fee: totalFee,
        carried_forward: cf,
        amount_paid: 0,
        balance: totalFee + cf,
        status: 'pending' as const,
      };

      if (existing) {
        await supabase.from('fee_bills').update(billPayload).eq('id', existing.id);
      } else {
        await supabase.from('fee_bills').insert(billPayload);
      }
    }

    // Reload bills after generating/updating
    const { data: freshBills } = await supabase
      .from('fee_bills').select('*')
      .eq('parent_id', parentId)
      .eq('school_id', schoolId)
      .order('billing_month');
    setBills(freshBills || []);
  };

  /* ── Select parent ─────────────────────────────────────────── */

  const selectParent = (p: Parent) => {
    setSelectedParent(p);
    setMobileShowDetail(true);
    loadParentDetail(p);
  };

  /* ── Filtered parents ────────────────────────────────────────── */

  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;
    const q = search.toLowerCase();
    return parents.filter(p =>
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.cnic.includes(q) ||
      p.contact.includes(q)
    );
  }, [parents, search]);

  /* ── Parent status helpers ───────────────────────────────────── */

  const billsByMonth = useMemo(() => {
    const map: Record<string, FeeBill> = {};
    bills.forEach(b => { map[b.billing_month] = b; });
    return map;
  }, [bills]);

  const currentMonthBill = billsByMonth[currentMonth()];

  const getParentStatus = useCallback((_parentId: string): { dot: string; balance: number } => {
    const bill = billsByMonth[currentMonth()];
    if (!bill || bill.status === 'pending' && bill.carried_forward === 0 && bill.total_fee === 0) {
      return { dot: 'gray', balance: 0 };
    }
    if (bill.status === 'paid' || bill.status === 'overpaid') return { dot: 'green', balance: bill.balance };
    if (bill.status === 'partial') return { dot: 'amber', balance: bill.balance };
    return { dot: 'gray', balance: 0 };
  }, [billsByMonth]);

  const currentMonthlyFee = useMemo(() => {
    return children.reduce((sum: number, c: StudentWithClass) => sum + (c.monthly_fee || 0), 0);
  }, [children]);

  /* ── Payment modal ─────────────────────────────────────────── */

  const openPaymentModal = () => {
    if (children.length === 0) return;
    setSelectedMonths(new Set());
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  const totalForSelected = useMemo(() => {
    let total = 0;
    selectedMonths.forEach(month => {
      const bill = billsByMonth[month];
      if (bill) total += bill.total_fee + bill.carried_forward;
    });
    return total;
  }, [selectedMonths, billsByMonth]);

  const canSelectMonth = (month: string) => {
    const bill = billsByMonth[month];
    if (!bill) return false;
    if (bill.status !== 'pending') return false;
    if (bill.total_fee === 0 && bill.carried_forward === 0) return false;
    return true;
  };

  const netBalance = totalForSelected - parseInt(paymentAmount || '0', 10);

  const recordPayment = async () => {
    if (selectedMonths.size === 0 || !paymentAmount || parseInt(paymentAmount) <= 0) {
      showFlash('Error: Select at least one month and enter a valid amount');
      return;
    }
    setSaving(true);

    try {
      // Sort selected months chronologically
      const sorted = Array.from(selectedMonths).sort();

      // Ensure all bills exist
      for (const month of sorted) {
        if (!billsByMonth[month]) {
          await ensureBillsForWindow(selectedParent!.id, bills);
          break; // ensureBillsForWindow will regenerate all, reload below
        }
      }

      // Reload bills after potential generation
      const { data: freshBills } = await supabase
        .from('fee_bills').select('*')
        .eq('parent_id', selectedParent!.id)
        .eq('school_id', schoolId)
        .order('billing_month');

      const freshMap: Record<string, FeeBill> = {};
      (freshBills || []).forEach((b: any) => { freshMap[b.billing_month] = b; });

      // Distribution algorithm
      const amt = parseInt(paymentAmount, 10);
      let remaining = amt;
      const updates: { id: string; amount_paid: number; balance: number; status: string; payment_id: string }[] = [];

      for (const month of sorted) {
        const bill = freshMap[month];
        if (!bill) continue;
        const billTotal = bill.total_fee + bill.carried_forward;

        if (remaining >= billTotal) {
          updates.push({
            id: bill.id,
            amount_paid: bill.amount_paid + billTotal,
            balance: 0,
            status: 'paid',
            payment_id: '',
          });
          remaining -= billTotal;
        } else {
          const newPaid = bill.amount_paid + remaining;
          const newBalance = billTotal - newPaid;
          updates.push({
            id: bill.id,
            amount_paid: newPaid,
            balance: newBalance,
            status: newBalance > 0 ? 'partial' : newBalance === 0 ? 'paid' : 'overpaid',
            payment_id: '',
          });
          remaining = 0;
          break;
        }
      }

      // If remaining surplus, add to last touched month
      if (remaining > 0 && updates.length > 0) {
        const last = updates[updates.length - 1];
        last.amount_paid += remaining;
        last.balance = (freshMap[sorted[sorted.length - 1]]?.total_fee || 0) +
                          (freshMap[sorted[sorted.length - 1]]?.carried_forward || 0) -
                          last.amount_paid;
        last.status = 'overpaid';
      }

      // Insert payment
      const { data: payData, error: payErr } = await supabase.from('fee_payments').insert({
        school_id: schoolId,
        parent_id: selectedParent!.id,
        amount: amt,
        months_paid: sorted,
        months_count: sorted.length,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        notes: paymentNotes || null,
      }).select('id').single();

      if (payErr) throw payErr;

      // Update bills
      for (const u of updates) {
        u.payment_id = payData!.id;
      }
      const { error: updateErr } = await supabase.from('fee_bills').upsert(updates);
      if (updateErr) throw updateErr;

      showFlash(`Payment of Rs ${amt.toLocaleString()} recorded for ${sorted.length} month${sorted.length > 1 ? 's' : ''}!`);
      setShowPaymentModal(false);
      // Reload detail
      loadParentDetail(selectedParent!);
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to record payment'));
    }

    setSaving(false);
  };

  /* ── Delete payment ──────────────────────────────────────────── */

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      // Find bills linked to this payment
      const linkedBills = bills.filter(b => b.payment_id === deleteTarget.id);

      // Revert each bill
      for (const bill of linkedBills) {
        const revertedPaid = Math.max(0, bill.amount_paid - deleteTarget.amount);
        const newBalance = bill.total_fee + bill.carried_forward - revertedPaid;
        const newStatus = newBalance > 0 ? 'partial' : newBalance === 0 ? 'paid' : (bill.carried_forward < 0 && revertedPaid === 0 ? 'pending' : newBalance < 0 ? 'overpaid' : 'pending');

        await supabase.from('fee_bills').update({
          amount_paid: revertedPaid,
          balance: newBalance,
          status: newStatus,
          payment_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', bill.id);
      }

      // Delete payment
      const { error } = await supabase.from('fee_payments').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      showFlash('Payment deleted successfully');
      setDeleteTarget(null);
      loadParentDetail(selectedParent!);
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to delete payment'));
    }

    setDeleting(false);
  };

  /* ── Focused month detail ─────────────────────────────────────── */

  const focusedBill = focusedMonth ? billsByMonth[focusedMonth] : null;

  /* ── Loading ─────────────────────────────────────────────────── */

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading…</span></div>;

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className="fee-shell">
      {/* ── Left Panel ── */}
      <div className="fee-parents-panel" style={{ display: mobileShowDetail ? 'none' : 'flex' }}>
        <div className="fee-parents-search">
          <div className="fee-search-input">
            <Search size={16} />
            <input placeholder="Search by name, CNIC or contact…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="fee-parents-list">
          {filteredParents.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              {parents.length === 0 ? 'No parents yet' : 'No results found'}
            </div>
          ) : (
            filteredParents.map(p => {
              const status = getParentStatus(p.id);
              return (
                <div
                  key={p.id}
                  className={`fee-parent-card${selectedParent?.id === p.id ? ' active' : ''}`}
                  onClick={() => selectParent(p)}
                >
                  <div className="fee-parent-avatar">
                    {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                  </div>
                  <div className="fee-parent-info">
                    <div className="fee-parent-name">{p.first_name} {p.last_name}</div>
                    <div className="fee-parent-contact">{p.contact}</div>
                  </div>
                  <div className="fee-parent-meta">
                    <span className="fee-children-badge">{studentCounts[p.id] || 0}</span>
                    <span className={`fee-status-dot ${status.dot}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="fee-detail-panel" style={{ display: !selectedParent && !mobileShowDetail ? 'none' : undefined }}>
        {!selectedParent ? (
          <div className="fee-empty-state">
            <Receipt size={52} />
            <p>Select a parent to view fee details</p>
            <small>Search by name, CNIC, or contact number</small>
          </div>
        ) : focusedMonth && focusedBill ? (
          /* ── Focused Month Detail ── */
          <div className="fee-month-detail">
            <div className="fee-month-detail-title">
              <button onClick={() => setFocusedMonth(null)}>
                <ArrowLeft size={18} />
              </button>
              {formatMonth(focusedMonth)}
              {focusedBill.status !== 'pending' && (
                <span className={`fee-month-status ${focusedBill.status === 'paid' ? 'paid' : focusedBill.status === 'overpaid' ? 'advance' : 'partial'}`}>
                  {focusedBill.status === 'paid' ? '✓ Paid' : focusedBill.status === 'overpaid' ? '↻ Advance' : '● Partial'}
                </span>
              )}
              <ChevronRight size={16} style={{ opacity: 0.3 }} />
            </div>

            {/* Children snapshot */}
            <div className="fee-section-title">Children ({focusedBill.children_data.length})</div>
            {focusedBill.children_data.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', padding: '0.5rem 0' }}>No children enrolled at this time.</p>
            ) : (
              <table className="fee-children-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Class</th><th>Fee</th><th>Discount</th><th>Final Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {focusedBill.children_data.map((c, i) => (
                    <tr key={c.student_id || i}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.class_name}</td>
                      <td>Rs {(c.original_fee || 0).toLocaleString()}</td>
                      <td>
                        {c.discount_type && c.discount_value ? (
                          <span className="discount-text">
                            {c.discount_type === 'percentage' ? `${c.discount_value}%` : `Rs ${(c.discount_value || 0).toLocaleString()}`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="fee-final">Rs {(c.monthly_fee || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="fee-row-total">
                    <td /><td /><td>Rs {(focusedBill.total_fee || 0).toLocaleString()}</td><td /><td />
                  </tr>
                </tbody>
              </table>
            )}

            {/* Bill summary */}
            <div className="fee-bill-summary">
              <div className="fee-bill-row">
                <span>Monthly Fee</span>
                <span>Rs {(focusedBill.total_fee || 0).toLocaleString()}</span>
              </div>
              <div className="fee-bill-row">
                <span>+ Carry Forward</span>
                <span>{focusedBill.carried_forward > 0 ? `Rs ${focusedBill.carried_forward.toLocaleString()}` : focusedBill.carried_forward < 0 ? `(Rs ${Math.abs(focusedBill.carried_forward).toLocaleString()} advance)` : '—'}</span>
              </div>
              <div className="fee-bill-row total">
                <span>Total Due</span>
                <span>Rs {(focusedBill.total_fee + focusedBill.carried_forward).toLocaleString()}</span>
              </div>
              <div className="fee-bill-row">
                <span>- Paid</span>
                <span>Rs {(focusedBill.amount_paid || 0).toLocaleString()}</span>
              </div>
              <div className={`fee-bill-row total ${focusedBill.balance > 0 ? 'balance-positive' : focusedBill.balance < 0 ? 'balance-negative' : ''}`}>
                <span>Balance</span>
                <span>
                  {focusedBill.balance === 0 ? '—' : focusedBill.balance > 0
                    ? `Rs ${focusedBill.balance.toLocaleString()} (unpaid)`
                    : `Rs ${Math.abs(focusedBill.balance).toLocaleString()} (advance)`
                  }
                </span>
              </div>
            </div>

            {/* Payment records for this month */}
            {focusedBill.payment_id && (
              <div className="fee-section-title" style={{ marginTop: '1.25rem' }}>Payment Record</div>
            )}
            {focusedBill.payment_id ? (
              <div className="fee-payment-history-list">
                {payments.filter(p => p.id === focusedBill.payment_id).map(p => (
                  <div key={p.id} className="fee-payment-row">
                    <span className="fee-payment-date">{new Date(p.payment_date).toLocaleDateString('en-PK')}</span>
                    <span className="fee-payment-method">{p.payment_method}</span>
                    <span className="fee-payment-amount">Rs {p.amount.toLocaleString()}</span>
                    {p.notes && <span className="fee-payment-method">{p.notes}</span>}
                  </div>
                ))}
              </div>
            ) : focusedBill.status !== 'pending' ? (
              <div className="fee-payment-history-list">
                {payments.filter(p => p.months_paid.includes(focusedMonth)).map(p => (
                  <div key={p.id} className="fee-payment-row">
                    <span className="fee-payment-date">{new Date(p.payment_date).toLocaleDateString('en-PK')}</span>
                    <span className="fee-payment-method">{p.payment_method}</span>
                    <span className="fee-payment-amount">Rs {p.amount.toLocaleString()}</span>
                    {p.notes && <span className="fee-payment-method">{p.notes}</span>}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          /* ── Default Year Overview ── */
          <div className="animate-fade-up">
            {/* Mobile back button */}
            <button className="fee-back-btn" onClick={() => { setSelectedParent(null); setMobileShowDetail(false); }}>
              <ArrowLeft size={16} /> Back to parents
            </button>

            {/* Parent header */}
            <div className="fee-parent-header">
              <div>
                <div className="fee-parent-header-name">{selectedParent.first_name} {selectedParent.last_name}</div>
                <div className="fee-parent-header-details">
                  <span><Phone size={12} /> {selectedParent.contact}</span>
                  {selectedParent.cnic && <span style={{ fontSize: '11px' }}>{selectedParent.cnic.slice(0, 8)}…</span>}
                </div>
              </div>
              {currentMonthBill && currentMonthBill.status !== 'pending' && (
                <div className="fee-parent-header-balance">
                  <div className={`balance-amount ${currentMonthBill.balance > 0 ? 'positive' : currentMonthBill.balance < 0 ? 'negative' : 'zero'}`}>
                    {currentMonthBill.balance > 0
                      ? `Rs ${currentMonthBill.balance.toLocaleString()} due`
                      : currentMonthBill.balance < 0
                        ? `Rs ${Math.abs(currentMonthBill.balance).toLocaleString()} advance`
                        : '—'
                    }
                  </div>
                  <div className="balance-label">
                    {currentMonthBill.balance > 0 ? 'unpaid balance' : currentMonthBill.balance < 0 ? 'credit' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Children */}
            {children.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                No active children enrolled.
              </div>
            ) : (
              <>
                <div className="fee-section-title">Children ({children.length})</div>
                <table className="fee-children-table">
                  <thead>
                    <tr>
                      <th>Student</th><th>Class</th><th>Fee</th><th>Discount</th><th>Final Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                        <td>{(c.classes as any)?.name || '—'}</td>
                        <td>Rs {(c.classes as any)?.monthly_fee ? parseInt((c.classes as any).monthly_fee, 10).toLocaleString() : '—'}</td>
                        <td>
                          {c.discount_type && c.discount_value ? (
                            <span className="discount-text">
                              {c.discount_type === 'percentage' ? `${c.discount_value}%` : `Rs ${(c.discount_value).toLocaleString()}`}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="fee-final">Rs {(c.monthly_fee || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="fee-row-total">
                      <td /><td /><td /><td /><td />
                    </tr>
                  </tbody>
                </table>
                <div className="fee-monthly-total">
                  <span className="fee-monthly-total-label">Monthly Fee Total</span>
                  <span className="fee-monthly-total-amount">Rs {currentMonthlyFee.toLocaleString()}</span>
                </div>
              </>
            )}

            {/* 12-month grid */}
            <div className="fee-section-title">Fee Status — {new Date().getFullYear()}</div>
            <div className="fee-month-grid">
              {Array.from({ length: 12 }, (_, i) => {
                const y = new Date().getFullYear();
                const m = String(i + 1).padStart(2, '0');
                const ym = `${y}-${m}`;
                const bill = billsByMonth[ym];
                const isActiveMonth = m === String(new Date().getMonth() + 1).padStart(2, '0');

                let statusClass = 'pending';
                let statusLabel = '';
                let badgeClass = '';
                if (bill) {
                  if (bill.status === 'paid') { statusClass = 'paid'; statusLabel = '✓ Paid'; badgeClass = 'paid'; }
                  else if (bill.status === 'overpaid') { statusClass = 'overpaid'; statusLabel = '↻ Advance'; badgeClass = 'paid'; }
                  else if (bill.status === 'partial') { statusClass = 'partial'; statusLabel = '● Partial'; badgeClass = 'due'; }
                  else if (bill.total_fee > 0 || bill.carried_forward > 0) { statusClass = 'pending'; statusLabel = '○ Due'; badgeClass = 'due'; }
                } else {
                  statusClass = 'empty';
                }

                const showCard = bill || isActiveMonth || i < parseInt(String(new Date().getMonth() + 1).padStart(2, '0'));

                if (!showCard) return null;

                return (
                  <div
                    key={ym}
                    className={`fee-month-card ${statusClass}${bill ? '' : ' empty'}`}
                    onClick={() => bill && bill.status !== 'pending' && setFocusedMonth(ym)}
                  >
                    <div className="fee-month-name">{MONTH_NAMES[i]}</div>
                    <div className="fee-month-fee">
                      {bill ? `Rs ${(bill.total_fee + bill.carried_forward).toLocaleString()}` : '—'}
                    </div>
                    <div className={`fee-month-badge ${badgeClass}`}>
                      {statusLabel}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment history */}
            <div className="fee-section-title">Payment History</div>
            {payments.length === 0 ? (
              <div className="fee-no-payments">No payments recorded yet.</div>
            ) : (
              <div className="fee-payment-history-list">
                {payments.map(p => (
                  <div key={p.id} className="fee-payment-row">
                    <span className="fee-payment-date">{new Date(p.payment_date).toLocaleDateString('en-PK')}</span>
                    <span className="fee-payment-months">
                      {p.months_paid.map(m => shortMonth(m)).join(', ')}
                    </span>
                    <span className="fee-payment-amount">Rs {p.amount.toLocaleString()}</span>
                    <span className="fee-payment-method">{p.payment_method}</span>
                    <button
                      className="fee-payment-delete"
                      onClick={() => setDeleteTarget(p)}
                      title="Delete payment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Record Payment button */}
            <div className="fee-record-btn">
              <Button
                onClick={openPaymentModal}
                disabled={children.length === 0}
                fullWidth
              >
                <Receipt size={18} /> Record Payment
              </Button>
            </div>

            {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <Trash2 size={40} color="var(--danger)" />
            <h3>Delete this payment?</h3>
            <p>
              Rs {deleteTarget.amount.toLocaleString()} recorded on {new Date(deleteTarget.payment_date).toLocaleDateString('en-PK')}
              {' '}for {deleteTarget.months_paid.map(m => shortMonth(m)).join(', ')}.
            </p>
            <div className="confirm-box-btns">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeletePayment} isLoading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && selectedParent && (
        <div className="fee-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}>
          <div className="fee-modal" onClick={e => e.stopPropagation()}>
            {/* Head */}
            <div className="fee-modal-head">
              <h3>Record Payment — {selectedParent.first_name} {selectedParent.last_name}</h3>
              <button className="fee-modal-close" onClick={() => setShowPaymentModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="fee-modal-body">
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Select months and enter the amount received:
              </div>

              {/* Month list */}
              <div className="fee-modal-months">
                {monthWindow.map(month => {
                  const bill = billsByMonth[month];
                  const isSelected = selectedMonths.has(month);
                  const isDisabled = !canSelectMonth(month);

                  return (
                    <div
                      key={month}
                      className={`fee-modal-month-row${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                      onClick={() => !isDisabled && toggleMonth(month)}
                    >
                      <div className={`checkbox${isSelected || isDisabled ? ' checked' : ''}`}>
                        {(isSelected || isDisabled) && <CheckCircle size={12} />}
                      </div>
                      <div className="fee-modal-month-info">
                        <div className="fee-modal-month-name">{formatMonth(month)}</div>
                        <div className="fee-modal-month-fee">
                          {bill
                            ? `Rs ${(bill.total_fee + bill.carried_forward).toLocaleString()}${bill.carried_forward > 0 ? ' (incl. carry fwd)' : ''}`
                            : '—'
                          }
                        </div>
                      </div>
                      <div className={`fee-modal-month-badge ${bill && bill.status !== 'pending' ? 'paid' : 'due'}`}>
                        {bill && bill.status !== 'pending' ? '✓ Paid' : '○ Due'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {selectedMonths.size > 0 && (
                <div className="fee-modal-summary">
                  <div className="fee-modal-summary-row">
                    <span>{selectedMonths.size} month{selectedMonths.size > 1 ? 's' : ''} selected</span>
                  </div>
                  <div className="fee-modal-summary-row total">
                    <span>Total Due</span>
                    <span>Rs {totalForSelected.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Remaining indicator */}
              {paymentAmount && parseInt(paymentAmount) > 0 && selectedMonths.size > 0 && (
                <div className={`fee-modal-remaining ${netBalance > 0 ? 'warning' : netBalance < 0 ? 'advance' : netBalance === 0 ? 'paid' : 'neutral'}`}>
                  {netBalance > 0 && <ChevronRight size={14} />}
                  {netBalance < 0 && <ChevronRight size={14} />}
                  {netBalance === 0 && <CheckCircle size={14} />}
                  <span>
                    {netBalance > 0
                      ? `Rs ${Math.abs(netBalance).toLocaleString()} remaining after payment`
                      : netBalance < 0
                        ? `Rs ${Math.abs(netBalance).toLocaleString()} advance after payment`
                        : 'Exact amount — fully paid!'
                    }
                  </span>
                </div>
              )}

              {/* Amount input */}
              <div className="fee-modal-amount-label">
                Amount Received (Rs) *
              </div>
              <input
                type="number"
                className="fee-modal-amount-input"
                placeholder="Enter amount received…"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                min="1"
                step="1"
                autoFocus
              />

              {/* Form fields */}
              <div className="fee-modal-fields">
                <div className="fee-modal-field">
                  <label>Payment Method *</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="fee-modal-field">
                  <label>Payment Date *</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                </div>
                <div className="fee-modal-field full">
                  <label>Notes (optional)</label>
                  <input type="text" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Any additional notes…" />
                </div>
              </div>
            </div>

            {/* Foot */}
            <div className="fee-modal-foot">
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button
                onClick={recordPayment}
                isLoading={saving}
                disabled={selectedMonths.size === 0 || !paymentAmount || parseInt(paymentAmount) <= 0}
              >
                <CreditCard size={16} /> Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
