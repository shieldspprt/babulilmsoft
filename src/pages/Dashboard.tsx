import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CreditCard, Wallet, Banknote, History, CheckCircle, Clock, XCircle } from 'lucide-react';
import './Dashboard.css';

export const Dashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'buy' | 'history'>('overview');
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'Bank'>('JazzCash');
  const [selectedPlan, setSelectedPlan] = useState<{credits: number, pkr: number} | null>(null);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'history' && profile) {
      loadHistory();
    }
  }, [activeTab, profile]);

  const loadHistory = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('credit_requests')
      .select('*')
      .eq('school_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedPlan || !reference) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    const { error } = await supabase.from('credit_requests').insert({
      school_id: profile.id,
      credits: selectedPlan.credits,
      amount_pkr: selectedPlan.pkr,
      payment_method: paymentMethod,
      payment_reference: reference,
      status: 'pending'
    });

    setLoading(false);

    if (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } else {
      setMessage({ text: 'Purchase request submitted successfully! Awaiting admin approval.', type: 'success' });
      setReference('');
      setSelectedPlan(null);
      setActiveTab('overview');
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="text-success" size={18} />;
      case 'rejected': return <XCircle className="text-danger" size={18} />;
      default: return <Clock className="text-muted" size={18} />;
    }
  };

  if (!profile) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container">
      <div className="sidebar glass">
        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>
            <Wallet size={20} /> Overview
          </button>
          <button className={`nav-item ${activeTab==='buy'?'active':''}`} onClick={()=>setActiveTab('buy')}>
            <CreditCard size={20} /> Buy Credits
          </button>
          <button className={`nav-item ${activeTab==='history'?'active':''}`} onClick={()=>setActiveTab('history')}>
            <History size={20} /> Transaction History
          </button>
        </nav>
      </div>

      <div className="dashboard-content animate-fade-in">
        <header className="content-header">
          <h2>{activeTab === 'overview' ? 'Dashboard Overview' : activeTab === 'buy' ? 'Buy Credits' : 'Transaction History'}</h2>
          {message.text && (
            <div className={`status-message ${message.type}`}>{message.text}</div>
          )}
        </header>

        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="stat-card glass primary-gradient">
              <div className="stat-icon"><Wallet size={32} /></div>
              <div className="stat-info">
                <span className="stat-label">Available Balance</span>
                <span className="stat-value">{profile.total_credits} Credits</span>
                <span className="stat-sub">({profile.total_credits} Days remaining)</span>
              </div>
            </div>
            <div className="info-card glass">
              <h3>Welcome, {profile.school_name}</h3>
              <p>Email: {profile.email}</p>
              <p>Contact: {profile.contact}</p>
              <div className="card-actions mt-4">
                <Button onClick={() => setActiveTab('buy')}>Recharge Now</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buy' && (
          <div className="buy-section">
            <div className="pricing-grid">
              <div className={`pricing-card glass ${selectedPlan?.credits === 30 ? 'selected' : ''}`} 
                   onClick={() => setSelectedPlan({credits: 30, pkr: 2000})}>
                <div className="plan-name">Monthly Plan</div>
                <div className="plan-price">Rs 2,000</div>
                <div className="plan-credits">30 Credits</div>
                <div className="plan-radio">
                  <div className={`radio-inner ${selectedPlan?.credits === 30 ? 'active' : ''}`}></div>
                </div>
              </div>

              <div className={`pricing-card glass border-accent ${selectedPlan?.credits === 100 ? 'selected' : ''}`} 
                   onClick={() => setSelectedPlan({credits: 100, pkr: 5000})}>
                <div className="popular-badge">Best Value - Save 17%</div>
                <div className="plan-name">Quarterly+ Plan</div>
                <div className="plan-price">Rs 5,000</div>
                <div className="plan-credits">100 Credits</div>
                <div className="plan-radio">
                  <div className={`radio-inner ${selectedPlan?.credits === 100 ? 'active' : ''}`}></div>
                </div>
              </div>
            </div>

            {selectedPlan && (
              <div className="checkout-card glass animate-fade-in">
                <h3>Complete Purchase</h3>
                <div className="payment-methods">
                  <button className={`pay-btn ${paymentMethod === 'JazzCash' ? 'active' : ''}`} 
                          onClick={() => setPaymentMethod('JazzCash')}>
                    JazzCash
                  </button>
                  <button className={`pay-btn ${paymentMethod === 'Bank' ? 'active' : ''}`} 
                          onClick={() => setPaymentMethod('Bank')}>
                    Bank Transfer
                  </button>
                </div>

                <div className="payment-instructions">
                  {paymentMethod === 'JazzCash' ? (
                    <>
                      <p>Send <strong>Rs {selectedPlan.pkr}</strong> via JazzCash to:</p>
                      <div className="account-box">0300-1234567 (ilmsoft)</div>
                    </>
                  ) : (
                    <>
                      <p>Transfer <strong>Rs {selectedPlan.pkr}</strong> to Bank Account:</p>
                      <div className="account-box">
                        <strong>Bank:</strong> Meezan Bank<br/>
                        <strong>Acct Title:</strong> ilmsoft<br/>
                        <strong>IBAN:</strong> PK12MEZN000123456789
                      </div>
                    </>
                  )}
                </div>

                <form onSubmit={handlePurchase} className="purchase-form">
                  <Input 
                    label="Payment Reference / Trx ID / Sender Account"
                    placeholder="e.g. 0300XXXXX or TID:12345"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                  />
                  <Button type="submit" size="lg" className="full-width mt-4" isLoading={loading}>
                    <Banknote size={18} /> Request Credits
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section glass">
            {history.length === 0 ? (
              <p className="empty-state">No transaction history found.</p>
            ) : (
              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id}>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>{item.credits} Credits</td>
                        <td>Rs {item.amount_pkr}</td>
                        <td>{item.payment_method}</td>
                        <td className="status-cell">
                          {getStatusIcon(item.status)}
                          <span className={`status-badge ${item.status}`}>{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
