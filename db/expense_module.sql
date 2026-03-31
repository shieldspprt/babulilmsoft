-- Expense Module for ilmsoft

CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.expense_categories(id),
  amount integer NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL,
  payment_method text NOT NULL DEFAULT 'Cash',
  description text NOT NULL,
  paid_by text NOT NULL,
  additional_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools can view their expense categories"
  ON public.expense_categories FOR SELECT
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "Schools can manage their expense categories"
  ON public.expense_categories FOR ALL
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "Schools can view their expenses"
  ON public.expenses FOR SELECT
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "Schools can manage their expenses"
  ON public.expenses FOR ALL
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- Trigger to create default expense categories
CREATE OR REPLACE FUNCTION public.create_default_expense_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.expense_categories (school_id, name, is_default) VALUES
    (NEW.id, 'Books', true),
    (NEW.id, 'Building', true),
    (NEW.id, 'Canteen', true),
    (NEW.id, 'Debt', true),
    (NEW.id, 'Food', true),
    (NEW.id, 'Gifts', true),
    (NEW.id, 'Home', true),
    (NEW.id, 'Medical', true),
    (NEW.id, 'Other Expense', true),
    (NEW.id, 'Overtime', true),
    (NEW.id, 'Payables', true),
    (NEW.id, 'Salaries', true),
    (NEW.id, 'Stationary', true),
    (NEW.id, 'Transportation', true),
    (NEW.id, 'Travel', true),
    (NEW.id, 'Utilities', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_school_created_expense_categories ON public.schools;
CREATE TRIGGER on_school_created_expense_categories
  AFTER INSERT ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.create_default_expense_categories();
