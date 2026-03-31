import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Users, Search, Trash2, UserPlus, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
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

const EMPTY = {
  first_name: '', last_name: '', cnic: '', contact: '', address: '',
};

const PAGE_SIZE = 25;

export const ParentsManager = ({ schoolId, onAddChild }: { schoolId: string; onAddChild?: (parentId: string) => void }) => {
  const [records, setRecords]       = useState<Parent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ ...EMPTY });
  const [saving, setSaving]         = useState(false);
  const [flash, setFlash]           = useState('');
  const [search, setSearch]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [cnicError, setCnicError]   = useState('');
  const [page, setPage]             = useState(1);
  const [editTarget, setEditTarget] = useState<Parent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('parents').select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [schoolId]);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'cnic') setCnicError('');
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
      setFlash('Error: First name, last name, CNIC and contact are required');
      setTimeout(() => setFlash(''), 4000);
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
        setFlash('Error: ' + error.message);
        setTimeout(() => setFlash(''), 4000);
      }
    } else {
      setFlash('Parent "' + form.first_name + ' ' + form.last_name + '" added!');
      setShowModal(false);
      setForm({ ...EMPTY });
      setCnicError('');
      load();
      setTimeout(() => setFlash(''), 4000);
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
      setFlash('Error: All fields are required');
      setTimeout(() => setFlash(''), 4000);
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
        setFlash('Error: ' + error.message);
        setTimeout(() => setFlash(''), 4000);
      }
    } else {
      setFlash('Parent "' + form.first_name + ' ' + form.last_name + '" updated!');
      setShowEditModal(false);
      setEditTarget(null);
      setForm({ ...EMPTY });
      setCnicError('');
      load();
      setTimeout(() => setFlash(''), 4000);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('parents').delete().eq('id', deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
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
            <h3>Parents</h3>
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
                  <th>Address</th>
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
                    <td style={{ color:'var(--text-muted)', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.address || '-'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="action-btn add-child" title="Add Child" onClick={() => onAddChild && onAddChild(r.id)}>
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
                <div>
                  <label className="form-label">CNIC *</label>
                  <input
                    className={"form-input " + (cnicError ? 'error' : '')}
                    placeholder="XXXXX-XXXXXXX-X"
                    value={form.cnic}
                    onChange={e => set('cnic', e.target.value)}
                    required
                  />
                  {cnicError && <div style={{color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem'}}>{cnicError}</div>}
                </div>
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
                <div>
                  <label className="form-label">CNIC *</label>
                  <input
                    className={"form-input " + (cnicError ? 'error' : '')}
                    placeholder="XXXXX-XXXXXXX-X"
                    value={form.cnic}
                    onChange={e => set('cnic', e.target.value)}
                    required
                  />
                  {cnicError && <div style={{color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem'}}>{cnicError}</div>}
                </div>
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
    </div>
  );
};
