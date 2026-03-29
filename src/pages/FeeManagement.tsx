import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, Search, ArrowLeft, Receipt as ReceiptIcon, Printer, 
  Calendar, Filter, Download, RefreshCw, Eye, FileText
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Receipt } from '@/components/fee-collection/Receipt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: 'charge' | 'payment';
  amount: number;
  transaction_date: string;
  payment_method?: string;
  description: string;
  notes?: string;
  created_at: string;
  parent: {
    id: string;
    father_name: string;
    phone: string;
    parent_id: string;
  };
  line_items: Array<{
    id: string;
    description: string;
    amount: number;
    student_id?: string;
    month?: string;
    student?: {
      name: string;
      student_id: string;
      class?: string;
    };
  }>;
}

interface FeePayment {
  id: string;
  student_id: string;
  parent_id: string;
  month: string;
  payment_year: number;
  amount_paid: number;
  payment_date: string;
  receipt_number: string;
  student: {
    name: string;
    student_id: string;
    class?: string;
  };
  parent: {
    father_name: string;
    phone: string;
  };
}

const FeeManagement = () => {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterType, setFilterType] = useState<string>('all');
  
  // Receipt dialog
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalTransactions: 0,
    thisMonthCollected: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  useEffect(() => {
    loadTransactions();
    loadStats();
  }, [filterMonth, filterYear, filterType]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('parent_transactions')
        .select(`
          *,
          parent:parents!parent_id(id, father_name, phone, parent_id),
          line_items:transaction_line_items(
            id, description, amount, student_id, month,
            student:students(name, student_id, class)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('transaction_type', filterType);
      }

      if (filterYear !== 'all') {
        const startDate = `${filterYear}-01-01`;
        const endDate = `${filterYear}-12-31`;
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
      }

      if (filterMonth !== 'all') {
        const monthNum = months.indexOf(filterMonth) + 1;
        const year = filterYear !== 'all' ? filterYear : new Date().getFullYear();
        const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const endDate = new Date(Number(year), monthNum, 0).toISOString().split('T')[0];
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search query if present
      let filteredData = data || [];
      if (searchQuery.trim()) {
        const search = searchQuery.toLowerCase();
        filteredData = filteredData.filter((t: any) => 
          t.transaction_number?.toLowerCase().includes(search) ||
          t.parent?.father_name?.toLowerCase().includes(search) ||
          t.parent?.phone?.includes(search) ||
          t.description?.toLowerCase().includes(search)
        );
      }

      setTransactions(filteredData as Transaction[]);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Total collected this month
      const { data: monthData } = await supabase
        .from('parent_transactions')
        .select('amount')
        .eq('transaction_type', 'payment')
        .gte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`);

      // Total collected this year
      const { data: yearData } = await supabase
        .from('parent_transactions')
        .select('amount')
        .eq('transaction_type', 'payment')
        .gte('transaction_date', `${currentYear}-01-01`)
        .lte('transaction_date', `${currentYear}-12-31`);

      setStats({
        totalCollected: yearData?.reduce((sum, t) => sum + t.amount, 0) || 0,
        totalTransactions: yearData?.length || 0,
        thisMonthCollected: monthData?.reduce((sum, t) => sum + t.amount, 0) || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = () => {
    loadTransactions();
  };

  const viewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptDialog(true);
  };

  const handlePrintReceipt = () => {
    const printContents = document.getElementById('receipt-print-area');
    if (!printContents) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
            .receipt-container { max-width: 80mm; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="receipt-container">${printContents.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportPDF = async () => {
    const receiptElement = document.getElementById('receipt-print-area');
    if (!receiptElement) return;

    try {
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150]
      });
      
      const imgWidth = 76;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 2, 2, imgWidth, imgHeight);
      pdf.save(`receipt-${selectedTransaction?.transaction_number || 'download'}.pdf`);
      toast.success('Receipt downloaded');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getReceiptData = (transaction: Transaction) => {
    if (!transaction) return null;

    // Calculate amounts from transaction
    const students = transaction.line_items?.map(li => ({
      name: li.student?.name || li.description.split(' - ')[0],
      studentId: li.student?.student_id || '',
      class: li.student?.class,
      amount: li.amount,
      description: li.description
    })) || [];

    return {
      transactionNumber: transaction.transaction_number,
      parentName: transaction.parent?.father_name || 'N/A',
      parentId: transaction.parent?.parent_id || '',
      phone: transaction.parent?.phone || '',
      previousBalance: 0, // Not available in history
      totalCharged: transaction.transaction_type === 'charge' ? transaction.amount : 0,
      cashReceived: transaction.transaction_type === 'payment' ? transaction.amount : 0,
      newBalance: 0, // Not available in history
      students,
      paymentDate: formatDate(transaction.transaction_date),
      paymentMethod: transaction.payment_method || 'cash',
      notes: transaction.notes,
      months: transaction.line_items
        ?.filter(li => li.month)
        .map(li => li.month!) || []
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 mt-20">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mt-4">Fee Management</h1>
          <p className="text-muted-foreground">View fee records, reprint receipts, and manage transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <ReceiptIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month Collection</p>
                  <p className="text-2xl font-bold">Rs.{stats.thisMonthCollected.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year Total ({filterYear})</p>
                  <p className="text-2xl font-bold">Rs.{stats.totalCollected.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by receipt #, parent name, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="charge">Charges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setFilterMonth('all');
                setFilterYear(new Date().getFullYear().toString());
                setFilterType('all');
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.transaction_number?.slice(-8)}
                        </TableCell>
                        <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.parent?.father_name}</div>
                            <div className="text-xs text-muted-foreground">{transaction.parent?.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.transaction_type === 'payment' ? 'default' : 'secondary'}>
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          Rs.{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">
                          {transaction.payment_method?.replace('_', ' ') || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewReceipt(transaction)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/fee-collection')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ReceiptIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Collect Fee</h3>
                  <p className="text-sm text-muted-foreground">Record new payment</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/manage-collections')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Collections</h3>
                  <p className="text-sm text-muted-foreground">Custom fee collections</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/reports')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Fee Reports</h3>
                  <p className="text-sm text-muted-foreground">View financial reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <>
              <div ref={receiptRef}>
                <Receipt {...getReceiptData(selectedTransaction)!} />
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeManagement;
