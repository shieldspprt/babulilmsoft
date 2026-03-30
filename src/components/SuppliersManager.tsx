import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Plus, Store, Phone, MapPin, ArrowUpCircle, ArrowDownCircle, FileText, ChevronLeft } from 'lucide-react';
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

type ViewType = 'list' | 'add' | 'payment' | 'bill' | 'ledger';

export const SuppliersManager = ({ schoolId }: { schoolId: string }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('list');

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
    if (selectedSupplier && currentView === 'ledger') {
      loadTransactions(selectedSupplier.id);
    }
  }, [selectedSupplier, currentView]);

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
      ...newSupplier,
      current_balance: newSupplier.opening_balance,
      total_billed: 0,
      total_paid: 0,
      is_active: true
    });
    if (!error) {
      setNewSupplier({ name: '', business_name: '', contact: '', address: '', opening_balance: 0, notes: '' });
      setCurrentView('list');
      loadSuppliers();
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amount = parseFloat(paymentForm.amount);
    const newBalance = selectedSupplier.current_balance - amount;
    const { error } = await supabase.from('supplier_transactions').insert({
      supplier_id: selectedSupplier.id,
      type: 'payment',
      amount: amount,
      date: paymentForm.date,
      description: paymentForm.description,
      notes: paymentForm.notes,
      payment_method: paymentForm.payment_method,
      balance_after: newBalance
    });
    if (!error) {
      await supabase.from('suppliers').update({
        current_balance: newBalance,
        total_paid: selectedSupplier.total_paid + amount
      }).eq('id', selectedSupplier.id);
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], payment_method: 'Cash', description: '', notes: '' });
      setCurrentView('ledger');
      loadSuppliers();
      setSelectedSupplier({ ...selectedSupplier, current_balance: newBalance, total_paid: selectedSupplier.total_paid + amount });
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amount = parseFloat(billForm.amount);
    const newBalance = selectedSupplier.current_balance + amount;
    const { error } = await supabase.from('supplier_transactions').insert({
      supplier_id: selectedSupplier.id,
      type: 'bill',
      amount: amount,
      date: billForm.date,
      description: billForm.description,
      notes: billForm.notes,
      bill_number: billForm.bill_number,
      balance_after: newBalance
    });
    if (!error) {
      await supabase.from('suppliers').update({
        current_balance: newBalance,
        total_billed: selectedSupplier.total_billed + amount
      }).eq('id', selectedSupplier.id);
      setBillForm({ amount: '', date: new Date().toISOString().split('T')[0], bill_number: '', description: '', notes: '' });
      setCurrentView('ledger');
      loadSuppliers();
      setSelectedSupplier({ ...selectedSupplier, current_balance: newBalance, total_billed: selectedSupplier.total_billed + amount });
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  // LIST VIEW
  if (currentView === 'list') {
    return (
      <div className="suppliers-manager">
        <div className="section-header">
          <h2>Suppliers</h2>
          <Button onClick={() => setCurrentView('add')}><Plus size={18} /> Add Supplier</Button>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <Store size={48} />
            <p>No suppliers yet</p>
            <Button onClick={() => setCurrentView('add')}><Plus size={18} /> Add First Supplier</Button>
          </div>
        ) : (
          <div className="suppliers-grid">
            {suppliers.map(s => (
              <div key={s.id} className="supplier-card">
                <div className="supplier-header">
                  <div className="supplier-icon"><Store size={24} /></div>
                  <div className="supplier-info">
                    <h3>{s.business_name || s.name}</h3>
                    <p className="supplier-contact"><Phone size={14} /> {s.contact}</p>
                    {s.address && <p className="supplier-address"><MapPin size={14} /> {s.address}</p>}
                  </div>
                </div>
                <div className="supplier-balance">
                  <span className="balance-label">Current Balance:</span>
                  <span className={`balance-value ${s.current_balance > 0 ? 'pending' : s.current_balance < 0 ? 'credit' : 'zero'}`}>
                    {formatCurrency(s.current_balance)}
                  </span>
                </div>
                <div className="supplier-actions">
                  <Button size="sm" onClick={() => { setSelectedSupplier(s); setCurrentView('payment'); }}>
                    <ArrowUpCircle size={16} /> Payment
                  </Button>
                  <Button size="sm" onClick={() => { setSelectedSupplier(s); setCurrentView('bill'); }}>
                    <ArrowDownCircle size={16} /> Bill
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedSupplier(s); setCurrentView('ledger'); }}>
                    <FileText size={16} /> Ledger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ADD SUPPLIER VIEW
  if (currentView === 'add') {
    return (
      <div className="suppliers-manager">
        <div className="section-header">
          <Button variant="ghost" onClick={() => setCurrentView('list')}><ChevronLeft size={18} /> Back</Button>
          <h2>Add New Supplier</h2>
        </div>
        <form onSubmit={handleAddSupplier} className="supplier-form">
          <div className="form-row">
            <div className="form-group">
              <label>Business Name *</label>
              <input type="text" value={newSupplier.business_name} onChange={e => setNewSupplier({...newSupplier, business_name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Number *</label>
              <input type="text" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Opening Balance</label>
              <input type="number" value={newSupplier.opening_balance} onChange={e => setNewSupplier({...newSupplier, opening_balance: parseFloat(e.target.value) || 0})} />
              <small>Positive = We owe them, Negative = They owe us</small>
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={newSupplier.notes} onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})} rows={3} />
          </div>
          <div className="form-actions">
            <Button type="submit" size="lg"><Plus size={18} /> Save Supplier</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setCurrentView('list')}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  // PAYMENT VIEW
  if (currentView === 'payment' && selectedSupplier) {
    return (
      <div className="suppliers-manager">
        <div className="section-header">
          <Button variant="ghost" onClick={() => setCurrentView('list')}><ChevronLeft size={18} /> Back</Button>
          <h2>Record Payment</h2>
        </div>
        <div className="supplier-summary">
          <h3>{selectedSupplier.business_name || selectedSupplier.name}</h3>
          <p>Current Balance: <strong className={selectedSupplier.current_balance > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(selectedSupplier.current_balance)}</strong></p>
        </div>
        <form onSubmit={handleRecordPayment} className="supplier-form">
          <div className="form-row">
            <div className="form-group">
              <label>Amount Paid *</label>
              <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required min="1" />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Jazz Cash</option>
              <option>Easy Paisa</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description *</label>
            <input type="text" value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} required placeholder="What was this payment for?" />
          </div>
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} rows={2} />
          </div>
          <div className="form-actions">
            <Button type="submit" size="lg"><ArrowUpCircle size={18} /> Record Payment</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setCurrentView('list')}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  // BILL VIEW
  if (currentView === 'bill' && selectedSupplier) {
    return (
      <div className="suppliers-manager">
        <div className="section-header">
          <Button variant="ghost" onClick={() => setCurrentView('list')}><ChevronLeft size={18} /> Back</Button>
          <h2>Add Bill</h2>
        </div>
        <div className="supplier-summary">
          <h3>{selectedSupplier.business_name || selectedSupplier.name}</h3>
          <p>Current Balance: <strong>{formatCurrency(selectedSupplier.current_balance)}</strong></p>
        </div>
        <form onSubmit={handleAddBill} className="supplier-form">
          <div className="form-row">
            <div className="form-group">
              <label>Bill Amount *</label>
              <input type="number" value={billForm.amount} onChange={e => setBillForm({...billForm, amount: e.target.value})} required min="1" />
            </div>
            <div className="form-group">
              <label>Bill Date *</label>
              <input type="date" value={billForm.date} onChange={e => setBillForm({...billForm, date: e.target.value})} required />
            </div>
          </div>
          <div className="form-group">
            <label>Bill Number</label>
            <input type="text" value={billForm.bill_number} onChange={e => setBillForm({...billForm, bill_number: e.target.value})} placeholder="Optional reference number" />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <input type="text" value={billForm.description} onChange={e => setBillForm({...billForm, description: e.target.value})} required placeholder="What items/services?" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={billForm.notes} onChange={e => setBillForm({...billForm, notes: e.target.value})} rows={2} />
          </div>
          <div className="form-actions">
            <Button type="submit" size="lg"><ArrowDownCircle size={18} /> Save Bill</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setCurrentView('list')}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  // LEDGER VIEW
  if (currentView === 'ledger' && selectedSupplier) {
    return (
      <div className="suppliers-manager">
        <div className="section-header">
          <Button variant="ghost" onClick={() => setCurrentView('list')}><ChevronLeft size={18} /> Back</Button>
          <h2>Transaction Ledger</h2>
        </div>
        <div className="supplier-summary">
          <h3>{selectedSupplier.business_name || selectedSupplier.name}</h3>
          <div className="ledger-stats">
            <div className="stat">
              <span className="stat-label">Current Balance</span>
              <span className={`stat-value ${selectedSupplier.current_balance > 0 ? 'pending' : selectedSupplier.current_balance < 0 ? 'credit' : ''}`}>
                {formatCurrency(selectedSupplier.current_balance)}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Billed</span>
              <span className="stat-value">{formatCurrency(selectedSupplier.total_billed)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Paid</span>
              <span className="stat-value success">{formatCurrency(selectedSupplier.total_paid)}</span>
            </div>
          </div>
        </div>
        <div className="ledger-actions">
          <Button size="sm" onClick={() => setCurrentView('payment')}><ArrowUpCircle size={16} /> Add Payment</Button>
          <Button size="sm" onClick={() => setCurrentView('bill')}><ArrowDownCircle size={16} /> Add Bill</Button>
        </div>
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="empty-cell">No transactions yet</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`type-badge ${t.type}`}>
                        {t.type === 'bill' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                        {t.type === 'bill' ? 'Bill' : 'Payment'}
                      </span>
                    </td>
                    <td>{t.description}{t.bill_number && <span className="bill-num">#{t.bill_number}</span>}</td>
                    <td className={`amount ${t.type}`}>{formatCurrency(t.amount)}</td>
                    <td className={`balance ${t.balance_after > 0 ? 'pending' : t.balance_after < 0 ? 'credit' : ''}`}>{formatCurrency(t.balance_after)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
