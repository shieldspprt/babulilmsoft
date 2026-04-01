import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { Button } from './ui/Button';
import {
  Search, Receipt, Trash2, Phone, CreditCard,
  CheckCircle, ArrowLeft
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

/* ── Helpers ──────────────────────────────────────────────────── */

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

function prevMonthStr(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shortMonth(ym: string): string {
  const m = parseInt(ym.split('-')[1], 10) - 1;
  return MONTH_NAMES[m];
}

/** Returns all 12 months of the current year */
function getMonthWindow(): string[] {
  const now = new Date();
  const y = now.getFullYear();
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(`${y}-${String(i + 1).padStart(2, '0')}`);
  }
  return months;
}

/** Parse a raw Supabase row into a FeeBill with correct numeric types */
function parseBill(raw: any): FeeBill {
  return {
    id: raw.id,
    school_id: raw.school_id,
    parent_id: raw.parent_id,
    billing_month: raw.billing_month,
    children_data: (raw.children_data || []).map((c: any) => ({
      student_id: c.student_id || '',
      name: c.name || '',
      class_name: c.class_name || '—',
      date_of_admission: c.date_of_admission || '',
      original_fee: N(c.original_fee),
      discount_type: c.discount_type || null,
      discount_value: c.discount_value != null ? N(c.discount_value) : null,
      monthly_fee: N(c.monthly_fee),
    })),
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

/** Parse a raw Supabase row into a FeePayment with correct numeric types */
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

/* ── Component ──────────────────────────────────────────────────── */

export const FeeManager = ({ schoolId }: { schoolId: string }) => {
  const { flash, showFlash } = useFlashMessage(4000);

  // ── State ──────────────────────────────────────────────────────
  const [parents, setParents] = useState<Parent[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [parentStatuses, setParentStatuses] = useState<Record<string, string>>({});
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

  // ── Load parents ───────────────────────────────────────────────
  const loadParents = async () => {
    setLoading(true);
    try {
      const [{ data: pData }, { data: sData }] = await Promise.all([
        supabase.from('parents').select('*').eq('school_id', schoolId).order('first_name'),
        supabase.from('students').select('parent_id').eq('school_id', schoolId).eq('active', true),
      ]);
      setParents(pData || []);

      const counts: Record<string, number> = {};
      (sData || []).forEach((s: any) => {
        counts[s.parent_id] = (counts[s.parent_id] || 0) + 1;
      });
      setStudentCounts(counts);

      // Load current-month bill status for each parent (dot indicator)
      const cm = currentMonthStr();
      const parentIdList = (pData || []).map((p: any) => p.id);
      if (parentIdList.length > 0) {
        const { data: statusBills } = await supabase
          .from('fee_bills')
          .select('parent_id, status, total_fee, carried_forward, balance')
          .eq('school_id', schoolId)
          .eq('billing_month', cm)
          .in('parent_id', parentIdList);

        const statusMap: Record<string, string> = {};
        (statusBills || []).forEach((b: any) => {
          const fee = N(b.total_fee);
          const cf = N(b.carried_forward);
          if (!b.status || (b.status === 'pending' && fee === 0 && cf === 0)) {
            statusMap[b.parent_id] = 'gray';
          } else if (b.status === 'paid' || b.status === 'overpaid') {
            statusMap[b.parent_id] = 'green';
          } else if (b.status === 'partial') {
            statusMap[b.parent_id] = 'amber';
          } else if (fee > 0 || cf > 0) {
            statusMap[b.parent_id] = 'gray'; // pending with amount due
          } else {
            statusMap[b.parent_id] = 'gray';
          }
        });
        setParentStatuses(statusMap);
      }
    } catch (err: any) {
      showFlash('Error loading parents: ' + (err.message || 'Unknown error'));
    }
    setLoading(false);
  };

  useEffect(() => { loadParents(); }, [schoolId]);

  // ── Derived: month window ──────────────────────────────────────
  const monthWindow = useMemo(getMonthWindow, []);

  // ── Bills lookup map ───────────────────────────────────────────
  const billsByMonth = useMemo(() => {
    const map: Record<string, FeeBill> = {};
    bills.forEach(b => { map[b.billing_month] = b; });
    return map;
  }, [bills]);

  // ── Generate bills for month window ────────────────────────────
  const generateBills = useCallback(async (parentId: string, existingBills: FeeBill[]) => {
    // Keep non-pending bills (paid/partial/overpaid) untouched
    const lockedBills = existingBills.filter(b => b.status !== 'pending');
    const lockedMap: Record<string, FeeBill> = {};
    lockedBills.forEach(b => { lockedMap[b.billing_month] = b; });

    // Delete ALL pending bills for this parent (clean slate)
    const pendingIds = existingBills.filter(b => b.status === 'pending').map(b => b.id);
    if (pendingIds.length > 0) {
      const { error: delErr } = await supabase
        .from('fee_bills')
        .delete()
        .in('id', pendingIds);
      if (delErr) {
        showFlash('Error cleaning up bills: ' + delErr.message);
        setBills(existingBills);
        return;
      }
    }

    // Fetch all active students for this parent
    const { data: allStudents, error: stuErr } = await supabase
      .from('students')
      .select('id, first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, admission_class_id')
      .eq('parent_id', parentId)
      .eq('school_id', schoolId)
      .eq('active', true);

    if (stuErr) {
      showFlash('Error loading students: ' + stuErr.message);
      setBills(lockedBills);
      return;
    }

    const students = allStudents || [];

    // Fetch class info for these students
    const classIds = [...new Set(students.map((s: any) => s.admission_class_id).filter(Boolean))] as string[];
    const classNameMap: Record<string, string> = {};
    const classFeeMap: Record<string, number> = {};
    if (classIds.length > 0) {
      const { data: classRows } = await supabase
        .from('classes').select('id, name, monthly_fee').in('id', classIds);
      (classRows || []).forEach((c: any) => {
        classNameMap[c.id] = c.name || '';
        classFeeMap[c.id] = N(c.monthly_fee);
      });
    }

    // Build new bills for the 12-month window (sorted chronologically for carry-forward chaining)
    const sortedMonths = [...monthWindow].sort();
    const newBills: any[] = [];

    for (const month of sortedMonths) {
      // Skip if locked bill exists
      if (lockedMap[month]) continue;

      // Filter students admitted by this month (string compare on YYYY-MM)
      const admitted = students.filter((s: any) => {
        if (!s.date_of_admission) return true;
        return s.date_of_admission.slice(0, 7) <= month;
      });

      if (admitted.length === 0) continue;

      // Compute total fee for this month
      const totalFee = admitted.reduce((sum: number, s: any) => sum + N(s.monthly_fee), 0);

      // Carry forward from previous month's balance
      const pm = prevMonthStr(month);
      const prevBill = lockedMap[pm] || newBills.find((b: any) => b.billing_month === pm);
      const cf = prevBill ? N(prevBill.balance) : 0;

      // Build children snapshot
      const childrenData = admitted.map((s: any) => ({
        student_id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        class_name: classNameMap[s.admission_class_id] || '—',
        date_of_admission: s.date_of_admission || '',
        original_fee: classFeeMap[s.admission_class_id] || 0,
        discount_type: s.discount_type || null,
        discount_value: s.discount_value != null ? N(s.discount_value) : null,
        monthly_fee: N(s.monthly_fee),
      }));

      newBills.push({
        school_id: schoolId,
        parent_id: parentId,
        billing_month: month,
        children_data: childrenData,
        total_fee: totalFee,
        carried_forward: cf,
        amount_paid: 0,
        balance: totalFee + cf,
        status: 'pending',
      });
    }

    // Batch insert all new bills
    if (newBills.length > 0) {
      const { error: insErr } = await supabase
        .from('fee_bills')
        .insert(newBills);
      if (insErr) {
        showFlash('Error creating bills: ' + insErr.message);
        setBills(lockedBills);
        return;
      }
    }

    // Reload all bills from DB
    const { data: freshBills } = await supabase
      .from('fee_bills')
      .select('*')
      .eq('parent_id', parentId)
      .eq('school_id', schoolId)
      .order('billing_month');
    setBills((freshBills || []).map(parseBill));
  }, [schoolId, monthWindow, showFlash]);

  // ── Load parent detail ─────────────────────────────────────────
  const loadParentDetail = useCallback(async (parent: Parent) => {
    setSelectedParent(parent);
    setBills([]);
    setPayments([]);
    setChildren([]);

    try {
      const [billsRes, paymentsRes, childrenRes] = await Promise.all([
        supabase.from('fee_bills').select('*').eq('parent_id', parent.id).eq('school_id', schoolId).order('billing_month'),
        supabase.from('fee_payments').select('*').eq('parent_id', parent.id).eq('school_id', schoolId).order('created_at', { ascending: false }),
        supabase.from('students')
          .select('id, parent_id, first_name, last_name, monthly_fee, discount_type, discount_value, date_of_admission, admission_class_id, active, classes(name, monthly_fee)')
          .eq('parent_id', parent.id)
          .eq('school_id', schoolId)
          .eq('active', true),
      ]);

      const existingBills = (billsRes.data || []).map(parseBill);
      setPayments((paymentsRes.data || []).map(parsePayment));
      setChildren((childrenRes.data || []) as unknown as StudentRow[]);

      // Generate / refresh bills for the 12-month window
      await generateBills(parent.id, existingBills);
    } catch (err: any) {
      showFlash('Error loading parent detail: ' + (err.message || 'Unknown error'));
    }
  }, [schoolId, generateBills, showFlash]);

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

  // ── Derived: current month bill ────────────────────────────────
  const currentMonthBill = billsByMonth[currentMonthStr()];

  // ── Derived: current monthly fee total from children ───────────
  const currentMonthlyFee = useMemo(() => {
    return children.reduce((sum: number, c: StudentRow) => sum + N(c.monthly_fee), 0);
  }, [children]);

  // ── Inline payment helpers ─────────────────────────────────────
  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  const canSelectMonth = (month: string): boolean => {
    const bill = billsByMonth[month];
    if (!bill) return false;
    if (bill.status !== 'pending') return false;
    if (bill.total_fee === 0 && bill.carried_forward === 0) return false;
    return true;
  };

  const totalForSelected = useMemo(() => {
    let total = 0;
    selectedMonths.forEach(month => {
      const bill = billsByMonth[month];
      if (bill) total += bill.total_fee + bill.carried_forward;
    });
    return total;
  }, [selectedMonths, billsByMonth]);

  // Previous balance = total of all carried_forward in selected months
  const previousBalance = useMemo(() => {
    let total = 0;
    selectedMonths.forEach(month => {
      const bill = billsByMonth[month];
      if (bill) total += bill.carried_forward;
    });
    return total;
  }, [selectedMonths, billsByMonth]);

  // Base charges = total of monthly fees only (no carried_forward)
  const baseCharges = useMemo(() => {
    let total = 0;
    selectedMonths.forEach(month => {
      const bill = billsByMonth[month];
      if (bill) total += bill.total_fee;
    });
    return total;
  }, [selectedMonths, billsByMonth]);

  const netBalance = totalForSelected - parseInt(paymentAmount || '0', 10);

  // ── Record payment ─────────────────────────────────────────────
  const recordPayment = async () => {
    if (selectedMonths.size === 0 || !paymentAmount || parseInt(paymentAmount) <= 0) {
      showFlash('Error: Select at least one month and enter a valid amount');
      return;
    }
    if (!selectedParent) return;
    setSaving(true);

    try {
      // 1. Sort selected months chronologically
      const sorted = Array.from(selectedMonths).sort();

      // 2. Reload fresh bills from DB, verify all are still pending
      const { data: freshBills } = await supabase
        .from('fee_bills')
        .select('*')
        .eq('parent_id', selectedParent.id)
        .eq('school_id', schoolId)
        .order('billing_month');

      const freshMap: Record<string, FeeBill> = {};
      (freshBills || []).forEach((b: any) => {
        freshMap[b.billing_month] = parseBill(b);
      });

      // Duplicate prevention: verify all selected months are still pending
      for (const month of sorted) {
        const bill = freshMap[month];
        if (!bill || bill.status !== 'pending') {
          showFlash('Error: Some selected months already have payments. Please refresh and try again.');
          setSaving(false);
          return;
        }
      }

      // 3. Calculate totalDue = sum of (total_fee + carried_forward) for ALL selected months
      let totalDue = 0;
      for (const month of sorted) {
        const bill = freshMap[month];
        if (bill) totalDue += bill.total_fee + bill.carried_forward;
      }

      // 4. Calculate netBalance = totalDue - amount_paid
      const amt = parseInt(paymentAmount, 10);
      const netBal = totalDue - amt; // positive = underpaid, negative = overpaid/advance

      // 5. Update EACH selected bill:
      //    - amount_paid = that bill's (total_fee + carried_forward) (full due)
      //    - balance = 0 for all EXCEPT the LAST selected month
      //    - balance = netBal for the LAST selected month
      //    - status = 'paid' for ALL
      const lastMonth = sorted[sorted.length - 1];

      const billUpdates: { id: string; amount_paid: number; balance: number; status: string }[] = [];
      for (const month of sorted) {
        const bill = freshMap[month];
        if (!bill) continue;
        const billDue = bill.total_fee + bill.carried_forward;
        billUpdates.push({
          id: bill.id,
          amount_paid: billDue,
          balance: month === lastMonth ? netBal : 0,
          status: 'paid',
        });
      }

      // 6. Insert into fee_payments table, get ID back
      const { data: payData, error: payErr } = await supabase
        .from('fee_payments')
        .insert({
          school_id: schoolId,
          parent_id: selectedParent.id,
          amount: amt,
          months_paid: sorted,
          months_count: sorted.length,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          notes: paymentNotes || null,
        })
        .select('id')
        .single();

      if (payErr) throw payErr;

      const paymentId = payData?.id;

      // Update each bill using .update().eq('id', bill.id)
      for (const u of billUpdates) {
        const { error: billErr } = await supabase
          .from('fee_bills')
          .update({
            amount_paid: u.amount_paid,
            balance: u.balance,
            status: u.status,
            payment_id: paymentId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', u.id);
        if (billErr) throw billErr;
      }

      showFlash(`Payment of Rs ${amt.toLocaleString()} recorded for ${sorted.length} month${sorted.length > 1 ? 's' : ''}!`);

      // 7. Reset form: clear selectedMonths, paymentAmount, paymentNotes
      setSelectedMonths(new Set());
      setPaymentAmount('');
      setPaymentNotes('');

      // 8. Reload parent detail
      loadParentDetail(selectedParent);
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to record payment'));
    }

    setSaving(false);
  };

  // ── Delete payment ─────────────────────────────────────────────
  const handleDeletePayment = async () => {
    if (!deleteTarget || !selectedParent) return;
    setDeleting(true);

    try {
      // 1. Find all bills linked to this payment (via payment_id)
      const linkedBills = bills.filter(b => b.payment_id === deleteTarget.id);

      // 2. Revert ALL linked bills: amount_paid=0, balance=0, status='pending', payment_id=null
      for (const bill of linkedBills) {
        const { error } = await supabase.from('fee_bills').update({
          amount_paid: 0,
          balance: 0,
          status: 'pending',
          payment_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', bill.id);

        if (error) throw error;
      }

      // 3. Delete the payment record
      const { error: delErr } = await supabase.from('fee_payments').delete().eq('id', deleteTarget.id);
      if (delErr) throw delErr;

      showFlash('Payment deleted successfully');
      setDeleteTarget(null);

      // 4. Reload parent detail (which regenerates bills and recalculates carry-forward chain)
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
      {/* ── Left Panel: Parent List ── */}
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
                  <span className={`fee-status-dot ${parentStatuses[p.id] || 'gray'}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Parent Detail ── */}
      <div className="fee-detail-panel" style={{ display: !selectedParent && !mobileShowDetail ? 'none' : undefined }}>
        {!selectedParent ? (
          /* ── Empty state ── */
          <div className="fee-empty-state">
            <Receipt size={52} />
            <p>Select a parent to view fee details</p>
            <small>Search by name, CNIC, or contact number</small>
          </div>
        ) : (
          /* ── Year Overview ── */
          <div className="animate-fade-up">
            {/* Mobile back button */}
            <button className="fee-back-btn" onClick={() => { setSelectedParent(null); setMobileShowDetail(false); }}>
              <ArrowLeft size={16} /> Back to parents
            </button>

            {/* Parent header */}
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
              {currentMonthBill && currentMonthBill.status !== 'pending' && (
                <div className="fee-parent-header-balance">
                  <div className={`balance-amount ${currentMonthBill.balance > 0 ? 'positive' : currentMonthBill.balance < 0 ? 'negative' : 'zero'}`}>
                    {currentMonthBill.balance > 0
                      ? `Rs ${currentMonthBill.balance.toLocaleString()} due`
                      : currentMonthBill.balance < 0
                        ? `Rs ${Math.abs(currentMonthBill.balance).toLocaleString()} advance`
                        : '—'}
                  </div>
                  <div className="balance-label">
                    {currentMonthBill.balance > 0 ? 'unpaid balance' : currentMonthBill.balance < 0 ? 'credit' : ''}
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
                  <span className="fee-monthly-total-amount">Rs {currentMonthlyFee.toLocaleString()}</span>
                </div>
              </>
            )}

            {/* ── Fee Status Grid (selectable pending months) ── */}
            {children.length > 0 && (
              <>
                <div className="fee-section-title">
                  Fee Status — {new Date().getFullYear()}{selectedMonths.size > 0 ? ` (${selectedMonths.size} selected)` : ''}
                </div>
                <div className="fee-month-grid">
                  {Array.from({ length: 12 }, (_, i) => {
                    const y = new Date().getFullYear();
                    const m = String(i + 1).padStart(2, '0');
                    const ym = `${y}-${m}`;
                    const bill = billsByMonth[ym];
                    const currentM = new Date().getMonth() + 1;
                    const isSelectable = canSelectMonth(ym);
                    const isSelected = selectedMonths.has(ym);

                    let statusClass = 'pending';
                    let statusLabel = '';
                    let badgeClass = '';

                    if (bill) {
                      const totalDue = bill.total_fee + bill.carried_forward;
                      if (bill.status === 'paid') {
                        statusClass = 'paid'; statusLabel = '✓ Paid'; badgeClass = 'paid';
                      } else if (bill.status === 'overpaid') {
                        statusClass = 'overpaid'; statusLabel = '↻ Advance'; badgeClass = 'paid';
                      } else if (bill.status === 'partial') {
                        statusClass = 'partial'; statusLabel = '● Partial'; badgeClass = 'due';
                      } else if (totalDue > 0) {
                        statusClass = 'pending'; statusLabel = '○ Due'; badgeClass = 'due';
                      }
                    } else {
                      statusClass = 'empty';
                    }

                    // Only show cards for past/current months; future months without data are hidden
                    const showCard = bill || i + 1 <= currentM;
                    if (!showCard) return null;

                    return (
                      <div
                        key={ym}
                        className={`fee-month-card ${statusClass}${!bill ? ' empty' : ''}${isSelected ? ' selected' : ''}${isSelectable ? ' selectable' : ''}`}
                        onClick={() => isSelectable && toggleMonth(ym)}
                        style={isSelectable ? { cursor: 'pointer' } : undefined}
                      >
                        {isSelected && <div className="fee-month-selected-check"><CheckCircle size={14} /></div>}
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

                {/* ── Payment Summary + Form (appears when months are selected) ── */}
                {selectedMonths.size > 0 && (
                  <div style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginTop: '0.5rem',
                  }}>
                    {/* Payment summary */}
                    <div className="fee-modal-summary">
                      <div className="fee-modal-summary-row">
                        <span>Previous Balance</span>
                        <span>{previousBalance > 0
                          ? `Rs ${previousBalance.toLocaleString()}`
                          : previousBalance < 0
                            ? `(Rs ${Math.abs(previousBalance).toLocaleString()} advance)`
                            : 'Rs 0'}</span>
                      </div>
                      <div className="fee-modal-summary-row">
                        <span>Fee Total ({selectedMonths.size} month{selectedMonths.size > 1 ? 's' : ''})</span>
                        <span>Rs {baseCharges.toLocaleString()}</span>
                      </div>
                      <div className="fee-modal-summary-row total">
                        <span>Total Due</span>
                        <span>Rs {totalForSelected.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Remaining indicator — shown only when amount entered */}
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
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Amount Paying Now (Rs) *</label>
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
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Payment Method *</label>
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
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Payment Date *</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={e => setPaymentDate(e.target.value)}
                          style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Notes (optional)</label>
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

            {/* Payment history */}
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

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <Trash2 size={40} color="var(--danger)" />
            <h3>Delete this payment?</h3>
            <p>
              Rs {deleteTarget.amount.toLocaleString()} recorded on{' '}
              {new Date(deleteTarget.payment_date).toLocaleDateString('en-PK')}
              {' '}for {deleteTarget.months_paid.map(m => shortMonth(m)).join(', ')}.
            </p>
            <div className="confirm-box-btns">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeletePayment} isLoading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
