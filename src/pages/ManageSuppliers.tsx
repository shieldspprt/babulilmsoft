import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Users, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { SupplierForm } from '@/components/suppliers/SupplierForm';
import { SupplierCard } from '@/components/suppliers/SupplierCard';

export default function ManageSuppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    outstanding: 0,
    advance: 0
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSuppliers(data || []);
      
      // Calculate stats
      const activeSuppliers = data?.filter(s => s.is_active) || [];
      const outstanding = activeSuppliers.filter(s => s.current_balance > 0).reduce((sum, s) => sum + Number(s.current_balance), 0);
      const advance = activeSuppliers.filter(s => s.current_balance < 0).reduce((sum, s) => sum + Math.abs(Number(s.current_balance)), 0);
      
      setStats({
        total: activeSuppliers.length,
        outstanding,
        advance
      });
    } catch (error: any) {
      toast.error('Failed to load suppliers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await loadSuppliers();
    setDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto p-6 pt-24 space-y-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Suppliers</h1>
              <p className="text-muted-foreground">Track supplier accounts and balances</p>
            </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingSupplier(null);
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              </DialogHeader>
              <SupplierForm 
                supplier={editingSupplier} 
                onSave={handleSave}
                onCancel={() => setDialogOpen(false)}
              />
          </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Active suppliers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding (Payable)</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">Rs. {stats.outstanding.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Amount we owe</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advance (Receivable)</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Rs. {stats.advance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Amount they owe us</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, business, ID, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers added yet. Click "Add Supplier" to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map(supplier => (
              <SupplierCard 
                key={supplier.id}
                supplier={supplier}
                onEdit={handleEdit}
                onRefresh={loadSuppliers}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
