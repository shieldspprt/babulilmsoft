import React, { useState } from 'react';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Supplier } from './types';

interface BillFormProps {
  supplier: Supplier;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const BillForm: React.FC<BillFormProps> = ({ supplier, onSubmit, onCancel }) => {
  const [billForm, setBillForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    bill_number: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(billForm);
  };

  return (
    <div className="suppliers-manager">
      <div className="manager-header">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft size={18} /> Back to Suppliers
        </Button>
        <h2><ArrowUpCircle size={20} /> Add New Bill</h2>
      </div>

      <div className="supplier-info-bar">
        <h3>{supplier.supplier_name}</h3>
        <p>Current Balance: <strong>Rs {supplier.current_balance.toLocaleString()}</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
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
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
