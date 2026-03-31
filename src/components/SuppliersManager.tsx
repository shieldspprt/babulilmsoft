import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Plus, Store, Phone, MapPin, ArrowLeft, ArrowUpCircle, ArrowDownCircle, BookOpen } from 'lucide-react';
import './SuppliersManager.css';

type Supplier = {
  id: string;
  supplier_name: string;
  business_name: string;
  contact_number: string;
  address: string;
  opening_balance: number;
  current_balance: number;
  notes: string;
};

type SupplierTransaction = {
  id: string;
  supplier_id: string;
  type: 'bill' | 'payment';
  amount: number;
  date: string;
  description: string;
  bill_number?: string;
  payment_method?: string;
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
    supplier_name: '',
    business_name: '',
    contact_number: '',
    address: '',
    opening_balance: 0,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    description: ''
  });

  const [billForm, setBillForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    bill_number: '',
    description: ''
  });

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('school_id', schoolId)
      .order('supplier_name');
    
    if (error) console.error('Error loading suppliers:', error);
    setSuppliers(data || []);
    setLoading(false);
  };

  const loadTransactions = async (supplierId: string) => {
    const { data, error } = await supabase
      .from('supplier_transactions')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('school_id', schoolId) // Extra safety
      .order('date', { ascending: false });
    
    if (error) console.error('Error loading transactions:', error);
    setTransactions(data || []);
  };

  useEffect(() => {
    loadSuppliers();
  }, [schoolId]);

  useEffect(() => {
    if (selectedSupplier) {
      loadTransactions(selectedSupplier.id);
    }
  }, [selectedSupplier]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('suppliers').insert({
      school_id: schoolId,
      supplier_name: newSupplier.supplier_name,
      business_name: newSupplier.business_name,
      contact_number: newSupplier.contact_number,
      address: newSupplier.address,
      opening_balance: newSupplier.opening_balance,
      current_balance: newSupplier.opening_balance,
      notes: newSupplier.notes
    });

    if (error) {
      alert('Error adding supplier: ' + error.message);
      return;
    }

    setNewSupplier({
      supplier_name: '',
      business_name: '',
      contact_number: '',
      address: '',
      opening_balance: 0,
      notes: ''
    });
    
    loadSuppliers();
    setCurrentView('list');
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amount = parseInt(paymentForm.amount);
    const newBalance = selectedSupplier.current_balance - amount;

    // Insert transaction with school_id
    const { error: txError } = await supabase.from('supplier_transactions').insert({
      supplier_id: selectedSupplier.id,
      school_id: schoolId,
      type: 'payment',
      amount: amount,
      date: paymentForm.date,
      description: paymentForm.description,
      payment_method: paymentForm.payment_method,
      balance_after: newBalance
    });

    if (txError) {
      alert('Error recording payment: ' + txError.message);
      return;
    }

    // Update supplier
    const { error: supError } = await supabase
      .from('suppliers')
      .update({
        current_balance: newBalance
      })
      .eq('id', selectedSupplier.id)
      .eq('school_id', schoolId); // Extra safety

    if (supError) {
      alert('Error updating supplier: ' + supError.message);
      return;
    }

    setPaymentForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      description: ''
    });

    loadSuppliers();
    loadTransactions(selectedSupplier.id);
    setSelectedSupplier(null);
    setCurrentView('list');
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amount = parseInt(billForm.amount);
    const newBalance = selectedSupplier.current_balance + amount;

    // Insert transaction with school_id
    const { error: txError } = await supabase.from('supplier_transactions').insert({
      supplier_id: selectedSupplier.id,
      school_id: schoolId,
      type: 'bill',
      amount: amount,
      date: billForm.date,
      bill_number: billForm.bill_number,
      description: billForm.description,
      balance_after: newBalance
    });

    if (txError) {
      alert('Error recording bill: ' + txError.message);
      return;
    }

    // Update supplier
    const { error: supError } = await supabase
      .from('suppliers')
      .update({
        current_balance: newBalance
      })
      .eq('id', selectedSupplier.id)
      .eq('school_id', schoolId); // Extra safety

    if (supError) {
      alert('Error updating supplier: ' + supError.message);
      return;
    }

    setBillForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      bill_number: '',
      description: ''
    });

    loadSuppliers();
    loadTransactions(selectedSupplier.id);
    setSelectedSupplier(null);
    setCurrentView('list');
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId); // Extra safety

    if (error) {
      alert('Error deleting supplier: ' + error.message);
      return;
    }

    loadSuppliers();
  };

  const selectSupplier = (supplier: Supplier, view: ViewType) => {
    setSelectedSupplier(supplier);
    setCurrentView(view);
  };

  const goBack = () => {
    setSelectedSupplier(null);
    setCurrentView('list');
  };

  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { text: 'We Owe', class: 'owe' };
    if (balance < 0) return { text: 'They Owe', class: 'owed' };
    return { text: 'Settled', class: 'settled' };
  };

  if (loading) {
    return <div className="suppliers-manager"><div className="loading">Loading suppliers...</div></div>;
  }

  // LIST VIEW
  if (currentView === 'list') {
    return (
      <div className="suppliers-manager">
        <div className="manager-header">
          <h2><Store size={24} /> Suppliers</h2>
          <Button onClick={() => setCurrentView('add')}>
            <Plus size={18} /> Add New Supplier
          </Button>
        </div>

        <div className="suppliers-grid">
          {suppliers.length === 0 ? (
            <div className="empty-message">
              <Store size={48} />
              <p>No suppliers yet</p>
              <Button onClick={() => setCurrentView('add')}>Add Your First Supplier</Button>
            </div>
          ) : (
            suppliers.map(supplier => {
              const status = getBalanceStatus(supplier.current_balance);
              return (
                <div key={supplier.id} className="supplier-card">
                  <div className="supplier-info">
                    <h3>{supplier.supplier_name}</h3>
                    {supplier.business_name && <p className="business">{supplier.business_name}</p>}
                    <p className="contact"><Phone size={14} /> {supplier.contact_number || 'No contact'}</p>
                    {supplier.address && <p className="address"><MapPin size={14} /> {supplier.address}</p>}
                  </div>

                  <div className="balance-section">
                    <div className={`balance-badge ${status.class}`}>
                      <span className="balance-label">{status.text}</span>
                      <span className="balance-amount">Rs {Math.abs(supplier.current_balance).toLocaleString()}</span>
                    </div>

                  </div>

                  <div className="supplier-actions">
                    <Button variant="outline" onClick={() => selectSupplier(supplier, 'payment')}>
                      <ArrowDownCircle size={16} /> Add Payment
                    </Button>
                    <Button variant="outline" onClick={() => selectSupplier(supplier, 'bill')}>
                      <ArrowUpCircle size={16} /> Add Bill
                    </Button>
                    <Button variant="ghost" onClick={() => selectSupplier(supplier, 'ledger')}>
                      <BookOpen size={16} /> View Ledger
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteSupplier(supplier.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ADD SUPPLIER VIEW
  if (currentView === 'add') {
    return (
      <div className="suppliers-manager">
        <div className="manager-header">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft size={18} /> Back to Suppliers
          </Button>
          <h2><Plus size={20} /> Add New Supplier</h2>
        </div>

        <form onSubmit={handleAddSupplier} className="supplier-form">
          <div className="form-row">
            <div className="form-field required">
              <label>Owner Name *</label>
              <input
                type="text"
                value={newSupplier.supplier_name}
                onChange={e => setNewSupplier({...newSupplier, supplier_name: e.target.value})}
                placeholder="e.g., Ahmed Khan"
                required
              />
            </div>
            <div className="form-field">
              <label>Business Name</label>
              <input
                type="text"
                value={newSupplier.business_name}
                onChange={e => setNewSupplier({...newSupplier, business_name: e.target.value})}
                placeholder="e.g., Ahmed Stationers"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field required">
              <label>Contact Number *</label>
              <input
                type="tel"
                value={newSupplier.contact_number}
                onChange={e => setNewSupplier({...newSupplier, contact_number: e.target.value})}
                placeholder="03XX-XXXXXXX"
                required
              />
            </div>
            <div className="form-field">
              <label>Opening Balance (if any)</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={newSupplier.opening_balance}
                onChange={e => setNewSupplier({...newSupplier, opening_balance: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
              <small>Positive = We owe them | Negative = They owe us</small>
            </div>
          </div>

          <div className="form-field">
            <label>Address</label>
            <input
              type="text"
              value={newSupplier.address}
              onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
              placeholder="Full address"
            />
          </div>

          <div className="form-field">
            <label>Notes</label>
            <textarea
              value={newSupplier.notes}
              onChange={e => setNewSupplier({...newSupplier, notes: e.target.value})}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <Button type="submit" size="lg">
              <Plus size={18} /> Add Supplier
            </Button>
            <Button type="button" variant="secondary" onClick={goBack}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // PAYMENT VIEW
  if (currentView === 'payment' && selectedSupplier) {
    return (
      <div className="suppliers-manager">
        <div className="manager-header">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft size={18} /> Back to Suppliers
          </Button>
          <h2><ArrowDownCircle size={20} /> Add Payment</h2>
        </div>

        <div className="supplier-info-bar">
          <h3>{selectedSupplier.supplier_name}</h3>
          <p>Current Balance: <strong>Rs {selectedSupplier.current_balance.toLocaleString()}</strong></p>
        </div>

        <form onSubmit={handleAddPayment} className="transaction-form">
          <div className="form-row">
            <div className="form-field required">
              <label>Amount Paid (Rs) *</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={paymentForm.amount}
                onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                placeholder="Enter amount"
                required
                min="1"
              />
            </div>
            <div className="form-field required">
              <label>Date *</label>
              <input
                type="date"
                value={paymentForm.date}
                onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-field required">
            <label>Payment Method *</label>
            <select
              value={paymentForm.payment_method}
              onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}
              required
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Easy Paisa">Easy Paisa</option>
            </select>
          </div>

          <div className="form-field required">
            <label>Description *</label>
            <input
              type="text"
              value={paymentForm.description}
              onChange={e => setPaymentForm({...paymentForm, description: e.target.value})}
              placeholder="e.g., Payment for books"
              required
            />
          </div>

          <div className="form-actions">
            <Button type="submit" size="lg">
              <ArrowDownCircle size={18} /> Record Payment
            </Button>
            <Button type="button" variant="secondary" onClick={goBack}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // BILL VIEW
  if (currentView === 'bill' && selectedSupplier) {
    return (
      <div className="suppliers-manager">
        <div className="manager-header">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft size={18} /> Back to Suppliers
          </Button>
          <h2><ArrowUpCircle size={20} /> Add New Bill</h2>
        </div>

        <div className="supplier-info-bar">
          <h3>{selectedSupplier.supplier_name}</h3>
          <p>Current Balance: <strong>Rs {selectedSupplier.current_balance.toLocaleString()}</strong></p>
        </div>

        <form onSubmit={handleAddBill} className="transaction-form">
          <div className="form-row">
            <div className="form-field required">
              <label>Bill Amount (Rs) *</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={billForm.amount}
                onChange={e => setBillForm({...billForm, amount: e.target.value})}
                placeholder="Enter bill amount"
                required
                min="1"
              />
            </div>
            <div className="form-field required">
              <label>Bill Date *</label>
              <input
                type="date"
                value={billForm.date}
                onChange={e => setBillForm({...billForm, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Bill Number / Reference</label>
            <input
              type="text"
              value={billForm.bill_number}
              onChange={e => setBillForm({...billForm, bill_number: e.target.value})}
              placeholder="e.g., B-00123"
            />
          </div>

          <div className="form-field required">
            <label>Description *</label>
            <input
              type="text"
              value={billForm.description}
              onChange={e => setBillForm({...billForm, description: e.target.value})}
              placeholder="e.g., Books for Class 5"
              required
            />
          </div>

          <div className="form-actions">
            <Button type="submit" size="lg">
              <ArrowUpCircle size={18} /> Add Bill
            </Button>
            <Button type="button" variant="secondary" onClick={goBack}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // LEDGER VIEW
  if (currentView === 'ledger' && selectedSupplier) {
    return (
      <div className="suppliers-manager">
        <div className="manager-header">
          <Button variant="ghost" onClick={goBack}>
            <ArrowLeft size={18} /> Back to Suppliers
          </Button>
          <h2><BookOpen size={20} /> Ledger: {selectedSupplier.supplier_name}</h2>
        </div>

        <div className="ledger-summary">
          <div className="summary-card">
            <span>Current Balance</span>
            <strong>Rs {selectedSupplier.current_balance.toLocaleString()}</strong>
          </div>
        </div>

        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Ref #</th>
                <th>Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">No transactions yet</td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className={t.type}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`type-badge ${t.type}`}>
                        {t.type === 'bill' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                        {t.type === 'bill' ? 'Bill' : 'Payment'}
                      </span>
                    </td>
                    <td>{t.description}</td>
                    <td>{t.bill_number || t.payment_method || '-'}</td>
                    <td className="amount">Rs {t.amount.toLocaleString()}</td>
                    <td className="balance">Rs {t.balance_after.toLocaleString()}</td>
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
