-- Create syllabus_types table
CREATE TABLE public.syllabus_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.syllabus_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for syllabus_types
CREATE POLICY "Admin/user can view syllabus types"
ON public.syllabus_types FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage syllabus types"
ON public.syllabus_types FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Insert default syllabus types
INSERT INTO public.syllabus_types (name) VALUES ('Oxford'), ('Voyage'), ('AlBakio');

-- Create book_items table (individual books)
CREATE TABLE public.book_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  syllabus_type_id UUID NOT NULL REFERENCES public.syllabus_types(id),
  class_name TEXT NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.book_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_items
CREATE POLICY "Admin/user can view book items"
ON public.book_items FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage book items"
ON public.book_items FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Create book_sets table
CREATE TABLE public.book_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  syllabus_type_id UUID NOT NULL REFERENCES public.syllabus_types(id),
  class_name TEXT NOT NULL,
  set_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.book_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_sets
CREATE POLICY "Admin/user can view book sets"
ON public.book_sets FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage book sets"
ON public.book_sets FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Create book_set_items table (links books to sets)
CREATE TABLE public.book_set_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_set_id UUID NOT NULL REFERENCES public.book_sets(id) ON DELETE CASCADE,
  book_item_id UUID NOT NULL REFERENCES public.book_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_set_id, book_item_id)
);

-- Enable RLS
ALTER TABLE public.book_set_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_set_items
CREATE POLICY "Admin/user can view book set items"
ON public.book_set_items FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage book set items"
ON public.book_set_items FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Create book_stock_transactions table (tracks stock changes)
CREATE TABLE public.book_stock_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_item_id UUID NOT NULL REFERENCES public.book_items(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'adjustment')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC,
  supplier_transaction_id UUID REFERENCES public.supplier_transactions(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.book_stock_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_stock_transactions
CREATE POLICY "Admin/user can view stock transactions"
ON public.book_stock_transactions FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin/user can insert stock transactions"
ON public.book_stock_transactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage stock transactions"
ON public.book_stock_transactions FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Create book_sales table
CREATE TABLE public.book_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  parent_id UUID NOT NULL REFERENCES public.parents(id),
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_transaction_id UUID REFERENCES public.account_transactions(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.book_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_sales
CREATE POLICY "Admin/user can view book sales"
ON public.book_sales FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin/user can insert book sales"
ON public.book_sales FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage book sales"
ON public.book_sales FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Create book_sale_items table
CREATE TABLE public.book_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_sale_id UUID NOT NULL REFERENCES public.book_sales(id) ON DELETE CASCADE,
  book_item_id UUID REFERENCES public.book_items(id),
  book_set_id UUID REFERENCES public.book_sets(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (book_item_id IS NOT NULL OR book_set_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.book_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_sale_items
CREATE POLICY "Admin/user can view book sale items"
ON public.book_sale_items FOR SELECT
USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin/user can insert book sale items"
ON public.book_sale_items FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'user')));

CREATE POLICY "Admin can manage book sale items"
ON public.book_sale_items FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'));

-- Add syllabus_type_id to classes table
ALTER TABLE public.classes 
ADD COLUMN syllabus_type_id UUID REFERENCES public.syllabus_types(id);

-- Create sequence for book sale numbers
CREATE SEQUENCE IF NOT EXISTS public.book_sale_counter START 1;

-- Create function to generate book sale number
CREATE OR REPLACE FUNCTION public.generate_book_sale_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter INTEGER;
  year TEXT;
BEGIN
  counter := nextval('public.book_sale_counter');
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  RETURN 'BS' || year || '-' || LPAD(counter::TEXT, 6, '0');
END;
$$;

-- Create trigger to update book_items stock on stock transaction
CREATE OR REPLACE FUNCTION public.update_book_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_type = 'purchase' THEN
    UPDATE public.book_items 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.book_item_id;
  ELSIF NEW.transaction_type = 'sale' THEN
    UPDATE public.book_items 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.book_item_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE public.book_items 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.book_item_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_book_stock_trigger
AFTER INSERT ON public.book_stock_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_book_stock();

-- Insert Book/Syllabus Sales income category
INSERT INTO public.account_categories (name, type, description, is_system)
VALUES ('Book/Syllabus Sales', 'income', 'Income from selling books and syllabus sets to students', true);