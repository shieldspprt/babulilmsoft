import { useState, useEffect } from 'react';
import { FileText, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { TransactionForm } from '@/components/suppliers/TransactionForm';
import { SupplierLedger } from '@/components/suppliers/SupplierLedger';

export default function SupplierTransactions() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      setSelectedSupplier(supplier);
    } else {
      setSelectedSupplier(null);
    }
  }, [selectedSupplierId, suppliers]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast.error('Failed to load suppliers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSuccess = () => {
    loadSuppliers();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto p-6 pt-24 space-y-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Supplier Transactions</h1>
          <p className="text-muted-foreground">Record bills and payments</p>
        </div>

        {/* Supplier Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.business_name} ({supplier.supplier_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSupplier && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Current Balance:</span>
                  <span className={`text-lg font-bold ${
                    selectedSupplier.current_balance > 0 ? 'text-destructive' : 
                    selectedSupplier.current_balance < 0 ? 'text-green-600' : 'text-foreground'
                  }`}>
                    Rs. {Math.abs(selectedSupplier.current_balance).toLocaleString()}
                    {selectedSupplier.current_balance > 0 && ' (Payable)'}
                    {selectedSupplier.current_balance < 0 && ' (Receivable)'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Billed:</span>
                  <span>Rs. {selectedSupplier.total_billed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span>Rs. {selectedSupplier.total_paid.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedSupplier && (
          <Tabs defaultValue="bill" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bill" className="gap-2">
                <FileText className="h-4 w-4" />
                Record Bill
              </TabsTrigger>
              <TabsTrigger value="payment" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Record Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bill">
              <TransactionForm
                supplierId={selectedSupplierId}
                transactionType="bill"
                onSuccess={handleTransactionSuccess}
              />
            </TabsContent>

            <TabsContent value="payment">
              <TransactionForm
                supplierId={selectedSupplierId}
                transactionType="payment"
                onSuccess={handleTransactionSuccess}
              />
            </TabsContent>
          </Tabs>
        )}

        {selectedSupplier && (
          <SupplierLedger supplierId={selectedSupplierId} />
        )}
      </main>
    </div>
  );
}
