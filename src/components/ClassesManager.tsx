import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, BookOpen, Search, Edit2, Trash2, Users } from 'lucide-react';
import { Button } from './ui/Button';
import { Input }  from './ui/Input';
import '../components/managers.css';

type Class = {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
  monthly_fee: number;
  admission_fee: number;
  active: boolean;
  created_at: string;
};

export const ClassesManager = ({ schoolId }: { schoolId: string }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState('');
  const [search, setSearch] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFee, setNewFee] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editName, setEditName] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editStudents, setEditStudents] = useState('');
  const [editActive, setEditActive] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('classes').select('*')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true })
      .order('name');
    setClasses(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleAdd = async () => {
    if (!newName.trim() || !newFee.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('classes').insert({
      school_id: schoolId,
      name: newName.trim(),
      monthly_fee: parseInt(newFee) || 0,
      admission_fee: 0,
      display_order: classes.length + 1,
      active: true
    });
    setSaving(false);
    if (error) {
      setFlash('Error: ' + error.message);
    } else {
      setFlash('Class added!');
      setNewName('');
      setNewFee('');
      setShowAddModal(false);
      load();
    }
    setTimeout(() => setFlash(''), 3000);
  };

  const handleEdit = async () => {
    if (!editingClass || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('classes').update({
      name: editName.trim(),
      monthly_fee: parseInt(editFee) || 0,
      admission_fee: parseInt(editStudents) || 0,
      active: editActive
    }).eq('id', editingClass.id);
    setSaving(false);
    if (error) {
      setFlash('Error: ' + error.message);
    } else {
      setFlash('Class updated!');
      setEditingClass(null);
      load();
    }
    setTimeout(() => setFlash(''), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
      setFlash('Error: ' + error.message);
    } else {
      setFlash('Class deleted!');
      load();
    }
    setTimeout(() => setFlash(''), 3000);
  };

  const openEdit = (c: Class) => {
    setEditingClass(c);
    setEditName(c.name);
    setEditFee(c.monthly_fee.toString());
    setEditStudents(c.admission_fee.toString());
    setEditActive(c.active);
  };

  const filtered = search.trim()
    ? classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : classes;

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading…</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <BookOpen size={24} />
          <div>
            <h3>Classes</h3>
            <p>{classes.length} class{classes.length !== 1 ? 'es' : ''} registered</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setNewName(''); setNewFee(''); setShowAddModal(true); }}>
            <Plus size={18} /> Add Class
          </Button>
        </div>
      </div>

      {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={52} />
          <p>{classes.length === 0 ? 'No classes yet' : 'No results found'}</p>
          <small>{classes.length === 0 ? 'Add your first class using the button above' : ''}</small>
          {classes.length === 0 && <Button onClick={() => setShowAddModal(true)}><Plus size={18} /> Add First Class</Button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Monthly Fee</th>
                <th># of Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>Rs {c.monthly_fee.toLocaleString()}</td>
                  <td><Users size={14} style={{marginRight:4}}/>{c.admission_fee || 0}</td>
                  <td>
                    <span className={`status-badge ${c.active ? 'active' : 'inactive'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn edit" title="Edit" onClick={() => openEdit(c)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="action-btn delete" title="Delete" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Add New Class</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="span-2">
                  <Input label="Class Name *" placeholder="e.g. Class 5, Grade 8" value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div className="span-2">
                  <Input label="Monthly Fee (Rs) *" placeholder="e.g. 1500" inputMode="numeric" pattern="[0-9]*" value={newFee} onChange={e => setNewFee(e.target.value)} required />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAdd} isLoading={saving} disabled={!newName.trim() || !newFee.trim()}>
                <Plus size={18} /> Add Class
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingClass && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEditingClass(null)}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Edit Class</h3>
              <button className="modal-close" onClick={() => setEditingClass(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="span-2">
                  <Input label="Class Name *" value={editName} onChange={e => setEditName(e.target.value)} required />
                </div>
                <div>
                  <Input label="Monthly Fee (Rs) *" inputMode="numeric" pattern="[0-9]*" value={editFee} onChange={e => setEditFee(e.target.value)} required />
                </div>
                <div>
                  <Input label="# of Students" inputMode="numeric" pattern="[0-9]*" value={editStudents} onChange={e => setEditStudents(e.target.value)} />
                </div>
                <div className="span-2">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editActive ? 'true' : 'false'} onChange={e => setEditActive(e.target.value === 'true')}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <Button variant="secondary" onClick={() => setEditingClass(null)}>Cancel</Button>
              <Button onClick={handleEdit} isLoading={saving} disabled={!editName.trim() || !editFee.trim()}>
                <Edit2 size={14} /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
