-- Parents Module for ilmsoft
-- Run this in Supabase SQL Editor

-- Create parents table
CREATE TABLE IF NOT EXISTS public.parents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  cnic text,
  gender text DEFAULT 'Male',
  contact text NOT NULL,
  whatsapp text,
  email text,
  address text,
  occupation text,
  relation text DEFAULT 'Father',  -- Father, Mother, Guardian
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT parents_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Schools can only see their own parents
DROP POLICY IF EXISTS "Schools can view their own parents" ON public.parents;
CREATE POLICY "Schools can view their own parents"
ON public.parents FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can create parents
DROP POLICY IF EXISTS "Schools can create parents" ON public.parents;
CREATE POLICY "Schools can create parents"
ON public.parents FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can update their parents
DROP POLICY IF EXISTS "Schools can update their parents" ON public.parents;
CREATE POLICY "Schools can update their parents"
ON public.parents FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can delete their parents
DROP POLICY IF EXISTS "Schools can delete their parents" ON public.parents;
CREATE POLICY "Schools can delete their parents"
ON public.parents FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Admin can view all parents
DROP POLICY IF EXISTS "Admins can view all parents" ON public.parents;
CREATE POLICY "Admins can view all parents"
ON public.parents FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));
