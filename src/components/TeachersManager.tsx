import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// import { Button } from './ui/Button';
// import { Input } from './ui/Input';
import { Plus, Save, X, User, Phone, MapPin, GraduationCap, Wallet, Edit2, Trash2, Search } from 'lucide-react';
import './TeachersManager.css';

export type Teacher = {
  id: string;
  school_id: string;
  name: string;
  cnic: string;
  gender: string;
  personal_contact: string;
  home_contact: string;
  address: string;
  education: string;
  salary: number;
  notes: string;
  is_active: boolean;
  created_at: string;
};

type TeachersManagerProps = {
  schoolId: string;
};

export const TeachersManager = ({ schoolId }: TeachersManagerProps) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    gender: 'Male',
    personal_contact: '',
    home_contact: '',
    address: '',
    education: '',
    salary: 0,
    notes: ''
  });

  useEffect(() => {
    loadTeachers();
  }, [schoolId]);

  const loadTeachers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error loading teachers:', error);
    } else {
      setTeachers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('teachers')
      .insert({
        school_id: schoolId,
        ...formData
      });
    
    if (error) {
      alert('Error creating teacher: ' + error.message);
    } else {
      resetForm();
      setShowForm(false);
      loadTeachers();
    }
  };

  const startEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name,
      cnic: teacher.cnic || '',
      gender: teacher.gender || 'Male',
      personal_contact: teacher.personal_contact || '',
      home_contact: teacher.home_contact || '',
      address: teacher.address || '',
      education: teacher.education || '',
      salary: teacher.salary || 0,
      notes: teacher.notes || ''
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const { error } = await supabase
      .from('teachers')
      .update(formData)
      .eq('id', editingId);
    
    if (error) {
      alert('Error updating teacher: ' + error.message);
    } else {
      setEditingId(null);
      setShowForm(false);
      resetForm();
      loadTeachers();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnic: '',
      gender: 'Male',
      personal_contact: '',
      home_contact: '',
      address: '',
      education: '',
      salary: 0,
      notes: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    if (error) {
      alert('Error deleting teacher: ' + error.message);
    } else {
      loadTeachers();
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.cnic?.includes(searchQuery) ||
    t.personal_contact?.includes(searchQuery)
  );

  if (loading) return <div className="loading">Loading teachers...</div>;

  return (
    <div className="teachers-manager">
      <div className="teachers-header">
        <div>
          <h3><User size={20} /> Teachers Management</h3>
          <p>Manage your teaching staff</p>
        </div>
        <button className="btn-add-teacher" onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }}>
          <Plus size={18} /> Add Teacher
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search teachers by name, CNIC or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showForm && (
        <form className="teacher-form glass" onSubmit={editingId ? handleUpdate : handleSubmit}>
          <div className="form-header">
            <h4>{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h4>
            <button type="button" className="btn-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X size={18} />
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Teacher full name"
                required
              />
            </div>

            <div className="form-group">
              <label>CNIC</label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                placeholder="e.g. 35201-1234567-8"
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label><Phone size={14} /> Personal Contact</label>
              <input
                type="text"
                value={formData.personal_contact}
                onChange={(e) => setFormData({ ...formData, personal_contact: e.target.value })}
                placeholder="Mobile number"
              />
            </div>

            <div className="form-group">
              <label><Phone size={14} /> Home Contact</label>
              <input
                type="text"
                value={formData.home_contact}
                onChange={(e) => setFormData({ ...formData, home_contact: e.target.value })}
                placeholder="Home/Landline number"
              />
            </div>

            <div className="form-group">
              <label><Wallet size={14} /> Monthly Salary (PKR)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 25000"
                min="0"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label><MapPin size={14} /> Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete address"
              rows={2}
            />
          </div>

          <div className="form-group full-width">
            <label><GraduationCap size={14} /> Education / Qualifications</label>
            <input
              type="text"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="e.g. M.A Education, B.Ed"
            />
          </div>

          <div className="form-group full-width">
            <label>Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information about the teacher"
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              <Save size={16} /> {editingId ? 'Update Teacher' : 'Save Teacher'}
            </button>
          </div>
        </form>
      )}

      <div className="teachers-list">
        {filteredTeachers.length === 0 ? (
          <div className="empty-state">
            <User size={48} />
            <p>No teachers found. Click "Add Teacher" to get started.</p>
          </div>
        ) : (
          <div className="teachers-grid">
            {filteredTeachers.map(teacher => (
              <div key={teacher.id} className={`teacher-card ${!teacher.is_active ? 'inactive' : ''}`}>
                <div className="teacher-header">
                  <div className="teacher-avatar">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="teacher-info">
                    <h4>{teacher.name}</h4>
                    <span className="teacher-gender">{teacher.gender}</span>
                  </div>
                  <div className="teacher-actions">
                    <button className="btn-icon" onClick={() => startEdit(teacher)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(teacher.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="teacher-details">
                  {teacher.cnic && (
                    <div className="detail-row">
                      <span className="label">CNIC:</span>
                      <span>{teacher.cnic}</span>
                    </div>
                  )}
                  {teacher.personal_contact && (
                    <div className="detail-row">
                      <span className="label"><Phone size={12} /> Personal:</span>
                      <span>{teacher.personal_contact}</span>
                    </div>
                  )}
                  {teacher.home_contact && (
                    <div className="detail-row">
                      <span className="label"><Phone size={12} /> Home:</span>
                      <span>{teacher.home_contact}</span>
                    </div>
                  )}
                  {teacher.address && (
                    <div className="detail-row">
                      <span className="label"><MapPin size={12} /> Address:</span>
                      <span className="address">{teacher.address}</span>
                    </div>
                  )}
                  {teacher.education && (
                    <div className="detail-row">
                      <span className="label"><GraduationCap size={12} /> Education:</span>
                      <span>{teacher.education}</span>
                    </div>
                  )}
                  {teacher.salary > 0 && (
                    <div className="detail-row">
                      <span className="label"><Wallet size={12} /> Salary:</span>
                      <span className="salary">Rs {teacher.salary.toLocaleString()}/month</span>
                    </div>
                  )}
                  {teacher.notes && (
                    <div className="detail-row notes">
                      <span className="label">Notes:</span>
                      <span className="notes-text">{teacher.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
