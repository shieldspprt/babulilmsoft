import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Store, Phone, MapPin, Wallet } from 'lucide-react';
import './SuppliersManager.css';

type Supplier = {
  id: string;
  name: string;
  business_name: string;
  contact: string;
  address: string;
  opening_balance: number;
  current_balance: number;
  created_at: string;
};

export const SuppliersManager = ({ schoolId }: { schoolId: string }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', business_name: '', contact: '', address: '', opening_balance: 0 });

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').eq('school_id', schoolId).eq('is_active', true).order('created_at', { ascending: false });
    if (data) setSuppliers(data);
  };

  const handleAdd = async () => {
    await supabase.from('suppliers').insert({
      school_id: schoolId, ...form, current_balance: form.opening_balance
    });
    setShowForm(false);
    setForm({ name: '', business_name: '', contact: '', address: '', opening_balance: 0 });
    loadSuppliers();
  };

  return (
    <div className="suppliers-manager">
      <div className="suppliers-header">
        <h3>Supplier Management</h3>
        <div className="header-actions">
          <button className="btn-add-transaction" disabled><Wallet size={16} /> Add Transaction (Coming Soon)</button>
          <button className="btn-add-supplier" onClick={() => setShowForm(true)}><Plus size={16} /> Add New Supplier</button>
        </div>
      </div>

      {showForm && (
        <div className="supplier-form glass">
          <h4>Add New Supplier</h4>
          <div className="form-row">
            <div className="form-field"><label>Supplier Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter name" /></div>
            <div className="form-field"><label>Business Name *</label><input value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} placeholder="Enter business name" /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Contact Number *</label><input value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="03XX-XXXXXXX" /></div>
            <div className="form-field"><label>Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" /></div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Opening Balance (if any)</label>
              <input type="number" value={form.opening_balance} onChange={e => setForm({...form, opening_balance: Number(e.target.value)})} placeholder="0" />
              <small className="balance-hint">Positive = We owe them, Negative = They owe us</small>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-save" onClick={handleAdd} disabled={!form.name || !form.business_name || !form.contact}>Save Supplier</button>
          </div>
        </div>
      )}

      <div className="suppliers-list">
        {suppliers.length === 0 ? (
          <div className="empty-state"><Store size={48} /><p>No suppliers added yet</p></div>
        ) : (
          suppliers.map(s => (
            <div key={s.id} className="supplier-card glass">
              <div className="supplier-info">
                <h4>{s.name}</h4>
                <span className="business-name">{s.business_name}</span>
                <div className="contact-row"><Phone size={14} /> {s.contact}</div>
                {s.address && <div className="contact-row"><MapPin size={14} /> {s.address}</div>}
              </div>
              <div className="balance-section">
                <span className={`balance ${s.current_balance > 0 ? 'owe' : s.current_balance < 0 ? 'owed' : 'zero'}`}>
                  {s.current_balance > 0 ? `We owe: Rs ${s.current_balance}` : s.current_balance < 0 ? `They owe: Rs ${Math.abs(s.current_balance)}` : 'Balanced'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
