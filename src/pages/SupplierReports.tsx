import { useState, useEffect } from 'react';
import { Download, Filter, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';
import { formatDate } from '@/lib/utils';

export default function SupplierReports() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

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
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('supplier_transactions')
        .select('*, suppliers(name, business_name, supplier_id)')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (selectedSupplierId !== 'all') {
        query = query.eq('supplier_id', selectedSupplierId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data || []);

      // Calculate summary
      const bills = data?.filter(t => t.transaction_type === 'bill').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const payments = data?.filter(t => t.transaction_type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      setReportData({
        totalBills: bills,
        totalPayments: payments,
        netBalance: bills - payments
      });

      toast.success('Report generated successfully');
    } catch (error: any) {
      toast.error('Failed to generate report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csv = [
      ['Date', 'Transaction #', 'Supplier', 'Type', 'Description', 'Amount', 'Method'].join(','),
      ...transactions.map(t => [
        formatDate(t.transaction_date),
        t.transaction_number,
        `${t.suppliers?.name} (${t.suppliers?.supplier_id})`,
        t.transaction_type,
        t.description,
        t.amount,
        t.payment_method || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-report-${startDate}-to-${endDate}.csv`;
    a.click();
    toast.success('Report exported successfully');
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
          <h1 className="text-3xl font-bold mt-4">Supplier Reports</h1>
          <p className="text-muted-foreground">Monthly summaries and transaction history</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.supplier_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button onClick={generateReport} disabled={loading} className="w-full">
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {reportData && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">Rs. {reportData.totalBills.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Rs. {reportData.totalPayments.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.netBalance > 0 ? 'text-destructive' : reportData.netBalance < 0 ? 'text-green-600' : 'text-foreground'}`}>
                  Rs. {Math.abs(reportData.netBalance).toLocaleString()}
                  {reportData.netBalance > 0 && ' (Payable)'}
                  {reportData.netBalance < 0 && ' (Receivable)'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaction Details</CardTitle>
              <Button onClick={exportReport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.transaction_number}</TableCell>
                      <TableCell>
                        {transaction.suppliers?.name}
                        <div className="text-xs text-muted-foreground">{transaction.suppliers?.supplier_id}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.transaction_type === 'bill' ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'
                        }`}>
                          {transaction.transaction_type === 'bill' ? 'Bill' : 'Payment'}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right font-medium">
                        Rs. {Number(transaction.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{transaction.payment_method || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {transactions.length === 0 && reportData && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions found for the selected period.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
