import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit2, Save, X, DollarSign, FileText, CreditCard, Search, User } from 'lucide-react';
import './ExpenseManager.css';

export type ExpenseCategory = {
  id: string;
  school_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
};

export type Expense = {
  id: string;
  school_id: string;
  category_id: string;
  category_name?: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  description: string;
  paid_by: string;
  additional_notes: string;
  created_at: string;
};

type ExpenseManagerProps = {
  schoolId: string;
};

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Easy Paisa', 'Jazz Cash'];

export const ExpenseManager = ({ schoolId }: ExpenseManagerProps) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    description: '',
    paid_by: '',
    additional_notes: ''
  });

  const [newCategory, setNewCategory] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadCategories(), loadExpenses()]);
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    if (data) setCategories(data);
  };

  const loadExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select(`
        *,
        categories:category_id (name)
      `)
      .eq('school_id', schoolId)
      .order('expense_date', { ascending: false });
    
    if (data) {
      const formatted = data.map((e: any) => ({
        ...e,
        category_name: e.categories?.name || 'Unknown'
      }));
      setExpenses(formatted as Expense[]);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount || !formData.description || !formData.paid_by) return;

    const expenseData = {
      school_id: schoolId,
      category_id: formData.category_id,
      amount: parseInt(formData.amount),
      expense_date: formData.expense_date,
      payment_method: formData.payment_method,
      description: formData.description,
      paid_by: formData.paid_by,
      additional_notes: formData.additional_notes
    };

    if (editingId) {
      await supabase.from('expenses').update(expenseData).eq('id', editingId);
    } else {
      await supabase.from('expenses').insert(expenseData);
    }

    resetForm();
    loadExpenses();
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      description: '',
      paid_by: '',
      additional_notes: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      category_id: expense.category_id,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      payment_method: expense.payment_method,
      description: expense.description,
      paid_by: expense.paid_by,
      additional_notes: expense.additional_notes || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    loadExpenses();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await supabase.from('expense_categories').insert({
      school_id: schoolId,
      name: newCategory.trim()
    });
    setNewCategory('');
    setShowCategoryForm(false);
    loadCategories();
  };

  const deleteCategory = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Cannot delete default categories');
      return;
    }
    if (!confirm('Delete this category?')) return;
    await supabase.from('expense_categories').delete().eq('id', id);
    loadCategories();
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.paid_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || e.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="loading">Loading expenses...</div>;

  return (
    <div className="expense-manager">
      {/* Summary Cards */}
      <div className="expense-summary">
        <div className="summary-card">
          <DollarSign className="summary-icon" />
          <div className="summary-info">
            <span className="summary-value">Rs {totalExpenses.toLocaleString()}</span>
            <span className="summary-label">Total Expenses</span>
          </div>
        </div>
        <div className="summary-card">
          <FileText className="summary-icon" />
          <div className="summary-info">
            <span className="summary-value">{expenses.length}</span>
            <span className="summary-label">Records</span>
          </div>
        </div>
        <div className="summary-card">
          <CreditCard className="summary-icon" />
          <div className="summary-info">
            <span className="summary-value">{categories.length}</span>
            <span className="summary-label">Categories</span>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <div className="expense-form-section">
        <button className="btn-toggle-form" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} />
          {showForm ? 'Cancel' : (editingId ? 'Edit Expense' : 'Record Expense')}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="expense-form glass">
            <div className="form-row">
              <div className="form-group">
                <label>Expense Category *</label>
                <select 
                  value={formData.category_id} 
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (PKR) *</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select 
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  required
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <input 
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter description"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Paid By *</label>
                <input 
                  type="text"
                  value={formData.paid_by}
                  onChange={(e) => setFormData({...formData, paid_by: e.target.value})}
                  placeholder="Name of person who paid"
                  required
                />
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <input 
                  type="text"
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                <Save size={18} /> {editingId ? 'Update' : 'Save'} Expense
              </button>
              <button type="button" className="btn-cancel" onClick={resetForm}>
                <X size={18} /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Categories Management */}
      <div className="categories-section">
        <div className="categories-header">
          <h4>Expense Categories</h4>
          <button className="btn-add-category" onClick={() => setShowCategoryForm(!showCategoryForm)}>
            <Plus size={16} /> Add Category
          </button>
        </div>
        
        {showCategoryForm && (
          <div className="add-category-form">
            <input 
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
            />
            <button onClick={addCategory}><Save size={16} /></button>
            <button onClick={() => setShowCategoryForm(false)}><X size={16} /></button>
          </div>
        )}

        <div className="categories-list">
          {categories.map(cat => (
            <div key={cat.id} className={`category-tag ${cat.is_default ? 'default' : 'custom'}`}>
              {cat.name}
              {!cat.is_default && (
                <button onClick={() => deleteCategory(cat.id, cat.is_default)}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-wrap">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Paid By</th>
              <th>Payment</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">No expenses found</td>
              </tr>
            ) : (
              filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td>
                    <span className="category-badge">{expense.category_name}</span>
                  </td>
                  <td>{expense.description}</td>
                  <td className="amount-cell">Rs {expense.amount.toLocaleString()}</td>
                  <td>
                    <div className="paid-by">
                      <User size={14} />
                      {expense.paid_by}
                    </div>
                  </td>
                  <td>{expense.payment_method}</td>
                  <td className="notes-cell">{expense.additional_notes || '-'}</td>
                  <td className="actions-cell">
                    <button onClick={() => handleEdit(expense)}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(expense.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
