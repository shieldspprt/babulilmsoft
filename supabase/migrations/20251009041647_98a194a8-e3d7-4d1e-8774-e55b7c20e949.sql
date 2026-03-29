-- Fix RLS policies for teachers and classes to allow proper inserts and staff read-only access

-- TEACHERS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can view teachers" ON public.teachers;

-- Allow staff and admins to view teachers
CREATE POLICY "Admin/staff can view teachers"
ON public.teachers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Allow only admins to insert teachers
CREATE POLICY "Admins can insert teachers"
ON public.teachers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow only admins to update teachers
CREATE POLICY "Admins can update teachers"
ON public.teachers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow only admins to delete teachers
CREATE POLICY "Admins can delete teachers"
ON public.teachers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- CLASSES TABLE POLICIES
-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Admins can insert classes" ON public.classes;

-- Add explicit INSERT policy for admins (required for RLS on INSERT)
CREATE POLICY "Admins can insert classes"
ON public.classes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add explicit UPDATE policy for admins
DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
CREATE POLICY "Admins can update classes"
ON public.classes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add explicit DELETE policy for admins
DROP POLICY IF EXISTS "Admins can delete classes" ON public.classes;
CREATE POLICY "Admins can delete classes"
ON public.classes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));