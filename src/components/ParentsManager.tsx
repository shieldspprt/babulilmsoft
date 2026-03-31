import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Users, Phone, Mail, MapPin, Search, Trash2, Briefcase, UserCheck, Heart, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Input }  from './ui/Input';
import '../components/managers.css';

type Parent = {
  id: string; school_id: string; name: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  gender: string; cnic: string; contact: string;
  whatsapp: string; email: string; address: string;
  occupation: string; notes: string;
};

const EMPTY = {
  name: '', relation: 'Father' as 'Father'|'Mother'|'Guardian',
  gender: 'Male', cnic: '', contact: '', whatsapp: '',
  email: '', address: '', occupation: '', notes: '',
};

const RELATIONS: { value: Parent['relation']; icon: typeof User; label: string }[] = [
  { value: 'Father',   icon: User,      label: 'Father'   },
  { value: 'Mother',   icon: Heart,     label: 'Mother'   },
  { value: 'Guardian', icon: UserCheck, label: 'Guardian' },
];

export const ParentsManager = ({ schoolId }: { schoolId: string }) => {
  const [records, setRecords]       = useState<Parent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ ...EMPTY });
  const [saving, setSaving]         = useState(false);
  const [flash, setFlash]           = useState('');
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<'All'|'Father'|'Mother'|'Guardian'>('All');
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { load(); }, [schoolId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('parents').select('*')
      .eq('school_id', schoolId).eq('is_active', true).order('relation').order('name');
    setRecords(data || []);
    setLoading(false);
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.contact.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('parents').insert({ school_id: schoolId, is_active: true, ...form });
    setSaving(false);
    if (error) { setFlash('Error: ' + error.message); }
    else       { setFlash(`${form.relation} "${form.name}" added!`); setShowModal(false); setForm({ ...EMPTY }); load(); }
    setTimeout(() => setFlash(''), 4000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('parents').update({ is_active: false }).eq('id', deleteTarget.id);
    setDeleting(false); setDeleteTarget(null); load();
  };

  const filtered = useMemo(() => {
    let list = filter === 'All' ? records : records.filter(r => r.relation === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.contact?.includes(q) || r.email?.toLowerCase().includes(q));
    }
    return list;
  }, [records, filter, search]);

  const counts = {
    Father: records.filter(r => r.relation === 'Father').length,
    Mother: records.filter(r => r.relation === 'Mother').length,
    Guardian: records.filter(r => r.relation === 'Guardian').length,
  };

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading…</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <Users size={24} />
          <div>
            <h3>Parents &amp; Guardians</h3>
            <p>{counts.Father} Fathers · {counts.Mother} Mothers · {counts.Guardian} Guardians</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setShowModal(true); }}>
            <Plus size={18} /> Add Parent
          </Button>
        </div>
      </div>

      {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}

      {/* Filter tabs */}
      <div className="type-pills">
        {(['All','Father','Mother','Guardian'] as const).map(f => (
          <button key={f} type="button" className={`type-pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' ? ` (${counts[f]})` : ` (${records.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={52} />
          <p>{records.length === 0 ? 'No parents added yet' : 'No results found'}</p>
          <small>{records.length === 0 ? 'Click "Add Parent" to register the first parent or guardian' : ''}</small>
          {records.length === 0 && <Button onClick={() => setShowModal(true)}><Plus size={18} /> Add First Parent</Button>}
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(r => (
            <div key={r.id} className="record-card">
              <div className="record-avatar">{r.name.charAt(0).toUpperCase()}</div>
              <div className="record-info">
                <div className="record-name-row">
                  <h4>{r.name}</h4>
                  <span className={`rec-badge ${r.relation.toLowerCase()}`}>{r.relation}</span>
                </div>
                <div className="record-meta">
                  <span><Phone size={12} /> {r.contact}</span>
                  {r.email      && <span><Mail size={12} /> {r.email}</span>}
                  {r.occupation && <span><Briefcase size={12} /> {r.occupation}</span>}
                  {r.address    && <span><MapPin size={12} /> {r.address}</span>}
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
              <h3>Add Parent / Guardian</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Relation */}
              <div>
                <div className="form-section-label">Relation *</div>
                <div className="type-pills" style={{ marginTop:'0.625rem' }}>
                  {RELATIONS.map(({ value, icon: Icon, label }) => (
                    <button key={value} type="button"
                      className={`type-pill${form.relation === value ? ' active' : ''}`}
                      onClick={() => set('relation', value)}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section-label">Basic Information</div>
              <div className="form-grid">
                <div className="span-2">
                  <Input label="Full Name *" placeholder="Enter full name" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <Input label="Contact Number *" placeholder="03XX-XXXXXXX" value={form.contact} onChange={e => set('contact', e.target.value)} required />
                <Input label="WhatsApp" placeholder="03XX-XXXXXXX" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
              </div>

              <div className="form-section-label">Additional Details (Optional)</div>
              <div className="form-grid">
                <Input label="Email" type="email" placeholder="parent@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                <Input label="Occupation" placeholder="e.g. Engineer, Business" value={form.occupation} onChange={e => set('occupation', e.target.value)} />
                <Input label="CNIC" placeholder="XXXXX-XXXXXXX-X" value={form.cnic} onChange={e => set('cnic', e.target.value)} />
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div className="span-2">
                  <label className="form-label">Address</label>
                  <textarea className="form-textarea" rows={2} placeholder="Home address" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div className="span-2">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} placeholder="Any additional notes…" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving} disabled={!form.name.trim() || !form.contact.trim()}>
                <Plus size={18} /> Save {form.relation}
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
            <p>This will remove <strong>{deleteTarget.name}</strong> from your records.</p>
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
