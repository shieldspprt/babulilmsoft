import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Role } from '../lib/supabase';
import { useFlashMessage } from '../hooks/useFlashMessage';
import { Button } from './ui/Button';
import { Plus, Trash2, Edit2, Save, X, DollarSign, Calendar, FileText, CreditCard, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './IncomeManager.css';
import './managers.css';

export type IncomeCategory = {
  id: string;
  school_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type IncomeRecord = {
  id: string;
  school_id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  date: string;
  payment_method: string;
  description: string;
  additional_notes: string;
  created_at: string;
};

type IncomeManagerProps = {
  schoolId: string;
  role?: Role;
};

const DEFAULT_CATEGORIES = ['Book Sales', 'Notebook Sales', 'Canteen', 'Other Income'];
const PAGE_SIZE = 25;
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'EasyPaisa', 'JazzCash'];

export const IncomeManager = ({ schoolId, role }: IncomeManagerProps) => {
  const isOwner = !role || role === 'owner';
  const { flash, showFlash } = useFlashMessage(4000);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    description: '',
    additional_notes: ''
  });

  const loadCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('income_categories')
      .select('*')
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }

    if (data && data.length === 0) {
      // Create default categories
      const defaultCats = DEFAULT_CATEGORIES.map(name => ({
        school_id: schoolId,
        name,
        is_default: true
      }));
      await supabase.from('income_categories').insert(defaultCats);
      const { data: newData } = await supabase
        .from('income_categories')
        .select('*')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });
      setCategories(newData || []);
    } else {
      setCategories(data || []);
    }
  }, [schoolId]);

  const loadRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from('income_records')
      .select(`*, category:category_id(name)`)
      .eq('school_id', schoolId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading records:', error);
      return;
    }

    const formatted = (data || []).map((r: any) => ({
      ...r,
      category_name: r.category?.name || 'Unknown'
    }));
    setRecords(formatted as IncomeRecord[]);
  }, [schoolId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadCategories(), loadRecords()]);
    setLoading(false);
  }, [loadCategories, loadRecords]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount) {
      showFlash('Please fill all required fields');
      return;
    }

    // Validate category is selected
    if (!formData.category_id || formData.category_id === '') {
      showFlash('Please select an income category');
      return;
    }

    const amountValue = parseInt(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      showFlash('Amount must be a positive number');
      return;
    }

    const payload = {
      school_id: schoolId,
      category_id: formData.category_id,
      amount: amountValue,
      date: formData.date,
      payment_method: formData.payment_method,
      description: formData.description,
      additional_notes: formData.additional_notes
    };

    if (editingId) {
      const { error } = await supabase
        .from('income_records')
        .update(payload)
        .eq('id', editingId);
      if (error) showFlash('Error updating: ' + error.message);
    } else {
      const { error } = await supabase.from('income_records').insert(payload);
      if (error) showFlash('Error creating: ' + error.message);
    }

    resetForm();
    setShowForm(false);
    loadRecords();
  };

  const resetForm = () => {
    setFormData({
      category_id: categories[0]?.id || '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      description: '',
      additional_notes: ''
    });
    setEditingId(null);
  };

  const startEdit = (record: IncomeRecord) => {
    setEditingId(record.id);
    setFormData({
      category_id: record.category_id,
      amount: record.amount.toString(),
      date: record.date,
      payment_method: record.payment_method,
      description: record.description,
      additional_notes: record.additional_notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setConfirmAction({
      message: 'Delete this income record?',
      onConfirm: async () => {
        const { error } = await supabase.from('income_records').delete().eq('id', id);
        if (error) showFlash('Error deleting: ' + error.message);
        else loadRecords();
        setConfirmAction(null);
      }
    });
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const { error } = await supabase.from('income_categories').insert({
      school_id: schoolId,
      name: newCategoryName.trim(),
      is_default: false
    });
    
    if (error) showFlash('Error adding category: ' + error.message);
    else {
      setNewCategoryName('');
      setShowCategoryForm(false);
      loadCategories();
    }
  };

  const deleteCategory = (id: string) => {
    setConfirmAction({
      message: 'Delete this category? Existing records will keep it.',
      onConfirm: async () => {
        const { error } = await supabase.from('income_categories').delete().eq('id', id);
        if (error) showFlash('Error: ' + error.message);
        else loadCategories();
        setConfirmAction(null);
      }
    });
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.category_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || r.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalIncome = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
  
  // Reset to valid page if filters changed and current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  useEffect(() => { setPage(1); }, [searchQuery, filterCategory]);

  if (loading) return <div className="loading">Loading income data...</div>;

  return (
    <div className="income-manager">
      {/* Summary Cards */}
      <div className="income-summary">
        <div className="summary-card glass">
          <DollarSign size={24} />
          <div>
            <span className="summary-value">Rs {totalIncome.toLocaleString()}</span>
            <span className="summary-label">Total Income</span>
          </div>
        </div>
        <div className="summary-card glass">
          <FileText size={24} />
          <div>
            <span className="summary-value">{records.length}</span>
            <span className="summary-label">Records</span>
          </div>
        </div>
        <div className="summary-card glass">
          <CreditCard size={24} />
          <div>
            <span className="summary-value">{categories.length}</span>
            <span className="summary-label">Categories</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="categories-bar">
        <span className="categories-label">Categories:</span>
        <div className="categories-list">
          {categories.map(cat => (
            <span key={cat.id} className={`category-tag ${cat.is_default ? 'default' : 'custom'}`}>
              {cat.name}
              {isOwner && !cat.is_default && (
                <button onClick={() => deleteCategory(cat.id)} title="Delete"><X size={10} /></button>
              )}
            </span>
          ))}
        </div>
        <button className="btn-add-category" onClick={() => setShowCategoryForm(!showCategoryForm)}>
          <Plus size={14} />
        </button>
        {showCategoryForm && (
          <form className="category-form-inline" onSubmit={addCategory}>
            <input
              type="text"
              placeholder="New category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-confirm"><Save size={14} /></button>
            <button type="button" className="btn-cancel" onClick={() => {setShowCategoryForm(false); setNewCategoryName('');}}><X size={14} /></button>
          </form>
        )}
      </div>

      {/* Record Form */}
      <div className="form-section">
        {!showForm ? (
          <button className="btn-add-income" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={20} /> Record Income
          </button>
        ) : (
          <form className="income-form glass" onSubmit={handleSubmit}>
            <div className="form-header">
              <h4>{editingId ? 'Edit Income' : 'Record Income'}</h4>
              <button type="button" className="btn-close" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group required">
                <label>Income Category</label>
                <select 
                  value={formData.category_id} 
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group required">
                <label>Amount (PKR)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group required">
                <label>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group required">
                <label>Payment Method</label>
                <select 
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group required full-width">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Brief description of income"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Additional Notes</label>
                <textarea
                  rows={2}
                  placeholder="Any additional notes..."
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">
                <Save size={16} /> {editingId ? 'Update' : 'Save'} Record
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Records List */}
      <div className="records-section glass">
        <div className="records-header">
          <div className="search-filter">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <span className="records-count">{filteredRecords.length} records</span>
        </div>

        <div className="records-list">
          {filteredRecords.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>No income records found</p>
            </div>
          ) : (
            paginated.map(record => (
              <div key={record.id} className="record-card">
                <div className="record-main">
                  <span className="record-category">{record.category_name}</span>
                  <span className="record-amount">Rs {record.amount.toLocaleString()}</span>
                </div>
                <div className="record-details">
                  <span><Calendar size={14} /> {new Date(record.date).toLocaleDateString()}</span>
                  <span><CreditCard size={14} /> {record.payment_method}</span>
                  <span className="record-desc">{record.description}</span>
                </div>
                {record.additional_notes && (
                  <div className="record-notes">{record.additional_notes}</div>
                )}
                <div className="record-actions">
                  {isOwner && (
                    <button className="btn-icon" onClick={() => startEdit(record)}><Edit2 size={14} /></button>
                  )}
                  {isOwner && (
                    <button className="btn-icon danger" onClick={() => handleDelete(record.id)}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {(page-1)*PAGE_SIZE + 1}–{Math.min(page*PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {flash && <div className={`flash ${flash.startsWith('Error') ? 'error' : 'success'}`}>{flash}</div>}

      {confirmAction && (
        <div className="modal-backdrop" onClick={() => setConfirmAction(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <Trash2 size={40} color="var(--danger)" />
            <h3>{confirmAction.message}</h3>
            <div className="confirm-box-btns">
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmAction.onConfirm}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
