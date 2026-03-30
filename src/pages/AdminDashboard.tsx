import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { 
  CheckCircle, XCircle, Clock, Users, CreditCard, 
  TrendingUp, AlertCircle, Search, Filter, RefreshCw,
  LogOut, School, Building2, Wallet, Landmark, Phone, Mail, Calendar
} from 'lucide-react';
import './AdminDashboard.css';

type CreditRequestWithSchool = {
  id: string;
  school_id: string;
  school_name: string;
  school_email: string;
  contact: string;
  credits: number;
  amount_pkr: number;
  payment_method: string;
  payment_reference: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type DashboardStats = {
  totalSchools: number;
  pendingRequests: number;
  totalRevenue: number;
  activeCredits: number;
};

type SchoolWithDetails = {
  id: string;
  school_name: string;
  contact: string;
  email: string;
  total_credits: number;
  credit_expires_at: string | null;
  created_at: string;
};

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'schools' | 'payments'>('requests');
  const [requests, setRequests] = useState<CreditRequestWithSchool[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CreditRequestWithSchool[]>([]);
  const [schools, setSchools] = useState<SchoolWithDetails[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolWithDetails[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState({
    jazzcash_number: '0300-1234567',
    jazzcash_name: 'ilmsoft',
    bank_name: 'Meezan Bank',
    bank_account_title: 'ilmsoft',
    bank_iban: 'PK12MEZN000123456789'
  });

  useEffect(() => { checkAdminAccess(); }, [user]);
  useEffect(() => { applyFilters(); }, [requests, filter, search]);
  useEffect(() => { filterSchools(); }, [schools, schoolSearch]);

  const checkAdminAccess = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data: admin, error } = await supabase.from('admin_users').select('id').eq('user_id', user.id).single();
      if (error || !admin) { navigate('/dashboard'); return; }
      loadData();
    } catch { navigate('/dashboard'); }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRequests(), loadStats(), loadSchools()]);
    setLoading(false);
  };

  const loadRequests = async () => {
    const { data } = await supabase.from('credit_requests').select('*, schools:school_id (school_name, email, contact)').order('created_at', { ascending: false });
    setRequests((data || []).map((r: any) => ({ id: r.id, school_id: r.school_id, school_name: r.schools?.school_name || 'Unknown', school_email: r.schools?.email || '', contact: r.schools?.contact || '', credits: r.credits, amount_pkr: r.amount_pkr, payment_method: r.payment_method, payment_reference: r.payment_reference, status: r.status, created_at: r.created_at })));
  };

  const loadSchools = async () => {
    const { data } = await supabase.from('schools').select('id, school_name, contact, email, total_credits, credit_expires_at, created_at').order('created_at', { ascending: false });
    setSchools(data || []);
  };

  const loadStats = async () => {
    const { data: schools } = await supabase.from('schools').select('total_credits, credit_expires_at');
    const { data: pending } = await supabase.from('credit_requests').select('id').eq('status', 'pending');
    const { data: approved } = await supabase.from('credit_requests').select('amount_pkr').eq('status', 'approved');
    const now = new Date();
    const active = (schools || []).filter(s => s.total_credits > 0 && (!s.credit_expires_at || new Date(s.credit_expires_at) > now)).length;
    setStats({ totalSchools: schools?.length || 0, pendingRequests: pending?.length || 0, totalRevenue: (approved || []).reduce((sum, r) => sum + r.amount_pkr, 0), activeCredits: active });
  };

  const applyFilters = () => {
    let filtered = [...requests];
    if (filter !== 'all') filtered = filtered.filter(r => r.status === filter);
    if (search) { const q = search.toLowerCase(); filtered = filtered.filter(r => r.school_name.toLowerCase().includes(q) || r.school_email.toLowerCase().includes(q)); }
    setFilteredRequests(filtered);
  };

  const filterSchools = () => {
    let filtered = [...schools];
    if (schoolSearch) { const q = schoolSearch.toLowerCase(); filtered = filtered.filter(s => s.school_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)); }
    setFilteredSchools(filtered);
  };

  const getSchoolStatus = (school: SchoolWithDetails) => {
    if (!school.total_credits) return { label: 'No Credits', class: 'expired' };
    if (!school.credit_expires_at) return { label: `${school.total_credits} Credits`, class: 'active' };
    const daysLeft = Math.ceil((new Date(school.credit_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expired', class: 'expired' };
    if (daysLeft <= 7) return { label: `${daysLeft} days`, class: 'warning' };
    return { label: `${daysLeft} days`, class: 'active' };
  };

  const handleApprove = async (request: CreditRequestWithSchool) => {
    setProcessingId(request.id);
    const now = new Date();
    const expiresAt = new Date(now); expiresAt.setDate(expiresAt.getDate() + request.credits);
    await supabase.from('credit_requests').update({ status: 'approved' }).eq('id', request.id);
    const { data: school } = await supabase.from('schools').select('total_credits, credit_expires_at').eq('id', request.school_id).single();
    const currentExpiry = school?.credit_expires_at ? new Date(school.credit_expires_at) : null;
    const currentCredits = school?.total_credits || 0;
    let newExpiry: Date;
    if (currentExpiry && currentExpiry > now) { newExpiry = new Date(currentExpiry); newExpiry.setDate(newExpiry.getDate() + request.credits); }
    else { newExpiry = expiresAt; }
    await supabase.from('schools').update({ total_credits: currentCredits + request.credits, credit_expires_at: newExpiry.toISOString() }).eq('id', request.school_id);
    setProcessingId(null); loadData();
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Reject this request?')) return;
    setProcessingId(requestId);
    await supabase.from('credit_requests').update({ status: 'rejected' }).eq('id', requestId);
    setProcessingId(null); loadData();
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  if (loading) { return <div className="admin-loading"><div className="spinner" /><span>Loading admin dashboard...</span></div>; }

  return (
    <div className="admin-dashboard">
      <header className="admin-header glass">
        <div className="admin-header-content">
          <div className="admin-brand"><School size={28} /><span>ilmsoft <span className="admin-label">Admin</span></span></div>
          <div className="admin-actions">
            <Button variant="ghost" onClick={loadData}><RefreshCw size={18} /></Button>
            <Button variant="outline" onClick={handleLogout}><LogOut size={18} /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <div className="stats-grid">
          <div className="stat-card glass"><div className="stat-icon-wrap primary"><Users size={24} /></div><div className="stat-info"><span className="stat-number">{stats?.totalSchools || 0}</span><span className="stat-label">Total Schools</span></div></div>
          <div className="stat-card glass"><div className="stat-icon-wrap warning"><AlertCircle size={24} /></div><div className="stat-info"><span className="stat-number">{stats?.pendingRequests || 0}</span><span className="stat-label">Pending Requests</span></div></div>
          <div className="stat-card glass"><div className="stat-icon-wrap success"><CreditCard size={24} /></div><div className="stat-info"><span className="stat-number">{stats?.activeCredits || 0}</span><span className="stat-label">Active Credits</span></div></div>
          <div className="stat-card glass"><div className="stat-icon-wrap accent"><TrendingUp size={24} /></div><div className="stat-info"><span className="stat-number">Rs {stats?.totalRevenue?.toLocaleString() || 0}</span><span className="stat-label">Total Revenue</span></div></div>
        </div>

        <div className="admin-tabs glass">
          <button className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}><CreditCard size={18} /> Credit Requests</button>
          <button className={`admin-tab ${activeTab === 'schools' ? 'active' : ''}`} onClick={() => setActiveTab('schools')}><Building2 size={18} /> All Schools</button>
          <button className={`admin-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}><Wallet size={18} /> Payment Settings</button>
        </div>

        {activeTab === 'requests' && (
          <div className="admin-section glass">
            <div className="section-header">
              <h2>Credit Purchase Requests</h2>
              <div className="filter-bar">
                <div className="search-box"><Search size={18} /><input type="text" placeholder="Search schools..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <div className="filter-tabs">{(['all', 'pending', 'approved', 'rejected'] as const).map(f => <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}</div>
              </div>
            </div>
            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead><tr><th>School</th><th>Plan</th><th>Amount</th><th>Payment</th><th>Reference</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredRequests.length === 0 ? <tr><td colSpan={7} className="empty-cell"><div className="empty-state"><Filter size={48} /><p>No requests found</p></div></td></tr> :
                    filteredRequests.map(req => (
                      <tr key={req.id} className={req.status}>
                        <td><div className="school-cell"><span className="school-name">{req.school_name}</span><span className="school-email">{req.school_email}</span></div></td>
                        <td>{req.credits} Credits</td><td>Rs {req.amount_pkr.toLocaleString()}</td><td>{req.payment_method}</td><td className="reference-cell">{req.payment_reference}</td>
                        <td><span className={`status-badge ${req.status}`}>{req.status === 'approved' ? <CheckCircle size={14} /> : req.status === 'rejected' ? <XCircle size={14} /> : <Clock size={14} />}{req.status}</span></td>
                        <td>{req.status === 'pending' && <div className="action-btns"><Button size="sm" onClick={() => handleApprove(req)} isLoading={processingId === req.id}><CheckCircle size={14} /></Button><Button size="sm" variant="danger" onClick={() => handleReject(req.id)} disabled={processingId === req.id}><XCircle size={14} /></Button></div>}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div className="admin-section glass">
            <div className="section-header"><h2>All Registered Schools</h2><div className="search-box"><Search size={18} /><input type="text" placeholder="Search by name or email..." value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} /></div></div>
            <div className="schools-grid">
              {filteredSchools.length === 0 ? <div className="empty-state"><Building2 size={48} /><p>No schools found</p></div> :
                filteredSchools.map(school => {
                  const status = getSchoolStatus(school);
                  return (
                    <div key={school.id} className="school-card">
                      <div className="school-card-header"><Building2 size={24} /><h3>{school.school_name}</h3></div>
                      <div className="school-card-body">
                        <div className="school-detail"><Mail size={14} /><span>{school.email}</span></div>
                        <div className="school-detail"><Phone size={14} /><span>{school.contact || 'N/A'}</span></div>
                        <div className="school-detail"><Calendar size={14} /><span>Joined: {new Date(school.created_at).toLocaleDateString()}</span></div>
                      </div>
                      <div className="school-card-footer"><div className={`credit-pill ${status.class}`}><CreditCard size={14} /><span>{status.label}</span></div><span className="credits-count">{school.total_credits || 0} credits</span></div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="admin-section glass">
            <div className="section-header"><h2>Payment Settings</h2><p>Configure payment details shown to schools when purchasing credits</p></div>
            <div className="payment-settings-grid">
              <div className="payment-card">
                <div className="payment-card-header"><Wallet size={24} /><h3>JazzCash</h3></div>
                <div className="payment-form">
                  <label>Account Number<input type="text" value={paymentSettings.jazzcash_number} onChange={e => setPaymentSettings({...paymentSettings, jazzcash_number: e.target.value})} /></label>
                  <label>Account Name<input type="text" value={paymentSettings.jazzcash_name} onChange={e => setPaymentSettings({...paymentSettings, jazzcash_name: e.target.value})} /></label>
                </div>
              </div>
              <div className="payment-card">
                <div className="payment-card-header"><Landmark size={24} /><h3>Bank Transfer</h3></div>
                <div className="payment-form">
                  <label>Bank Name<input type="text" value={paymentSettings.bank_name} onChange={e => setPaymentSettings({...paymentSettings, bank_name: e.target.value})} /></label>
                  <label>Account Title<input type="text" value={paymentSettings.bank_account_title} onChange={e => setPaymentSettings({...paymentSettings, bank_account_title: e.target.value})} /></label>
                  <label>IBAN<input type="text" value={paymentSettings.bank_iban} onChange={e => setPaymentSettings({...paymentSettings, bank_iban: e.target.value})} /></label>
                </div>
              </div>
            </div>
            <div className="payment-actions"><Button size="lg">Save Payment Settings (Demo)</Button></div>
          </div>
        )}
      </main>
    </div>
  );
};
