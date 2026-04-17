import React from 'react';
import { Plus, Store, Phone, MapPin, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Supplier, ViewType } from './types';

interface SupplierTableProps {
  suppliers: Supplier[];
  isOwner: boolean;
  onAddClick: () => void;
  onActionClick: (supplier: Supplier, view: ViewType) => void;
  onDeleteClick: (id: string) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  isOwner,
  onAddClick,
  onActionClick,
  onDeleteClick
}) => {
  const getBalanceStatus = (balance: number) => {
    if (balance > 0) return { text: 'We Owe', class: 'owe' };
    if (balance < 0) return { text: 'They Owe', class: 'owed' };
    return { text: 'Settled', class: 'settled' };
  };

  return (
    <div className="suppliers-manager">
      <div className="manager-toolbar">
        <Button onClick={onAddClick}>
          <Plus size={18} /> Add Supplier
        </Button>
      </div>

      <div className="suppliers-table-container glass">
        {suppliers.length === 0 ? (
          <div className="empty-message">
            <Store size={48} />
            <p>No suppliers yet</p>
            <Button onClick={onAddClick}>Add Your First Supplier</Button>
          </div>
        ) : (
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Supplier / Business</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th className="balance-col">Balance Status</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => {
                const status = getBalanceStatus(supplier.current_balance);
                return (
                  <tr key={supplier.id}>
                    <td>
                      <div className="supplier-main-info">
                        <span className="supplier-name">{supplier.supplier_name}</span>
                        {supplier.business_name && <span className="business-name">{supplier.business_name}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <Phone size={14} />
                        <span>{supplier.contact_number || 'No contact'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="address-info" title={supplier.address}>
                        <MapPin size={14} />
                        <span>{supplier.address || '-'}</span>
                      </div>
                    </td>
                    <td className="balance-col">
                      <div className={`balance-status-badge ${status.class}`}>
                        <span className="status-label">{status.text}</span>
                        <span className="status-amount">Rs {Math.abs(supplier.current_balance).toLocaleString()}</span>
                      </div>
                    </td>
                      <td className="actions-col">
                        <div className="supplier-row-actions">
                          <button className="action-btn-text bill" onClick={() => onActionClick(supplier, 'bill')}>
                            Add Bill
                          </button>
                          <button className="action-btn-text payment" onClick={() => onActionClick(supplier, 'payment')}>
                            Add Payment
                          </button>
                          <button className="action-btn-text view" onClick={() => onActionClick(supplier, 'ledger')}>
                            View
                          </button>
                          {isOwner && (
                            <button className="action-btn-icon delete" onClick={() => onDeleteClick(supplier.id)} title="Delete Supplier">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
