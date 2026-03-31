-- Add discount fields to students table
-- Run this in Supabase SQL Editor

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'amount')),
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES public.discounts(id) ON DELETE SET NULL;
