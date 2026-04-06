import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp, Calendar, Clock, Search, Users, AlertCircle,
} from 'lucide-react';
import './FeeStatsManager.css';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

type ClassBreakdownItem = {
  classId: string;
  className: string;
  expected: number;
  collected: number;
};

type ParentDuesRow = {
  id: string;
  name: string;
  contact: string;
  childrenCount: number;
  balance: number;
};

/* ═══════════════════════════════════════════════════════════════════
   HELPERS (mirrors FeeManager logic)
   ═══════════════════════════════════════════════════════════════════ */

function N(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

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

function getAdmissionMonth(students: { date_of_admission: string | null }[]): string {
  if (!students.length) return currentMonthStr();
  const months = students
    .map(s => s.date_of_admission?.slice(0, 7))
    .filter((m): m is string => !!m);
  if (!months.length) return currentMonthStr();
  return [...months].sort()[0];
}

function computeBalance(
  children: { monthly_fee: number; discount_type: string | null; discount_value: number | null; date_of_admission: string | null }[],
  payments: { amount: number; months_paid: string[] }[],
  cm: string,
): number {
  const admMonth = getAdmissionMonth(children);
  const payableMonths = getBillableMonths(admMonth, cm);
  const monthlyAfterDiscount = children.reduce((sum, c) => {
    let disc = 0;
    if (c.discount_type === 'percentage' && c.discount_value) disc = (N(c.monthly_fee) * N(c.discount_value)) / 100;
    else if ((c.discount_type === 'amount' || c.discount_type === 'fixed') && c.discount_value) disc = N(c.discount_value);
    return sum + Math.max(0, N(c.monthly_fee) - disc);
  }, 0);
  const totalOwed = payableMonths.length * monthlyAfterDiscount;
  const totalPaid = payments.reduce((s, p) => s + N(p.amount), 0);
  return totalOwed - totalPaid;
}

function formatPKR(n: number): string {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(1)}K`;
  return `Rs ${n.toLocaleString()}`;
}

/* ═══════════════════════════════════════════════════════════════════
   SVG BAR CHART
   ═══════════════════════════════════════════════════════════════════ */

const BAR_CHART_H = 180;
const BAR_GAP = 12;
const GROUP_GAP = 28;
const BAR_W = 28;

const ClassBarChart = ({ data }: { data: ClassBreakdownItem[] }) => {
  if (!data.length) return (
    <div className="fss-chart-empty">
      <AlertCircle size={32} />
      <p>No class data available</p>
    </div>
  );

  const maxVal = Math.max(...data.map(d => Math.max(d.expected, d.collected)), 1);
  const groupW = BAR_W * 2 + BAR_GAP + GROUP_GAP;
  const svgW = data.length * groupW + GROUP_GAP;

  const yLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="fss-chart-scroll">
      <svg
        width={svgW}
        height={BAR_CHART_H + 60}
        className="fss-chart-svg"
        aria-label="Class-wise fee collection chart"
      >
        {/* Y-axis guide lines */}
        {yLines.map(frac => {
          const y = 8 + (1 - frac) * BAR_CHART_H;
          return (
            <g key={frac}>
              <line x1={0} y1={y} x2={svgW} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 3" />
              <text x={2} y={y - 3} fontSize={9} fill="var(--text-muted)">
                {frac === 0 ? '' : formatPKR(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {data.map((item, i) => {
          const x = GROUP_GAP / 2 + i * groupW;
          const expH = Math.max(2, (item.expected / maxVal) * BAR_CHART_H);
          const colH = Math.max(2, (item.collected / maxVal) * BAR_CHART_H);
          const expY = 8 + BAR_CHART_H - expH;
          const colY = 8 + BAR_CHART_H - colH;
          const labelX = x + BAR_W + BAR_GAP / 2;

          return (
            <g key={item.classId}>
              {/* Expected bar */}
              <rect
                x={x}
                y={expY}
                width={BAR_W}
                height={expH}
                rx={5}
                className="fss-bar-expected"
              />
              {/* Collected bar */}
              <rect
                x={x + BAR_W + BAR_GAP}
                y={colY}
                width={BAR_W}
                height={colH}
                rx={5}
                className="fss-bar-collected"
              />
              {/* Class label */}
              <text
                x={labelX}
                y={8 + BAR_CHART_H + 16}
                fontSize={10}
                textAnchor="middle"
                fill="var(--text-muted)"
                className="fss-bar-label"
              >
                {item.className.length > 10 ? item.className.slice(0, 9) + '…' : item.className}
              </text>
              {/* Value labels */}
              {item.expected > 0 && (
                <text x={x + BAR_W / 2} y={expY - 4} fontSize={9} textAnchor="middle" fill="var(--text-muted)">
                  {formatPKR(item.expected)}
                </text>
              )}
              {item.collected > 0 && (
                <text x={x + BAR_W + BAR_GAP + BAR_W / 2} y={colY - 4} fontSize={9} textAnchor="middle" fill="var(--text-muted)">
                  {formatPKR(item.collected)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="fss-chart-legend">
        <span className="fss-legend-item expected"><span className="fss-legend-dot expected" />Expected</span>
        <span className="fss-legend-item collected"><span className="fss-legend-dot collected" />Collected</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export const FeeStatsManager = ({ schoolId }: { schoolId: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // KPI state
  const [expectedMonthly, setExpectedMonthly] = useState(0);
  const [receivedThisMonth, setReceivedThisMonth] = useState(0);
  const [collectedToday, setCollectedToday] = useState(0);

  // Chart
  const [classBreakdown, setClassBreakdown] = useState<ClassBreakdownItem[]>([]);

  // Dues search
  const [allParentDues, setAllParentDues] = useState<ParentDuesRow[]>([]);
  const [duesThreshold, setDuesThreshold] = useState('');

  const cm = useMemo(() => currentMonthStr(), []);
  const today = useMemo(() => todayStr(), []);

  /* ── fetch all data in one shot ──────────────────────────────────── */
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, classesRes, paymentsRes, parentsRes] = await Promise.all([
        supabase
          .from('students')
          .select('id, parent_id, admission_class_id, monthly_fee, discount_type, discount_value, date_of_admission, active')
          .eq('school_id', schoolId)
          .eq('active', true),
        supabase
          .from('classes')
          .select('id, name, monthly_fee')
          .eq('school_id', schoolId),
        supabase
          .from('fee_payments')
          .select('parent_id, amount, payment_date, months_paid')
          .eq('school_id', schoolId),
        supabase
          .from('parents')
          .select('id, first_name, last_name, contact')
          .eq('school_id', schoolId)
          .order('first_name'),
      ]);

      const students = studentsRes.data || [];
      const classes = classesRes.data || [];
      const payments = paymentsRes.data || [];
      const parents = parentsRes.data || [];

      /* ── class map ────────────────────────────────────────────────── */
      const classMap = new Map<string, { name: string; monthly_fee: number }>();
      classes.forEach((c: any) => classMap.set(c.id, { name: c.name, monthly_fee: N(c.monthly_fee) }));

      /* ── KPI: Expected Monthly ────────────────────────────────────── */
      let expMonthly = 0;
      students.forEach((s: any) => {
        const classFee = N(classMap.get(s.admission_class_id)?.monthly_fee ?? s.monthly_fee);
        let disc = 0;
        if (s.discount_type === 'percentage' && s.discount_value) disc = classFee * N(s.discount_value) / 100;
        else if ((s.discount_type === 'amount' || s.discount_type === 'fixed') && s.discount_value) disc = N(s.discount_value);
        expMonthly += Math.max(0, classFee - disc);
      });
      setExpectedMonthly(expMonthly);

      /* ── KPI: Received This Month ─────────────────────────────────── */
      const thisMonthPayments = payments.filter((p: any) =>
        (p.payment_date || '').startsWith(cm),
      );
      setReceivedThisMonth(thisMonthPayments.reduce((s: number, p: any) => s + N(p.amount), 0));

      /* ── KPI: Collected Today ─────────────────────────────────────── */
      setCollectedToday(
        payments
          .filter((p: any) => p.payment_date === today)
          .reduce((s: number, p: any) => s + N(p.amount), 0),
      );

      /* ── Class-wise breakdown ─────────────────────────────────────── */
      // Build: parentId → set of classIds (of their children)
      const parentClassMap = new Map<string, Set<string>>();
      students.forEach((s: any) => {
        if (!s.admission_class_id) return;
        if (!parentClassMap.has(s.parent_id)) parentClassMap.set(s.parent_id, new Set());
        parentClassMap.get(s.parent_id)!.add(s.admission_class_id);
      });

      // Per class: expected
      const classExpected = new Map<string, number>();
      students.forEach((s: any) => {
        const cid = s.admission_class_id;
        if (!cid) return;
        const classFee = N(classMap.get(cid)?.monthly_fee ?? s.monthly_fee);
        let disc = 0;
        if (s.discount_type === 'percentage' && s.discount_value) disc = classFee * N(s.discount_value) / 100;
        else if ((s.discount_type === 'amount' || s.discount_type === 'fixed') && s.discount_value) disc = N(s.discount_value);
        const fee = Math.max(0, classFee - disc);
        classExpected.set(cid, (classExpected.get(cid) || 0) + fee);
      });

      // Per class: collected this month (from parents who have any child in that class)
      const classCollected = new Map<string, number>();
      thisMonthPayments.forEach((p: any) => {
        const classIds = parentClassMap.get(p.parent_id);
        if (!classIds) return;
        // Distribute payment proportionally across classes the parent's kids belong to
        const share = N(p.amount) / classIds.size;
        classIds.forEach(cid => {
          classCollected.set(cid, (classCollected.get(cid) || 0) + share);
        });
      });

      const breakdown: ClassBreakdownItem[] = classes
        .filter((c: any) => classExpected.has(c.id) || classCollected.has(c.id))
        .map((c: any) => ({
          classId: c.id,
          className: c.name,
          expected: Math.round(classExpected.get(c.id) || 0),
          collected: Math.round(classCollected.get(c.id) || 0),
        }))
        .sort((a, b) => b.expected - a.expected);

      setClassBreakdown(breakdown);

      /* ── Dues per parent ──────────────────────────────────────────── */
      // Build student map and payment map per parent
      const studentMap = new Map<string, { monthly_fee: number; discount_type: string | null; discount_value: number | null; date_of_admission: string | null }[]>();
      students.forEach((s: any) => {
        const classFee = N(classMap.get(s.admission_class_id)?.monthly_fee ?? s.monthly_fee);
        if (!studentMap.has(s.parent_id)) studentMap.set(s.parent_id, []);
        studentMap.get(s.parent_id)!.push({
          monthly_fee: classFee,
          discount_type: s.discount_type,
          discount_value: s.discount_value,
          date_of_admission: s.date_of_admission,
        });
      });

      const paymentMap = new Map<string, { amount: number; months_paid: string[] }[]>();
      payments.forEach((p: any) => {
        if (!paymentMap.has(p.parent_id)) paymentMap.set(p.parent_id, []);
        paymentMap.get(p.parent_id)!.push({ amount: N(p.amount), months_paid: Array.isArray(p.months_paid) ? p.months_paid : [] });
      });

      const duesRows: ParentDuesRow[] = parents
        .map((par: any) => {
          const children = studentMap.get(par.id) || [];
          const pmts = paymentMap.get(par.id) || [];
          const balance = computeBalance(children, pmts, cm);
          return {
            id: par.id,
            name: `${par.first_name} ${par.last_name}`,
            contact: par.contact || '—',
            childrenCount: children.length,
            balance: Math.round(balance),
          };
        })
        .filter(r => r.balance > 0)            // only parents who owe money
        .sort((a, b) => b.balance - a.balance); // highest dues first

      setAllParentDues(duesRows);

    } catch (err: any) {
      setError('Failed to load fee statistics: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, cm, today]);

  useEffect(() => { loadStats(); }, [loadStats]);

  /* ── filtered dues ───────────────────────────────────────────────── */
  const filteredDues = useMemo(() => {
    const threshold = parseFloat(duesThreshold);
    if (!duesThreshold.trim() || isNaN(threshold) || threshold <= 0) return allParentDues;
    return allParentDues.filter(r => r.balance >= threshold);
  }, [allParentDues, duesThreshold]);

  /* ── collection rate ─────────────────────────────────────────────── */
  const collectionRate = expectedMonthly > 0
    ? Math.min(100, Math.round((receivedThisMonth / expectedMonthly) * 100))
    : 0;

  /* ── render ──────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="fss-loading">
        <div className="spinner" />
        <span>Loading fee statistics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fss-error">
        <AlertCircle size={32} />
        <p>{error}</p>
        <button className="fss-retry-btn" onClick={loadStats}>Retry</button>
      </div>
    );
  }

  return (
    <div className="fss-shell animate-fade-up">

      {/* ── Section Title ─────────────────────────────────────────────── */}
      <div className="fss-section-header">
        <div>
          <h2 className="fss-section-title">Fee Statistics</h2>
          <p className="fss-section-sub">
            {new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' })} — live snapshot
          </p>
        </div>
        <button className="fss-refresh-btn" onClick={loadStats} title="Refresh data">
          <TrendingUp size={16} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="fss-kpi-grid">
        <div className="fss-kpi-card amber">
          <div className="fss-kpi-icon"><TrendingUp size={20} /></div>
          <div className="fss-kpi-body">
            <div className="fss-kpi-label">Expected Monthly</div>
            <div className="fss-kpi-value">{formatPKR(expectedMonthly)}</div>
            <div className="fss-kpi-sub">Total fees billed this month</div>
          </div>
        </div>

        <div className="fss-kpi-card green">
          <div className="fss-kpi-icon"><Calendar size={20} /></div>
          <div className="fss-kpi-body">
            <div className="fss-kpi-label">Received This Month</div>
            <div className="fss-kpi-value">{formatPKR(receivedThisMonth)}</div>
            <div className="fss-kpi-sub">
              <span className={`fss-rate-badge ${collectionRate >= 75 ? 'good' : collectionRate >= 40 ? 'warn' : 'bad'}`}>
                {collectionRate}% collected
              </span>
            </div>
          </div>
        </div>

        <div className="fss-kpi-card blue">
          <div className="fss-kpi-icon"><Clock size={20} /></div>
          <div className="fss-kpi-body">
            <div className="fss-kpi-label">Collected Today</div>
            <div className="fss-kpi-value">{formatPKR(collectedToday)}</div>
            <div className="fss-kpi-sub">
              {new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Class-wise Chart ──────────────────────────────────────────── */}
      <div className="fss-card">
        <div className="fss-card-header">
          <h3 className="fss-card-title">Class-wise Collection</h3>
          <span className="fss-card-sub">Expected vs Collected — {new Date().toLocaleString('en-PK', { month: 'long' })}</span>
        </div>
        <ClassBarChart data={classBreakdown} />
      </div>

      {/* ── Dues Search ───────────────────────────────────────────────── */}
      <div className="fss-card">
        <div className="fss-card-header">
          <h3 className="fss-card-title">Search by Outstanding Dues</h3>
          <span className="fss-card-sub">Find parents who owe a certain amount or more</span>
        </div>

        <div className="fss-dues-search-row">
          <div className="fss-dues-search-box">
            <Search size={16} />
            <input
              id="dues-threshold-input"
              type="number"
              min="0"
              placeholder="Enter minimum dues amount (e.g. 5000)"
              value={duesThreshold}
              onChange={e => setDuesThreshold(e.target.value)}
            />
            {duesThreshold && (
              <button
                className="fss-dues-clear"
                onClick={() => setDuesThreshold('')}
                title="Clear"
              >×</button>
            )}
          </div>
          <div className="fss-dues-count">
            <Users size={14} />
            {filteredDues.length} {filteredDues.length === 1 ? 'parent' : 'parents'} found
          </div>
        </div>

        {filteredDues.length === 0 ? (
          <div className="fss-dues-empty">
            <Users size={40} />
            <p>
              {duesThreshold
                ? `No parents owe Rs ${parseFloat(duesThreshold).toLocaleString()} or more`
                : 'All parents are clear! No outstanding dues.'}
            </p>
          </div>
        ) : (
          <div className="fss-dues-table-wrap">
            <table className="fss-dues-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Parent</th>
                  <th>Contact</th>
                  <th>Children</th>
                  <th>Outstanding Dues</th>
                </tr>
              </thead>
              <tbody>
                {filteredDues.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="fss-rank">{idx + 1}</td>
                    <td>
                      <div className="fss-parent-cell">
                        <div className="fss-parent-avatar">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="fss-parent-name">{row.name}</span>
                      </div>
                    </td>
                    <td className="fss-contact">{row.contact}</td>
                    <td>
                      <span className="fss-children-badge">{row.childrenCount}</span>
                    </td>
                    <td>
                      <span className={`fss-dues-amount ${row.balance >= 10000 ? 'high' : row.balance >= 5000 ? 'med' : 'low'}`}>
                        Rs {row.balance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
