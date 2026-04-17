import React, { useState } from 'react';
import { ArrowLeft, ArrowDownCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Supplier } from './types';

interface PaymentFormProps {
  supplier: Supplier;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ supplier, onSubmit, onCancel }) => {
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(paymentForm);
  };

  return (
    <div className="suppliers-manager">
      <div className="manager-header">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft size={18} /> Back to Suppliers
        </Button>
        <h2><ArrowDownCircle size={20} /> Add Payment</h2>
      </div>

      <div className="supplier-info-bar">
        <h3>{supplier.supplier_name}</h3>
        <p>Current Balance: <strong>Rs {supplier.current_balance.toLocaleString()}</strong></p>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
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
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
