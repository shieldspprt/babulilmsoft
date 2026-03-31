-- Supplier Transactions Module

CREATE TABLE IF NOT EXISTS public.supplier_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bill', 'payment')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  notes text,
  payment_method text,
  bill_number text,
  balance_after numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Schools can view their supplier transactions"
  ON public.supplier_transactions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

CREATE POLICY "Schools can insert their supplier transactions"
  ON public.supplier_transactions FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Indexes
CREATE INDEX idx_supplier_transactions_school ON public.supplier_transactions(school_id);
CREATE INDEX idx_supplier_transactions_supplier ON public.supplier_transactions(supplier_id);
CREATE INDEX idx_supplier_transactions_date ON public.supplier_transactions(date DESC);

-- Function to update supplier balance after transaction
CREATE OR REPLACE FUNCTION public.update_supplier_balance()
RETURNS trigger AS $$
DECLARE
  current_bal numeric(12,2);
  new_bal numeric(12,2);
BEGIN
  -- Get current balance
  SELECT current_balance INTO current_bal
  FROM public.suppliers
  WHERE id = NEW.supplier_id;

  -- Calculate new balance
  IF NEW.type = 'bill' THEN
    new_bal := current_bal + NEW.amount;
  ELSE -- payment
    new_bal := current_bal - NEW.amount;
  END IF;

  -- Update supplier balance
  UPDATE public.suppliers
  SET current_balance = new_bal,
      total_billed = CASE WHEN NEW.type = 'bill' THEN total_billed + NEW.amount ELSE total_billed END,
      total_paid = CASE WHEN NEW.type = 'payment' THEN total_paid + NEW.amount ELSE total_paid END,
      updated_at = now()
  WHERE id = NEW.supplier_id;

  -- Set balance_after on transaction
  NEW.balance_after := new_bal;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_supplier_balance_on_transaction
  BEFORE INSERT ON public.supplier_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_balance();

-- Function to recalculate balance if transaction deleted
CREATE OR REPLACE FUNCTION public.recalculate_supplier_balance()
RETURNS trigger AS $$
BEGIN
  UPDATE public.suppliers
  SET current_balance = opening_balance,
      total_billed = 0,
      total_paid = 0,
      updated_at = now()
  WHERE id = OLD.supplier_id;

  -- Recalculate from remaining transactions
  UPDATE public.suppliers s
  SET total_billed = COALESCE((
    SELECT SUM(amount) FROM public.supplier_transactions 
    WHERE supplier_id = s.id AND type = 'bill'
  ), 0),
      total_paid = COALESCE((
    SELECT SUM(amount) FROM public.supplier_transactions 
    WHERE supplier_id = s.id AND type = 'payment'
  ), 0),
      current_balance = s.opening_balance + COALESCE((
    SELECT SUM(CASE WHEN type = 'bill' THEN amount ELSE -amount END) 
    FROM public.supplier_transactions 
    WHERE supplier_id = s.id
  ), 0)
  WHERE id = OLD.supplier_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalculate_supplier_balance_on_delete
  AFTER DELETE ON public.supplier_transactions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_supplier_balance();

