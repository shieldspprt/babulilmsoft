import React, { useState, useEffect } from 'react';
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
  LayoutDashboard, GraduationCap, DollarSign, Truck, Store,
  Users2, CreditCard, History, LogOut, AlertTriangle, Clock,
  CheckCircle, XCircle, Banknote, BookOpen, Receipt
} from 'lucide-react';
import './Dashboard.css';

type Tab = 'overview' | 'classes' | 'people' | 'people-students' | 'people-parents' | 'finances' | 'finances-income' | 'finances-expense' | 'finances-suppliers' | 'fee' | 'team' | 'profile' | 'buy' | 'history';

const NAV: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'people',   label: 'People',    icon: Users2 },
  { id: 'classes',  label: 'Classes',   icon: BookOpen },
  { id: 'finances', label: 'Finances',  icon: DollarSign },
  { id: 'team',     label: 'Team',      icon: GraduationCap },
];

// Sub-nav for People
const PEOPLE_NAV = [
  { id: 'people-parents'   as Tab, label: 'Parents',   icon: Users2 },
  { id: 'people-students'  as Tab, label: 'Students',  icon: GraduationCap },
];

// Sub-nav for Finances
const FINANCES_NAV = [
  { id: 'finances-income'   as Tab, label: 'Income',    icon: DollarSign },
  { id: 'finances-expense'  as Tab, label: 'Expenses',  icon: Truck },
  { id: 'finances-suppliers' as Tab, label: 'Suppliers', icon: Store },
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

  const checkCredits = () => {
    if (!profile) return;
    const now = new Date();
    const exp = profile.credit_expires_at ? new Date(profile.credit_expires_at) : null;
    const expired = !!exp && exp <= now;
    const days = exp ? Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / 86400000)) : profile.total_credits;
    setCreditExpired(expired || profile.total_credits <= 0);
    setDaysLeft(days);
    if (expired || profile.total_credits <= 0) setTab('buy');
  };

  const loadOverviewStats = async () => {
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
  };

  const loadHistory = async () => {
    if (!profile) return;
    const { data } = await supabase.from('credit_requests').select('*').eq('school_id', profile.id).order('created_at', { ascending: false });
    setHistory(data || []);
  };

  useEffect(() => { if (profile) { checkCredits(); loadOverviewStats(); } }, [profile]);
  useEffect(() => { if (tab === 'history' && profile) loadHistory(); }, [tab, profile]);
  useEffect(() => {
    const s = location.state as { showBuyCredits?: boolean };
    if (s?.showBuyCredits) { setTab('buy'); navigate('/dashboard', { replace: true, state: {} }); }
  }, [location, navigate]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !plan || !reference) return;
    setBuying(true); setMsg({ text: '', type: '' });
    const { error } = await supabase.from('credit_requests').insert({
      school_id: profile.id, credits: plan.credits, amount_pkr: plan.pkr,
      payment_method: payMethod, payment_reference: reference, status: 'pending'
    });
    setBuying(false);
    if (error) setMsg({ text: `Error: ${error.message}`, type: 'error' });
    else {
      setMsg({ text: 'Request submitted! Admin will approve within 24 hours.', type: 'success' });
      setReference(''); setPlan(null); refreshProfile();
    }
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

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
              onClick={() => setTab(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}

          {/* Sub-nav for People */}
          {tab.startsWith('people') && PEOPLE_NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item sub${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}

          {/* Sub-nav for Finances */}
          {tab.startsWith('finances') && FINANCES_NAV.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item sub${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
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

              <div className="overview-section-title">Quick Actions</div>
              <div className="quick-actions">
                {[
                  { id: 'people-parents'  as Tab, icon: Users2,      color: 'purple', label: 'Add Parent',      sub: 'Register guardian' },
                  { id: 'fee'            as Tab, icon: Receipt,     color: 'rose',   label: 'Add Fee',        sub: 'Collect from parents' },
                  { id: 'finances-income' as Tab, icon: DollarSign, color: 'cyan',   label: 'Record Income',  sub: 'Other income' },
                  { id: 'finances-expense' as Tab, icon: Truck,     color: 'amber',  label: 'Add Expense',    sub: 'Track spending' },
                ].map(qa => (
                  <div key={qa.id} className="qa-card" onClick={() => setTab(qa.id)}>
                    <div className={`qa-icon ${qa.color}`}><qa.icon size={22} /></div>
                    <div>
                      <div className="qa-label">{qa.label}</div>
                      <div className="qa-sub">{qa.sub}</div>
                    </div>
                  </div>
                ))}
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
    </div>
  );
};
