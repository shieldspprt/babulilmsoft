import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Store, Phone, MapPin, X, ArrowUpCircle, ArrowDownCircle, FileText } from 'lucide-react';
import './SuppliersManager.css';

type Supplier = {
  id: string;
  name: string;
  business_name: string;
  contact: string;
  address: string;
  opening_balance: number;
  current_balance: number;
  total_billed: number;
  total_paid: number;
  notes: string;
  is_active: boolean;
};

type SupplierTransaction = {
  id: string;
  supplier_id: string;
  type: 'bill' | 'payment';
  amount: number;
  date: string;
  description: string;
  notes: string;
  payment_method?: string;
  bill_number?: string;
  balance_after: number;
  created_at: string;
};

type TabType = 'list' | 'payment' | 'bill' | 'ledger';

export const SuppliersManager = ({ schoolId }: { schoolId: string }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');

  // Form states
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    business_name: '',
    contact: '',
    address: '',
    opening_balance: 0,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    description: '',
    notes: ''
  });

  const [billForm, setBillForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    bill_number: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, [schoolId]);

  useEffect(() => {
    if (selectedSupplier) {
      loadTransactions(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('name');
    setSuppliers(data || []);
    setLoading(false);
  };

  const loadTransactions = async (supplierId: string) => {
    const { data } = await supabase
      .from('supplier_transactions')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('date', { ascending: false });
    setTransactions(data || []);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('suppliers').insert({
      school_id: schoolId,
      ...newSupplier
    });
    if (!error) {
      setShowAddModal(false);
      setNewSupplier({ name: '', business_name: '', contact: '', address: '', opening_balance: 0, notes: '' });
      loadSuppliers();
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const { error } = await supabase.from('supplier_transactions').insert({
      school_id: schoolId,
      supplier_id: selectedSupplier.id,
      type: 'payment',
      amount: parseFloat(paymentForm.amount),
      date: paymentForm.date,
      description: paymentForm.description,
      notes: paymentForm.notes,
      payment_method: paymentForm.payment_method
    });

    if (!error) {
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], payment_method: 'Cash', description: '', notes: '' });
      loadSuppliers();
      loadTransactions(selectedSupplier.id);
      setActiveTab('ledger');
    }
  };

  const handleRecordBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const { error } = await supabase.from('supplier_transactions').insert({
      school_id: schoolId,
      supplier_id: selectedSupplier.id,
      type: 'bill',
      amount: parseFloat(billForm.amount),
      date: billForm.date,
      description: billForm.description,
      notes: billForm.notes,
      bill_number: billForm.bill_number
    });

    if (!error) {
      setBillForm({ amount: '', date: new Date().toISOString().split('T')[0], bill_number: '', description: '', notes: '' });
      loadSuppliers();
      loadTransactions(selectedSupplier.id);
      setActiveTab('ledger');
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'negative'; // We owe them (red)
    if (balance < 0) return 'positive'; // They owe us (green)
    return 'neutral';
  };

  const formatBalance = (balance: number) => {
    if (balance > 0) return `We owe: Rs. ${balance.toLocaleString()}`;
    if (balance < 0) return `They owe: Rs. ${Math.abs(balance).toLocaleString()}`;
    return 'Balanced';
  };

  if (loading) return <div className="suppliers-loading">Loading suppliers...</div>;

  return (
    <div className="suppliers-manager">
      {/* Header Buttons */}
      <div className="suppliers-header-actions">
        <button className="action-btn primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add New Supplier
        </button>
        <button className="action-btn secondary" onClick={() => setActiveTab('payment')} disabled={suppliers.length === 0}>
          <ArrowUpCircle size={18} /> Record Payment
        </button>
        <button className="action-btn secondary" onClick={() => setActiveTab('bill')} disabled={suppliers.length === 0}>
          <ArrowDownCircle size={18} /> Record Bill
        </button>
        <button className="action-btn secondary" onClick={() => setActiveTab('ledger')} disabled={!selectedSupplier}>
          <FileText size={18} /> Transaction History
        </button>
      </div>

      {/* Tabs Navigation */}
      {activeTab !== 'list' && (
        <div className="transaction-tabs">
          <button className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
            <ArrowUpCircle size={16} /> Record Payment
          </button>
          <button className={`tab-btn ${activeTab === 'bill' ? 'active' : ''}`} onClick={() => setActiveTab('bill')}>
            <ArrowDownCircle size={16} /> Record Bill
          </button>
          <button className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
            <FileText size={16} /> Ledger
          </button>
          <button className="tab-btn close" onClick={() => { setActiveTab('list'); setSelectedSupplier(null); }}>
            <X size={16} /> Close
          </button>
        </div>
      )}

      {/* Record Payment Form */}
      {activeTab === 'payment' && (
        <div className="transaction-form-container">
          <h3>Record Payment Made</h3>
          <div className="supplier-selector">
            <label>Select Supplier</label>
            <select value={selectedSupplier?.id || ''} onChange={(e) => {
              const supplier = suppliers.find(s => s.id === e.target.value);
              setSelectedSupplier(supplier || null);
            }}>
              <option value="">Choose a supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.business_name})</option>
              ))}
            </select>
          </div>
          
          {selectedSupplier && (
            <div className="balance-summary">
              <div className="balance-item">
                <span>Current Balance:</span>
                <strong className={getBalanceColor(selectedSupplier.current_balance)}>
                  {formatBalance(selectedSupplier.current_balance)}
                </strong>
              </div>
              <div className="balance-item">
                <span>Total Billed:</span>
                <strong>Rs. {selectedSupplier.total_billed.toLocaleString()}</strong>
              </div>
              <div className="balance-item">
                <span>Total Paid:</span>
                <strong>Rs. {selectedSupplier.total_paid.toLocaleString()}</strong>
              </div>
            </div>
          )}

          <form onSubmit={handleRecordPayment} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label>Amount (Rs.) *</label>
                <input type="number" min="0.01" step="0.01" required
                  value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" required
                  value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Payment Method *</label>
              <select value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Jazz Cash">Jazz Cash</option>
                <option value="Easy Paisa">Easy Paisa</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <input type="text" placeholder="e.g., Payment for stationery" required
                value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea rows={2} placeholder="Optional notes..."
                value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
            </div>
            <button type="submit" className="submit-btn" disabled={!selectedSupplier}>
              <ArrowUpCircle size={18} /> Record Payment
            </button>
          </form>
        </div>
      )}

      {/* Record Bill Form */}
      {activeTab === 'bill' && (
        <div className="transaction-form-container">
          <h3>Record Bill Received</h3>
          <div className="supplier-selector">
            <label>Select Supplier</label>
            <select value={selectedSupplier?.id || ''} onChange={(e) => {
              const supplier = suppliers.find(s => s.id === e.target.value);
              setSelectedSupplier(supplier || null);
            }}>
              <option value="">Choose a supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.business_name})</option>
              ))}
            </select>
          </div>

          {selectedSupplier && (
            <div className="balance-summary">
              <div className="balance-item">
                <span>Current Balance:</span>
                <strong className={getBalanceColor(selectedSupplier.current_balance)}>
                  {formatBalance(selectedSupplier.current_balance)}
                </strong>
              </div>
            </div>
          )}

          <form onSubmit={handleRecordBill} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label>Amount (Rs.) *</label>
                <input type="number" min="0.01" step="0.01" required
                  value={billForm.amount} onChange={e => setBillForm({...billForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" required
                  value={billForm.date} onChange={e => setBillForm({...billForm, date: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Bill/Invoice Number</label>
              <input type="text" placeholder="e.g., INV-001"
                value={billForm.bill_number} onChange={e => setBillForm({...billForm, bill_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <input type="text" placeholder="e.g., Monthly stationery bill" required
                value={billForm.description} onChange={e => setBillForm({...billForm, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea rows={2} placeholder="Optional notes..."
                value={billForm.notes} onChange={e => setBillForm({...billForm, notes: e.target.value})} />
            </div>
            <button type="submit" className="submit-btn bill" disabled={!selectedSupplier}>
              <ArrowDownCircle size={18} /> Record Bill
            </button>
          </form>
        </div>
      )}

      {/* Transaction History & Ledger */}
      {activeTab === 'ledger' && selectedSupplier && (
        <div className="ledger-container">
          <div className="ledger-header">
            <h3>Transaction History & Ledger - {selectedSupplier.name}</h3>
            <div className="ledger-summary">
              <span className={getBalanceColor(selectedSupplier.current_balance)}>
                Current: {formatBalance(selectedSupplier.current_balance)}
              </span>
            </div>
          </div>
          <div className="ledger-table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transaction #</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance</th>
                  <th>Method/Bill #</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      No transactions yet. Record your first bill or payment.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td className="tx-number">TX-{t.id.slice(0, 8).toUpperCase()}</td>
                      <td>
                        <span className={`tx-type ${t.type}`}>
                          {t.type === 'bill' ? 'Bill' : 'Payment'}
                        </span>
                      </td>
                      <td>{t.description}</td>
                      <td className="tx-amount">Rs. {t.amount.toLocaleString()}</td>
                      <td className={`tx-balance ${getBalanceColor(t.balance_after)}`}>
                        {formatBalance(t.balance_after)}
                      </td>
                      <td>{t.payment_method || t.bill_number || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers List */}
      {(activeTab === 'list' || activeTab === 'ledger') && !selectedSupplier && (
        <div className="suppliers-list">
          <div className="section-header">
            <h3>All Suppliers</h3>
            <span className="count">{suppliers.length} suppliers</span>
          </div>
          <div className="suppliers-grid">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="supplier-card" onClick={() => { setSelectedSupplier(supplier); setActiveTab('ledger'); }}>
                <div className="supplier-card-header">
                  <div className="supplier-icon"><Store size={24} /></div>
                  <div className={`balance-badge ${getBalanceColor(supplier.current_balance)}`}>
                    {formatBalance(supplier.current_balance)}
                  </div>
                </div>
                <h4>{supplier.name}</h4>
                <p className="business-name">{supplier.business_name}</p>
                <div className="supplier-details">
                  <span><Phone size={14} /> {supplier.contact}</span>
                  <span><MapPin size={14} /> {supplier.address}</span>
                </div>
                <div className="supplier-stats">
                  <div>
                    <span>Billed</span>
                    <strong>Rs. {supplier.total_billed.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Paid</span>
                    <strong>Rs. {supplier.total_paid.toLocaleString()}</strong>
                  </div>
                </div>
                <button className="view-ledger-btn">View Ledger</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Supplier</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSupplier} className="supplier-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Business Name *</label>
                  <input type="text" required value={newSupplier.business_name} onChange={e => setNewSupplier({...newSupplier, business_name: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input type="text" required value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Opening Balance (if any)</label>
                <input type="number" step="0.01"
                  value={newSupplier.opening_balance} onChange={e => setNewSupplier({...newSupplier, opening_balance: parseFloat(e.target.value) || 0})} />
                <small>Positive = We owe them, Negative = They owe us</small>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={newSupplier.notes} onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
