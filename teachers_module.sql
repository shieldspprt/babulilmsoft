-- Teachers Module for ilmsoft
-- Run this in Supabase SQL Editor

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  cnic text,
  gender text,
  personal_contact text,
  home_contact text,
  address text,
  education text,
  salary integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teachers_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Schools can only see their own teachers
DROP POLICY IF EXISTS "Schools can view their own teachers" ON public.teachers;
CREATE POLICY "Schools can view their own teachers" 
ON public.teachers FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can create teachers
DROP POLICY IF EXISTS "Schools can create teachers" ON public.teachers;
CREATE POLICY "Schools can create teachers" 
ON public.teachers FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can update their teachers
DROP POLICY IF EXISTS "Schools can update their teachers" ON public.teachers;
CREATE POLICY "Schools can update their teachers" 
ON public.teachers FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can delete their teachers
DROP POLICY IF EXISTS "Schools can delete their teachers" ON public.teachers;
CREATE POLICY "Schools can delete their teachers" 
ON public.teachers FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));