import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Save, X, Users } from 'lucide-react';
import { Input } from './ui/Input';
import './TeachersManager.css';

export type Teacher = {
  id: string;
  school_id: string;
  name: string;
  cnic: string;
  gender: 'Male' | 'Female';
  personal_contact: string;
  home_contact: string;
  address: string;
  education: string;
  salary: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  type: 'Teacher' | 'Staff';
};

export const TeachersManager = ({ schoolId }: { schoolId: string }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    gender: 'Male' as 'Male' | 'Female',
    personal_contact: '',
    home_contact: '',
    address: '',
    education: '',
    salary: '',
    notes: '',
    type: 'Teacher' as 'Teacher' | 'Staff'
  });

  useEffect(() => { loadTeachers(); }, [schoolId]);

  const loadTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error && data) setTeachers(data as Teacher[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherData = {
      school_id: schoolId,
      name: formData.name,
      cnic: formData.cnic,
      gender: formData.gender,
      personal_contact: formData.personal_contact,
      home_contact: formData.home_contact,
      address: formData.address,
      education: formData.education,
      salary: parseInt(formData.salary) || 0,
      notes: formData.notes,
      type: formData.type,
      is_active: true
    };
    if (editingId) {
      await supabase.from('teachers').update(teacherData).eq('id', editingId);
    } else {
      await supabase.from('teachers').insert(teacherData);
    }
    resetForm();
    loadTeachers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await supabase.from('teachers').update({ is_active: false }).eq('id', id);
    loadTeachers();
  };

  const startEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name, cnic: teacher.cnic, gender: teacher.gender,
      personal_contact: teacher.personal_contact, home_contact: teacher.home_contact,
      address: teacher.address, education: teacher.education,
      salary: teacher.salary.toString(), notes: teacher.notes, type: teacher.type
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', cnic: '', gender: 'Male', personal_contact: '', home_contact: '', address: '', education: '', salary: '', notes: '', type: 'Teacher' });
    setEditingId(null); setShowForm(false);
  };

  const getTypeBadge = (type: string) => (
    <span className={`type-badge ${type.toLowerCase()}`}>{type}</span>
  );

  if (loading) return <div className="teachers-loading">Loading...</div>;

  return (
    <div className="teachers-manager">
      <div className="teachers-header">
        <h3><Users size={20} /> Teachers & Staff</h3>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Teacher/Staff'}
        </button>
      </div>

      {showForm && (
        <form className="teacher-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as 'Teacher' | 'Staff'})}>
                <option value="Teacher">Teacher</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CNIC *</label>
              <Input value={formData.cnic} onChange={(e) => setFormData({...formData, cnic: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as 'Male' | 'Female'})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Personal Contact *</label>
              <Input value={formData.personal_contact} onChange={(e) => setFormData({...formData, personal_contact: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Home Contact</label>
              <Input value={formData.home_contact} onChange={(e) => setFormData({...formData, home_contact: e.target.value})} />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Education</label>
              <Input value={formData.education} onChange={(e) => setFormData({...formData, education: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Salary (PKR)</label>
              <Input type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Additional Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit"><Save size={16} /> {editingId ? 'Update' : 'Save'}</button>
            <button type="button" className="btn-cancel" onClick={resetForm}><X size={16} /> Cancel</button>
          </div>
        </form>
      )}

      <div className="teachers-table-wrap">
        <table className="teachers-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>CNIC</th>
              <th>Gender</th>
              <th>Personal Contact</th>
              <th>Home Contact</th>
              <th>Education</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan={9} className="empty-cell">No teachers or staff added yet</td></tr>
            ) : teachers.map(t => (
              <tr key={t.id}>
                <td>{getTypeBadge(t.type)}</td>
                <td>{t.name}</td>
                <td>{t.cnic}</td>
                <td>{t.gender}</td>
                <td>{t.personal_contact}</td>
                <td>{t.home_contact || '-'}</td>
                <td>{t.education || '-'}</td>
                <td>Rs {t.salary.toLocaleString()}</td>
                <td className="actions-cell">
                  <button onClick={() => startEdit(t)} title="Edit"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(t.id)} title="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
