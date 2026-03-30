-- Classes Module for ilmsoft
-- Run this in Supabase SQL Editor

-- 1. Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g., "Playgroup", "Class 1", "Matric"
  display_order integer NOT NULL DEFAULT 0,
  monthly_fee integer NOT NULL DEFAULT 0,
  admission_fee integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_school_name_unique UNIQUE (school_id, name)
);

-- 2. Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Schools can view their own classes" ON public.classes;
CREATE POLICY "Schools can view their own classes" 
ON public.classes FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

DROP POLICY IF EXISTS "Schools can insert their own classes" ON public.classes;
CREATE POLICY "Schools can insert their own classes" 
ON public.classes FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

DROP POLICY IF EXISTS "Schools can update their own classes" ON public.classes;
CREATE POLICY "Schools can update their own classes" 
ON public.classes FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

DROP POLICY IF EXISTS "Schools can delete their own classes" ON public.classes;
CREATE POLICY "Schools can delete their own classes" 
ON public.classes FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- 4. Create default classes for new schools
CREATE OR REPLACE FUNCTION public.create_default_classes()
RETURNS trigger AS $$
DECLARE
  class_names text[] := ARRAY[
    'Playgroup', 'Nursery', 'Prep',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8',
    'Pre-Nine', 'Class 9', 'Class 10', 'Pass-Out'
  ];
  class_name text;
  display_ord integer := 1;
BEGIN
  FOREACH class_name IN ARRAY class_names
  LOOP
    INSERT INTO public.classes (school_id, name, display_order)
    VALUES (NEW.id, class_name, display_ord);
    display_ord := display_ord + 1;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to auto-create default classes when school profile is created
DROP TRIGGER IF EXISTS on_school_created ON public.schools;
CREATE TRIGGER on_school_created
  AFTER INSERT ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.create_default_classes();

-- 6. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
