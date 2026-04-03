import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ClassesManager }   from '../components/ClassesManager';
import { IncomeManager }    from '../components/IncomeManager';
import { ExpenseManager }   from '../components/ExpenseManager';
import { SuppliersManager } from '../components/SuppliersManager';
import { ParentsManager }   from '../components/ParentsManager';
import { StudentsManager }  from '../components/StudentsManager';
import { FeeManager }           from '../components/FeeManager';
import { SchoolProfileManager } from '../components/SchoolProfileManager';
import { TeamManager }           from '../components/TeamManager';
import { Button } from '../components/ui/Button';
import { Input }  from '../components/ui/Input';
import {
  LayoutDashboard, GraduationCap, DollarSign,
  Users2, CreditCard, History, LogOut, AlertTriangle, Clock,
  CheckCircle, XCircle, BookOpen,
  Receipt, Search, X, ArrowLeft, CheckCircle2, Banknote
} from 'lucide-react';
import './Dashboard.css';

type Tab = 'overview' | 'classes' | 'people' | 'people-students' | 'people-parents' | 'finances' | 'finances-income' | 'finances-expense' | 'finances-suppliers' | 'fee' | 'team' | 'profile' | 'buy' | 'history';

type Parent = {
  id: string;
  first_name: string;
  last_name: string;
  cnic: string;
  contact: string;
};

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  monthly_fee: number;
  classes?: { name: string };
};

const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'people',   label: 'People',    icon: Users2 },
  { id: 'classes',  label: 'Classes',   icon: BookOpen },
  { id: 'finances', label: 'Finances',  icon: DollarSign },
  { id: 'team',     label: 'Team',      icon: GraduationCap },
];

const PAGE_TITLES: Record<Tab, string> = {
  overview:  '',
  classes:   'Classes',
  team:      'Team Management',
  buy:       'Buy Credits',
  profile:   'School Profile',
  history:   'Payment History',
  people:       'People',
  'people-parents':   'Parents & Guardians',
  'people-students':  'Students',
  finances:     'Finances',
  'finances-income':    'Income',
  'finances-expense':   'Expenses',
  'finances-suppliers': 'Suppliers',
  fee:       'Add Fee',
};

export const Dashboard = () => {
  const { profile, role, refreshProfile, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [tab, setTab]               = useState<Tab>('overview');
  const [payMethod, setPayMethod]   = useState<'JazzCash' | 'Bank'>('JazzCash');
  const [plan, setPlan]             = useState<{ credits: number; pkr: number } | null>(null);
  const [reference, setReference]   = useState('');
  const [buying, setBuying]         = useState(false);
  const [msg, setMsg]               = useState<{ text: string; type: string }>({ text: '', type: '' });
  const [history, setHistory]       = useState<any[]>([]);
  const [creditExpired, setCreditExpired] = useState(false);
  const [daysLeft, setDaysLeft]     = useState(0);
  const [overviewStats, setOverviewStats] = useState({ parents: 0, students: 0, classes: 0 });

  // Quick Fee Modal state
  const [showQuickFee, setShowQuickFee] = useState(false);
  const [qfSearch, setQfSearch] = useState('');
  const [qfParents, setQfParents] = useState<Parent[]>([]);
  const [qfSelectedParent, setQfSelectedParent] = useState<Parent | null>(null);
  const [qfChildren, setQfChildren] = useState<Student[]>([]);
  const [qfAmount, setQfAmount] = useState('');
  const [qfMethod, setQfMethod] = useState('Cash');
  const [qfSaving, setQfSaving] = useState(false);
  const [qfSuccess, setQfSuccess] = useState(false);

  // Quick Fee: search parents as user types
  useEffect(() => {
    if (!showQuickFee || !profile) return;
    const timer = setTimeout(async () => {
      let query = supabase.from('parents').select('*').eq('school_id', profile.id);
      if (qfSearch.trim()) {
        query = query.or(`first_name.ilike.%${qfSearch}%,last_name.ilike.%${qfSearch}%,cnic.ilike.%${qfSearch}%`);
      }
      const { data } = await query.order('first_name').limit(10);
      setQfParents(data || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [qfSearch, showQuickFee, profile]);

  // Quick Fee: load children when parent selected
  useEffect(() => {
    if (!qfSelectedParent || !profile) return;
    supabase.from('students').select('*, admission_class_id(name)').eq('parent_id', qfSelectedParent.id).eq('school_id', profile.id).eq('active', true)
      .then(({ data }) => {
        setQfChildren(data || []);
        if (data && data.length > 0) {
          const totalMonthly = data.reduce((sum: number, s: any) => sum + (parseFloat(s.monthly_fee) || 0), 0);
          setQfAmount(String(totalMonthly));
        }
      });
  }, [qfSelectedParent, profile]);

  const openQuickFee = () => {
    setShowQuickFee(true);
    setQfSearch('');
    setQfParents([]);
    setQfSelectedParent(null);
    setQfChildren([]);
    setQfAmount('');
    setQfMethod('Cash');
    setQfSuccess(false);
  };

  // Quick Fee: Record payment with validation
  const recordQuickFee = async () => {
    if (!qfSelectedParent || !qfAmount || !profile) return;
    
    // Validate amount is positive
    const numAmount = parseFloat(qfAmount);
    if (!isFinite(numAmount) || numAmount <= 0) {
      setMsg({ text: 'Error: Amount must be a positive number', type: 'error' });
      return;
    }
    if (numAmount > 99999999) {
      setMsg({ text: 'Error: Amount is too large', type: 'error' });
      return;
    }
    
    setQfSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const { error } = await supabase.from('fee_payments').insert({
      school_id: profile.id,
      parent_id: qfSelectedParent.id,
      amount: numAmount,
      months_paid: [currentMonth],
      months_count: 1,
      payment_date: today,
      payment_method: qfMethod,
    });
    setQfSaving(false);
    if (error) {
      setMsg({ text: 'Error: ' + error.message, type: 'error' });
    } else {
      setQfSuccess(true);
      setTimeout(() => {
        setShowQuickFee(false);
        setQfSuccess(false);
      }, 1500);
    }
  };

  const checkCredits = useCallback(() => {
    if (!profile) return;
    const now = new Date();
    const exp = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const expired = !!exp && exp <= now;
    const days = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000)) : profile.total_credits;
    setCreditExpired(expired || profile.total_credits <= 0);
    setDaysLeft(days);
    if (expired || profile.total_credits <= 0) setTab('buy');
  }, [profile]);

  const loadOverviewStats = useCallback(async () => {
    if (!profile) return;
    try {
      const [parentsRes, studentsRes, classesRes] = await Promise.all([
        supabase.from('parents').select('id', { count: 'exact', head: true }).eq('school_id', profile.id),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', profile.id),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', profile.id),
      ]);
      setOverviewStats({
        parents: parentsRes.count || 0,
        students: studentsRes.count || 0,
        classes: classesRes.count || 0,
      });
    } catch (err: any) {
      console.error('Error loading overview stats:', err);
      setMsg({ text: 'Failed to load dashboard statistics', type: 'error' });
      setOverviewStats({ parents: 0, students: 0, classes: 0 });
    }
  }, [profile]);

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    try {
      const { data } = await supabase.from('credit_requests').select('*').eq('school_id', profile.id).order('created_at', { ascending: false });
      setHistory(data || []);
    } catch (err: any) {
      console.error('Error loading payment history:', err);
      setMsg({ text: 'Failed to load payment history', type: 'error' });
      setHistory([]);
    }
  }, [profile]);

  useEffect(() => { if (profile) { checkCredits(); loadOverviewStats(); } }, [profile, checkCredits, loadOverviewStats]);
  useEffect(() => { if (tab === 'history' && profile) loadHistory(); }, [tab, profile, loadHistory]);
  useEffect(() => {
    const s = location.state as { showBuyCredits?: boolean };
    if (s?.showBuyCredits) { setTab('buy'); navigate('/dashboard', { replace: true, state: {} }); }
  }, [location, navigate]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !plan || !reference) return;
    
    // Validate reference format (max 100 chars, no special injection chars)
    const cleanReference = reference.trim();
    if (cleanReference.length < 5) {
      setMsg({ text: 'Error: Reference number must be at least 5 characters', type: 'error' });
      return;
    }
    if (cleanReference.length > 100) {
      setMsg({ text: 'Error: Reference number is too long (max 100 characters)', type: 'error' });
      return;
    }
    
    setBuying(true); setMsg({ text: '', type: '' });
    const { error } = await supabase.from('credit_requests').insert({
      school_id: profile.id, credits: plan.credits, amount_pkr: plan.pkr,
      payment_method: payMethod, payment_reference: cleanReference, status: 'pending'
    });
    setBuying(false);
    if (error) setMsg({ text: `Error: ${error.message}`, type: 'error' });
    else {
      setMsg({ text: 'Request submitted! Admin will approve within 24 hours.', type: 'success' });
      setReference(''); setPlan(null); refreshProfile();
    }
  };

  const handleLogout = useCallback(async () => { await signOut(); navigate('/'); }, [signOut, navigate]);

  if (!profile) return (
    <div className="dash-loading">
      <div className="spinner" />
      <span>Loading dashboard…</span>
    </div>
  );

  return (
    <div className="dash-shell">
      {/* ─── Sidebar ─── */}
      <aside className="dash-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><GraduationCap size={20} /></div>
          <span className="sidebar-logo-text">ilm<em>soft</em></span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item${tab === item.id ? ' active' : ''}${tab.startsWith(item.id + '-') && item.id !== 'overview' ? ' active' : ''}`}
              onClick={() => setTab(item.id === 'people' ? 'people-parents' : item.id === 'finances' ? 'finances-income' : item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="sidebar-nav-item buy-credit-link" onClick={() => setTab('buy')}>
            <CreditCard size={16} /> Buy Credits
          </button>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="dash-main">
        {/* Top bar */}
        <div className="dash-topbar">
          <span className="dash-topbar-title">{PAGE_TITLES[tab]}</span>
          <div className="dash-topbar-actions">
            {msg.text && (
              <span style={{
                fontSize: 'var(--font-sm)', fontWeight: 600, padding: '4px 12px',
                borderRadius: '99px',
                background: msg.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
                color:       msg.type === 'success' ? 'var(--success)'       : 'var(--danger)',
              }}>
                {msg.text}
              </span>
            )}
            {tab !== 'buy' && (
              <Button size="sm" variant="outline" onClick={() => setTab('buy')}>
                <CreditCard size={14} /> {creditExpired ? 'Reactivate' : `${profile.total_credits} credits · ${daysLeft}d left`}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="dash-content">

          {/* Overview */}
          {tab === 'overview' && (
            <div className="animate-fade-up">
              <div className="overview-welcome">
                <h2>Welcome, {profile.school_name} 👋</h2>
              </div>

              <div className="overview-stats">
                <div className="ov-stat-card blue">
                  <div className="ov-stat-icon"><Users2 size={20} /></div>
                  <div className="ov-stat-label">Parents</div>
                  <div className="ov-stat-value">{overviewStats.parents}</div>
                  <div className="ov-stat-sub">Registered guardians</div>
                </div>
                <div className="ov-stat-card green">
                  <div className="ov-stat-icon"><GraduationCap size={20} /></div>
                  <div className="ov-stat-label">Students</div>
                  <div className="ov-stat-value">{overviewStats.students}</div>
                  <div className="ov-stat-sub">Enrolled students</div>
                </div>
                <div className="ov-stat-card purple">
                  <div className="ov-stat-icon"><BookOpen size={20} /></div>
                  <div className="ov-stat-label">Classes</div>
                  <div className="ov-stat-value">{overviewStats.classes}</div>
                  <div className="ov-stat-sub">Active classes</div>
                </div>
              </div>

              {/* Quick Actions - Hero Section */}
              <div className="overview-hero-actions">
                <h3 className="overview-hero-title">Quick Actions</h3>
                <div className="hero-actions">
                  <button className="hero-action-btn purple" onClick={() => setTab('people-parents')}>
                    <div className="hero-action-icon"><Users2 size={28} /></div>
                    <div className="hero-action-content">
                      <span className="hero-action-label">Add Parent</span>
                      <span className="hero-action-sub">Register a guardian</span>
                    </div>
                  </button>
                  <button className="hero-action-btn blue" onClick={() => setTab('people-students')}>
                    <div className="hero-action-icon"><GraduationCap size={28} /></div>
                    <div className="hero-action-content">
                      <span className="hero-action-label">Add Student</span>
                      <span className="hero-action-sub">Enroll a student</span>
                    </div>
                  </button>
                  <button className="hero-action-btn rose" onClick={openQuickFee}>
                    <div className="hero-action-icon"><Receipt size={28} /></div>
                    <div className="hero-action-content">
                      <span className="hero-action-label">Collect Fee</span>
                      <span className="hero-action-sub">Record a payment</span>
                    </div>
                  </button>
                  <button className="hero-action-btn cyan" onClick={() => setTab('finances-income')}>
                    <div className="hero-action-icon"><DollarSign size={28} /></div>
                    <div className="hero-action-content">
                      <span className="hero-action-label">Record Income</span>
                      <span className="hero-action-sub">Log other income</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feature tabs */}
          {tab === 'classes'   && <ClassesManager   schoolId={profile.id} role={role || undefined} />}
          {tab === 'people-parents'   && <ParentsManager   schoolId={profile.id} role={role || undefined} />}
          {tab === 'people-students'  && <StudentsManager  schoolId={profile.id} role={role || undefined} />}
          {tab === 'fee'            && <FeeManager       schoolId={profile.id} role={role || undefined} />}
          {tab === 'finances-income'    && <IncomeManager    schoolId={profile.id} role={role || undefined} />}
          {tab === 'finances-expense'   && <ExpenseManager   schoolId={profile.id} role={role || undefined} />}
          {tab === 'finances-suppliers' && <SuppliersManager schoolId={profile.id} role={role || undefined} />}
          {tab === 'team'      && <TeamManager schoolId={profile.id} />}
          {tab === 'profile'   && <SchoolProfileManager schoolId={profile.id} role={role || undefined} />}

          {/* Buy Credits */}
          {tab === 'buy' && (
            <div className="buy-section animate-fade-up">
              {creditExpired && (
                <div className="alert-banner">
                  <AlertTriangle size={22} />
                  <div>
                    <strong>Account Suspended</strong>
                    <p>Your credits have expired. Purchase a plan below to reactivate your account.</p>
                  </div>
                </div>
              )}

              <div className="pricing-grid">
                {[
                  { credits: 30,  pkr: 2000, name: 'Monthly Plan',    popular: false },
                  { credits: 100, pkr: 5000, name: 'Quarterly+ Plan', popular: true  },
                ].map(p => (
                  <div
                    key={p.credits}
                    className={`pricing-card${plan?.credits === p.credits ? ' selected' : ''}`}
                    onClick={() => setPlan({ credits: p.credits, pkr: p.pkr })}
                  >
                    {p.popular && <div className="popular-badge">Best Value</div>}
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-price">Rs {p.pkr.toLocaleString()}</div>
                    <div className="plan-credits">{p.credits} Credits</div>
                    <div className="plan-duration">{p.credits} days access</div>
                    <div className="plan-check" />
                  </div>
                ))}
              </div>

              {plan && (
                <div className="checkout-card animate-fade-up">
                  <h3>Complete Your Purchase</h3>
                  <table className="summary-table">
                    <tbody>
                      <tr><td>Plan</td><td>{plan.credits} Credits ({plan.credits} days)</td></tr>
                      <tr><td>Total</td><td>Rs {plan.pkr.toLocaleString()}</td></tr>
                    </tbody>
                  </table>

                  <div className="pay-method-row">
                    <button className={`pay-method-btn${payMethod === 'JazzCash' ? ' active' : ''}`} onClick={() => setPayMethod('JazzCash')}>JazzCash</button>
                    <button className={`pay-method-btn${payMethod === 'Bank' ? ' active' : ''}`} onClick={() => setPayMethod('Bank')}>Bank Transfer</button>
                  </div>

                  <div className="pay-instructions">
                    Send <strong>Rs {plan.pkr.toLocaleString()}</strong> via{' '}
                    {payMethod === 'JazzCash'
                      ? <><strong>JazzCash to 0300-1234567</strong> (ilmsoft)</>
                      : <><strong>Meezan Bank — IBAN: PK12MEZN000123456789</strong> (ilmsoft)</>
                    }
                    <br />After payment, enter your transaction reference number below.
                  </div>

                  <form onSubmit={handleBuy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                      label="Transaction Reference Number"
                      placeholder="e.g. TXN-123456 or JazzCash ID"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      required
                    />
                    <Button type="submit" size="lg" fullWidth isLoading={buying}>
                      <Banknote size={18} /> Submit Payment Request
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* History */}
          {tab === 'history' && (
            <div className="animate-fade-up">
              {history.length === 0 ? (
                <div className="section-empty">
                  <History size={48} />
                  <p>No payment history yet</p>
                </div>
              ) : (
                <div className="history-card">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(item => (
                          <tr key={item.id}>
                            <td>{new Date(item.created_at).toLocaleDateString('en-PK')}</td>
                            <td>{item.credits} Credits</td>
                            <td style={{ fontWeight: 600 }}>Rs {item.amount_pkr.toLocaleString()}</td>
                            <td>{item.payment_method}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{item.payment_reference}</td>
                            <td>
                              <div className="status-cell">
                                {item.status === 'approved' ? <CheckCircle size={14} color="var(--success)" /> : item.status === 'rejected' ? <XCircle size={14} color="var(--danger)" /> : <Clock size={14} color="var(--warning)" />}
                                <span className={`status-pill ${item.status}`}>{item.status}</span>
                              </div>
                              {item.status === 'rejected' && item.admin_notes && (
                                <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', fontStyle: 'italic' }}>
                                  Reason: {item.admin_notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ─── Quick Fee Modal ──────────────────────────────────────── */}
      {showQuickFee && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowQuickFee(false)}>
          <div className="quick-fee-modal">
            <div className="qfm-header">
              <div className="qfm-title">
                <Receipt size={20} />
                Collect Fee
              </div>
              <button className="qfm-close" onClick={() => setShowQuickFee(false)}><X size={18} /></button>
            </div>

            {qfSuccess ? (
              <div className="qfm-success">
                <CheckCircle2 size={48} color="var(--success)" />
                <p>Payment recorded!</p>
              </div>
            ) : !qfSelectedParent ? (
              <div className="qfm-search-step">
                <p className="qfm-step-label">Step 1 — Find Parent</p>
                <div className="qfm-search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or CNIC…"
                    value={qfSearch}
                    onChange={e => setQfSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="qfm-parent-list">
                  {qfParents.map(p => (
                    <button key={p.id} className="qfm-parent-item" onClick={() => setQfSelectedParent(p)}>
                      <div className="qfm-parent-avatar">{p.first_name[0]}{p.last_name[0]}</div>
                      <div className="qfm-parent-info">
                        <span className="qfm-parent-name">{p.first_name} {p.last_name}</span>
                        <span className="qfm-parent-contact">{p.contact || p.cnic}</span>
                      </div>
                    </button>
                  ))}
                  {qfParents.length === 0 && qfSearch && (
                    <p className="qfm-empty">No parents found</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="qfm-pay-step">
                <div className="qfm-selected-parent">
                  <button className="qfm-back-btn" onClick={() => setQfSelectedParent(null)}>
                    <ArrowLeft size={14} /> Change parent
                  </button>
                  <div className="qfm-parent-badge">
                    <div className="qfm-parent-avatar sm">{qfSelectedParent.first_name[0]}{qfSelectedParent.last_name[0]}</div>
                    <span>{qfSelectedParent.first_name} {qfSelectedParent.last_name}</span>
                  </div>
                </div>
                {qfChildren.length > 0 && (
                  <div className="qfm-children-info">
                    {qfChildren.map((c: any) => (
                      <span key={c.id} className="qfm-child-chip">{c.first_name} ({c.classes?.name || 'N/A'})</span>
                    ))}
                  </div>
                )}
                <div className="qfm-form">
                  <div className="qfm-form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" value={qfAmount} onChange={e => setQfAmount(e.target.value)} placeholder="0" />
                  </div>
                  <div className="qfm-form-group">
                    <label>Method</label>
                    <select value={qfMethod} onChange={e => setQfMethod(e.target.value)}>
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>JazzCash</option>
                      <option>EasyPaisa</option>
                    </select>
                  </div>
                </div>
                <Button size="lg" fullWidth isLoading={qfSaving} onClick={recordQuickFee} disabled={!qfAmount}>
                  <CreditCard size={16} /> Record Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
