import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Users, Phone, MapPin, Search, Trash2 } from 'lucide-react';
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY = {
  first_name: '', last_name: '', cnic: '', contact: '', address: '',
};

export const ParentsManager = ({ schoolId }: { schoolId: string }) => {
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

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('parents').select('*')
      .eq('school_id', schoolId).eq('is_active', true).order('created_at', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [schoolId]);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'cnic') setCnicError('');
  };

  const validateCnic = async (cnic: string): Promise<boolean> => {
    if (!cnic.trim()) return false;
    const { data } = await supabase.from('parents')
      .select('id')
      .eq('school_id', schoolId)
      .eq('cnic', cnic)
      .eq('is_active', true)
      .maybeSingle();
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
      is_active: true,
    });
    setSaving(false);
    if (error) {
      if (error.message.includes('unique')) {
        setCnicError('A parent with this CNIC already exists');
      } else {
        setFlash('Error: ' + error.message);
        setTimeout(() => setFlash(''), 4000);
      }
    } else {
      setFlash(`Parent "${form.first_name} ${form.last_name}" added!`);
      setShowModal(false);
      setForm({ ...EMPTY });
      setCnicError('');
      load();
      setTimeout(() => setFlash(''), 4000);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('parents').update({ is_active: false }).eq('id', deleteTarget.id);
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

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading…</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <Users size={24} />
          <div>
            <h3>Parents</h3>
            <p>{records.length} parent(s) registered</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setCnicError(''); setShowModal(true); }}>
            <Plus size={18} /> Add Parent
          </Button>
        </div>
      </div>

      {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={52} />
          <p>{records.length === 0 ? 'No parents added yet' : 'No results found'}</p>
          <small>{records.length === 0 ? 'Click "Add Parent" to register the first parent' : ''}</small>
          {records.length === 0 && <Button onClick={() => { setForm({ ...EMPTY }); setCnicError(''); setShowModal(true); }}><Plus size={18} /> Add First Parent</Button>}
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(r => (
            <div key={r.id} className="record-card">
              <div className="record-avatar" style={{fontSize:'0.75rem'}}>{r.first_name.charAt(0).toUpperCase()}{r.last_name.charAt(0).toUpperCase()}</div>
              <div className="record-info">
                <div className="record-name-row">
                  <h4>{r.first_name} {r.last_name}</h4>
                </div>
                <div className="record-meta">
                  <span><Phone size={12} /> {r.contact}</span>
                  {r.cnic && <span title="CNIC">🆔 {r.cnic}</span>}
                  {r.address && <span><MapPin size={12} /> {r.address}</span>}
                </div>
              </div>
              <button className="record-delete" title="Remove" onClick={() => setDeleteTarget(r)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
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
                    className={`form-input ${cnicError ? 'error' : ''}`}
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

      {/* Delete confirm */}
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
