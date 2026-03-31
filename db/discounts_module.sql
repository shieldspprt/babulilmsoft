-- Discounts Module for ilmsoft
-- Run this in Supabase SQL Editor

-- Create discounts table
CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'amount')),
  value integer NOT NULL CHECK (value > 0),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discounts_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Schools can view their own discounts
DROP POLICY IF EXISTS "Schools can view their own discounts" ON public.discounts;
CREATE POLICY "Schools can view their own discounts"
ON public.discounts FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can create discounts
DROP POLICY IF EXISTS "Schools can create discounts" ON public.discounts;
CREATE POLICY "Schools can create discounts"
ON public.discounts FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can update their discounts
DROP POLICY IF EXISTS "Schools can update their discounts" ON public.discounts;
CREATE POLICY "Schools can update their discounts"
ON public.discounts FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can delete their discounts
DROP POLICY IF EXISTS "Schools can delete their discounts" ON public.discounts;
CREATE POLICY "Schools can delete their discounts"
ON public.discounts FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discounts_updated_at ON public.discounts;
CREATE TRIGGER discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
