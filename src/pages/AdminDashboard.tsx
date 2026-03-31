import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import {
  CheckCircle, XCircle, Clock, Users, CreditCard, TrendingUp,
  AlertCircle, Search, RefreshCw, LogOut, GraduationCap,
  Building2, Wallet, Landmark, Phone, Mail, Calendar, Filter
} from 'lucide-react';
import './AdminDashboard.css';

type Request = {
  id: string; school_id: string; school_name: string; school_email: string;
  contact: string; credits: number; amount_pkr: number;
  payment_method: string; payment_reference: string;
  status: 'pending' | 'approved' | 'rejected'; created_at: string;
};

type School = {
  id: string; school_name: string; contact: string; email: string;
  total_credits: number; credit_expires_at: string | null; created_at: string;
};

type Stats = { totalSchools: number; pendingRequests: number; totalRevenue: number; activeSchools: number };

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]                     = useState<'requests' | 'schools' | 'payments'>('requests');
  const [requests, setRequests]           = useState<Request[]>([]);
  const [schools, setSchools]             = useState<School[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch]               = useState('');
  const [schoolSearch, setSchoolSearch]   = useState('');
  const [processingId, setProcessingId]   = useState<string | null>(null);
  const [paySettings, setPaySettings]     = useState({
    jazzcash_number: '0300-1234567', jazzcash_name: 'ilmsoft',
    bank_name: 'Meezan Bank', bank_account_title: 'ilmsoft', bank_iban: 'PK12MEZN000123456789',
  });

  const checkAdmin = async () => {
    if (!user) { navigate('/login'); return; }
    const { data, error } = await supabase.from('admin_users').select('id').eq('user_id', user.id).single();
    if (error || !data) { navigate('/dashboard'); return; }
    loadAll();
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadRequests(), loadSchools(), loadStats()]);
    setLoading(false);
  };

  const loadRequests = async () => {
    const { data } = await supabase
      .from('credit_requests')
      .select('*, schools:school_id(school_name, email, contact)')
      .order('created_at', { ascending: false });
    setRequests((data || []).map((r: any) => ({
      id: r.id, school_id: r.school_id,
      school_name: r.schools?.school_name || 'Unknown',
      school_email: r.schools?.email || '',
      contact: r.schools?.contact || '',
      credits: r.credits, amount_pkr: r.amount_pkr,
      payment_method: r.payment_method, payment_reference: r.payment_reference,
      status: r.status, created_at: r.created_at,
    })));
  };

  const loadSchools = async () => {
    const { data } = await supabase.from('schools')
      .select('id,school_name,contact,email,total_credits,credit_expires_at,created_at')
      .order('created_at', { ascending: false });
    setSchools(data || []);
  };

  const loadStats = async () => {
    const { data: sc }  = await supabase.from('schools').select('total_credits,credit_expires_at');
    const { data: pend } = await supabase.from('credit_requests').select('id').eq('status', 'pending');
    const { data: appr } = await supabase.from('credit_requests').select('amount_pkr').eq('status', 'approved');
    const now = new Date();
    const active = (sc || []).filter(s => s.total_credits > 0 && (!s.credit_expires_at || new Date(s.credit_expires_at) > now)).length;
    setStats({
      totalSchools: sc?.length || 0,
      pendingRequests: pend?.length || 0,
      totalRevenue: (appr || []).reduce((sum, r) => sum + r.amount_pkr, 0),
      activeSchools: active,
    });
  };

  useEffect(() => { checkAdmin(); }, [user]);


  const handleApprove = async (req: Request) => {
    setProcessingId(req.id);
    const now = new Date();
    await supabase.from('credit_requests').update({ status: 'approved' }).eq('id', req.id);
    const { data: school } = await supabase.from('schools').select('total_credits,credit_expires_at').eq('id', req.school_id).single();
    const curExp = school?.credit_expires_at ? new Date(school.credit_expires_at) : null;
    let newExp = new Date(now);
    if (curExp && curExp > now) newExp = new Date(curExp);
    newExp.setDate(newExp.getDate() + req.credits);
    await supabase.from('schools').update({
      total_credits: (school?.total_credits || 0) + req.credits,
      credit_expires_at: newExp.toISOString(),
    }).eq('id', req.school_id);
    setProcessingId(null);
    loadAll();
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this request?')) return;
    setProcessingId(id);
    await supabase.from('credit_requests').update({ status: 'rejected' }).eq('id', id);
    setProcessingId(null);
    loadAll();
  };

  const getSchoolStatus = (s: School) => {
    if (!s.total_credits) return { label: 'No Credits', cls: 'expired' };
    if (!s.credit_expires_at) return { label: `${s.total_credits} credits`, cls: 'active' };
    const d = Math.ceil((new Date(s.credit_expires_at).getTime() - new Date().getTime()) / 86400000);
    if (d < 0) return { label: 'Expired', cls: 'expired' };
    if (d <= 7) return { label: `${d} days left`, cls: 'warning' };
    return { label: `${d} days left`, cls: 'active' };
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return r.school_name.toLowerCase().includes(q) || r.school_email.toLowerCase().includes(q); }
    return true;
  });

  const filteredSchools = schoolSearch
    ? schools.filter(s => s.school_name.toLowerCase().includes(schoolSearch.toLowerCase()) || s.email?.toLowerCase().includes(schoolSearch.toLowerCase()))
    : schools;

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner" />
      <span>Loading admin dashboard…</span>
    </div>
  );

  return (
    <div className="admin-shell">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-logo">
          <div className="admin-logo-icon"><GraduationCap size={20} /></div>
          <span className="admin-logo-text">ilm<em>soft</em></span>
        </div>
        <span className="admin-badge">Admin</span>
        <div className="admin-header-right">
          <Button variant="ghost" size="sm" onClick={loadAll} style={{ color: '#94a3b8' }}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="secondary" size="sm" onClick={async () => { await signOut(); navigate('/'); }}
            style={{ background:'rgba(255,255,255,0.08)', borderColor:'rgba(255,255,255,0.12)', color:'#94a3b8' }}>
            <LogOut size={15} /> Logout
          </Button>
        </div>
      </header>

      <div className="admin-body">
        {/* Stats */}
        <div className="admin-stats">
          {[
            { icon: Users,       color: 'blue',   label: 'Total Schools',    value: stats?.totalSchools || 0 },
            { icon: AlertCircle, color: 'amber',  label: 'Pending Requests', value: stats?.pendingRequests || 0 },
            { icon: CreditCard,  color: 'green',  label: 'Active Schools',   value: stats?.activeSchools || 0 },
            { icon: TrendingUp,  color: 'purple', label: 'Total Revenue',    value: `Rs ${(stats?.totalRevenue || 0).toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="admin-stat">
              <div className={`admin-stat-icon ${s.color}`}><s.icon size={20} /></div>
              <div>
                <div className="admin-stat-number">{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { id: 'requests' as const, icon: CreditCard,  label: 'Credit Requests' },
            { id: 'schools'  as const, icon: Building2,   label: 'All Schools'     },
            { id: 'payments' as const, icon: Wallet,      label: 'Payment Info'    },
          ].map(t => (
            <button
              key={t.id}
              className={`admin-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Requests */}
        {tab === 'requests' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Credit Purchase Requests</h2>
              <div className="admin-filter-bar">
                <div className="admin-search">
                  <Search size={15} />
                  <input placeholder="Search school or email…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                  {(['all','pending','approved','rejected'] as const).map(f => (
                    <button key={f} className={`filter-chip${statusFilter === f ? ' active' : ''}`} onClick={() => setStatusFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="admin-empty"><Filter size={48} /><p>No requests found</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>School</th><th>Credits</th><th>Amount</th>
                      <th>Method</th><th>Reference</th><th>Date</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="school-cell">
                            <strong>{r.school_name}</strong>
                            <span>{r.school_email}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{r.credits} Credits</td>
                        <td style={{ fontWeight: 700 }}>Rs {r.amount_pkr.toLocaleString()}</td>
                        <td>{r.payment_method}</td>
                        <td><span className="ref-cell">{r.payment_reference}</span></td>
                        <td>{new Date(r.created_at).toLocaleDateString('en-PK')}</td>
                        <td>
                          <span className={`status-pill ${r.status}`}>
                            {r.status === 'approved' ? <CheckCircle size={11} /> : r.status === 'rejected' ? <XCircle size={11} /> : <Clock size={11} />}
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'pending' && (
                            <div className="action-btns">
                              <Button size="sm" onClick={() => handleApprove(r)} isLoading={processingId === r.id}>
                                <CheckCircle size={13} /> Approve
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleReject(r.id)} disabled={processingId === r.id}>
                                <XCircle size={13} />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Schools */}
        {tab === 'schools' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>All Registered Schools</h2>
              <div className="admin-search">
                <Search size={15} />
                <input placeholder="Search by name or email…" value={schoolSearch} onChange={e => setSchoolSearch(e.target.value)} />
              </div>
            </div>
            {filteredSchools.length === 0 ? (
              <div className="admin-empty"><Building2 size={48} /><p>No schools found</p></div>
            ) : (
              <div className="schools-grid">
                {filteredSchools.map(s => {
                  const st = getSchoolStatus(s);
                  return (
                    <div key={s.id} className="school-card">
                      <div className="school-card-top">
                        <div className="school-avatar">{s.school_name.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3>{s.school_name}</h3>
                          <div className="school-card-details">
                            <div className="school-detail"><Mail size={12} />{s.email}</div>
                            {s.contact && <div className="school-detail"><Phone size={12} />{s.contact}</div>}
                            <div className="school-detail"><Calendar size={12} />Joined {new Date(s.created_at).toLocaleDateString('en-PK')}</div>
                          </div>
                        </div>
                      </div>
                      <div className="school-card-footer">
                        <span className={`credit-pill ${st.cls}`}><CreditCard size={12} /> {st.label}</span>
                        <span style={{ fontSize:'var(--font-xs)', color:'var(--text-muted)' }}>{s.total_credits} total credits</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment Settings */}
        {tab === 'payments' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Payment Information</h2>
              <p style={{ color:'var(--text-muted)', fontSize:'var(--font-sm)', margin:0 }}>Shown to schools when they purchase credits</p>
            </div>
            <div className="pay-settings-grid">
              <div className="pay-settings-card">
                <h3><Wallet size={18} color="var(--primary)" /> JazzCash</h3>
                <div className="pay-settings-form">
                  <label>Account Number<input value={paySettings.jazzcash_number} onChange={e => setPaySettings({ ...paySettings, jazzcash_number: e.target.value })} /></label>
                  <label>Account Name<input value={paySettings.jazzcash_name} onChange={e => setPaySettings({ ...paySettings, jazzcash_name: e.target.value })} /></label>
                </div>
              </div>
              <div className="pay-settings-card">
                <h3><Landmark size={18} color="var(--primary)" /> Bank Transfer</h3>
                <div className="pay-settings-form">
                  <label>Bank Name<input value={paySettings.bank_name} onChange={e => setPaySettings({ ...paySettings, bank_name: e.target.value })} /></label>
                  <label>Account Title<input value={paySettings.bank_account_title} onChange={e => setPaySettings({ ...paySettings, bank_account_title: e.target.value })} /></label>
                  <label>IBAN<input value={paySettings.bank_iban} onChange={e => setPaySettings({ ...paySettings, bank_iban: e.target.value })} /></label>
                </div>
              </div>
            </div>
            <div className="pay-settings-actions">
              <Button size="lg">Save Settings (Demo)</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
