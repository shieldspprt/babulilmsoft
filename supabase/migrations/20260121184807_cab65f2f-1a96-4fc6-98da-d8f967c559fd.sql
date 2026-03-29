-- Update students table policies
DROP POLICY IF EXISTS "Only admin/staff can view students" ON public.students;
DROP POLICY IF EXISTS "Admin/staff can manage students" ON public.students;

CREATE POLICY "Only admin/user can view students" ON public.students
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage students" ON public.students
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update parents table policies
DROP POLICY IF EXISTS "Only admin/staff can view parents" ON public.parents;
DROP POLICY IF EXISTS "Admin/staff can manage parents" ON public.parents;

CREATE POLICY "Only admin/user can view parents" ON public.parents
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage parents" ON public.parents
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update fee_payments table policies
DROP POLICY IF EXISTS "Only admin/staff can view payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Admin/staff can manage payments" ON public.fee_payments;

CREATE POLICY "Only admin/user can view payments" ON public.fee_payments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage payments" ON public.fee_payments
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update classes table policies
DROP POLICY IF EXISTS "Staff can view classes" ON public.classes;

CREATE POLICY "User can view classes" ON public.classes
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update collections table policies
DROP POLICY IF EXISTS "Admin/staff can view collections" ON public.collections;
DROP POLICY IF EXISTS "Admin/staff can manage collections" ON public.collections;

CREATE POLICY "Admin/user can view collections" ON public.collections
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage collections" ON public.collections
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update collection_payments table policies
DROP POLICY IF EXISTS "Admin/staff can view collection payments" ON public.collection_payments;
DROP POLICY IF EXISTS "Admin/staff can manage collection payments" ON public.collection_payments;

CREATE POLICY "Admin/user can view collection payments" ON public.collection_payments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage collection payments" ON public.collection_payments
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update teachers table policies
DROP POLICY IF EXISTS "Admin/staff can view teachers" ON public.teachers;

CREATE POLICY "Admin/user can view teachers" ON public.teachers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update suppliers table policies
DROP POLICY IF EXISTS "Admin/staff can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin/staff can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admin/staff can update suppliers" ON public.suppliers;

CREATE POLICY "Admin/user can view suppliers" ON public.suppliers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can insert suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can update suppliers" ON public.suppliers
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update supplier_transactions table policies
DROP POLICY IF EXISTS "Admin/staff can view supplier transactions" ON public.supplier_transactions;
DROP POLICY IF EXISTS "Admin/staff can insert supplier transactions" ON public.supplier_transactions;

CREATE POLICY "Admin/user can view supplier transactions" ON public.supplier_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can insert supplier transactions" ON public.supplier_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update parent_transactions table policies
DROP POLICY IF EXISTS "Admin/staff can view parent transactions" ON public.parent_transactions;
DROP POLICY IF EXISTS "Admin/staff can insert parent transactions" ON public.parent_transactions;

CREATE POLICY "Admin/user can view parent transactions" ON public.parent_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can insert parent transactions" ON public.parent_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update transaction_line_items table policies
DROP POLICY IF EXISTS "Admin/staff can view line items" ON public.transaction_line_items;
DROP POLICY IF EXISTS "Admin/staff can insert line items" ON public.transaction_line_items;

CREATE POLICY "Admin/user can view line items" ON public.transaction_line_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can insert line items" ON public.transaction_line_items
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update account_transactions table policies
DROP POLICY IF EXISTS "Admin/staff can view transactions" ON public.account_transactions;
DROP POLICY IF EXISTS "Admin/staff can record transactions" ON public.account_transactions;

CREATE POLICY "Admin/user can view transactions" ON public.account_transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can record transactions" ON public.account_transactions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update account_categories table policies
DROP POLICY IF EXISTS "Admin/staff can view categories" ON public.account_categories;

CREATE POLICY "Admin/user can view categories" ON public.account_categories
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update student_concessions table policies
DROP POLICY IF EXISTS "Only admin/staff can view concessions" ON public.student_concessions;
DROP POLICY IF EXISTS "Admin/staff can manage concessions" ON public.student_concessions;

CREATE POLICY "Only admin/user can view concessions" ON public.student_concessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage concessions" ON public.student_concessions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update sibling_discounts table policies
DROP POLICY IF EXISTS "Only admin/staff can view sibling discounts" ON public.sibling_discounts;
DROP POLICY IF EXISTS "Admin/staff can manage sibling discounts" ON public.sibling_discounts;

CREATE POLICY "Only admin/user can view sibling discounts" ON public.sibling_discounts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage sibling discounts" ON public.sibling_discounts
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

-- Update concession_categories table policies
DROP POLICY IF EXISTS "Only admin/staff can view categories" ON public.concession_categories;
DROP POLICY IF EXISTS "Admin/staff can manage concession categories" ON public.concession_categories;

CREATE POLICY "Only admin/user can view concession categories" ON public.concession_categories
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );

CREATE POLICY "Admin/user can manage concession categories" ON public.concession_categories
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'user'::app_role)
    )
  );