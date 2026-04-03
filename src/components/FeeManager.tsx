import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Role } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { useDebounce } from '../hooks/useDebounce';
import { Button } from './ui/Button';
import {
  Search, Receipt, Trash2, Phone, CreditCard,
  CheckCircle, ArrowLeft, Calendar, Users, AlertCircle, FileText,
} from 'lucide-react';
import { generateReceiptData, saveReceipt, getReceiptByPayment } from '../lib/receiptGenerator';
import type { ReceiptData } from '../lib/supabase';
import { ReceiptPreview } from './receipts/ReceiptPreview';
import './FeeManager.css';
import './managers.css';
import { isPositiveNumber } from '../lib/validation';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
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
  monthly_fee: number;
  discount_type: string | null;
  discount_value: string | number | null;
  date_of_admission: string | null;
  admission_class_id: string | null;
  active: boolean;
  classes: { name: string; monthly_fee: number }[] | null;
};

type ParentBalanceInfo = {
  balance: number;
  currentMonthPaid: boolean;
};

type ParentListItem = Parent & {
  childrenCount: number;
  balanceInfo: ParentBalanceInfo;
};

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa'];

/** Safe numeric coercion (PostgreSQL numeric comes as string) */
function N(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

/** Returns 'YYYY-MM' for today */
function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** '2026-03' → 'March' */
function shortMonth(ym: string): string {
  const m = parseInt(ym.slice(5, 7), 10) - 1;
  return MONTH_NAMES[m] || ym;
}

/** Earliest admission month from active children */
function getAdmissionMonth(students: StudentRow[]): string {
  if (students.length === 0) return currentMonthStr();
  const months = students
    .map(s => s.date_of_admission?.slice(0, 7))
    .filter((m): m is string => !!m);
  if (months.length === 0) return currentMonthStr();
  months.sort();
  return months[0];
}

/** All months in [startYm, endYm] inclusive */
function getBillableMonths(startYm: string, endYm: string): string[] {
  const result: string[] = [];
  let [y, m] = startYm.split('-').map(Number);
  const [ey, em] = endYm.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

/** Parse a raw Supabase row into FeePayment */
function parsePayment(raw: any): FeePayment {
  return {
    id: raw.id,
    school_id: raw.school_id,
    parent_id: raw.parent_id,
    amount: N(raw.amount),
    months_paid: Array.isArray(raw.months_paid) ? raw.months_paid : [],
    months_count: N(raw.months_count),
    payment_date: raw.payment_date,
    payment_method: raw.payment_method || 'Cash',
    notes: raw.notes || null,
    created_at: raw.created_at,
  };
}

/**
 * Pure balance calculator for a parent.
 * Returns { balance, currentMonthPaid }.
 * balance > 0 → owes money; balance < 0 → has advance.
 */
function computeParentBalance(
  childrenData: { monthly_fee: number; date_of_admission: string | null }[],
  paymentsData: { amount: number; months_paid: string[] }[],
  cm: string,
): ParentBalanceInfo {
  const admMonth = getAdmissionMonth(
    childrenData as StudentRow[],
  );
  const payableMonths = getBillableMonths(admMonth, cm);
  const monthlyFee = childrenData.reduce(
    (sum, c) => sum + N(c.monthly_fee),
    0,
  );

  const totalOwed = payableMonths.length * monthlyFee;
  const totalPaid = paymentsData.reduce((s, p) => s + N(p.amount), 0);
  const balance = totalOwed - totalPaid;

  const touched = new Set<string>();
  paymentsData.forEach(p =>
    (Array.isArray(p.months_paid) ? p.months_paid : []).forEach(m => touched.add(m)),
  );

  return {
    balance,
    currentMonthPaid: touched.has(cm),
  };
}

/** Mask CNIC: show last 4 digits */
function maskCnic(cnic: string): string {
  if (!cnic || cnic.length < 5) return cnic || '—';
  return '••••••••••' + cnic.slice(-4);
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export const FeeManager = ({ schoolId, role }: { schoolId: string; role?: Role }) => {
  const isOwner = !role || role === 'owner';
  const { flash, showFlash } = useFlashMessage(4000);

  /* ── state ──────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<ParentListItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // right panel data
  const [detailLoading, setDetailLoading] = useState(false);
  const [children, setChildren] = useState<StudentRow[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);

  // payment form
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentNotes, setPaymentNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // delete
  const [deleteTarget, setDeleteTarget] = useState<FeePayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // RECEIPT MODAL STATE
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const cm = useMemo(() => currentMonthStr(), []);

  /* ── load parents (left panel) ──────────────────────────────────── */
  const loadParents = useCallback(async () => {
    setLoading(true);
    try {
      const [parentsRes, studentsRes, paymentsRes] = await Promise.all([
        supabase
          .from('parents')
          .select('*')
          .eq('school_id', schoolId)
          .order('first_name'),
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

      const rawParents: Parent[] = (parentsRes.data || []) as Parent[];
      const rawStudents = studentsRes.data || [];
      const rawPayments = paymentsRes.data || [];

      // Group students and payments by parent
      const studentMap = new Map<string, { monthly_fee: number; date_of_admission: string | null }[]>();
      const paymentMap = new Map<string, { amount: number; months_paid: string[] }[]>();

      rawStudents.forEach((s: any) => {
        if (!studentMap.has(s.parent_id)) studentMap.set(s.parent_id, []);
        studentMap.get(s.parent_id)!.push({
          monthly_fee: N(s.monthly_fee),
          date_of_admission: s.date_of_admission,
        });
      });

      rawPayments.forEach((p: any) => {
        if (!paymentMap.has(p.parent_id)) paymentMap.set(p.parent_id, []);
        paymentMap.get(p.parent_id)!.push({
          amount: N(p.amount),
          months_paid: Array.isArray(p.months_paid) ? p.months_paid : [],
        });
      });

      const items: ParentListItem[] = rawParents.map(p => ({
        ...p,
        childrenCount: studentMap.get(p.id)?.length || 0,
        balanceInfo: computeParentBalance(
          studentMap.get(p.id) || [],
          paymentMap.get(p.id) || [],
          cm,
        ),
      }));

      setParents(items);
    } catch (err: any) {
      showFlash('Error loading parents: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, cm, showFlash]);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  /* ── load parent detail (right panel) ───────────────────────────── */
  const loadParentDetail = useCallback(
    async (parent: Parent) => {
      setDetailLoading(true);
      setSelectedMonths(new Set());
      setPaymentAmount('');
      setPaymentNotes('');
      setPaymentMethod('Cash');
      setPaymentDate(todayStr);
      try {
        const [paymentsRes, studentsRes, classesRes] = await Promise.all([
          supabase
            .from('fee_payments')
            .select('*')
            .eq('parent_id', parent.id)
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false }),
          supabase
            .from('students')
            .select(
              'id, parent_id, first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, admission_class_id, active',
            )
            .eq('parent_id', parent.id)
            .eq('school_id', schoolId)
            .eq('active', true),
          supabase
            .from('classes')
            .select('id, name, monthly_fee')
            .eq('school_id', schoolId),
        ]);

        // Build a map of classes by id for quick lookup
        const classesMap = new Map<string, { name: string; monthly_fee: number }>();
        (classesRes.data || []).forEach((c: any) => {
          classesMap.set(c.id, {
            name: c.name || '—',
            monthly_fee: N(c.monthly_fee),
          });
        });

        // Manually attach classes data to each student
        const studentsWithClasses = (studentsRes.data || []).map((student: any) => {
          const classData = student.admission_class_id
            ? classesMap.get(student.admission_class_id)
            : null;
          return {
            ...student,
            classes: classData ? [classData] : null,
          };
        });

        setPayments((paymentsRes.data || []).map(parsePayment));
        setChildren(studentsWithClasses);
      } catch (err: any) {
        showFlash('Error loading detail: ' + err.message);
      } finally {
        setDetailLoading(false);
      }
    },
    [schoolId, showFlash, todayStr],
  );

  /* ── select parent ──────────────────────────────────────────────── */
  const selectParent = useCallback(
    (parent: Parent) => {
      setSelectedParent(parent);
      setMobileShowDetail(true);
      loadParentDetail(parent);
    },
    [loadParentDetail],
  );

  /* ── derived: filtered parents ──────────────────────────────────── */
  const filteredParents = useMemo(() => {
    if (!debouncedSearch.trim()) return parents;
    const q = debouncedSearch.toLowerCase();
    return parents.filter(
      p =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q) ||
        p.cnic.includes(q) ||
        (p.contact || '').includes(q),
    );
  }, [parents, debouncedSearch]);

  /* ── derived: balance engine for selected parent ────────────────── */
  const monthlyFee = useMemo(
    () => children.reduce((s, c) => s + N(c.monthly_fee), 0),
    [children],
  );

  const admissionMonth = useMemo(
    () => getAdmissionMonth(children),
    [children],
  );

  const payableMonths = useMemo(
    () => getBillableMonths(admissionMonth, cm),
    [admissionMonth, cm],
  );

  const touchedMonths = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p =>
      p.months_paid.forEach(m => set.add(m)),
    );
    return set;
  }, [payments]);

  const unpaidMonths = useMemo(
    () => payableMonths.filter(m => !touchedMonths.has(m)),
    [payableMonths, touchedMonths],
  );

  const totalOwed = useMemo(
    () => payableMonths.length * monthlyFee,
    [payableMonths.length, monthlyFee],
  );

  const totalPaid = useMemo(
    () => payments.reduce((s, p) => s + p.amount, 0),
    [payments],
  );

  const runningBalance = useMemo(
    () => totalOwed - totalPaid,
    [totalOwed, totalPaid],
  );

  const paidMonthsBalance = useMemo(
    () => runningBalance - unpaidMonths.length * monthlyFee,
    [runningBalance, unpaidMonths.length, monthlyFee],
  );

  const totalForSelected = useMemo(() => {
    return selectedMonths.size * monthlyFee + paidMonthsBalance;
  }, [selectedMonths.size, monthlyFee, paidMonthsBalance]);

  const netBalance = useMemo(() => {
    const amt = parseInt(paymentAmount, 10) || 0;
    return totalForSelected - amt;
  }, [totalForSelected, paymentAmount]);

  /* ── toggle month selection ─────────────────────────────────────── */
  const toggleMonth = useCallback(
    (ym: string) => {
      if (touchedMonths.has(ym)) return; // paid months not selectable
      setSelectedMonths(prev => {
        const next = new Set(prev);
        if (next.has(ym)) next.delete(ym);
        else next.add(ym);
        return next;
      });
    },
    [touchedMonths],
  );

  /* ── auto-fill payment amount ───────────────────────────────────── */
  useEffect(() => {
    if (selectedMonths.size > 0 && !paymentAmount) {
      setPaymentAmount(String(Math.max(0, totalForSelected)));
    }
    // Only re-run when months selection changes, not when paymentAmount changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonths.size]);

  /* ── record payment ─────────────────────────────────────────────── */
  const recordPayment = useCallback(async () => {
    if (!selectedParent || selectedMonths.size === 0) return;
    
    // Validate payment amount is positive
    if (!isPositiveNumber(paymentAmount)) {
      showFlash('Please enter a valid positive amount');
      return;
    }

    setSaving(true);
    try {
      // Validate against computed total for selected months
      const amountVal = parseInt(paymentAmount, 10);
      const monthsArray = Array.from(selectedMonths).sort();

      // Insert payment
      const { data: payment, error: payErr } = await supabase
        .from('fee_payments')
        .insert({
          school_id: schoolId,
          parent_id: selectedParent.id,
          amount: amountVal,
          months_paid: monthsArray,
          months_count: selectedMonths.size,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes: paymentNotes.trim() || null,
        })
        .select()
        .single();

      if (payErr) throw payErr;

      // Generate and save receipt
      const receiptData = await generateReceiptData(payment.id, schoolId);
      if (receiptData) {
        await saveReceipt(receiptData, payment.id, schoolId, selectedParent.id);
        setCurrentReceipt(receiptData);
        setShowReceipt(true);
      }

      setPaymentAmount('');
      setSelectedMonths(new Set());
      setPaymentNotes('');
      showFlash('Payment recorded successfully');
      await Promise.all([loadParentDetail(selectedParent), loadParents()]);
    } catch (err: any) {
      showFlash('Error recording payment: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [
    selectedParent, selectedMonths, paymentAmount, paymentDate,
    paymentMethod, paymentNotes, schoolId,
    loadParentDetail, loadParents, showFlash,
  ]);

  /* ── load receipt from payment ──────────────────────────────────── */
  const loadReceiptFromPayment = useCallback(async (paymentId: string) => {
    if (!paymentId?.trim()) {
      showFlash('Invalid payment ID');
      return;
    }
    try {
      const receipt = await getReceiptByPayment(paymentId.trim());
      if (receipt?.receipt_data) {
        setCurrentReceipt(receipt.receipt_data);
        setShowReceipt(true);
      } else {
        showFlash('Receipt not found for this payment');
      }
    } catch (err: any) {
      showFlash('Error loading receipt: ' + (err?.message || 'Unknown error'));
    }
  }, [showFlash]);


  /* ── delete payment ─────────────────────────────────────────────── */
  const handleDeletePayment = useCallback(async () => {
    if (!deleteTarget || !selectedParent) return;
    setDeleting(true);
    try {
      // First delete associated receipt if exists
      await supabase
        .from('fee_receipts')
        .delete()
        .eq('payment_id', deleteTarget.id);
      
      // Then delete the payment
      const { error } = await supabase
        .from('fee_payments')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      showFlash('Payment deleted successfully');
      setDeleteTarget(null);
      await Promise.all([loadParentDetail(selectedParent), loadParents()]);
    } catch (err: any) {
      showFlash('Error deleting payment: ' + err.message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, selectedParent, loadParentDetail, loadParents, showFlash]);

  /* ── format month range label ───────────────────────────────────── */
  const rangeLabel = useMemo(() => {
    if (payableMonths.length === 0) return '';
    const first = payableMonths[0];
    const last = payableMonths[payableMonths.length - 1];
    return `${shortMonth(first)} ${first.slice(0, 4)} → ${shortMonth(last)} ${last.slice(0, 4)}`;
  }, [payableMonths]);

  /* ═════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════ */

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
      {/* ─── LEFT PANEL ─────────────────────────────────────────────── */}
      <div
        className={`fee-parents-panel${mobileShowDetail ? ' hidden-mobile' : ''}`}
      >
        <div className="fee-parents-search">
          <div className="manager-search-bar" style={{ maxWidth: '100%' }}>
            <Search size={16} />
            <input
              type="text"
              role="searchbox"
              aria-label="Search parents by name, CNIC, or contact"
              placeholder="Search by name, CNIC, contact…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="fee-parents-list">
          {filteredParents.length === 0 ? (
            <div className="fee-parents-empty">
              <Users size={40} />
              <p>
                {parents.length === 0
                  ? 'No parents yet'
                  : 'No results found'}
              </p>
            </div>
          ) : (
            filteredParents.map(p => (
              <div
                key={p.id}
                className={
                  'fee-parent-card' +
                  (selectedParent?.id === p.id ? ' active' : '')
                }
                onClick={() => selectParent(p)}
                aria-label={`Select ${p.first_name} ${p.last_name}`}
              >
                <div className="fee-parent-avatar">
                  {p.first_name.charAt(0).toUpperCase()}
                  {p.last_name.charAt(0).toUpperCase()}
                </div>
                <div className="fee-parent-info">
                  <div className="fee-parent-name">{p.first_name} {p.last_name}</div>
                  <div className="fee-parent-contact">
                    <Phone size={11} />
                    {p.contact || '—'}
                  </div>
                  <div className="fee-parent-status-row">
                    <div
                      className={
                        'fee-status-dot ' +
                        (p.balanceInfo.balance <= 0 ? 'clear' : 'due')
                      }
                    />
                    <span className="fee-children-badge">
                      {p.childrenCount} {p.childrenCount === 1 ? 'child' : 'children'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL ────────────────────────────────────────────── */}
      <div
        className={`fee-detail-panel${!mobileShowDetail ? ' hidden-mobile' : ''}`}
      >
        {!selectedParent ? (
          <div className="fee-detail-empty">
            <Receipt size={56} />
            <p>Select a parent to manage fees</p>
            <small>Choose from the list on the left to view fee details</small>
          </div>
        ) : detailLoading ? (
          <div className="manager-loading">
            <div className="spinner" />
            <span>Loading details…</span>
          </div>
        ) : (
          <>
            {/* Mobile Back Button */}
            <button
              className="fee-detail-back"
              aria-label="Back to parents list"
              onClick={() => setMobileShowDetail(false)}
            >
              <ArrowLeft size={16} /> Back to Parents
            </button>

            {/* ── 1. Parent Header ──────────────────────────────────── */}
            <div className="fee-parent-header">
              <div className="fee-parent-header-left">
                <h3>
                  {selectedParent.first_name} {selectedParent.last_name}
                </h3>
                <div className="fee-parent-header-meta">
                  <span>
                    <Phone size={13} /> {selectedParent.contact || '—'}
                  </span>
                  <span>CNIC: {maskCnic(selectedParent.cnic)}</span>
                </div>
              </div>
              {runningBalance > 0 && (
                <span className="fee-balance-badge due">
                  Rs {runningBalance.toLocaleString()} due
                </span>
              )}
              {runningBalance < 0 && (
                <span className="fee-balance-badge advance">
                  Rs {Math.abs(runningBalance).toLocaleString()} advance
                </span>
              )}
            </div>

            {/* ── 2. Children Table ─────────────────────────────────── */}
            {children.length > 0 && (
              <div className="fee-children-section">
                <div className="fee-section-title">
                  <Users size={14} /> Enrolled Children
                </div>
                <div className="fee-children-table-wrap">
                  <table className="fee-children-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Class Fee</th>
                        <th>Discount</th>
                        <th>Final Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map(child => {
                        let discAmt = 0;
                        if (child.discount_type === 'percentage' && child.discount_value) {
                          discAmt =
                            (N(child.classes?.[0]?.monthly_fee) * N(child.discount_value)) /
                            100;
                        } else if (child.discount_type === 'amount' && child.discount_value) {
                          discAmt = N(child.discount_value);
                        }
                        const classFee = N(child.classes?.[0]?.monthly_fee);
                        const finalFee = Math.max(0, classFee - discAmt);

                        return (
                          <tr key={child.id}>
                            <td style={{ fontWeight: 600 }}>
                              {child.first_name} {child.last_name}
                            </td>
                            <td>{child.classes?.[0]?.name || '—'}</td>
                            <td>Rs {classFee.toLocaleString()}</td>
                            <td>
                              {discAmt > 0 ? (
                                <span className="fee-discount-label">
                                  -Rs {discAmt.toLocaleString()}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              Rs {finalFee.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right' }}>
                          Monthly Total
                        </td>
                        <td style={{ color: 'var(--primary)' }}>
                          Rs {monthlyFee.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── 3. Stats Bar — REMOVED per user request ───────────── */}

            {/* ── 4. Fee Status — Month Grid ────────────────────────── */}
            <div className="fee-status-section">
              <div className="fee-section-title">
                <Calendar size={14} /> Fee Status
              </div>
              <div className="fee-range-label">{rangeLabel}</div>
              <div className="fee-month-grid">
                {payableMonths.map(ym => {
                  const isPaid = touchedMonths.has(ym);
                  const isSelected = selectedMonths.has(ym);
                  const isUnpaid = !isPaid;

                  // First unpaid month absorbs paidMonthsBalance
                  let displayFee = monthlyFee;
                  const isFirstUnpaid =
                    unpaidMonths.length > 0 && ym === unpaidMonths[0];
                  if (isFirstUnpaid) {
                    displayFee = monthlyFee + paidMonthsBalance;
                  }

                  return (
                    <div
                      key={ym}
                      className={
                        'fee-month-card' +
                        (isPaid ? ' paid' : '') +
                        (isSelected ? ' selected' : '') +
                        (isUnpaid && !isSelected ? ' selectable' : '')
                      }
                      onClick={() => isUnpaid && toggleMonth(ym)}
                    >
                      {isSelected && (
                        <div className="fee-month-check">
                          <CheckCircle size={12} />
                        </div>
                      )}
                      <span className="fee-month-card-name">
                        {shortMonth(ym)} {ym.slice(2, 4)}
                      </span>
                      <span
                        className={
                          'fee-month-card-fee' +
                          (displayFee < 0 ? ' negative' : '')
                        }
                      >
                        {displayFee < 0
                          ? `covered`
                          : `Rs ${displayFee.toLocaleString()}`}
                      </span>
                      {isPaid && (
                        <span className="fee-month-card-badge paid-badge">
                          ✓ Paid
                        </span>
                      )}
                      {isUnpaid && !isSelected && (
                        <span className="fee-month-card-badge due-badge">
                          ○ Due
                        </span>
                      )}
                      {isSelected && (
                        <span className="fee-month-card-badge selected-badge">
                          ● Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 4. Payment Summary (when months selected) ─────────── */}
            {selectedMonths.size > 0 && (
              <div className="fee-modal-summary">
                <div className="fee-summary-title">
                  <CreditCard size={16} /> Payment Summary
                </div>

                <div className="fee-summary-row">
                  <span className="fee-summary-row-label">
                    Fee for {selectedMonths.size} month(s)
                  </span>
                  <span className="fee-summary-row-value">
                    Rs {(selectedMonths.size * monthlyFee).toLocaleString()}
                  </span>
                </div>

                {paidMonthsBalance !== 0 && (
                  <div className="fee-summary-row">
                    <span className="fee-summary-row-label">
                      Previous Balance
                    </span>
                    <span
                      className={
                        'fee-summary-row-value ' +
                        (paidMonthsBalance > 0 ? 'danger' : 'advance')
                      }
                    >
                      {paidMonthsBalance > 0 ? '+' : ''}
                      Rs {paidMonthsBalance.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="fee-summary-row total">
                  <span className="fee-summary-row-label">Total Due</span>
                  <span className="fee-summary-row-value">
                    Rs {Math.max(0, totalForSelected).toLocaleString()}
                  </span>
                </div>

                {/* Live remaining/advance indicator */}
                {paymentAmount && parseInt(paymentAmount, 10) > 0 && (
                  <div
                    className={
                      'fee-modal-remaining ' +
                      (netBalance > 0
                        ? 'warning'
                        : netBalance < 0
                          ? 'advance'
                          : 'paid')
                    }
                  >
                    {netBalance > 0
                      ? `Rs ${netBalance.toLocaleString()} still remaining`
                      : netBalance < 0
                        ? `Rs ${Math.abs(netBalance).toLocaleString()} advance after payment`
                        : '✓ Exact payment'}
                  </div>
                )}

                {/* Payment Form */}
                <div className="fee-payment-form" style={{ marginTop: '1rem' }}>
                  <div className="fee-form-row">
                    <div className="fee-form-group">
                      <label>Amount (Rs) *</label>
                      <input
                        type="number"
                        min="1"
                        max="99999999"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="fee-form-group">
                      <label>Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                      >
                        {PAYMENT_METHODS.map(m => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="fee-form-row">
                    <div className="fee-form-group">
                      <label>Payment Date</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                      />
                    </div>
                    <div className="fee-form-group">
                      <label>Notes (optional)</label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={e => setPaymentNotes(e.target.value)}
                        placeholder="Any notes…"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={recordPayment}
                    isLoading={saving}
                    disabled={
                      !paymentAmount || parseInt(paymentAmount, 10) <= 0
                    }
                    fullWidth
                    size="lg"
                  >
                    <CreditCard size={16} /> Record Payment
                  </Button>
                </div>
              </div>
            )}

            {/* ── 6. Payment History ────────────────────────────────── */}
            <div className="fee-history-section">
              <div className="fee-section-title">
                <Receipt size={14} /> Payment History
              </div>
              {payments.length === 0 ? (
                <div className="fee-history-empty">
                  No payments recorded yet
                </div>
              ) : (
                <div className="fee-payment-history-list">
                  {payments.map(p => (
                    <div key={p.id} className="fee-payment-row">
                      <div className="fee-payment-row-icon">
                        <CheckCircle size={18} />
                      </div>
                      <div className="fee-payment-row-details">
                        <div className="fee-payment-row-date">
                          {new Date(p.payment_date).toLocaleDateString(
                            undefined,
                            { year: 'numeric', month: 'short', day: 'numeric' },
                          )}
                        </div>
                        <div className="fee-payment-row-months">
                          {p.months_paid
                            .slice()
                            .sort()
                            .map(m => shortMonth(m))
                            .join(', ')}{' '}
                          ({p.months_count} month{p.months_count !== 1 ? 's' : ''})
                        </div>
                      </div>
                      <span className="fee-payment-row-amount">
                        Rs {p.amount.toLocaleString()}
                      </span>
                      <span className="fee-payment-row-method">
                        {p.payment_method}
                      </span>
                      {isOwner && (
                        <button
                          className="fee-payment-delete"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete payment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        className="fee-payment-view"
                        onClick={() => loadReceiptFromPayment(p.id)}
                        title="View receipt"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Flash Message ──────────────────────────────────────────── */}
      {flash && (
        <div
          className={
            'fee-toast ' + (flash.startsWith('Error') ? 'error' : 'success')
          }
        >
          {flash.startsWith('Error') ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle size={20} />
          )}
          <span>{flash}</span>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────── */}
      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="confirm-box">
            <Trash2 size={40} color="var(--danger)" />
            <h3>Delete Payment?</h3>
            <p>
              Remove this payment of{' '}
              <strong>Rs {deleteTarget.amount.toLocaleString()}</strong>?
            </p>
            <div className="confirm-box-btns">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeletePayment}
                isLoading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Receipt Preview Modal ──────────────────────────────────── */}
      {showReceipt && currentReceipt && (
        <ReceiptPreview
          receipt={currentReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};
