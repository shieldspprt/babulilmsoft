-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Create account_categories table
CREATE TABLE public.account_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account_transactions table
CREATE TABLE public.account_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type public.transaction_type NOT NULL,
  category_id UUID NOT NULL REFERENCES public.account_categories(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  receipt_number TEXT,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_categories
CREATE POLICY "Admin/staff can view categories"
ON public.account_categories
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin can manage categories"
ON public.account_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for account_transactions
CREATE POLICY "Admin/staff can view transactions"
ON public.account_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can record transactions"
ON public.account_transactions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin can manage transactions"
ON public.account_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default income categories
INSERT INTO public.account_categories (name, type, description, is_system) VALUES
('Canteen', 'income', 'Income from school canteen', true),
('Stationary', 'income', 'Income from stationary sales', true),
('Other Income', 'income', 'Other miscellaneous income', true);

-- Insert default expense categories
INSERT INTO public.account_categories (name, type, description, is_system) VALUES
('Food', 'expense', 'Food and refreshment expenses', true),
('Gifts', 'expense', 'Gift and appreciation expenses', true),
('Home', 'expense', 'Home and facility maintenance', true),
('Building', 'expense', 'Building repairs and construction', true),
('Transportation', 'expense', 'Transportation and vehicle costs', true),
('Stationary', 'expense', 'Stationary and office supplies', true),
('Overtime', 'expense', 'Overtime payments to staff', true),
('Utilities', 'expense', 'Electricity, water, gas bills', true),
('Travel', 'expense', 'Travel and accommodation expenses', true),
('Salaries', 'expense', 'Staff salary payments', true),
('Other Expense', 'expense', 'Other miscellaneous expenses', true),
('Debt', 'expense', 'Debt repayments', true),
('Payables', 'expense', 'Outstanding payables', true),
('Medical', 'expense', 'Medical and health expenses', true),
('Canteen', 'expense', 'Canteen operation expenses', true);