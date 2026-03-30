import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, GraduationCap } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import './ClassesManager.css';

type Class = {
  id: string;
  school_id: string;
  name: string;
  display_order: number;
};

const DEFAULT_CLASSES = [
  'Playgroup', 'Nursery', 'Prep',
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
  'Pre-Nine', 'Nine', 'Tenth', 'Pass-out'
];

export const ClassesManager = ({ schoolId }: { schoolId: string }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading classes:', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // Create default classes
      const defaultClasses = DEFAULT_CLASSES.map((name, index) => ({
        school_id: schoolId,
        name,
        display_order: index
      }));
      await supabase.from('classes').insert(defaultClasses);
      const { data: newData } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', schoolId)
        .order('display_order', { ascending: true });
      setClasses(newData || []);
    } else {
      setClasses(data);
    }
    setLoading(false);
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    
    const { error } = await supabase.from('classes').insert({
      school_id: schoolId,
      name: newClassName.trim(),
      display_order: classes.length
    });

    if (error) {
      setMessage('Error adding class. Please try again.');
    } else {
      setNewClassName('');
      setShowAddForm(false);
      setMessage('Class added successfully!');
      setTimeout(() => setMessage(''), 2000);
      loadClasses();
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    
    await supabase.from('classes').delete().eq('id', id);
    loadClasses();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading classes...</span>
      </div>
    );
  }

  return (
    <div className="classes-manager">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-title">
          <GraduationCap size={28} />
          <div>
            <h3>Classes</h3>
            <p>{classes.length} classes total</p>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="lg">
          <Plus size={20} /> Add New Class
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`manager-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="form-card animate-fade-in">
          <div className="form-header">
            <h4>Add New Class</h4>
            <button className="btn-close" onClick={() => setShowAddForm(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="form-row">
            <Input
              label="Class Name"
              placeholder="Enter class name (e.g., Eleventh)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddClass()}
              autoFocus
            />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClass} disabled={!newClassName.trim()}>
              <Plus size={18} /> Add Class
            </Button>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      <div className="classes-grid">
        {classes.map((cls, index) => (
          <div key={cls.id} className="class-card">
            <div className="class-number">{index + 1}</div>
            <div className="class-name">{cls.name}</div>
            <button
              className="btn-delete"
              onClick={() => handleDeleteClass(cls.id)}
              title="Delete class"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="empty-state">
          <GraduationCap size={48} />
          <p>No classes added yet</p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus size={18} /> Add First Class
          </Button>
        </div>
      )}
    </div>
  );
};
