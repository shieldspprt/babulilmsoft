-- Create sequences for auto-generated IDs
CREATE SEQUENCE IF NOT EXISTS public.supplier_counter START 1;
CREATE SEQUENCE IF NOT EXISTS public.supplier_transaction_counter START 1;

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  address TEXT,
  cnic TEXT,
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  total_billed NUMERIC DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create supplier_transactions table
CREATE TABLE public.supplier_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('bill', 'payment')),
  transaction_number TEXT NOT NULL UNIQUE DEFAULT generate_transaction_number(),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  bill_number TEXT,
  payment_method TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Function to generate supplier ID
CREATE OR REPLACE FUNCTION public.generate_supplier_id(supplier_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter INTEGER;
  year_suffix TEXT;
  initials TEXT;
  name_parts TEXT[];
BEGIN
  counter := nextval('public.supplier_counter');
  year_suffix := SUBSTRING(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT FROM 3 FOR 2);
  
  name_parts := regexp_split_to_array(TRIM(supplier_name), '\s+');
  IF array_length(name_parts, 1) >= 2 THEN
    initials := UPPER(SUBSTRING(name_parts[1] FROM 1 FOR 1) || SUBSTRING(name_parts[array_length(name_parts, 1)] FROM 1 FOR 1));
  ELSE
    initials := UPPER(SUBSTRING(supplier_name FROM 1 FOR 2));
  END IF;
  
  RETURN 'SUP' || LPAD(counter::TEXT, 4, '0') || '-' || year_suffix || initials;
END;
$$;

-- Function to generate supplier transaction number
CREATE OR REPLACE FUNCTION public.generate_supplier_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter INTEGER;
  year TEXT;
BEGIN
  counter := nextval('public.supplier_transaction_counter');
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  RETURN 'STXN' || year || '-' || LPAD(counter::TEXT, 6, '0');
END;
$$;

-- Trigger function to update supplier balance
CREATE OR REPLACE FUNCTION public.update_supplier_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'bill' THEN
    UPDATE public.suppliers 
    SET 
      current_balance = current_balance + NEW.amount,
      total_billed = total_billed + NEW.amount
    WHERE id = NEW.supplier_id;
  ELSIF NEW.transaction_type = 'payment' THEN
    UPDATE public.suppliers 
    SET 
      current_balance = current_balance - NEW.amount,
      total_paid = total_paid + NEW.amount
    WHERE id = NEW.supplier_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for supplier balance updates
CREATE TRIGGER update_supplier_balance_trigger
AFTER INSERT ON public.supplier_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_supplier_balance();

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Admin/staff can view suppliers"
ON public.suppliers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can update suppliers"
ON public.suppliers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin can delete suppliers"
ON public.suppliers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for supplier_transactions
CREATE POLICY "Admin/staff can view supplier transactions"
ON public.supplier_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can insert supplier transactions"
ON public.supplier_transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin can manage supplier transactions"
ON public.supplier_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));