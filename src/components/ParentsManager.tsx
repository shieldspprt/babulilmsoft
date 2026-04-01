import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { Plus, X, Users, Search, Trash2, UserPlus, ChevronLeft, ChevronRight, Edit2, GraduationCap, BookOpen, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { Input }  from './ui/Input';
import '../components/managers.css';

type Parent = {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  cnic: string;
  contact: string;
  address: string | null;
  created_at: string;
  updated_at: string;
};

type Class = { id: string; name: string; monthly_fee: number; };

const EMPTY = {
  first_name: '', last_name: '', cnic: '', contact: '', address: '',
};
const EMPTY_STUDENT = { first_name: '', last_name: '', cnic: '', date_of_birth: '', date_of_admission: new Date().toISOString().split('T')[0], admission_class_id: '', monthly_fee: 0, discount_type: '', discount_value: 0 };

const PAGE_SIZE = 25;

export const ParentsManager = ({ schoolId }: { schoolId: string }) => {
  const [records, setRecords]       = useState<Parent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ ...EMPTY });
  const [saving, setSaving]         = useState(false);
  const { flash, showFlash }         = useFlashMessage(4000);
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [cnicError, setCnicError]   = useState('');
  const [page, setPage]             = useState(1);
  const [editTarget, setEditTarget] = useState<Parent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [selectedParentForChild, setSelectedParentForChild] = useState<Parent | null>(null);
  const [childForm, setChildForm] = useState({ ...EMPTY_STUDENT });
  const [classes, setClasses] = useState<Class[]>([]);
  const [savingChild, setSavingChild] = useState(false);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, number>>({});
  const [discountTotals, setDiscountTotals] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: parents }, { data: students }] = await Promise.all([
      supabase.from('parents').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
      supabase.from('students').select('id, parent_id, monthly_fee, discount_type, discount_value').eq('school_id', schoolId)
    ]);
    setRecords(parents || []);
    
        // Count students, total monthly fee, and total discount per parent
    const counts: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};
    const discountTotals: Record<string, number> = {};
    students?.forEach(s => {
      counts[s.parent_id] = (counts[s.parent_id] || 0) + 1;
      const fee = s.monthly_fee || 0;
      let disc = 0;
      if (s.discount_type === 'percentage' && s.discount_value) {
        disc = (fee * s.discount_value) / 100;
      } else if (s.discount_type === 'amount' && s.discount_value) {
        disc = s.discount_value;
      }
      monthlyTotals[s.parent_id] = (monthlyTotals[s.parent_id] || 0) + fee;
      discountTotals[s.parent_id] = (discountTotals[s.parent_id] || 0) + disc;
    });
    setStudentCounts(counts);
    setMonthlyTotals(monthlyTotals);
    setDiscountTotals(discountTotals);
    setLoading(false);
  };

  const loadClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name, monthly_fee').eq('school_id', schoolId).eq('active', true).order('name');
    setClasses(data || []);
  };
  useEffect(() => { load(); }, [schoolId]);

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
    const cnicValid = await validateCnic(form.cnic);
    if (!cnicValid) {
      setCnicError('A parent with this CNIC already exists');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('parents').insert({
      school_id: schoolId,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      cnic: form.cnic.trim(),
      contact: form.contact.trim(),
      address: form.address.trim() || null,
    });
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

  const openEdit = (parent: Parent) => {
    setEditTarget(parent);
    setForm({
      first_name: parent.first_name,
      last_name: parent.last_name,
      cnic: parent.cnic,
      contact: parent.contact,
      address: parent.address || '',
    });
    setCnicError('');
    setShowEditModal(true);
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
    const { error } = await supabase.from('parents').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      cnic: form.cnic.trim(),
      contact: form.contact.trim(),
      address: form.address.trim() || null,
    }).eq('id', editTarget.id);
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
    await supabase.from('parents').delete().eq('id', deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
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
    const { error } = await supabase.from('students').insert({
      school_id: schoolId,
      parent_id: selectedParentForChild.id,
      first_name: childForm.first_name.trim(),
      last_name: childForm.last_name.trim(),
      cnic: childForm.cnic.trim() || null,
      date_of_birth: childForm.date_of_birth || null,
      date_of_admission: childForm.date_of_admission || null,
      admission_class_id: childForm.admission_class_id || null,
      monthly_fee: getFinalFee(),
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
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.cnic.includes(q) ||
      r.contact?.includes(q)
    );
  }, [records, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search]);

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading...</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <Users size={24} />
          <div>
            <h3></h3>
            <p>{records.length} parent{records.length !== 1 ? 's' : ''} registered</p>
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
                {paginated.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div className="record-avatar" style={{width:'36px',height:'36px',fontSize:'0.7rem',flexShrink:0}}>
                          {r.first_name.charAt(0).toUpperCase()}{r.last_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600 }}>{r.first_name} {r.last_name}</span>
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
                      Rs {((monthlyTotals[r.id] || 0) - (discountTotals[r.id] || 0)).toLocaleString()}
                    </td>
                    <td style={{ color: (discountTotals[r.id] || 0) > 0 ? 'var(--success)' : 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                      {(discountTotals[r.id] || 0) > 0 ? `-Rs ${Math.round(discountTotals[r.id]!).toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn add-child" title="Add Child" onClick={() => openAddChild(r)}>
                          <UserPlus size={14} />
                        </button>
                        <button className="action-btn edit" title="Edit" onClick={() => openEdit(r)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="action-btn delete" title="Delete" onClick={() => setDeleteTarget(r)}>
                          <Trash2 size={14} />
                        </button>
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
                <div className="span-2">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" rows={2} placeholder="Home address (optional)" value={form.address} onChange={e => set('address', e.target.value)} />
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
                <div className="span-2">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" rows={2} placeholder="Home address (optional)" value={form.address} onChange={e => set('address', e.target.value)} />
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
                  <div className="fee-display{childForm.discount_value ? ' discounted' : ''}">
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
