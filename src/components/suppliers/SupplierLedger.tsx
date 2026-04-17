import React, { useMemo } from 'react';
import { ArrowLeft, BookOpen, ArrowUpCircle, ArrowDownCircle, Store } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Supplier, SupplierTransaction } from './types';

interface SupplierLedgerProps {
  supplier: Supplier;
  transactions: SupplierTransaction[];
  onBack: () => void;
}

export const SupplierLedger: React.FC<SupplierLedgerProps> = ({ supplier, transactions, onBack }) => {
  const computedTransactions = useMemo(() => {
    if (!supplier || !transactions.length) return [];

    // Sort ascending to calculate running balance correctly
    const sortedAsc = [...transactions].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let balance = supplier.opening_balance || 0;
    const withBalance = sortedAsc.map(t => {
      if (t.type === 'bill') balance += t.amount;
      else if (t.type === 'payment') balance -= t.amount;
      return { ...t, computedBalance: balance };
    });

    // Return descending for display (latest first)
    return withBalance.reverse();
  }, [transactions, supplier]);

  return (
    <div className="suppliers-manager">
      <div className="manager-header">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Suppliers
        </Button>
        <h2><BookOpen size={20} /> Ledger: {supplier.supplier_name}</h2>
      </div>

      <div className="ledger-summary">
        <div className="summary-card">
          <span>Current Balance</span>
          <strong>Rs {(computedTransactions[0]?.computedBalance ?? (supplier.opening_balance || 0)).toLocaleString()}</strong>
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
            {computedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">No transactions yet</td>
              </tr>
            ) : (
              <>
                {computedTransactions.map(t => (
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
                    <td className="balance">Rs {(t.computedBalance ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
                {/* Opening Balance Row */}
                <tr className="opening-balance-row">
                  <td>-</td>
                  <td>
                    <span className="type-badge opening">
                      <Store size={14} />
                      Opening
                    </span>
                  </td>
                  <td>Initial Opening Balance</td>
                  <td>-</td>
                  <td className="amount">-</td>
                  <td className="balance">Rs {(supplier.opening_balance || 0).toLocaleString()}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
