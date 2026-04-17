import React from 'react';
import { X, Plus, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ParentModalProps {
  form: any;
  set: (k: string, v: string) => void;
  cnicError: string;
  saving: boolean;
  editTarget: any | null;
  onClose: () => void;
  onSave: () => void;
}

export const ParentModal: React.FC<ParentModalProps> = ({
  form,
  set,
  cnicError,
  saving,
  editTarget,
  onClose,
  onSave
}) => {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <h3>{editTarget ? 'Edit Parent' : 'Add Parent'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-section-label">Personal Information *</div>
          <div className="form-grid">
            <Input label="First Name *" placeholder="Enter first name" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            <Input label="Last Name *" placeholder="Enter last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            <Input
              label="CNIC *"
              placeholder="XXXXX-XXXXXXX-X"
              value={form.cnic}
              onChange={e => set('cnic', e.target.value)}
              required
              error={cnicError}
            />
            <Input label="Contact Number *" placeholder="03XX-XXXXXXX" value={form.contact} onChange={e => set('contact', e.target.value)} required />
            <Input type="number" label="Initial Balance (Rs)" placeholder="Positive (Arrears) / Negative (Advance)" value={form.initial_balance} onChange={e => set('initial_balance', e.target.value)} />
            <div className="span-2" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows={2} placeholder="Home address (optional)" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="span-2">
              <label className="form-label">Family Notes</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Any notes about this family (e.g. scholarship, special arrangement, reason for discount…)"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} isLoading={saving} disabled={!form.first_name.trim() || !form.last_name.trim() || !form.cnic.trim() || !form.contact.trim()}>
            {editTarget ? <Edit2 size={14} /> : <Plus size={18} />} {editTarget ? 'Save Changes' : 'Save Parent'}
          </Button>
        </div>
      </div>
    </div>
  );
};
