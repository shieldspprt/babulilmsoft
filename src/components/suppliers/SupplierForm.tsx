import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

interface SupplierFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ onSubmit, onCancel }) => {
  const [newSupplier, setNewSupplier] = useState({
    supplier_name: '',
    business_name: '',
    contact_number: '',
    address: '',
    opening_balance: 0,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newSupplier);
  };

  return (
    <div className="suppliers-manager">
      <div className="manager-header">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft size={18} /> Back to Suppliers
        </Button>
        <h2><Plus size={20} /> Add New Supplier</h2>
      </div>

      <form onSubmit={handleSubmit} className="supplier-form">
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
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
