import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Role } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { useDebounce } from '../hooks/useDebounce';
import { isValidPhone } from '../lib/validation';
import { GraduationCap, BookOpen, Calendar, Edit2, Trash2, UserPlus, X, Plus, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input }  from './ui/Input';
import { useParents } from '../hooks/useParents';
import type { Parent } from '../hooks/useParents';
import '../components/managers.css';

const EMPTY = {
  first_name: '', last_name: '', cnic: '', contact: '', address: '', notes: '', initial_balance: '',
};
const EMPTY_STUDENT = { first_name: '', last_name: '', cnic: '', date_of_birth: '', date_of_admission: new Date().toISOString().split('T')[0], admission_class_id: '', monthly_fee: 0, discount_type: '', discount_value: 0 };

const PAGE_SIZE = 25;

export const ParentsManager = ({ schoolId, role }: { schoolId: string; role?: Role }) => {
  const isOwner = !role || role === 'owner';
  const { flash, showFlash } = useFlashMessage(4000);
  
  const {
    records, loading, classes,
    studentCounts, monthlyTotals, discountTotals,
    parentStats, load, loadClasses
  } = useParents(schoolId, showFlash);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cnicError, setCnicError] = useState('');
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<Parent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [selectedParentForChild, setSelectedParentForChild] = useState<Parent | null>(null);
  const [childForm, setChildForm] = useState({ ...EMPTY_STUDENT });
  const [savingChild, setSavingChild] = useState(false);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'cnic') setCnicError('');
  };

  const setChild = (k: string, v: string | number) => {
    const newForm = { ...childForm, [k]: v };
    if (k === 'admission_class_id') {
      const cls = classes.find(c => c.id === v);
      newForm.monthly_fee = cls ? cls.monthly_fee : 0;
      
      newForm.discount_type = '';
      newForm.discount_value = 0;
    }
    setChildForm(newForm);
  };

  const getFinalFee = () => {
    if (!childForm.discount_type || !childForm.discount_value) return childForm.monthly_fee;
    if (childForm.discount_type === 'percentage') {
      return Math.round(childForm.monthly_fee * (1 - childForm.discount_value / 100));
    }
    return Math.max(0, childForm.monthly_fee - childForm.discount_value);
  };

  const validateCnic = async (cnic: string, excludeId?: string): Promise<boolean> => {
    if (!cnic.trim()) return false;
    let query = supabase.from('parents').select('id').eq('school_id', schoolId).eq('cnic', cnic);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    return data === null;
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.contact.trim() || !form.cnic.trim()) {
      showFlash('Error: First name, last name, CNIC and contact are required');
      return;
    }
    // Validate phone format
    if (form.contact && !isValidPhone(form.contact)) {
      showFlash('Error: Contact number must be a valid Pakistani mobile number (e.g., 03XX-XXXXXXX or 03XXXXXXXXX)');
      return;
    }
    const cnicValid = await validateCnic(form.cnic);
    if (!cnicValid) {
      setCnicError('A parent with this CNIC already exists');
      return;
    }
    setSaving(true);
    const balNum = Number(form.initial_balance) || 0;
    const { data: newParent, error } = await supabase.from('parents').insert({
      school_id: schoolId,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      cnic: form.cnic.trim(),
      contact: form.contact.trim(),
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    }).select('id').single();

    if (newParent && !error && balNum !== 0) {
      await supabase.from('ledger').insert({
         school_id: schoolId,
         parent_id: newParent.id,
         entry_type: balNum > 0 ? 'debit' : 'credit',
         amount: Math.abs(balNum),
         reference_type: 'opening_balance',
         description: 'Opening Balance'
      });
    }

    setSaving(false);
    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setCnicError('A parent with this CNIC already exists');
      } else {
        showFlash('Error: ' + error.message);
      }
    } else {
      showFlash('Parent "' + form.first_name + ' ' + form.last_name + '" added!');
      setShowModal(false);
      setForm({ ...EMPTY });
      setCnicError('');
      load();
    }
  };

  const openEdit = async (parent: Parent) => {
    setEditTarget(parent);
    setForm({
      first_name: parent.first_name,
      last_name: parent.last_name,
      cnic: parent.cnic,
      contact: parent.contact,
      address: parent.address || '',
      notes: parent.notes || '',
      initial_balance: ''
    });
    setCnicError('');
    setShowEditModal(true);

    const { data } = await supabase.from('ledger').select('amount, entry_type').eq('parent_id', parent.id).eq('reference_type', 'opening_balance').maybeSingle();
    if (data) {
      setForm(prev => ({ ...prev, initial_balance: data.entry_type === 'debit' ? String(data.amount) : String(-data.amount) }));
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!form.first_name.trim() || !form.last_name.trim() || !form.contact.trim() || !form.cnic.trim()) {
      showFlash('Error: All fields are required');
      return;
    }
    const cnicValid = await validateCnic(form.cnic, editTarget.id);
    if (!cnicValid) {
      setCnicError('A parent with this CNIC already exists');
      return;
    }
    setSaving(true);
    const balNum = Number(form.initial_balance) || 0;
    const { error } = await supabase.from('parents').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      cnic: form.cnic.trim(),
      contact: form.contact.trim(),
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    }).eq('id', editTarget.id);
    
    if (!error) {
       await supabase.from('ledger').delete().eq('parent_id', editTarget.id).eq('reference_type', 'opening_balance');
       if (balNum !== 0) {
         await supabase.from('ledger').insert({
           school_id: schoolId,
           parent_id: editTarget.id,
           entry_type: balNum > 0 ? 'debit' : 'credit',
           amount: Math.abs(balNum),
           reference_type: 'opening_balance',
           description: 'Opening Balance'
         });
       }
    }
    setSaving(false);
    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        setCnicError('A parent with this CNIC already exists');
      } else {
        showFlash('Error: ' + error.message);
      }
    } else {
      showFlash('Parent "' + form.first_name + ' ' + form.last_name + '" updated!');
      setShowEditModal(false);
      setEditTarget(null);
      setForm({ ...EMPTY });
      setCnicError('');
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Soft-delete: deactivate parent and their students
      const { error } = await supabase.from('parents').update({ is_active: false }).eq('id', deleteTarget.id);
      if (error) {
        showFlash('Error deactivating parent: ' + error.message);
      } else {
        // Also deactivate all their students
        await supabase.from('students').update({ active: false }).eq('parent_id', deleteTarget.id);
        showFlash(`Parent "${deleteTarget.first_name} ${deleteTarget.last_name}" deactivated`);
        setDeleteTarget(null);
        load();
      }
    } catch (err: any) {
      showFlash('Error: ' + (err.message || 'Failed to deactivate parent'));
    } finally {
      setDeleting(false);
    }
  };

  const openAddChild = (parent: Parent) => {
    setSelectedParentForChild(parent);
    setChildForm({ ...EMPTY_STUDENT });
    loadClasses();
    setShowChildModal(true);
  };

  const handleSaveChild = async () => {
    if (!selectedParentForChild || !childForm.first_name.trim() || !childForm.last_name.trim()) {
      showFlash('Error: First name and last name are required');
      return;
    }
    setSavingChild(true);
    
    // Calculate final monthly fee for revenue integrity
    const net_monthly_fee = childForm.discount_type && childForm.discount_value
        ? (childForm.discount_type === 'percentage' 
            ? Math.round(childForm.monthly_fee * (100 - childForm.discount_value) / 100) 
            : Math.max(0, childForm.monthly_fee - childForm.discount_value))
        : childForm.monthly_fee;

    const { error } = await supabase.from('students').insert({
      school_id: schoolId,
      parent_id: selectedParentForChild.id,
      first_name: childForm.first_name.trim(),
      last_name: childForm.last_name.trim(),
      cnic: childForm.cnic.trim() || null,
      date_of_birth: childForm.date_of_birth || null,
      date_of_admission: childForm.date_of_admission || null,
      admission_class_id: childForm.admission_class_id || null,
      current_class_id: childForm.admission_class_id || null, // Ensure current_class is set
      monthly_fee: childForm.monthly_fee,
      current_monthly_fee: net_monthly_fee, // Explicitly save net fee
      discount_type: childForm.discount_type || null,
      discount_value: childForm.discount_value || null,
      active: true,
    });
    setSavingChild(false);
    if (error) {
      showFlash('Error: ' + error.message);
    } else {
      showFlash('Student "' + childForm.first_name + ' ' + childForm.last_name + '" added for ' + selectedParentForChild.first_name + '!');
      setShowChildModal(false);
      setChildForm({ ...EMPTY_STUDENT });
      setSelectedParentForChild(null);
    }
  };

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return records;
    const q = debouncedSearch.toLowerCase();
    return records.filter(r =>
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.cnic.includes(q) ||
      r.contact?.includes(q)
    );
  }, [records, debouncedSearch]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / PAGE_SIZE), [filtered]);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading...</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <Users size={24} />
          <div>
            <h3>Families & Beneficiaries</h3>
            <p>{records.length} {records.length === 1 ? 'parent' : 'parents'} registered across all classes</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search by name, CNIC or contact..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setCnicError(''); setShowModal(true); }}>
            <Plus size={18} /> Add Parent
          </Button>
        </div>
      </div>

      <div className="manager-stats-grid">
        <div className="manager-stat-card blue">
          <div className="manager-stat-icon"><Users size={20} /></div>
          <div className="manager-stat-info">
            <div className="manager-stat-label">Total Families</div>
            <div className="manager-stat-value">{parentStats.totalFamilies}</div>
            <div className="manager-stat-sub">
              {parentStats.fathers} Fathers • {parentStats.mothers} Mothers
            </div>
          </div>
        </div>

        <div className="manager-stat-card green">
          <div className="manager-stat-icon"><GraduationCap size={20} /></div>
          <div className="manager-stat-info">
            <div className="manager-stat-label">Total Children</div>
            <div className="manager-stat-value">{parentStats.totalChildren}</div>
            <div className="manager-stat-sub">Avg {parentStats.totalFamilies > 0 ? (parentStats.totalChildren / parentStats.totalFamilies).toFixed(1) : 0} per family</div>
          </div>
        </div>

        <div className="manager-stat-card amber">
          <div className="manager-stat-icon"><BookOpen size={20} /></div>
          <div className="manager-stat-info">
            <div className="manager-stat-label">Monthly Potential</div>
            <div className="manager-stat-value">Rs {parentStats.totalPotential.toLocaleString()}</div>
            <div className="manager-stat-sub">Total expected from parents</div>
          </div>
        </div>

        <div className="manager-stat-card rose">
          <div className="manager-stat-icon"><Search size={20} /></div>
          <div className="manager-stat-info">
            <div className="manager-stat-label">Financial Aid</div>
            <div className="manager-stat-value">Rs {parentStats.totalScholarships.toLocaleString()}</div>
            <div className="manager-stat-sub">Total scholarship/discounts</div>
          </div>
        </div>
      </div>

      {flash && <div className={"flash " + (flash.startsWith('Error') ? 'error' : 'success')}>{flash}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={52} />
          <p>{records.length === 0 ? 'No parents added yet' : 'No results found'}</p>
          <small>{records.length === 0 ? 'Click "Add Parent" to register the first parent' : ''}</small>
          {records.length === 0 && <Button onClick={() => { setForm({ ...EMPTY }); setCnicError(''); setShowModal(true); }}><Plus size={18} /> Add First Parent</Button>}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Parent Name</th>
                  <th>CNIC</th>
                  <th>Contact</th>
                  <th>Children</th>
                  <th>Monthly Payment</th>
                  <th>Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <div className="student-cell">
                        <span style={{ fontWeight:600 }}>{r.first_name} {r.last_name}</span>
                        {r.relation && (
                          <span className={`rec-badge ${r.relation.toLowerCase()}`}>
                            {r.relation}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{r.cnic}</td>
                    <td>{r.contact}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: (studentCounts[r.id] || 0) > 0 ? 'var(--primary-light)' : 'var(--bg-alt)',
                        color: (studentCounts[r.id] || 0) > 0 ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}>
                        <GraduationCap size={14} />
                        {studentCounts[r.id] || 0}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      Rs {(monthlyTotals[r.id] || 0).toLocaleString()}
                    </td>
                    <td style={{ color: (discountTotals[r.id] || 0) > 0 ? 'var(--success)' : 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                      {(discountTotals[r.id] || 0) > 0 ? `-Rs ${Math.round(discountTotals[r.id] || 0).toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn add-child" title="Add Child" onClick={() => openAddChild(r)}>
                          <UserPlus size={14} />
                        </button>
                        {isOwner && (
                          <button className="action-btn edit" title="Edit" onClick={() => openEdit(r)}>
                            <Edit2 size={14} />
                          </button>
                        )}
                        {isOwner && (
                          <button className="action-btn delete" title="Delete" onClick={() => setDeleteTarget(r)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {(page-1)*PAGE_SIZE + 1}-{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                  <button key={p} className={"page-btn" + (p === page ? ' active' : '')} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Add Parent</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
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
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving} disabled={!form.first_name.trim() || !form.last_name.trim() || !form.cnic.trim() || !form.contact.trim()}>
                <Plus size={18} /> Save Parent
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Edit Parent</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
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
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleEdit} isLoading={saving} disabled={!form.first_name.trim() || !form.last_name.trim() || !form.cnic.trim() || !form.contact.trim()}>
                <Edit2 size={14} /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="confirm-box">
            <Trash2 size={40} color="var(--danger)" />
            <h3>Remove Parent?</h3>
            <p>This will remove <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> from your records.</p>
            <div className="confirm-box-btns">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleting}>Remove</Button>
            </div>
          </div>
        </div>
      )}

      {showChildModal && selectedParentForChild && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowChildModal(false)}>
          <div className="modal-box" style={{maxWidth: '550px'}}>
            <div className="modal-head">
              <h3><GraduationCap size={20} /> Add Child for {selectedParentForChild.first_name}</h3>
              <button className="modal-close" onClick={() => setShowChildModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-section-label">Student Information *</div>
              <div className="form-grid">
                <Input label="First Name *" placeholder="Enter first name" value={childForm.first_name} onChange={e => setChild('first_name', e.target.value)} required />
                <Input label="Last Name *" placeholder="Enter last name" value={childForm.last_name} onChange={e => setChild('last_name', e.target.value)} required />
                <Input label="CNIC" placeholder="XXXXX-XXXXXXX-X" value={childForm.cnic} onChange={e => setChild('cnic', e.target.value)} />
                <div>
                  <label className="form-label"><Calendar size={14} style={{marginRight: 4}}/> Date of Birth</label>
                  <input type="date" className="form-input" value={childForm.date_of_birth} onChange={e => setChild('date_of_birth', e.target.value)} />
                </div>
              </div>
              <div className="form-section-label">Enrollment Details *</div>
              <div className="form-grid">
                <div>
                  <label className="form-label"><BookOpen size={14} style={{marginRight: 4}}/> Class *</label>
                  <select className="form-select" value={childForm.admission_class_id} onChange={e => setChild('admission_class_id', e.target.value)} required>
                    <option value="">Select class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Rs {c.monthly_fee.toLocaleString()}/mo)</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label"><Calendar size={14} style={{marginRight: 4}}/> Admission Date</label>
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
              <Button variant="secondary" onClick={() => setShowChildModal(false)}>Cancel</Button>
              <Button onClick={handleSaveChild} isLoading={savingChild} disabled={!childForm.first_name.trim() || !childForm.last_name.trim()}>
                <Plus size={18} /> Save Student
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
