-- Fix 1: Convert student_outstanding_collections view to SECURITY INVOKER function
-- This provides explicit security by using the caller's permissions

-- First drop the existing view
DROP VIEW IF EXISTS public.student_outstanding_collections;

-- Create a SECURITY INVOKER function instead
CREATE OR REPLACE FUNCTION public.get_student_outstanding_collections()
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  class TEXT,
  parent_id UUID,
  collection_id UUID,
  collection_name TEXT,
  description TEXT,
  suggested_amount NUMERIC,
  amount_paid NUMERIC,
  outstanding_amount NUMERIC
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT 
    s.id AS student_id,
    s.name AS student_name,
    s.class,
    s.parent_id,
    c.id AS collection_id,
    c.name AS collection_name,
    c.description,
    c.amount AS suggested_amount,
    COALESCE(SUM(cp.amount_paid), 0) AS amount_paid,
    c.amount - COALESCE(SUM(cp.amount_paid), 0) AS outstanding_amount
  FROM students s
  CROSS JOIN collections c
  LEFT JOIN collection_payments cp 
    ON cp.student_id = s.id 
    AND cp.collection_id = c.id
  WHERE s.is_active = true 
    AND c.is_active = true
    AND (
      c.is_class_specific = false 
      OR s.class = ANY(c.class_names)
    )
  GROUP BY s.id, s.name, s.class, s.parent_id, c.id, c.name, c.description, c.amount
  HAVING c.amount - COALESCE(SUM(cp.amount_paid), 0) > 0
$$;

-- Fix 2: Update all RLS policies to add explicit authentication checks
-- This adds defense in depth by checking auth.uid() IS NOT NULL

-- user_roles table
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- classes table
DROP POLICY IF EXISTS "Admins can delete classes" ON public.classes;
CREATE POLICY "Admins can delete classes" ON public.classes
FOR DELETE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert classes" ON public.classes;
CREATE POLICY "Admins can insert classes" ON public.classes
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
CREATE POLICY "Admins can update classes" ON public.classes
FOR UPDATE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Staff can view classes" ON public.classes;
CREATE POLICY "Staff can view classes" ON public.classes
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- parents table
DROP POLICY IF EXISTS "Admin/staff can manage parents" ON public.parents;
CREATE POLICY "Admin/staff can manage parents" ON public.parents
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Only admin/staff can view parents" ON public.parents;
CREATE POLICY "Only admin/staff can view parents" ON public.parents
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- students table
DROP POLICY IF EXISTS "Admin/staff can manage students" ON public.students;
CREATE POLICY "Admin/staff can manage students" ON public.students
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Only admin/staff can view students" ON public.students;
CREATE POLICY "Only admin/staff can view students" ON public.students
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- fee_payments table
DROP POLICY IF EXISTS "Admin/staff can manage payments" ON public.fee_payments;
CREATE POLICY "Admin/staff can manage payments" ON public.fee_payments
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Only admin/staff can view payments" ON public.fee_payments;
CREATE POLICY "Only admin/staff can view payments" ON public.fee_payments
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- collections table
DROP POLICY IF EXISTS "Admin/staff can manage collections" ON public.collections;
CREATE POLICY "Admin/staff can manage collections" ON public.collections
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view collections" ON public.collections;
CREATE POLICY "Admin/staff can view collections" ON public.collections
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- collection_payments table
DROP POLICY IF EXISTS "Admin/staff can manage collection payments" ON public.collection_payments;
CREATE POLICY "Admin/staff can manage collection payments" ON public.collection_payments
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view collection payments" ON public.collection_payments;
CREATE POLICY "Admin/staff can view collection payments" ON public.collection_payments
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- student_concessions table
DROP POLICY IF EXISTS "Admin/staff can manage concessions" ON public.student_concessions;
CREATE POLICY "Admin/staff can manage concessions" ON public.student_concessions
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Only admin/staff can view concessions" ON public.student_concessions;
CREATE POLICY "Only admin/staff can view concessions" ON public.student_concessions
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- sibling_discounts table
DROP POLICY IF EXISTS "Admin/staff can manage sibling discounts" ON public.sibling_discounts;
CREATE POLICY "Admin/staff can manage sibling discounts" ON public.sibling_discounts
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Only admin/staff can view sibling discounts" ON public.sibling_discounts;
CREATE POLICY "Only admin/staff can view sibling discounts" ON public.sibling_discounts
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- concession_categories table
DROP POLICY IF EXISTS "Admin/staff can manage concession categories" ON public.concession_categories;
CREATE POLICY "Admin/staff can manage concession categories" ON public.concession_categories
FOR ALL USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Only admin/staff can view categories" ON public.concession_categories;
CREATE POLICY "Only admin/staff can view categories" ON public.concession_categories
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- suppliers table
DROP POLICY IF EXISTS "Admin can delete suppliers" ON public.suppliers;
CREATE POLICY "Admin can delete suppliers" ON public.suppliers
FOR DELETE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/staff can insert suppliers" ON public.suppliers;
CREATE POLICY "Admin/staff can insert suppliers" ON public.suppliers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can update suppliers" ON public.suppliers;
CREATE POLICY "Admin/staff can update suppliers" ON public.suppliers
FOR UPDATE USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view suppliers" ON public.suppliers;
CREATE POLICY "Admin/staff can view suppliers" ON public.suppliers
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- supplier_transactions table
DROP POLICY IF EXISTS "Admin can manage supplier transactions" ON public.supplier_transactions;
CREATE POLICY "Admin can manage supplier transactions" ON public.supplier_transactions
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/staff can insert supplier transactions" ON public.supplier_transactions;
CREATE POLICY "Admin/staff can insert supplier transactions" ON public.supplier_transactions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view supplier transactions" ON public.supplier_transactions;
CREATE POLICY "Admin/staff can view supplier transactions" ON public.supplier_transactions
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- account_transactions table
DROP POLICY IF EXISTS "Admin can manage transactions" ON public.account_transactions;
CREATE POLICY "Admin can manage transactions" ON public.account_transactions
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/staff can record transactions" ON public.account_transactions;
CREATE POLICY "Admin/staff can record transactions" ON public.account_transactions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view transactions" ON public.account_transactions;
CREATE POLICY "Admin/staff can view transactions" ON public.account_transactions
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- account_categories table
DROP POLICY IF EXISTS "Admin can manage categories" ON public.account_categories;
CREATE POLICY "Admin can manage categories" ON public.account_categories
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/staff can view categories" ON public.account_categories;
CREATE POLICY "Admin/staff can view categories" ON public.account_categories
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- teachers table
DROP POLICY IF EXISTS "Admin/staff can view teachers" ON public.teachers;
CREATE POLICY "Admin/staff can view teachers" ON public.teachers
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admins can delete teachers" ON public.teachers;
CREATE POLICY "Admins can delete teachers" ON public.teachers
FOR DELETE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert teachers" ON public.teachers;
CREATE POLICY "Admins can insert teachers" ON public.teachers
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update teachers" ON public.teachers;
CREATE POLICY "Admins can update teachers" ON public.teachers
FOR UPDATE USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- transaction_line_items table
DROP POLICY IF EXISTS "Admin can manage line items" ON public.transaction_line_items;
CREATE POLICY "Admin can manage line items" ON public.transaction_line_items
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/staff can insert line items" ON public.transaction_line_items;
CREATE POLICY "Admin/staff can insert line items" ON public.transaction_line_items
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view line items" ON public.transaction_line_items;
CREATE POLICY "Admin/staff can view line items" ON public.transaction_line_items
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- parent_transactions table
DROP POLICY IF EXISTS "Admin can manage transactions" ON public.parent_transactions;
CREATE POLICY "Admin can manage parent transactions" ON public.parent_transactions
FOR ALL USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/staff can insert transactions" ON public.parent_transactions;
CREATE POLICY "Admin/staff can insert parent transactions" ON public.parent_transactions
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

DROP POLICY IF EXISTS "Admin/staff can view transactions" ON public.parent_transactions;
CREATE POLICY "Admin/staff can view parent transactions" ON public.parent_transactions
FOR SELECT USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)));

-- balance_writeoffs table
DROP POLICY IF EXISTS "Only admins can create write-offs" ON public.balance_writeoffs;
CREATE POLICY "Only admins can create write-offs" ON public.balance_writeoffs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Only admins can view write-offs" ON public.balance_writeoffs;
CREATE POLICY "Only admins can view write-offs" ON public.balance_writeoffs
FOR SELECT USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));