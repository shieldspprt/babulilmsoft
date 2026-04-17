import React from 'react';
import { X, Plus, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ChildModalProps {
  parent: any;
  childForm: any;
  setChild: (k: string, v: string | number) => void;
  classes: any[];
  savingChild: boolean;
  onClose: () => void;
  onSave: () => void;
  getFinalFee: () => number;
}

export const ChildModal: React.FC<ChildModalProps> = ({
  parent,
  childForm,
  setChild,
  classes,
  savingChild,
  onClose,
  onSave,
  getFinalFee
}) => {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '550px' }}>
        <div className="modal-head">
          <h3><GraduationCap size={20} /> Add Child for {parent.first_name}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-section-label">Student Information *</div>
          <div className="form-grid">
            <Input label="First Name *" placeholder="Enter first name" value={childForm.first_name} onChange={e => setChild('first_name', e.target.value)} required />
            <Input label="Last Name *" placeholder="Enter last name" value={childForm.last_name} onChange={e => setChild('last_name', e.target.value)} required />
            <Input label="CNIC" placeholder="XXXXX-XXXXXXX-X" value={childForm.cnic} onChange={e => setChild('cnic', e.target.value)} />
            <div>
              <label className="form-label"><Calendar size={14} style={{ marginRight: 4 }} /> Date of Birth</label>
              <input type="date" className="form-input" value={childForm.date_of_birth} onChange={e => setChild('date_of_birth', e.target.value)} />
            </div>
          </div>
          <div className="form-section-label">Enrollment Details *</div>
          <div className="form-grid">
            <div>
              <label className="form-label"><BookOpen size={14} style={{ marginRight: 4 }} /> Class *</label>
              <select className="form-select" value={childForm.admission_class_id} onChange={e => setChild('admission_class_id', e.target.value)} required>
                <option value="">Select class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Rs {c.monthly_fee.toLocaleString()}/mo)</option>)}
              </select>
            </div>
            <div>
              <label className="form-label"><Calendar size={14} style={{ marginRight: 4 }} /> Admission Date</label>
              <input type="date" className="form-input" value={childForm.date_of_admission} onChange={e => setChild('date_of_admission', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Discount Type</label>
              <select className="form-select" value={childForm.discount_type} onChange={e => setChild('discount_type', e.target.value)}>
                <option value="">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Fixed Amount (Rs)</option>
              </select>
            </div>
            {childForm.discount_type && (
              <div>
                <label className="form-label">{childForm.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount (Rs)'}</label>
                <Input
                  type="number"
                  value={childForm.discount_value || ''}
                  onChange={e => setChild('discount_value', parseFloat(e.target.value) || 0)}
                  placeholder={childForm.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                />
              </div>
            )}
            <div>
              <label className="form-label">Final Monthly Fee (Rs)</label>
              <div className={`fee-display${childForm.discount_value ? ' discounted' : ''}`}>
                Rs {getFinalFee().toLocaleString()}
                {childForm.discount_value > 0 && <span className="fee-original">(was Rs {childForm.monthly_fee.toLocaleString()})</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} isLoading={savingChild} disabled={!childForm.first_name.trim() || !childForm.last_name.trim()}>
            <Plus size={18} /> Save Student
          </Button>
        </div>
      </div>
    </div>
  );
};
