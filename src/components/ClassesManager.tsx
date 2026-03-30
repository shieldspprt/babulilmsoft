import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// import { Button } from './ui/Button';
import { Edit2, Save, X, Users } from 'lucide-react';
import './ClassesManager.css';

export type Class = {
  id: string;
  school_id: string;
  name: string;
  monthly_fee: number;
  admission_fee: number;
  display_order: number;
  active: boolean;
  created_at: string;
};

type Props = {
  schoolId: string;
};

const DEFAULT_CLASSES = [
  { name: 'Playgroup', display_order: 1, monthly_fee: 2000, admission_fee: 5000 },
  { name: 'Nursery', display_order: 2, monthly_fee: 2000, admission_fee: 5000 },
  { name: 'Prep', display_order: 3, monthly_fee: 2000, admission_fee: 5000 },
  { name: 'One', display_order: 4, monthly_fee: 2500, admission_fee: 5000 },
  { name: 'Two', display_order: 5, monthly_fee: 2500, admission_fee: 5000 },
  { name: 'Three', display_order: 6, monthly_fee: 2500, admission_fee: 5000 },
  { name: 'Four', display_order: 7, monthly_fee: 3000, admission_fee: 6000 },
  { name: 'Five', display_order: 8, monthly_fee: 3000, admission_fee: 6000 },
  { name: 'Six', display_order: 9, monthly_fee: 3500, admission_fee: 7000 },
  { name: 'Seven', display_order: 10, monthly_fee: 3500, admission_fee: 7000 },
  { name: 'Eight', display_order: 11, monthly_fee: 4000, admission_fee: 8000 },
  { name: 'Pre-Nine', display_order: 12, monthly_fee: 4500, admission_fee: 9000 },
  { name: 'Nine', display_order: 13, monthly_fee: 5000, admission_fee: 10000 },
  { name: 'Tenth', display_order: 14, monthly_fee: 5500, admission_fee: 12000 },
  { name: 'Pass Out', display_order: 15, monthly_fee: 0, admission_fee: 0 },
];

export const ClassesManager = ({ schoolId }: Props) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Class>>({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const loadClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', schoolId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error loading classes:', error);
      setMessage({ text: 'Error loading classes', type: 'error' });
    } else {
      if (!data || data.length === 0) {
        await createDefaultClasses();
      } else {
        setClasses(data);
      }
    }
    setLoading(false);
  };

  const createDefaultClasses = async () => {
    const classesToInsert = DEFAULT_CLASSES.map(c => ({
      ...c,
      school_id: schoolId,
      active: true,
    }));

    const { error } = await supabase.from('classes').insert(classesToInsert);
    
    if (error) {
      console.error('Error creating default classes:', error);
    } else {
      await loadClasses();
    }
  };

  const startEdit = (cls: Class) => {
    setEditingId(cls.id);
    setEditForm({ ...cls });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('classes')
      .update({
        monthly_fee: editForm.monthly_fee ?? 0,
        admission_fee: editForm.admission_fee ?? 0,
        active: editForm.active ?? true,
      })
      .eq('id', editingId);

    if (error) {
      setMessage({ text: 'Error saving changes', type: 'error' });
    } else {
      setMessage({ text: 'Class updated!', type: 'success' });
      setEditingId(null);
      loadClasses();
    }
  };

  const toggleActive = async (cls: Class) => {
    const { error } = await supabase
      .from('classes')
      .update({ active: !cls.active })
      .eq('id', cls.id);

    if (!error) loadClasses();
  };

  if (loading) return <div className="classes-loading"><Users size={24}/> Loading classes...</div>;

  return (
    <div className="classes-manager">
      <div className="classes-header">
        <h3><Users size={20}/> Class Management</h3>
        <p>Manage class fees and status for your school</p>
      </div>

      {message.text && (
        <div className={`class-message ${message.type}`}>{message.text}</div>
      )}

      <div className="classes-table-wrap">
        <table className="classes-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Monthly Fee</th>
              <th>Admission Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id} className={cls.active ? '' : 'inactive'}>
                <td className="class-name">
                  <span className="order-badge">{cls.display_order}</span>
                  {cls.name}
                </td>
                <td>
                  {editingId === cls.id ? (
                    <input type="number" value={editForm.monthly_fee || 0} onChange={(e) => setEditForm({ ...editForm, monthly_fee: parseInt(e.target.value) || 0 })} className="edit-input" />
                  ) : `Rs ${cls.monthly_fee?.toLocaleString() || 0}`}
                </td>
                <td>
                  {editingId === cls.id ? (
                    <input type="number" value={editForm.admission_fee || 0} onChange={(e) => setEditForm({ ...editForm, admission_fee: parseInt(e.target.value) || 0 })} className="edit-input" />
                  ) : `Rs ${cls.admission_fee?.toLocaleString() || 0}`}
                </td>
                <td>
                  <button className={`status-toggle ${cls.active ? 'active' : 'inactive'}`} onClick={() => editingId !== cls.id && toggleActive(cls)}>
                    {cls.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  {editingId === cls.id ? (
                    <div className="edit-actions">
                      <button className="btn-save" onClick={saveEdit}><Save size={16}/></button>
                      <button className="btn-cancel" onClick={cancelEdit}><X size={16}/></button>
                    </div>
                  ) : (
                    <button className="btn-edit" onClick={() => startEdit(cls)} disabled={!cls.active}>
                      <Edit2 size={16}/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
