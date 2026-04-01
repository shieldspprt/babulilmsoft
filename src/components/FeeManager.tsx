import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { Button } from './ui/Button';
import {
  Search, Receipt, Trash2, Phone, CreditCard,
  CheckCircle, ArrowLeft
} from 'lucide-react';
import './FeeManager.css';

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

type FeeBill = {
  id: string;
  school_id: string;
  parent_id: string;
  billing_month: string;
  children_data: any[];
  total_fee: number;
  carried_forward: number;
  amount_paid: number;
  balance: number;
  status: string;
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

type StudentRow = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  monthly_fee: string | number;
  discount_type: string | null;
  discount_value: string | number | null;
  date_of_admission: string | null;
  admission_class_id: string | null;
  active: boolean;
  classes: { name: string; monthly_fee: string | number } | null;
};

/* ═══════════════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════════════ */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];

/** Safe numeric coercion for PostgreSQL numeric values (returned as strings) */
function N(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthStr(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1); // JS month is 0-based, so m gives next month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shortMonth(ym: string): string {
  const m = parseInt(ym.split('-')[1], 10) - 1;
  return MONTH_NAMES[m];
}

/** Earliest admission month among all children */
function getAdmissionMonth(students: StudentRow[]): string {
  const dates = students
    .map(s => s.date_of_admission)
    .filter(Boolean)
    .map(d => d!.slice(0, 7))
    .sort();
  return dates.length > 0 ? dates[0] : currentMonthStr();
}

/** All months from startYm to endYm inclusive (YYYY-MM format) */
function getBillableMonths(startYm: string, endYm: string): string[] {
  const months: string[] = [];
  const [sy, sm] = startYm.split('-').map(Number);
  const [ey, em] = endYm.split('-').map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

/** Parse raw Supabase row → FeeBill */
function parseBill(raw: any): FeeBill {
  return {
    id: raw.id,
    school_id: raw.school_id,
    parent_id: raw.parent_id,
    billing_month: raw.billing_month,
    children_data: raw.children_data || [],
    total_fee: N(raw.total_fee),
    carried_forward: N(raw.carried_forward),
    amount_paid: N(raw.amount_paid),
    balance: N(raw.balance),
    status: raw.status || 'pending',
    payment_id: raw.payment_id || null,
    created_at: raw.created_at || '',
    updated_at: raw.updated_at || '',
  };
}

/** Parse raw Supabase row → FeePayment */
function parsePayment(raw: any): FeePayment {
  return {
    id: raw.id,
    school_id: raw.school_id,
    parent_id: raw.parent_id,
    amount: N(raw.amount),
    months_paid: raw.months_paid || [],
    months_count: N(raw.months_count),
    payment_date: raw.payment_date || '',
    payment_method: raw.payment_method || 'Cash',
    notes: raw.notes || null,
    created_at: raw.created_at || '',
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════ */

export const FeeManager = ({ schoolId }: { schoolId: string }) => {
  const { flash, showFlash } = useFlashMessage(4000);

  // ── State ──────────────────────────────────────────────────────
  const [parents, setParents] = useState<Parent[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [parentPaidCurrentMonth, setParentPaidCurrentMonth] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [bills, setBills] = useState<FeeBill[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [children, setChildren] = useState<StudentRow[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeePayment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // ── Load parents (list panel) ──────────────────────────────────
  const loadParents = async () => {
    setLoading(true);
    try {
      const [{ data: pData }, { data: sData }] = await Promise.all([
        supabase.from('parents').select('*').eq('school_id', schoolId).order('first_name'),
        supabase.from('students').select('parent_id').eq('school_id', schoolId).eq('active', true),
      ]);
      const parentList = pData || [];
      setParents(parentList);

      const counts: Record<string, number> = {};
      (sData || []).forEach((s: any) => {
        counts[s.parent_id] = (counts[s.parent_id] || 0) + 1;
      });
      setStudentCounts(counts);

      // Dot indicator: is current month paid for each parent?
      const cm = currentMonthStr();
      const parentIdList = parentList.map((p: any) => p.id);
      if (parentIdList.length > 0) {
        const { data: paidBills } = await supabase
          .from('fee_bills')
          .select('parent_id')
          .eq('school_id', schoolId)
          .eq('billing_month', cm)
          .eq('status', 'paid')
          .in('parent_id', parentIdList);

        const paidSet = new Set((paidBills || []).map((b: any) => b.parent_id));
        const map: Record<string, boolean> = {};
        parentList.forEach((p: any) => { map[p.id] = paidSet.has(p.id); });
        setParentPaidCurrentMonth(map);
      }
    } catch (err: any) {
      showFlash('Error loading parents: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  };

  useEffect(() => { loadParents(); }, [schoolId]);

  // ── Load parent detail (no generateBills — just fetch data) ────
  const loadParentDetail = useCallback(async (parent: Parent) => {
    setSelectedParent(parent);
    setBills([]);
    setPayments([]);
    setChildren([]);
    setSelectedMonths(new Set());
    setPaymentAmount('');
    setPaymentNotes('');

    try {
      const [billsRes, paymentsRes, childrenRes] = await Promise.all([
        supabase.from('fee_bills').select('*')
          .eq('parent_id', parent.id)
          .eq('school_id', schoolId)
          .eq('status', 'paid')
          .order('billing_month'),
        supabase.from('fee_payments').select('*')
          .eq('parent_id', parent.id)
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false }),
        supabase.from('students')
          .select('id, parent_id, first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, admission_class_id, active, classes(name, monthly_fee)')
          .eq('parent_id', parent.id)
          .eq('school_id', schoolId)
          .eq('active', true),
      ]);

      setBills((billsRes.data || []).map(parseBill));
      setPayments((paymentsRes.data || []).map(parsePayment));
      setChildren((childrenRes.data || []) as unknown as StudentRow[]);
    } catch (err: any) {
      showFlash('Error loading parent detail: ' + (err.message || 'Unknown error'));
    }
  }, [schoolId, showFlash]);

  // ── Select parent ──────────────────────────────────────────────
  const selectParent = useCallback((p: Parent) => {
    setSelectedParent(p);
    setMobileShowDetail(true);
    loadParentDetail(p);
  }, [loadParentDetail]);

  // ── Filtered parents ───────────────────────────────────────────
  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;
    const q = search.toLowerCase();
    return parents.filter(p =>
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      (p.cnic && p.cnic.includes(q)) ||
      (p.contact && p.contact.includes(q))
    );
  }, [parents, search]);

  // ── Derived: monthly fee (sum of all children's monthly_fee) ──
  const monthlyFee = useMemo(() => {
    return children.reduce((sum, c) => sum + N(c.monthly_fee), 0);
  }, [children]);

  // ── Derived: admission month (earliest child admission) ────────
  const admissionMonth = useMemo(() => getAdmissionMonth(children), [children]);

  // ── Derived: billable months (admission → current month) ──────
  const billableMonths = useMemo(() => {
    if (children.length === 0) return [];
    return getBillableMonths(admissionMonth, currentMonthStr());
  }, [children.length, admissionMonth]);

  // ── Derived: paid bills tracking ──────────────────────────────
  const paidMonthsSet = useMemo(() => new Set(bills.map(b => b.billing_month)), [bills]);
  const lastPaidBill = bills.length > 0 ? bills[bills.length - 1] : null;
  const lastPaidBalance = lastPaidBill ? lastPaidBill.balance : 0;

  // ── Derived: balance that carries into the first selected month ─
  const balanceBefore = useMemo(() => {
    if (selectedMonths.size === 0 || !lastPaidBill) return 0;
    const sorted = Array.from(selectedMonths).sort();
    const nextAfterLast = nextMonthStr(lastPaidBill.billing_month);
    return nextAfterLast === sorted[0] ? lastPaidBalance : 0;
  }, [selectedMonths, lastPaidBill, lastPaidBalance]);

  // ── Derived: total due for selected months ─────────────────────
  const totalForSelected = useMemo(() => {
    return monthlyFee * selectedMonths.size + balanceBefore;
  }, [monthlyFee, selectedMonths.size, balanceBefore]);

  const netBalance = totalForSelected - parseInt(paymentAmount || '0', 10);

  // ── Toggle month selection ─────────────────────────────────────
  const toggleMonth = (month: string) => {
    if (paidMonthsSet.has(month)) return;
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  // ── Record payment (creates bills on-the-fly) ──────────────────
  const recordPayment = async () => {
    if (selectedMonths.size === 0 || !paymentAmount || parseInt(paymentAmount) <= 0 || !selectedParent) {
      showFlash('Select at least one month and enter a valid amount');
      return;
    }
    setSaving(true);

    try {
      const sorted = Array.from(selectedMonths).sort();
      const amt = parseInt(paymentAmount, 10);

      // Double-check: verify no selected month is already paid
      const { data: existingPaid } = await supabase
        .from('fee_bills')
        .select('billing_month')
        .eq('parent_id', selectedParent.id)
        .eq('school_id', schoolId)
        .eq('status', 'paid')
        .in('billing_month', sorted);

      const alreadyPaid = new Set((existingPaid || []).map((b: any) => b.billing_month));
      const unpaidMonths = sorted.filter(m => !alreadyPaid.has(m));
      if (unpaidMonths.length === 0) {
        showFlash('All selected months are already paid');
        setSaving(false);
        return;
      }

      // Calculate balance before (from last paid bill, if contiguous)
      let balBefore = 0;
      if (lastPaidBill) {
        const nextAfterLast = nextMonthStr(lastPaidBill.billing_month);
        if (nextAfterLast === unpaidMonths[0]) {
          balBefore = lastPaidBalance;
        }
      }

      const totalDue = monthlyFee * unpaidMonths.length + balBefore;
      const net = totalDue - amt; // positive = underpaid, negative = advance

      // Insert payment record
      const { data: payData, error: payErr } = await supabase
        .from('fee_payments')
        .insert({
          school_id: schoolId,
          parent_id: selectedParent.id,
          amount: amt,
          months_paid: unpaidMonths,
          months_count: unpaidMonths.length,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          notes: paymentNotes || null,
        })
        .select('id')
        .single();
      if (payErr) throw payErr;

      const paymentId = payData?.id;

      // Create bill records for each month (allocate payment across months)
      let allocated = 0;
      for (let i = 0; i < unpaidMonths.length; i++) {
        const month = unpaidMonths[i];
        const isLast = i === unpaidMonths.length - 1;
        const cf = (i === 0) ? balBefore : 0;
        const due = monthlyFee + cf;
        const paidAmt = isLast ? (amt - allocated) : due;
        allocated += paidAmt;

        const { error: billErr } = await supabase.from('fee_bills').insert({
          school_id: schoolId,
          parent_id: selectedParent.id,
          billing_month: month,
          children_data: [],
          total_fee: monthlyFee,
          carried_forward: cf,
          amount_paid: paidAmt,
          balance: isLast ? net : 0,
          status: 'paid',
          payment_id: paymentId,
        });
        if (billErr) throw billErr;
      }

      showFlash(`Payment of Rs ${amt.toLocaleString()} recorded for ${unpaidMonths.length} month${unpaidMonths.length > 1 ? 's' : ''}!`);
      setSelectedMonths(new Set());
      setPaymentAmount('');
      setPaymentNotes('');
      loadParentDetail(selectedParent);
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to record payment'));
    }
    setSaving(false);
  };

  // ── Delete payment (removes bills + payment) ───────────────────
  const handleDeletePayment = async () => {
    if (!deleteTarget || !selectedParent) return;
    setDeleting(true);

    try {
      // Delete all fee_bills linked to this payment
      const { error: delBills } = await supabase
        .from('fee_bills')
        .delete()
        .eq('payment_id', deleteTarget.id);
      if (delBills) throw delBills;

      // Delete the payment record
      const { error: delPay } = await supabase
        .from('fee_payments')
        .delete()
        .eq('id', deleteTarget.id);
      if (delPay) throw delPay;

      showFlash('Payment deleted successfully');
      setDeleteTarget(null);
      loadParentDetail(selectedParent);
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to delete payment'));
    }
    setDeleting(false);
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="manager-loading">
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="fee-shell">

      {/* ═══ Left Panel: Parent List ═══ */}
      <div className="fee-parents-panel" style={{ display: mobileShowDetail ? 'none' : 'flex' }}>
        <div className="fee-parents-search">
          <div className="fee-search-input">
            <Search size={16} />
            <input
              placeholder="Search by name, CNIC or contact…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="fee-parents-list">
          {filteredParents.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              {parents.length === 0 ? 'No parents yet' : 'No results found'}
            </div>
          ) : (
            filteredParents.map(p => (
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
                  <span className={`fee-status-dot ${parentPaidCurrentMonth[p.id] ? 'green' : 'gray'}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ Right Panel: Parent Detail ═══ */}
      <div className="fee-detail-panel" style={{ display: !selectedParent && !mobileShowDetail ? 'none' : undefined }}>
        {!selectedParent ? (
          <div className="fee-empty-state">
            <Receipt size={52} />
            <p>Select a parent to view fee details</p>
            <small>Search by name, CNIC, or contact number</small>
          </div>
        ) : (
          <div className="animate-fade-up">
            {/* Mobile back button */}
            <button className="fee-back-btn" onClick={() => { setSelectedParent(null); setMobileShowDetail(false); }}>
              <ArrowLeft size={16} /> Back to parents
            </button>

            {/* Parent header with balance indicator */}
            <div className="fee-parent-header">
              <div>
                <div className="fee-parent-header-name">
                  {selectedParent.first_name} {selectedParent.last_name}
                </div>
                <div className="fee-parent-header-details">
                  <span><Phone size={12} /> {selectedParent.contact}</span>
                  {selectedParent.cnic && (
                    <span style={{ fontSize: '11px' }}>{selectedParent.cnic.slice(0, 8)}…</span>
                  )}
                </div>
              </div>
              {lastPaidBill && lastPaidBill.balance !== 0 && (
                <div className="fee-parent-header-balance">
                  <div className={`balance-amount ${lastPaidBill.balance > 0 ? 'positive' : 'negative'}`}>
                    {lastPaidBill.balance > 0
                      ? `Rs ${lastPaidBill.balance.toLocaleString()} due`
                      : `Rs ${Math.abs(lastPaidBill.balance).toLocaleString()} advance`}
                  </div>
                  <div className="balance-label">
                    {lastPaidBill.balance > 0 ? 'unpaid balance' : 'credit'}
                  </div>
                </div>
              )}
            </div>

            {/* Children table */}
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
                    {children.map(c => {
                      const cls = c.classes as any;
                      const classFee = cls ? N(cls.monthly_fee) : 0;
                      const finalFee = N(c.monthly_fee);
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                          <td>{cls?.name || '—'}</td>
                          <td>Rs {classFee > 0 ? classFee.toLocaleString() : '—'}</td>
                          <td>
                            {c.discount_type && c.discount_value != null ? (
                              <span className="discount-text">
                                {c.discount_type === 'percentage'
                                  ? `${N(c.discount_value)}%`
                                  : `Rs ${N(c.discount_value).toLocaleString()}`}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="fee-final">Rs {finalFee.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    <tr className="fee-row-total">
                      <td /><td /><td /><td /><td />
                    </tr>
                  </tbody>
                </table>
                <div className="fee-monthly-total">
                  <span className="fee-monthly-total-label">Monthly Fee Total</span>
                  <span className="fee-monthly-total-amount">Rs {monthlyFee.toLocaleString()}</span>
                </div>

                {/* ═══ Fee Status Grid (admission → current month) ═══ */}
                <div className="fee-section-title">
                  Fee Status{selectedMonths.size > 0 ? ` (${selectedMonths.size} selected)` : ''}
                </div>
                <div className="fee-month-grid">
                  {billableMonths.map(ym => {
                    const isPaid = paidMonthsSet.has(ym);
                    const isSelected = selectedMonths.has(ym);
                    const isSelectable = !isPaid;
                    const monthIdx = parseInt(ym.split('-')[1], 10) - 1;

                    // Effective fee: monthlyFee + balance from last paid (only for first unpaid after last paid)
                    let effectiveFee = monthlyFee;
                    if (!isPaid && lastPaidBill && lastPaidBalance !== 0) {
                      const nextAfterLast = nextMonthStr(lastPaidBill.billing_month);
                      if (nextAfterLast === ym) {
                        effectiveFee = monthlyFee + lastPaidBalance;
                      }
                    }

                    const statusClass = isPaid ? 'paid' : 'pending';
                    const statusLabel = isPaid ? '✓ Paid' : '○ Due';
                    const badgeClass = isPaid ? 'paid' : 'due';

                    return (
                      <div
                        key={ym}
                        className={`fee-month-card ${statusClass}${isSelected ? ' selected' : ''}${isSelectable ? ' selectable' : ''}`}
                        onClick={() => isSelectable && toggleMonth(ym)}
                        style={isSelectable ? { cursor: 'pointer' } : undefined}
                      >
                        {isSelected && <div className="fee-month-selected-check"><CheckCircle size={14} /></div>}
                        <div className="fee-month-name">{MONTH_NAMES[monthIdx]}</div>
                        <div className="fee-month-fee">Rs {effectiveFee.toLocaleString()}</div>
                        <div className={`fee-month-badge ${badgeClass}`}>{statusLabel}</div>
                      </div>
                    );
                  })}
                </div>

                {/* ═══ Payment Summary + Form (shown when months selected) ═══ */}
                {selectedMonths.size > 0 && (
                  <div style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginTop: '0.5rem',
                  }}>
                    {/* Summary */}
                    <div className="fee-modal-summary">
                      {balanceBefore !== 0 && (
                        <div className="fee-modal-summary-row">
                          <span>{balanceBefore > 0 ? 'Previous Balance' : 'Previous Advance'}</span>
                          <span>
                            {balanceBefore > 0
                              ? `Rs ${balanceBefore.toLocaleString()}`
                              : `(Rs ${Math.abs(balanceBefore).toLocaleString()})`}
                          </span>
                        </div>
                      )}
                      <div className="fee-modal-summary-row">
                        <span>Fee Total ({selectedMonths.size} month{selectedMonths.size > 1 ? 's' : ''})</span>
                        <span>Rs {(monthlyFee * selectedMonths.size).toLocaleString()}</span>
                      </div>
                      <div className="fee-modal-summary-row total">
                        <span>Total Due</span>
                        <span>Rs {totalForSelected.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Remaining indicator */}
                    {paymentAmount && parseInt(paymentAmount) > 0 && (
                      <div className={`fee-modal-remaining ${netBalance > 0 ? 'warning' : netBalance < 0 ? 'advance' : netBalance === 0 ? 'paid' : 'neutral'}`}>
                        <span>
                          {netBalance > 0
                            ? `⚠ Rs ${Math.abs(netBalance).toLocaleString()} remaining after payment`
                            : netBalance < 0
                              ? `↻ Rs ${Math.abs(netBalance).toLocaleString()} advance after payment`
                              : '✓ Exact amount — fully paid!'}
                        </span>
                      </div>
                    )}

                    {/* Form fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Amount Paying Now (Rs) *
                        </label>
                        <input
                          type="number"
                          className="fee-modal-amount-input"
                          placeholder="Enter amount received…"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          min="1"
                          step="1"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', background: 'var(--surface)', color: 'var(--text)' }}
                        >
                          {PAYMENT_METHODS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={e => setPaymentDate(e.target.value)}
                          style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={e => setPaymentNotes(e.target.value)}
                          placeholder="Any additional notes…"
                          style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                    </div>

                    {/* Record button */}
                    <div style={{ marginTop: '1rem' }}>
                      <Button
                        onClick={recordPayment}
                        isLoading={saving}
                        disabled={!paymentAmount || parseInt(paymentAmount) <= 0}
                        fullWidth
                      >
                        <CreditCard size={16} /> Record Payment
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ Payment History ═══ */}
            <div className="fee-section-title">Payment History</div>
            {payments.length === 0 ? (
              <div className="fee-no-payments">No payments recorded yet.</div>
            ) : (
              <div className="fee-payment-history-list">
                {payments.map(p => (
                  <div key={p.id} className="fee-payment-row">
                    <span className="fee-payment-date">
                      {new Date(p.payment_date).toLocaleDateString('en-PK')}
                    </span>
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

            {flash && (
              <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>
                {flash}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="fee-modal" onClick={e => e.stopPropagation()}>
            <div className="fee-modal-head">
              <h3>Delete Payment</h3>
              <button className="fee-modal-close" onClick={() => setDeleteTarget(null)} disabled={deleting}>✕</button>
            </div>
            <div className="fee-modal-body">
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Delete payment of <strong>Rs {deleteTarget.amount.toLocaleString()}</strong> for{' '}
                <strong>{deleteTarget.months_paid.map(m => shortMonth(m)).join(', ')}</strong>?
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                This will remove the payment record and all associated bill entries. The balance will be recalculated.
              </p>
            </div>
            <div className="fee-modal-foot">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={handleDeletePayment} isLoading={deleting}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
