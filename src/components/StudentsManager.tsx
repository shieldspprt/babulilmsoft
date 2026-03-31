import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Search, Trash2, Edit2, ChevronLeft, ChevronRight, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import '../components/managers.css';

type Student = {
  id: string;
  school_id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  cnic: string | null;
  date_of_birth: string | null;
  date_of_admission: string | null;
  admission_class_id: string | null;
  discount_type: string | null;
  discount_value: number | null;
  monthly_fee: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type Class = {
  id: string;
  name: string;
  monthly_fee: number;
  active: boolean;
};

type Parent = {
  id: string;
  first_name: string;
  last_name: string;
};

const EMPTY_FORM = {
  parent_id: '', first_name: '', last_name: '', cnic: '',
  date_of_birth: '', date_of_admission: new Date().toISOString().split('T')[0],
  admission_class_id: '', monthly_fee: 0,
};

const PAGE_SIZE = 25;

export const StudentsManager = ({ schoolId }: { schoolId: string }) => {
  const [students, setStudents]       = useState<Student[]>([]);
  const [classes, setClasses]         = useState<Class[]>([]);
  const [parents, setParents]         = useState<Parent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [saving, setSaving]           = useState(false);
  const [flash, setFlash]             = useState('');
  const [search, setSearch]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [page, setPage]               = useState(1);

  const load = async () => {
    setLoading(true);
    const [studentsRes, classesRes, parentsRes] = await Promise.all([
      supabase.from('students').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
      supabase.from('classes').select('id, name, monthly_fee, active').eq('school_id', schoolId).eq('active', true).order('name'),
      supabase.from('parents').select('id, first_name, last_name').eq('school_id', schoolId).order('first_name'),
    ]);
    setStudents(studentsRes.data || []);
    setClasses(classesRes.data || []);
    setParents(parentsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [schoolId]);

  const set = (k: string, v: string) => {
    const newForm = { ...form, [k]: v };
    // Auto-fill monthly fee when class changes
    if (k === 'admission_class_id') {
      const cls = classes.find(c => c.id === v);
      newForm.monthly_fee = cls ? cls.monthly_fee : 0;
    }
    setForm(newForm);
  };

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditStudent(null); setShowModal(true); };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      parent_id: s.parent_id,
      first_name: s.first_name,
      last_name: s.last_name,
      cnic: s.cnic || '',
      date_of_birth: s.date_of_birth || '',
      date_of_admission: s.date_of_admission || new Date().toISOString().split('T')[0],
      admission_class_id: s.admission_class_id || '',
      monthly_fee: s.monthly_fee,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.parent_id || !form.first_name.trim() || !form.last_name.trim()) {
      setFlash('Error: Parent, first name and last name are required');
      setTimeout(() => setFlash(''), 4000);
      return;
    }
    setSaving(true);
    const payload = {
      school_id: schoolId,
      parent_id: form.parent_id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      cnic: form.cnic.trim() || null,
      date_of_birth: form.date_of_birth || null,
      date_of_admission: form.date_of_admission || null,
      admission_class_id: form.admission_class_id || null,
      monthly_fee: form.monthly_fee || 0,
      active: true,
    };
    let error;
    if (editStudent) {
      const { error: err } = await supabase.from('students').update(payload).eq('id', editStudent.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('students').insert(payload);
      error = err;
    }
    setSaving(false);
    if (error) {
      setFlash('Error: ' + error.message);
      setTimeout(() => setFlash(''), 4000);
    } else {
      setFlash(`Student "${form.first_name} ${form.last_name}" ${editStudent ? 'updated' : 'added'}!`);
      setShowModal(false); setForm({ ...EMPTY_FORM }); setEditStudent(null); load();
      setTimeout(() => setFlash(''), 4000);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('students').delete().eq('id', deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const getParentName = (parentId: string) => {
    const p = parents.find(x => x.id === parentId);
    return p ? `${p.first_name} ${p.last_name}` : '—';
  };

  const getClassName = (classId: string | null) => {
    if (!classId) return '—';
    const c = classes.find(x => x.id === classId);
    return c ? c.name : '—';
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      (s.cnic && s.cnic.includes(q)) ||
      getParentName(s.parent_id).toLowerCase().includes(q) ||
      getClassName(s.admission_class_id).toLowerCase().includes(q)
    );
  }, [students, search, parents, classes]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search]);

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading…</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <GraduationCap size={24} />
          <div>
            <h3>Students</h3>
            <p>{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search by name, CNIC, parent or class…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={52} />
          <p>{students.length === 0 ? 'No students enrolled yet' : 'No results found'}</p>
          <small>{students.length === 0 ? 'Click "Add Student" to enroll the first student' : ''}</small>
          {students.length === 0 && <Button onClick={openAdd}><Plus size={18} /> Add First Student</Button>}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>CNIC</th>
                  <th>Date of Birth</th>
                  <th>Parent</th>
                  <th>Class</th>
                  <th>Monthly Fee</th>
                  <th>Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id} className={!s.active ? 'inactive' : ''}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div className="record-avatar" style={{width:'36px',height:'36px',fontSize:'0.7rem',flexShrink:0}}>
                          {s.first_name.charAt(0).toUpperCase()}{s.last_name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight:600 }}>{s.first_name} {s.last_name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{s.cnic || '—'}</td>
                    <td>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                    <td>{getParentName(s.parent_id)}</td>
                    <td>
                      <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                        <BookOpen size={12} style={{color:'var(--primary)'}} />
                        {getClassName(s.admission_class_id)}
                      </span>
                    </td>
                    <td>
                      {s.discount_type && s.discount_value !== null
                        ? <span>Rs {(s.discount_type === 'percentage' 
                            ? Math.round(s.monthly_fee * (100 - (s.discount_value ?? 0)) / 100) 
                            : s.monthly_fee - (s.discount_value ?? 0)).toLocaleString()}</span>
                        : <span>Rs {s.monthly_fee.toLocaleString()}</span>
                      }
                    </td>
                    <td>
                      {s.discount_type === 'percentage' && s.discount_value !== null && <span style={{color:'var(--success)', fontWeight:600}}>{s.discount_value}%</span>}
                      {s.discount_type === 'amount' && s.discount_value !== null && <span style={{color:'var(--success)', fontWeight:600}}>Rs {(s.discount_value ?? 0).toLocaleString()}</span>}
                      {!s.discount_type && <span style={{color:'var(--text-muted)'}}>—</span>}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn edit" title="Edit" onClick={() => openEdit(s)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="action-btn delete" title="Delete" onClick={() => setDeleteTarget(s)}>
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
                Showing {(page-1)*PAGE_SIZE + 1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}><ChevronLeft size={16} /></button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                  <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>{editStudent ? 'Edit Student' : 'Add Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-section-label">Student Information *</div>
              <div className="form-grid">
                <Input label="First Name *" placeholder="Enter first name" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
                <Input label="Last Name *" placeholder="Enter last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
                <Input label="CNIC" placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={e => set('cnic', e.target.value)} />
                <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>

              <div className="form-section-label">Enrollment Details *</div>
              <div className="form-grid">
                <div className="span-2">
                  <label className="form-label">Parent</label>
                  <div style={{padding:'0.625rem 0.875rem', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-md)', fontWeight:600, color:'var(--text)'}}>
                    {getParentName(form.parent_id)}
                  </div>
                </div>
                <div>
                  <label className="form-label">Admission Date</label>
                  <input type="date" className="form-input" value={form.date_of_admission} onChange={e => set('date_of_admission', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Class</label>
                  <select className="form-select" value={form.admission_class_id} onChange={e => set('admission_class_id', e.target.value)}>
                    <option value="">Select class…</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Rs {c.monthly_fee.toLocaleString()}/month)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Monthly Fee (Rs)</label>
                  <input type="number" className="form-input" value={form.monthly_fee} onChange={e => set('monthly_fee', e.target.value)} min="0" step="1" />
                  <small style={{color:'var(--text-muted)', fontSize:'0.7rem'}}>Auto-filled from class. Edit manually if needed.</small>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving} disabled={!form.parent_id || !form.first_name.trim() || !form.last_name.trim()}>
                <Plus size={18} /> {editStudent ? 'Save Changes' : 'Add Student'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="confirm-box">
            <Trash2 size={40} color="var(--danger)" />
            <h3>Remove Student?</h3>
            <p>This will permanently remove <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> from enrollment records.</p>
            <div className="confirm-box-btns">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleting}>Remove</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
