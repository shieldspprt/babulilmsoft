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

type ParentBalanceInfo = {
  balance: number;
  currentMonthPaid: boolean;
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

/**
 * Compute parent balance info from children data + payments.
 * Pure function — no DB queries.
 *
 * balance = (payableMonths × monthlyFee) - totalPaid
 *   positive = parent owes money
 *   negative = parent has advance
 */
function computeParentBalance(
  childrenData: { monthlyFee: number; admissionDate: string | null }[],
  paymentsData: { amount: number; months_paid: string[] }[],
  cm: string,
): ParentBalanceInfo {
  if (childrenData.length === 0) {
    return { balance: 0, currentMonthPaid: false };
  }

  const mf = childrenData.reduce((sum, c) => sum + c.monthlyFee, 0);
  const admMonth = childrenData
    .map(c => c.admissionDate?.slice(0, 7))
    .filter(Boolean)
    .sort()[0] || cm;

  const payable = getBillableMonths(admMonth, cm);
  const totalOwed = payable.length * mf;
  const totalPaid = paymentsData.reduce((sum, p) => sum + p.amount, 0);

  const touched = new Set<string>();
  paymentsData.forEach(p => p.months_paid.forEach(m => touched.add(m)));

  return {
    balance: totalOwed - totalPaid,
    currentMonthPaid: touched.has(cm),
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
  const [parentBalances, setParentBalances] = useState<Record<string, ParentBalanceInfo>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
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

  /* ═══════════════════════════════════════════════════════════════
     DATA LOADING
     ═══════════════════════════════════════════════════════════════ */

  // ── Load parents + compute each parent's balance (left panel) ──
  const loadParents = async () => {
    setLoading(true);
    try {
      const [parentsRes, studentsRes, paymentsRes] = await Promise.all([
        supabase.from('parents').select('*').eq('school_id', schoolId).order('first_name'),
        supabase
          .from('students')
          .select('parent_id, monthly_fee, date_of_admission, active')
          .eq('school_id', schoolId)
          .eq('active', true),
        supabase
          .from('fee_payments')
          .select('parent_id, amount, months_paid')
          .eq('school_id', schoolId),
      ]);

      const parentList = (parentsRes.data || []) as Parent[];
      setParents(parentList);

      // Group students by parent
      const studentsByParent: Record<string, { monthlyFee: number; admissionDate: string | null }[]> = {};
      const counts: Record<string, number> = {};
      (studentsRes.data || []).forEach((s: any) => {
        if (!studentsByParent[s.parent_id]) studentsByParent[s.parent_id] = [];
        studentsByParent[s.parent_id].push({
          monthlyFee: N(s.monthly_fee),
          admissionDate: s.date_of_admission,
        });
        counts[s.parent_id] = (counts[s.parent_id] || 0) + 1;
      });
      setStudentCounts(counts);

      // Group payments by parent
      const paymentsByParent: Record<string, { amount: number; months_paid: string[] }[]> = {};
      (paymentsRes.data || []).forEach((p: any) => {
        if (!paymentsByParent[p.parent_id]) paymentsByParent[p.parent_id] = [];
        paymentsByParent[p.parent_id].push({
          amount: N(p.amount),
          months_paid: p.months_paid || [],
        });
      });

      // Compute balance for every parent (pure JS, no extra queries)
      const cm = currentMonthStr();
      const balances: Record<string, ParentBalanceInfo> = {};
      parentList.forEach((p: Parent) => {
        balances[p.id] = computeParentBalance(
          studentsByParent[p.id] || [],
          paymentsByParent[p.id] || [],
          cm,
        );
      });
      setParentBalances(balances);
    } catch (err: any) {
      showFlash('Error loading parents: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  };

  useEffect(() => { loadParents(); }, [schoolId]);

  // ── Load parent detail (right panel) ───────────────────────────
  const loadParentDetail = useCallback(async (parent: Parent) => {
    setSelectedParent(parent);
    setPayments([]);
    setChildren([]);
    setSelectedMonths(new Set());
    setPaymentAmount('');
    setPaymentNotes('');

    try {
      const [paymentsRes, childrenRes] = await Promise.all([
        supabase
          .from('fee_payments')
          .select('*')
          .eq('parent_id', parent.id)
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false }),
        supabase
          .from('students')
          .select(
            'id, parent_id, first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, admission_class_id, active, classes(name, monthly_fee)',
          )
          .eq('parent_id', parent.id)
          .eq('school_id', schoolId)
          .eq('active', true),
      ]);

      setPayments((paymentsRes.data || []).map(parsePayment));
      setChildren((childrenRes.data || []) as unknown as StudentRow[]);
    } catch (err: any) {
      showFlash('Error loading parent detail: ' + (err.message || 'Unknown error'));
    }
  }, [schoolId, showFlash]);

  // ── Select parent ──────────────────────────────────────────────
  const selectParent = useCallback(
    (p: Parent) => {
      setSelectedParent(p);
      setMobileShowDetail(true);
      loadParentDetail(p);
    },
    [loadParentDetail],
  );

  // ── Filtered parents (search) ──────────────────────────────────
  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;
    const q = search.toLowerCase();
    return parents.filter(
      (p) =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        (p.cnic && p.cnic.includes(q)) ||
        (p.contact && p.contact.includes(q)),
    );
  }, [parents, search]);

  /* ═══════════════════════════════════════════════════════════════
     DERIVED VALUES (pure computation — no DB queries)
     ═══════════════════════════════════════════════════════════════ */

  // ── Monthly fee = sum of all children's monthly_fee ────────────
  const monthlyFee = useMemo(() => {
    return children.reduce((sum, c) => sum + N(c.monthly_fee), 0);
  }, [children]);

  // ── Admission month = earliest child admission ─────────────────
  const admissionMonth = useMemo(() => getAdmissionMonth(children), [children]);

  // ── Payable months = from admission month → current month ──────
  const payableMonths = useMemo(() => {
    if (children.length === 0) return [];
    return getBillableMonths(admissionMonth, currentMonthStr());
  }, [children.length, admissionMonth]);

  // ── Touched months = months covered by ANY payment ─────────────
  const touchedMonths = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => p.months_paid.forEach((m) => set.add(m)));
    return set;
  }, [payments]);

  // ── Unpaid months = payable months NOT touched ─────────────────
  const unpaidMonths = useMemo(() => {
    return payableMonths.filter((m) => !touchedMonths.has(m));
  }, [payableMonths, touchedMonths]);

  // ── Running balance = totalOwed − totalPaid ────────────────────
  //    positive = owes money, negative = has advance
  const totalPaid = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);
  const totalOwed = useMemo(() => payableMonths.length * monthlyFee, [payableMonths.length, monthlyFee]);
  const runningBalance = useMemo(() => totalOwed - totalPaid, [totalOwed, totalPaid]);

  // ── paidMonthsBalance = balance FROM PAID MONTHS ───────────────
  //    This is the underpayment/overpayment from months already paid.
  //    runningBalance = (unpaidMonths × monthlyFee) + paidMonthsBalance
  //    → paidMonthsBalance = runningBalance - (unpaidMonths × monthlyFee)
  const paidMonthsBalance = useMemo(() => {
    return runningBalance - unpaidMonths.length * monthlyFee;
  }, [runningBalance, unpaidMonths.length, monthlyFee]);

  // ── Total due for selected months ──────────────────────────────
  //    = fee for selected months + any carried balance from paid months
  const totalForSelected = useMemo(() => {
    if (selectedMonths.size === 0) return 0;
    return monthlyFee * selectedMonths.size + paidMonthsBalance;
  }, [monthlyFee, selectedMonths.size, paidMonthsBalance]);

  const netBalance = totalForSelected - parseInt(paymentAmount || '0', 10);

  // ── First unpaid month (gets the balance badge) ────────────────
  const firstUnpaidMonth = unpaidMonths.length > 0 ? unpaidMonths[0] : null;

  /* ═══════════════════════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════════════════════ */

  // ── Toggle month selection ─────────────────────────────────────
  const toggleMonth = (month: string) => {
    if (touchedMonths.has(month)) return;
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  // ── Record payment (single INSERT into fee_payments) ───────────
  const recordPayment = async () => {
    if (selectedMonths.size === 0 || !paymentAmount || parseInt(paymentAmount) <= 0 || !selectedParent) {
      showFlash('Select at least one month and enter a valid amount');
      return;
    }
    setSaving(true);

    try {
      const sortedMonths = Array.from(selectedMonths).sort();
      const amt = parseInt(paymentAmount, 10);

      const { error } = await supabase.from('fee_payments').insert({
        school_id: schoolId,
        parent_id: selectedParent.id,
        amount: amt,
        months_paid: sortedMonths,
        months_count: sortedMonths.length,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        notes: paymentNotes || null,
      });

      if (error) throw error;

      showFlash(
        `Payment of Rs ${amt.toLocaleString()} recorded for ${sortedMonths.length} month${sortedMonths.length > 1 ? 's' : ''}!`,
      );
      setSelectedMonths(new Set());
      setPaymentAmount('');
      setPaymentNotes('');

      // Refresh both detail and parent list
      loadParentDetail(selectedParent);
      loadParents();
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to record payment'));
    }
    setSaving(false);
  };

  // ── Delete payment (single DELETE from fee_payments) ───────────
  const handleDeletePayment = async () => {
    if (!deleteTarget || !selectedParent) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from('fee_payments').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      showFlash('Payment deleted successfully');
      setDeleteTarget(null);

      loadParentDetail(selectedParent);
      loadParents();
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to delete payment'));
    }
    setDeleting(false);
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className="fee-shell">
      {/* ═══════════════════════════════════════════════════════════
          LEFT PANEL — Parent List
          ═══════════════════════════════════════════════════════════ */}
      <div className="fee-parents-panel" style={{ display: mobileShowDetail ? 'none' : 'flex' }}>
        <div className="fee-parents-search">
          <div className="fee-search-input">
            <Search size={16} />
            <input
              placeholder="Search by name, CNIC or contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="fee-parents-list">
          {filteredParents.length === 0 ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--font-sm)',
              }}
            >
              {parents.length === 0 ? 'No parents yet' : 'No results found'}
            </div>
          ) : (
            filteredParents.map((p) => {
              const info = parentBalances[p.id] || { balance: 0, currentMonthPaid: false };
              const dotClass = info.balance <= 0 ? 'green' : 'amber';
              return (
                <div
                  key={p.id}
                  className={`fee-parent-card${selectedParent?.id === p.id ? ' active' : ''}`}
                  onClick={() => selectParent(p)}
                >
                  <div className="fee-parent-avatar">
                    {p.first_name.charAt(0)}
                    {p.last_name.charAt(0)}
                  </div>
                  <div className="fee-parent-info">
                    <div className="fee-parent-name">
                      {p.first_name} {p.last_name}
                    </div>
                    <div className="fee-parent-contact">{p.contact}</div>
                  </div>
                  <div className="fee-parent-meta">
                    <span className="fee-children-badge">{studentCounts[p.id] || 0}</span>
                    <span className={`fee-status-dot ${dotClass}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL — Fee Detail
          ═══════════════════════════════════════════════════════════ */}
      <div
        className="fee-detail-panel"
        style={{ display: !selectedParent && !mobileShowDetail ? 'none' : undefined }}
      >
        {!selectedParent ? (
          <div className="fee-empty-state">
            <Receipt size={52} />
            <p>Select a parent to view fee details</p>
            <small>Search by name, CNIC, or contact number</small>
          </div>
        ) : (
          <div className="animate-fade-up">
            {/* Mobile back button */}
            <button
              className="fee-back-btn"
              onClick={() => {
                setSelectedParent(null);
                setMobileShowDetail(false);
              }}
            >
              <ArrowLeft size={16} /> Back to parents
            </button>

            {/* ── Parent header with balance ─────────────────────── */}
            <div className="fee-parent-header">
              <div>
                <div className="fee-parent-header-name">
                  {selectedParent.first_name} {selectedParent.last_name}
                </div>
                <div className="fee-parent-header-details">
                  <span>
                    <Phone size={12} /> {selectedParent.contact}
                  </span>
                  {selectedParent.cnic && (
                    <span style={{ fontSize: '11px' }}>
                      {selectedParent.cnic.slice(0, 8)}…
                    </span>
                  )}
                </div>
              </div>
              {runningBalance !== 0 && (
                <div className="fee-parent-header-balance">
                  <div className={`balance-amount ${runningBalance > 0 ? 'positive' : 'negative'}`}>
                    {runningBalance > 0
                      ? `Rs ${runningBalance.toLocaleString()} due`
                      : `Rs ${Math.abs(runningBalance).toLocaleString()} advance`}
                  </div>
                  <div className="balance-label">
                    {runningBalance > 0 ? 'unpaid balance' : 'credit'}
                  </div>
                </div>
              )}
            </div>

            {/* ── Children table ──────────────────────────────────── */}
            {children.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 0',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-sm)',
                }}
              >
                No active children enrolled.
              </div>
            ) : (
              <>
                <div className="fee-section-title">Children ({children.length})</div>
                <table className="fee-children-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Fee</th>
                      <th>Discount</th>
                      <th>Final Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((c) => {
                      const cls = c.classes as any;
                      const classFee = cls ? N(cls.monthly_fee) : 0;
                      const finalFee = N(c.monthly_fee);
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>
                            {c.first_name} {c.last_name}
                          </td>
                          <td>{cls?.name || '—'}</td>
                          <td>Rs {classFee > 0 ? classFee.toLocaleString() : '—'}</td>
                          <td>
                            {c.discount_type && c.discount_value != null ? (
                              <span className="discount-text">
                                {c.discount_type === 'percentage'
                                  ? `${N(c.discount_value)}%`
                                  : `Rs ${N(c.discount_value).toLocaleString()}`}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="fee-final">Rs {finalFee.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="fee-monthly-total">
                  <span className="fee-monthly-total-label">Monthly Fee Total</span>
                  <span className="fee-monthly-total-amount">
                    Rs {monthlyFee.toLocaleString()}
                  </span>
                </div>

                {/* ── Month Status Grid ──────────────────────────── */}
                <div className="fee-section-title">
                  Fee Status
                  {selectedMonths.size > 0 && ` (${selectedMonths.size} selected)`}
                  {payableMonths.length > 0 && (
                    <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: '0.5rem' }}>
                      {admissionMonth} → {currentMonthStr()}
                    </span>
                  )}
                </div>

                {payableMonths.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    No payable months yet.
                  </div>
                ) : (
                  <div className="fee-month-grid">
                    {payableMonths.map((ym) => {
                      const isPaid = touchedMonths.has(ym);
                      const isSelected = selectedMonths.has(ym);
                      const isSelectable = !isPaid;
                      const monthIdx = parseInt(ym.split('-')[1], 10) - 1;

                      // Effective fee: first unpaid month absorbs the carried balance
                      let effectiveFee = monthlyFee;
                      if (!isPaid && ym === firstUnpaidMonth && paidMonthsBalance !== 0) {
                        effectiveFee = monthlyFee + paidMonthsBalance;
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
                          {isSelected && (
                            <div className="fee-month-selected-check">
                              <CheckCircle size={14} />
                            </div>
                          )}
                          <div className="fee-month-name">{MONTH_NAMES[monthIdx]}</div>
                          <div className="fee-month-fee">
                            Rs {Math.max(0, effectiveFee).toLocaleString()}
                          </div>
                          {effectiveFee < 0 && !isPaid && (
                            <div style={{ fontSize: '10px', color: 'var(--primary)', marginTop: 2 }}>
                              (Rs {Math.abs(effectiveFee).toLocaleString()} advance covers this)
                            </div>
                          )}
                          <div className={`fee-month-badge ${badgeClass}`}>{statusLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Payment Summary (shown when months selected) ── */}
                {selectedMonths.size > 0 && (
                  <div
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    {/* Summary rows */}
                    <div className="fee-modal-summary">
                      <div className="fee-modal-summary-row">
                        <span>
                          Fee for {selectedMonths.size} month
                          {selectedMonths.size > 1 ? 's' : ''}
                        </span>
                        <span>Rs {(monthlyFee * selectedMonths.size).toLocaleString()}</span>
                      </div>

                      {paidMonthsBalance > 0 && (
                        <div className="fee-modal-summary-row" style={{ color: 'var(--danger)' }}>
                          <span>Previous Balance</span>
                          <span>Rs {paidMonthsBalance.toLocaleString()}</span>
                        </div>
                      )}
                      {paidMonthsBalance < 0 && (
                        <div className="fee-modal-summary-row" style={{ color: 'var(--primary)' }}>
                          <span>Advance</span>
                          <span>(Rs {Math.abs(paidMonthsBalance).toLocaleString()})</span>
                        </div>
                      )}

                      <div className="fee-modal-summary-row total">
                        <span>Total Due</span>
                        <span>Rs {Math.max(0, totalForSelected).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Remaining / advance indicator */}
                    {paymentAmount && parseInt(paymentAmount) > 0 && (
                      <div
                        className={`fee-modal-remaining ${netBalance > 0 ? 'warning' : netBalance < 0 ? 'advance' : netBalance === 0 ? 'paid' : 'neutral'}`}
                      >
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
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginTop: '0.75rem',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Amount Paying Now (Rs) *
                        </label>
                        <input
                          type="number"
                          className="fee-modal-amount-input"
                          placeholder="Enter amount received…"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          min="1"
                          step="1"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            display: 'block',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="Any additional notes…"
                          style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-sm)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                          }}
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

                {/* ── Stats bar ───────────────────────────────────── */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Payable Months
                    </div>
                    <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text)' }}>
                      {payableMonths.length}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Paid
                    </div>
                    <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--success)' }}>
                      {touchedMonths.size}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Unpaid
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-xl)',
                        fontWeight: 800,
                        color: unpaidMonths.length > 0 ? 'var(--warning)' : 'var(--success)',
                      }}
                    >
                      {unpaidMonths.length}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Payment History ─────────────────────────────────── */}
            <div className="fee-section-title">Payment History</div>
            {payments.length === 0 ? (
              <div className="fee-no-payments">No payments recorded yet.</div>
            ) : (
              <div className="fee-payment-history-list">
                {payments.map((p) => (
                  <div key={p.id} className="fee-payment-row">
                    <span className="fee-payment-date">
                      {new Date(p.payment_date).toLocaleDateString('en-PK')}
                    </span>
                    <span className="fee-payment-months">
                      {p.months_paid.map((m) => shortMonth(m)).join(', ')}
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
              <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="fee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fee-modal-head">
              <h3>Delete Payment</h3>
              <button
                className="fee-modal-close"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>
            <div className="fee-modal-body">
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.75rem',
                }}
              >
                Delete payment of{' '}
                <strong>Rs {deleteTarget.amount.toLocaleString()}</strong> for{' '}
                <strong>
                  {deleteTarget.months_paid.map((m) => shortMonth(m)).join(', ')}
                </strong>
                ?
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                This will remove the payment record. All balances will be recalculated
                automatically.
              </p>
            </div>
            <div className="fee-modal-foot">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
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
