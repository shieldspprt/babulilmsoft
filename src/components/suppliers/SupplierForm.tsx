import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  business_name: z.string().min(2, 'Business name is required'),
  contact: z.string().min(10, 'Valid contact number required'),
  address: z.string().optional(),
  cnic: z.string().optional(),
  opening_balance: z.string().optional()
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: any;
  onSave: () => void;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSave, onCancel }: SupplierFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier ? {
      name: supplier.name,
      business_name: supplier.business_name,
      contact: supplier.contact,
      address: supplier.address || '',
      cnic: supplier.cnic || '',
      opening_balance: supplier.opening_balance?.toString() || '0'
    } : {
      opening_balance: '0'
    }
  });

  const supplierName = watch('name');

  useEffect(() => {
    if (!supplier && supplierName && supplierName.length >= 2) {
      generateSupplierId(supplierName);
    }
  }, [supplierName, supplier]);

  const generateSupplierId = async (name: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_supplier_id', { supplier_name: name });
      if (error) throw error;
      setGeneratedId(data);
    } catch (error: any) {
      console.error('Error generating supplier ID:', error);
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    setLoading(true);
    try {
      const supplierData = {
        ...data,
        opening_balance: parseFloat(data.opening_balance || '0'),
        current_balance: parseFloat(data.opening_balance || '0'),
        created_by: user?.id
      };

      if (supplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', supplier.id);

        if (error) throw error;
        toast.success('Supplier updated successfully');
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([{
            name: data.name,
            business_name: data.business_name,
            contact: data.contact,
            address: data.address || null,
            cnic: data.cnic || null,
            supplier_id: generatedId,
            opening_balance: parseFloat(data.opening_balance || '0'),
            current_balance: parseFloat(data.opening_balance || '0'),
            created_by: user?.id
          }]);

        if (error) throw error;
        toast.success('Supplier added successfully');
      }

      onSave();
    } catch (error: any) {
      toast.error('Failed to save supplier: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!supplier && generatedId && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <Label className="text-sm font-medium">Generated Supplier ID</Label>
          <p className="text-lg font-mono font-bold text-primary">{generatedId}</p>
        </div>
      )}

      {supplier && (
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Supplier ID</Label>
          <p className="text-lg font-mono font-bold">{supplier.supplier_id}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Supplier Name *</Label>
          <Input id="name" {...register('name')} placeholder="Muhammad Ali" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input id="business_name" {...register('business_name')} placeholder="Ali Enterprises" />
          {errors.business_name && <p className="text-sm text-destructive">{errors.business_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Contact Number *</Label>
          <Input id="contact" {...register('contact')} placeholder="0300-1234567" />
          {errors.contact && <p className="text-sm text-destructive">{errors.contact.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnic">CNIC</Label>
          <Input id="cnic" {...register('cnic')} placeholder="12345-6789012-3" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...register('address')} placeholder="Complete address" rows={2} />
      </div>

      {!supplier && (
        <div className="space-y-2">
          <Label htmlFor="opening_balance">Opening Balance (if any)</Label>
          <Input 
            id="opening_balance" 
            type="number" 
            step="0.01"
            {...register('opening_balance')} 
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Positive = We owe them, Negative = They owe us
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Add Supplier'}
        </Button>
      </div>
    </form>
  );
}
