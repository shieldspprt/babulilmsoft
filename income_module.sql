-- Income Module for ilmsoft

CREATE TABLE IF NOT EXISTS public.income_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.income_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.income_categories(id),
  amount integer NOT NULL CHECK (amount > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'Cash',
  description text NOT NULL DEFAULT '',
  additional_notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT payment_method_check CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Cheque', 'EasyPaisa', 'JazzCash'))
);

ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_cat_select" ON public.income_categories FOR SELECT USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
CREATE POLICY "income_cat_insert" ON public.income_categories FOR INSERT WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
CREATE POLICY "income_cat_delete" ON public.income_categories FOR DELETE USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "income_rec_select" ON public.income_records FOR SELECT USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
CREATE POLICY "income_rec_insert" ON public.income_records FOR INSERT WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
CREATE POLICY "income_rec_update" ON public.income_records FOR UPDATE USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
CREATE POLICY "income_rec_delete" ON public.income_records FOR DELETE USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
