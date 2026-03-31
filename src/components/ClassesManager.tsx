import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, BookOpen, Search } from 'lucide-react';
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
  const [name, setName]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [flash, setFlash]       = useState('');
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('name');
    setClasses(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('classes').insert({
        school_id: schoolId,
        name: name.trim(),
        display_order: classes.length + 1,
        monthly_fee: 0,
        admission_fee: 0,
        active: true
      });
    setSaving(false);
    if (error) { setFlash('Error: ' + error.message); }
    else       { setFlash('Class added!'); setName(''); load(); }
    setTimeout(() => setFlash(''), 3000);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
    load();
  };

  const filtered = search.trim()
    ? classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : classes;

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading…</span></div>;

  return (
    <div className="manager">
      {/* Header */}
      <div className="manager-toolbar">
        <div className="manager-title">
          <BookOpen size={24} />
          <div>
            <h3>Classes</h3>
            <p>{classes.length} class{classes.length !== 1 ? 'es' : ''} registered</p>
          </div>
        </div>
        {classes.length > 4 && (
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}
      </div>

      {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}

      {/* Inline Add */}
      <form className="inline-add-row" onSubmit={handleAdd}>
        <Input
          label="Class Name"
          placeholder="e.g. Class 5, Grade 8-A, Nursery"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <Button type="submit" isLoading={saving} style={{ marginTop: '22px' }}>
          <Plus size={18} /> Add Class
        </Button>
      </form>

      {/* Classes List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={52} />
          <p>{classes.length === 0 ? 'No classes yet' : 'No results found'}</p>
          <small>{classes.length === 0 ? 'Add your first class using the form above' : 'Try a different search'}</small>
        </div>
      ) : (
        <div className="classes-list">
          {filtered.map(c => (
            <div key={c.id} className="class-chip">
              <BookOpen size={14} color="var(--primary)" />
              <span>{c.name}</span>
              
              <button className="class-chip-del" title="Remove class" onClick={() => handleDelete(c.id)}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
