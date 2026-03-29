-- Create teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  cnic TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  education TEXT NOT NULL,
  institute TEXT NOT NULL,
  home_address TEXT NOT NULL,
  personal_phone TEXT NOT NULL,
  home_phone TEXT,
  assigned_class TEXT,
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create sequence for teacher ID generation
CREATE SEQUENCE IF NOT EXISTS public.teacher_counter START 1;

-- Function to generate teacher ID
CREATE OR REPLACE FUNCTION public.generate_teacher_id(first_name TEXT, last_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  counter INTEGER;
  year_suffix TEXT;
  initials TEXT;
  fname_initial TEXT;
  lname_initial TEXT;
BEGIN
  counter := nextval('public.teacher_counter');
  year_suffix := SUBSTRING(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT FROM 3 FOR 2);
  
  fname_initial := UPPER(SUBSTRING(TRIM(first_name) FROM 1 FOR 1));
  lname_initial := UPPER(SUBSTRING(TRIM(last_name) FROM 1 FOR 1));
  initials := fname_initial || lname_initial;
  
  RETURN 'T' || LPAD(counter::TEXT, 4, '0') || '-' || year_suffix || initials;
END;
$$;

-- Enable RLS on teachers table
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- RLS policies for teachers (admin-only access)
CREATE POLICY "Admins can manage teachers"
ON public.teachers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view teachers"
ON public.teachers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add teacher_id column to classes table
ALTER TABLE public.classes
ADD COLUMN teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Update RLS policies for classes table
DROP POLICY IF EXISTS "Admin/staff can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Only admin/staff can view classes" ON public.classes;

CREATE POLICY "Admins can manage classes"
ON public.classes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view classes"
ON public.classes
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));