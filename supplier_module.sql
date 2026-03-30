-- Supplier Module for ilmsoft

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  business_name text,
  contact_number text NOT NULL,
  address text,
  opening_balance integer DEFAULT 0,
  current_balance integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Schools can view their own suppliers
CREATE POLICY "Schools can view their own suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can insert their own suppliers
CREATE POLICY "Schools can insert their own suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can update their own suppliers
CREATE POLICY "Schools can update their own suppliers" ON public.suppliers
  FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can delete (soft) their own suppliers
CREATE POLICY "Schools can delete their own suppliers" ON public.suppliers
  FOR DELETE USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Function to update current_balance when opening_balance changes
CREATE OR REPLACE FUNCTION update_supplier_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- On insert or opening_balance update
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.opening_balance IS DISTINCT FROM NEW.opening_balance) THEN
    -- Set current_balance to opening_balance initially
    NEW.current_balance := NEW.opening_balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for balance update (before insert)
CREATE TRIGGER supplier_balance_trigger
  BEFORE INSERT ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_supplier_balance();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_school_id ON public.suppliers(school_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

-- Supplier Transactions Table
CREATE TABLE IF NOT EXISTS public.supplier_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    type varchar(20) NOT NULL CHECK (type IN ('bill', 'payment')),
    amount integer NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    bill_number varchar(100),
    payment_method varchar(50),
    description text NOT NULL,
    notes text,
    balance_after integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on supplier_transactions
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplier_transactions
DROP POLICY IF EXISTS supplier_tx_select ON public.supplier_transactions;
CREATE POLICY supplier_tx_select ON public.supplier_transactions
    FOR SELECT USING (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_tx_insert ON public.supplier_transactions;
CREATE POLICY supplier_tx_insert ON public.supplier_transactions
    FOR INSERT WITH CHECK (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_tx_update ON public.supplier_transactions;
CREATE POLICY supplier_tx_update ON public.supplier_transactions
    FOR UPDATE USING (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS supplier_tx_delete ON public.supplier_transactions;
CREATE POLICY supplier_tx_delete ON public.supplier_transactions
    FOR DELETE USING (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_school_id ON public.supplier_transactions(school_id);
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_supplier_id ON public.supplier_transactions(supplier_id);
