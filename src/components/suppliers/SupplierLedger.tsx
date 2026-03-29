import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';

interface SupplierLedgerProps {
  supplierId: string;
}

export function SupplierLedger({ supplierId }: SupplierLedgerProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [supplierId]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_transactions')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate running balance
      let runningBalance = 0;
      const withBalance = (data || []).reverse().map(t => {
        if (t.transaction_type === 'bill') {
          runningBalance += Number(t.amount);
        } else {
          runningBalance -= Number(t.amount);
        }
        return { ...t, running_balance: runningBalance };
      }).reverse();

      setTransactions(withBalance);
    } catch (error: any) {
      toast.error('Failed to load transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading transaction history...
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No transactions recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History & Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Method/Bill #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Intl.DateTimeFormat('en-GB').format(new Date(transaction.transaction_date))}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {transaction.transaction_number}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.transaction_type === 'bill' ? 'destructive' : 'default'}
                      className={transaction.transaction_type === 'payment' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                    >
                      {transaction.transaction_type === 'bill' ? 'Bill' : 'Payment'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.description}
                    {transaction.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {transaction.notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transaction.transaction_type === 'bill' ? 'text-destructive' : 'text-green-600'}>
                      {transaction.transaction_type === 'bill' ? '+' : '-'}
                      Rs. {Number(transaction.amount).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    <span className={`${
                      transaction.running_balance > 0 ? 'text-destructive' : 
                      transaction.running_balance < 0 ? 'text-green-600' : 
                      'text-foreground'
                    }`}>
                      Rs. {Math.abs(transaction.running_balance).toLocaleString()}
                      {transaction.running_balance > 0 && ' (Payable)'}
                      {transaction.running_balance < 0 && ' (Receivable)'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {transaction.payment_method || transaction.bill_number || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
