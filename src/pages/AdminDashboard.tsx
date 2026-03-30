import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { 
  CheckCircle, XCircle, Clock, Users, CreditCard, 
  TrendingUp, AlertCircle, Search, Filter, RefreshCw,
  LogOut, School
} from 'lucide-react';
import './AdminDashboard.css';

type CreditRequestWithSchool = {
  id: string;
  school_id: string;
  school_name: string;
  school_email: string;
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

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CreditRequestWithSchool[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CreditRequestWithSchool[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [requests, filter, search]);

  const checkAdminAccess = async () => {
    console.log('Checking admin access for user:', user?.id);
    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      console.log('Admin query result:', { admin, error });

      if (error || !admin) {
        console.log('Not an admin, redirecting to dashboard', error);
        navigate('/dashboard');
        return;
      }

      console.log('Admin access granted');
      loadData();
    } catch (err) {
      console.error('Error checking admin:', err);
      navigate('/dashboard');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRequests(), loadStats()]);
    setLoading(false);
  };

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('credit_requests')
      .select(`
        *,
        schools:school_id (school_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      return;
    }

    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      school_id: r.school_id,
      school_name: r.schools?.school_name || 'Unknown',
      school_email: r.schools?.email || '',
      credits: r.credits,
      amount_pkr: r.amount_pkr,
      payment_method: r.payment_method,
      payment_reference: r.payment_reference,
      status: r.status,
      created_at: r.created_at
    }));

    setRequests(formatted);
  };

  const loadStats = async () => {
    const { data: schools } = await supabase.from('schools').select('total_credits, credit_expires_at');
    const { data: pending } = await supabase.from('credit_requests').select('id').eq('status', 'pending');
    const { data: approved } = await supabase.from('credit_requests').select('amount_pkr').eq('status', 'approved');

    const now = new Date();
    const active = (schools || []).filter(s => {
      const expires = s.credit_expires_at ? new Date(s.credit_expires_at) : null;
      return s.total_credits > 0 && (!expires || expires > now);
    }).length;

    setStats({
      totalSchools: schools?.length || 0,
      pendingRequests: pending?.length || 0,
      totalRevenue: (approved || []).reduce((sum, r) => sum + r.amount_pkr, 0),
      activeCredits: active
    });
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.school_name.toLowerCase().includes(q) ||
        r.school_email.toLowerCase().includes(q) ||
        r.payment_reference.toLowerCase().includes(q)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async (request: CreditRequestWithSchool) => {
    setProcessingId(request.id);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + request.credits);

    const { error: updateError } = await supabase
      .from('credit_requests')
      .update({ status: 'approved' })
      .eq('id', request.id);

    if (updateError) {
      alert('Error approving request');
      setProcessingId(null);
      return;
    }

    const { data: school } = await supabase
      .from('schools')
      .select('total_credits, credit_expires_at')
      .eq('id', request.school_id)
      .single();

    const currentExpiry = school?.credit_expires_at ? new Date(school.credit_expires_at) : null;
    const currentCredits = school?.total_credits || 0;

    let newExpiry: Date;
    if (currentExpiry && currentExpiry > now) {
      newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + request.credits);
    } else {
      newExpiry = expiresAt;
    }

    const { error: creditError } = await supabase
      .from('schools')
      .update({
        total_credits: currentCredits + request.credits,
        credit_expires_at: newExpiry.toISOString()
      })
      .eq('id', request.school_id);

    if (creditError) {
      console.error('Error updating credits:', creditError);
    }

    setProcessingId(null);
    loadData();
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Reject this request?')) return;
    setProcessingId(requestId);

    await supabase
      .from('credit_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    setProcessingId(null);
    loadData();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="status-icon approved" size={18} />;
      case 'rejected': return <XCircle className="status-icon rejected" size={18} />;
      default: return <Clock className="status-icon pending" size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <span>Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header glass">
        <div className="admin-header-content">
          <div className="admin-brand">
            <School size={28} />
            <span>ilmsoft <span className="admin-label">Admin</span></span>
          </div>
          <div className="admin-actions">
            <Button variant="ghost" onClick={loadData}>
              <RefreshCw size={18} />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <div className="stats-grid">
          <div className="stat-card glass">
            <div className="stat-icon-wrap primary"><Users size={24} /></div>
            <div className="stat-info">
              <span className="stat-number">{stats?.totalSchools || 0}</span>
              <span className="stat-label">Total Schools</span>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon-wrap warning"><AlertCircle size={24} /></div>
            <div className="stat-info">
              <span className="stat-number">{stats?.pendingRequests || 0}</span>
              <span className="stat-label">Pending Requests</span>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon-wrap success"><CreditCard size={24} /></div>
            <div className="stat-info">
              <span className="stat-number">{stats?.activeCredits || 0}</span>
              <span className="stat-label">Active Credits</span>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon-wrap accent"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <span className="stat-number">Rs {stats?.totalRevenue?.toLocaleString() || 0}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
        </div>

        <div className="requests-section glass">
          <div className="section-header">
            <h2>Credit Requests</h2>
            <div className="filter-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-tabs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="requests-table-wrap">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      <div className="empty-state">
                        <Filter size={48} />
                        <p>No requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(req => (
                    <tr key={req.id} className={req.status}>
                      <td>
                        <div className="school-cell">
                          <span className="school-name">{req.school_name}</span>
                          <span className="school-email">{req.school_email}</span>
                        </div>
                      </td>
                      <td>{req.credits} Credits</td>
                      <td>Rs {req.amount_pkr.toLocaleString()}</td>
                      <td>{req.payment_method}</td>
                      <td className="reference-cell">{req.payment_reference}</td>
                      <td>{new Date(req.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${req.status}`}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <div className="action-btns">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(req)}
                              isLoading={processingId === req.id}
                            >
                              <CheckCircle size={16} /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleReject(req.id)}
                              disabled={processingId === req.id}
                            >
                              <XCircle size={16} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
