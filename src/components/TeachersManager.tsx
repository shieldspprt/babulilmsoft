import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Users, Phone, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import './TeachersManager.css';

type Teacher = {
  id: string;
  school_id: string;
  name: string;
  type: 'Teacher' | 'Staff';
  cnic: string;
  gender: 'Male' | 'Female';
  personal_contact: string;
  home_contact: string;
  address: string;
  education: string;
  salary: number;
  notes: string;
};


export const TeachersManager = ({ schoolId }: { schoolId: string }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'Teacher' as 'Teacher' | 'Staff',
    name: '',
    cnic: '',
    gender: 'Male' as 'Male' | 'Female',
    personal_contact: '',
    home_contact: '',
    address: '',
    education: '',
    salary: '',
    notes: ''
  });

  useEffect(() => {
    loadTeachers();
  }, [schoolId]);

  const loadTeachers = async () => {
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('type')
      .order('name');
    setTeachers(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      type: 'Teacher',
      name: '',
      cnic: '',
      gender: 'Male',
      personal_contact: '',
      home_contact: '',
      address: '',
      education: '',
      salary: '',
      notes: ''
    });
    setFormStep(1);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from('teachers').insert({
      school_id: schoolId,
      ...formData,
      salary: parseInt(formData.salary) || 0,
      is_active: true
    });

    if (error) {
      setMessage('Error saving. Please try again.');
    } else {
      setMessage(`${formData.type} added successfully!`);
      setTimeout(() => setMessage(''), 2000);
      resetForm();
      loadTeachers();
    }
  };

  const isStep1Valid = formData.name.trim() && formData.personal_contact.trim();
  const isStep2Valid = formData.cnic.trim() && formData.address.trim();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  const teacherCount = teachers.filter(t => t.type === 'Teacher').length;
  const staffCount = teachers.filter(t => t.type === 'Staff').length;

  return (
    <div className="teachers-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-title">
          <Users size={28} />
          <div>
            <h3>Teachers & Staff</h3>
            <p>{teacherCount} Teachers, {staffCount} Staff</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg">
          <Plus size={20} /> Add Person
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`manager-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Add New {formData.type}</h3>
              <button className="btn-close" onClick={resetForm}>
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
              <div className={`step ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'completed' : ''}`}>
                <span>1</span>
                <small>Basic Info</small>
              </div>
              <div className="step-line"></div>
              <div className={`step ${formStep >= 2 ? 'active' : ''} ${formStep > 2 ? 'completed' : ''}`}>
                <span>2</span>
                <small>Details</small>
              </div>
              <div className="step-line"></div>
              <div className={`step ${formStep >= 3 ? 'active' : ''}`}>
                <span>3</span>
                <small>Review</small>
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {formStep === 1 && (
              <div className="form-step">
                <div className="type-selector">
                  <label className={formData.type === 'Teacher' ? 'active' : ''}
                    onClick={() => setFormData({...formData, type: 'Teacher'})}>
                    <GraduationCap size={24} />
                    <span>Teacher</span>
                  </label>
                  <label className={formData.type === 'Staff' ? 'active' : ''}
                    onClick={() => setFormData({...formData, type: 'Staff'})}>
                    <Briefcase size={24} />
                    <span>Staff</span>
                  </label>
                </div>

                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />

                <div className="form-row two-col">
                  <Input
                    label="Personal Contact"
                    placeholder="03XX-XXXXXXX"
                    value={formData.personal_contact}
                    onChange={(e) => setFormData({...formData, personal_contact: e.target.value})}
                    required
                  />
                  <Input
                    label="Home Contact (Optional)"
                    placeholder="03XX-XXXXXXX"
                    value={formData.home_contact}
                    onChange={(e) => setFormData({...formData, home_contact: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <Button variant="secondary" onClick={resetForm}>Cancel</Button>
                  <Button onClick={() => setFormStep(2)} disabled={!isStep1Valid}>
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {formStep === 2 && (
              <div className="form-step">
                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value as 'Male' | 'Female'})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <Input
                    label="CNIC"
                    placeholder="XXXXX-XXXXXXX-X"
                    value={formData.cnic}
                    onChange={(e) => setFormData({...formData, cnic: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><MapPin size={16} /> Address</label>
                  <textarea
                    rows={2}
                    placeholder="Enter complete address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="form-row two-col">
                  <Input
                    label="Education"
                    placeholder="e.g., BA, BEd, MA"
                    value={formData.education}
                    onChange={(e) => setFormData({...formData, education: e.target.value})}
                  />
                  <Input
                    label="Monthly Salary (PKR)"
                    type="number"
                    placeholder="e.g., 25000"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Additional Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Any special notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>

                <div className="form-actions">
                  <Button variant="secondary" onClick={() => setFormStep(1)}>← Back</Button>
                  <Button onClick={() => setFormStep(3)} disabled={!isStep2Valid}>
                    Review →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {formStep === 3 && (
              <div className="form-step">
                <div className="review-card">
                  <div className="review-header">
                    <span className={`type-badge ${formData.type.toLowerCase()}`}>{formData.type}</span>
                    <h4>{formData.name}</h4>
                  </div>
                  <div className="review-details">
                    <p><Phone size={16} /> {formData.personal_contact}</p>
                    <p><MapPin size={16} /> {formData.address}</p>
                    {formData.education && <p><GraduationCap size={16} /> {formData.education}</p>}
                    {formData.salary && <p>Salary: Rs {parseInt(formData.salary).toLocaleString()}/month</p>}
                  </div>
                </div>

                <div className="form-actions">
                  <Button variant="secondary" onClick={() => setFormStep(2)}>← Back</Button>
                  <Button onClick={handleSubmit}>
                    <Plus size={18} /> Save {formData.type}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teachers List */}
      <div className="teachers-list">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="teacher-card">
            <div className="teacher-avatar">
              {teacher.name.charAt(0).toUpperCase()}
            </div>
            <div className="teacher-info">
              <div className="teacher-header">
                <h4>{teacher.name}</h4>
                <span className={`type-badge ${teacher.type.toLowerCase()}`}>
                  {teacher.type}
                </span>
              </div>
              <div className="teacher-details">
                <span><Phone size={14} /> {teacher.personal_contact}</span>
                {teacher.cnic && <span>CNIC: {teacher.cnic}</span>}
                {teacher.education && <span><GraduationCap size={14} /> {teacher.education}</span>}
                {teacher.salary > 0 && <span>Rs {teacher.salary.toLocaleString()}/mo</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No teachers or staff added yet</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add First Person
          </Button>
        </div>
      )}
    </div>
  );
};
