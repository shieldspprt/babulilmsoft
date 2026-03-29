-- Add missing SELECT policies for all sensitive tables
-- These policies ensure data is only readable by authenticated admin/staff users

-- Parents table - contains sensitive PII (CNICs, phone numbers, addresses)
CREATE POLICY "Only admin/staff can view parents"
ON public.parents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Students table - contains children's personal information
CREATE POLICY "Only admin/staff can view students"
ON public.students FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Fee payments table - contains financial transaction history
CREATE POLICY "Only admin/staff can view payments"
ON public.fee_payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Student concessions table - contains sensitive discount information
CREATE POLICY "Only admin/staff can view concessions"
ON public.student_concessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Sibling discounts table - contains family discount arrangements
CREATE POLICY "Only admin/staff can view sibling discounts"
ON public.sibling_discounts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Classes table - contains business-sensitive fee structure
CREATE POLICY "Only admin/staff can view classes"
ON public.classes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Concession categories table - contains discount framework
CREATE POLICY "Only admin/staff can view categories"
ON public.concession_categories FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));