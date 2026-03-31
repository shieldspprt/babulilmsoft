import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Percent, Banknote, Tag, Search, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import '../components/managers.css';

type DiscountType = 'percentage' | 'amount';

type Discount = {
  id: string;
  school_id: string;
  name: string;
  type: DiscountType;
  value: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const EMPTY_FORM = {
  name: '',
  type: 'percentage' as DiscountType,
  value: '',
  description: '',
  is_active: true,
};

const PAGE_SIZE = 25;

export const DiscountsManager = ({ schoolId }: { schoolId: string }) => {
  const [records, setRecords] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<Discount | null>(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [schoolId]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.value) {
      setFlash('Error: Name and value are required');
      setTimeout(() => setFlash(''), 4000);
      return;
    }
    if (form.type === 'percentage' && parseInt(form.value) > 100) {
      setFlash('Error: Percentage cannot exceed 100%');
      setTimeout(() => setFlash(''), 4000);
      return;
    }

    setSaving(true);
    let error;
    if (editTarget) {
      const { error: err } = await supabase.from('discounts').update({
        name: form.name.trim(),
        type: form.type,
        value: parseInt(form.value) || 0,
        description: form.description.trim() || null,
        is_active: form.is_active,
      }).eq('id', editTarget.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('discounts').insert({
        school_id: schoolId,
        name: form.name.trim(),
        type: form.type,
        value: parseInt(form.value) || 0,
        description: form.description.trim() || null,
        is_active: form.is_active,
      });
      error = err;
    }
    setSaving(false);

    if (error) {
      setFlash('Error: ' + error.message);
      setTimeout(() => setFlash(''), 4000);
    } else {
      setFlash(`Discount "${form.name}" ${editTarget ? 'updated' : 'added'}!`);
      setShowModal(false);
      setEditTarget(null);
      setForm({ ...EMPTY_FORM });
      load();
      setTimeout(() => setFlash(''), 4000);
    }
  };

  const openEdit = (discount: Discount) => {
    setEditTarget(discount);
    setForm({
      name: discount.name,
      type: discount.type,
      value: discount.value.toString(),
      description: discount.description || '',
      is_active: discount.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('discounts').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      setFlash('Error: ' + error.message);
      setTimeout(() => setFlash(''), 4000);
    } else {
      setDeleteTarget(null);
      load();
    }
  };

  const toggleActive = async (discount: Discount) => {
    const { error } = await supabase.from('discounts').update({
      is_active: !discount.is_active,
    }).eq('id', discount.id);

    if (error) {
      setFlash('Error: ' + error.message);
      setTimeout(() => setFlash(''), 4000);
    } else {
      load();
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }, [records, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search]);

  const formatValue = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    }
    return `Rs ${discount.value.toLocaleString()}`;
  };

  if (loading) return <div className="manager-loading"><div className="spinner" /><span>Loading...</span></div>;

  return (
    <div className="manager">
      <div className="manager-toolbar">
        <div className="manager-title">
          <Tag size={24} />
          <div>
            <h3>Discounts</h3>
            <p>{records.filter(r => r.is_active).length} active discount{records.filter(r => r.is_active).length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="manager-search-bar">
            <Search size={16} />
            <input placeholder="Search discounts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setEditTarget(null); setShowModal(true); }}>
            <Plus size={18} /> Add Discount
          </Button>
        </div>
      </div>

      {flash && <div className={"flash " + (flash.startsWith('Error') ? 'error' : 'success')}>{flash}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Tag size={52} />
          <p>{records.length === 0 ? 'No discounts created yet' : 'No results found'}</p>
          <small>{records.length === 0 ? 'Create your first discount using the button above' : ''}</small>
          {records.length === 0 && <Button onClick={() => { setForm({ ...EMPTY_FORM }); setEditTarget(null); setShowModal(true); }}><Plus size={18} /> Add First Discount</Button>}
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Discount Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(r => (
                  <tr key={r.id} className={!r.is_active ? 'inactive' : ''}>
                    <td><strong>{r.name}</strong></td>
                    <td>
                      <span className={`type-badge ${r.type}`}>
                        {r.type === 'percentage' ? <Percent size={14} /> : <Banknote size={14} />}
                        {r.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatValue(r)}</td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '-'}</td>
                    <td>
                      <button
                        className={`toggle-btn ${r.is_active ? 'active' : ''}`}
                        onClick={() => toggleActive(r)}
                        title={r.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {r.is_active ? <ToggleRight size={20} color="var(--success)" /> : <ToggleLeft size={20} />}
                        <span>{r.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
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
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  {'<'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={"page-btn" + (p === page ? ' active' : '')} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  {'>'}
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
              <h3>{editTarget ? 'Edit Discount' : 'Add Discount'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-section-label">Discount Information *</div>
              <div className="form-grid">
                <div className="span-2">
                  <Input
                    label="Discount Name *"
                    placeholder="e.g., Sibling Discount, Need-based Scholarship"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="form-label">Type *</div>
                  <div className="type-pills" style={{ marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className={`type-pill ${form.type === 'percentage' ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, type: 'percentage' })}
                    >
                      <Percent size={14} /> Percentage
                    </button>
                    <button
                      type="button"
                      className={`type-pill ${form.type === 'amount' ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, type: 'amount' })}
                    >
                      <Banknote size={14} /> Fixed Amount
                    </button>
                  </div>
                </div>

                <div>
                  <Input
                    label={form.type === 'percentage' ? 'Percentage Value *' : 'Amount (Rs) *'}
                    type="number"
                    placeholder={form.type === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    required
                    min="1"
                    max={form.type === 'percentage' ? '100' : undefined}
                  />
                </div>

                <div className="span-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Optional description or notes about this discount..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {form.type === 'percentage' && form.value && parseInt(form.value) > 100 && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Warning: Percentage cannot exceed 100%
                </div>
              )}
            </div>
            <div className="modal-foot">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                isLoading={saving}
                disabled={!form.name.trim() || !form.value || (form.type === 'percentage' && parseInt(form.value) > 100)}
              >
                <Plus size={18} /> {editTarget ? 'Save Changes' : 'Add Discount'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="confirm-box">
            <Trash2 size={40} color="var(--danger)" />
            <h3>Delete Discount?</h3>
            <p>This will permanently delete <strong>{deleteTarget.name}</strong>.</p>
            <div className="confirm-box-btns">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
