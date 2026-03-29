import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Package } from 'lucide-react';

const transactionSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(3, 'Description is required'),
  bill_number: z.string().optional(),
  payment_method: z.string().optional(),
  transaction_date: z.string(),
  notes: z.string().optional()
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface BookSetStockItem {
  setId: string;
  quantity: number;
  unitCost: number;
}

interface TransactionFormProps {
  supplierId: string;
  transactionType: 'bill' | 'payment';
  onSuccess: () => void;
}

export function TransactionForm({ supplierId, transactionType, onSuccess }: TransactionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addToStock, setAddToStock] = useState(false);
  const [bookSetStockItems, setBookSetStockItems] = useState<BookSetStockItem[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0]
    }
  });

  const paymentMethod = watch('payment_method');

  // Fetch book sets for stock addition
  const { data: bookSets = [] } = useQuery({
    queryKey: ['book-sets-for-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_sets')
        .select('id, name, class_name, set_price, unit_cost, syllabus_types(name)')
        .eq('is_active', true)
        .order('class_name')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: transactionType === 'bill',
  });

  const addBookSetItem = () => {
    setBookSetStockItems([...bookSetStockItems, { setId: '', quantity: 1, unitCost: 0 }]);
  };

  const removeBookSetItem = (index: number) => {
    setBookSetStockItems(bookSetStockItems.filter((_, i) => i !== index));
  };

  const updateBookSetItem = (index: number, field: keyof BookSetStockItem, value: string | number) => {
    const updated = [...bookSetStockItems];
    if (field === 'setId') {
      updated[index].setId = value as string;
      // Auto-fill unit cost from set data
      const set = bookSets.find(s => s.id === value);
      if (set) {
        updated[index].unitCost = set.unit_cost || set.set_price;
      }
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value as string) || 1;
    } else if (field === 'unitCost') {
      updated[index].unitCost = parseFloat(value as string) || 0;
    }
    setBookSetStockItems(updated);
  };

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      // Insert supplier transaction
      const { data: transaction, error } = await supabase
        .from('supplier_transactions')
        .insert({
          supplier_id: supplierId,
          transaction_type: transactionType,
          amount: parseFloat(data.amount),
          description: data.description,
          bill_number: data.bill_number || null,
          payment_method: transactionType === 'payment' ? data.payment_method : null,
          transaction_date: data.transaction_date,
          notes: data.notes || null,
          recorded_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // If this is a bill and we're adding to stock
      if (transactionType === 'bill' && addToStock && bookSetStockItems.length > 0) {
        for (const item of bookSetStockItems) {
          if (item.setId && item.quantity > 0) {
            const { error: stockError } = await supabase
              .from('book_stock_transactions')
              .insert({
                book_set_id: item.setId,
                transaction_type: 'purchase',
                quantity: item.quantity,
                unit_cost: item.unitCost,
                supplier_transaction_id: transaction.id,
                notes: `Purchased from supplier - Bill #${data.bill_number || 'N/A'}`,
                created_by: user?.id
              });
            if (stockError) throw stockError;
          }
        }
      }

      toast.success(`${transactionType === 'bill' ? 'Bill' : 'Payment'} recorded successfully`);
      reset();
      setAddToStock(false);
      setBookSetStockItems([]);
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to record transaction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {transactionType === 'bill' ? 'Record Bill Received' : 'Record Payment Made'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rs.) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="Enter amount"
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Date *</Label>
              <Input
                id="transaction_date"
                type="date"
                {...register('transaction_date')}
              />
              {errors.transaction_date && <p className="text-sm text-destructive">{errors.transaction_date.message}</p>}
            </div>
          </div>

          {transactionType === 'bill' && (
            <div className="space-y-2">
              <Label htmlFor="bill_number">Bill/Invoice Number</Label>
              <Input
                id="bill_number"
                {...register('bill_number')}
                placeholder="External bill reference"
              />
            </div>
          )}

          {transactionType === 'payment' && (
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setValue('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder={transactionType === 'bill' ? 'Items/services received' : 'Payment purpose'}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional information"
              rows={2}
            />
          </div>

          {/* Book Set Stock Section - Only for Bills */}
          {transactionType === 'bill' && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addToStock"
                  checked={addToStock}
                  onCheckedChange={(checked) => {
                    setAddToStock(checked as boolean);
                    if (!checked) setBookSetStockItems([]);
                  }}
                />
                <label htmlFor="addToStock" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Add book sets to stock from this bill
                </label>
              </div>

              {addToStock && (
                <div className="space-y-3">
                  {bookSetStockItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">Book Set</Label>
                        <Select
                          value={item.setId}
                          onValueChange={(v) => updateBookSetItem(index, 'setId', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select book set" />
                          </SelectTrigger>
                          <SelectContent>
                            {bookSets.map((set: any) => (
                              <SelectItem key={set.id} value={set.id}>
                                {set.name} ({set.class_name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          className="h-9"
                          value={item.quantity}
                          onChange={(e) => updateBookSetItem(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Unit Cost</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-9"
                          value={item.unitCost}
                          onChange={(e) => updateBookSetItem(index, 'unitCost', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 text-destructive"
                          onClick={() => removeBookSetItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addBookSetItem}>
                    + Add Book Set
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : transactionType === 'bill' ? 'Record Bill' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
