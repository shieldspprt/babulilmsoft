-- Create sequence for transaction numbers FIRST
CREATE SEQUENCE IF NOT EXISTS public.transaction_counter START 1;

-- Create function to generate transaction numbers BEFORE using it
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
  counter INTEGER;
  year TEXT;
BEGIN
  counter := nextval('public.transaction_counter');
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  RETURN 'TXN' || year || '-' || LPAD(counter::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Now create parent_transactions table
CREATE TABLE IF NOT EXISTS public.parent_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE DEFAULT generate_transaction_number(),
  parent_id UUID NOT NULL REFERENCES public.parents(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'payment')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  description TEXT NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_line_items table
CREATE TABLE IF NOT EXISTS public.transaction_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.parent_transactions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id),
  item_type TEXT NOT NULL CHECK (item_type IN ('monthly_fee', 'collection', 'balance_adjustment')),
  month TEXT,
  collection_id UUID REFERENCES public.collections(id),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Modify parents table
ALTER TABLE public.parents 
  ADD COLUMN IF NOT EXISTS current_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_charged NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0;

-- Migrate credit_balance to current_balance (negative balance = credit)
UPDATE public.parents 
SET current_balance = COALESCE(-credit_balance, 0)
WHERE credit_balance IS NOT NULL AND credit_balance != 0;

-- Update remaining rows
UPDATE public.parents 
SET current_balance = 0
WHERE current_balance IS NULL;

-- Drop credit_balance column
ALTER TABLE public.parents DROP COLUMN IF EXISTS credit_balance;

-- Create trigger function to auto-update parent balance
CREATE OR REPLACE FUNCTION public.update_parent_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'charge' THEN
    UPDATE public.parents 
    SET 
      current_balance = current_balance + NEW.amount,
      total_charged = total_charged + NEW.amount
    WHERE id = NEW.parent_id;
  ELSIF NEW.transaction_type = 'payment' THEN
    UPDATE public.parents 
    SET 
      current_balance = current_balance - NEW.amount,
      total_paid = total_paid + NEW.amount
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS on_transaction_insert ON public.parent_transactions;
CREATE TRIGGER on_transaction_insert
  AFTER INSERT ON public.parent_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parent_balance();

-- Enable RLS on new tables
ALTER TABLE public.parent_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for parent_transactions
CREATE POLICY "Admin/staff can view transactions" 
ON public.parent_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can insert transactions" 
ON public.parent_transactions 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin can manage transactions" 
ON public.parent_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for transaction_line_items
CREATE POLICY "Admin/staff can view line items" 
ON public.transaction_line_items 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can insert line items" 
ON public.transaction_line_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin can manage line items" 
ON public.transaction_line_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parent_transactions_parent_id ON public.parent_transactions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_transactions_date ON public.parent_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_line_items_transaction_id ON public.transaction_line_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_line_items_student_id ON public.transaction_line_items(student_id);