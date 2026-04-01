-- =====================================================
-- FEE MODULE v4 — Migration (Subscription Model)
-- Run this in Supabase SQL Editor
-- =====================================================
--
-- WHAT THIS DOES:
-- 1. Drops the old fee_bills table (no longer needed)
-- 2. Ensures fee_payments table exists with correct schema + RLS
-- 3. No pre-generated bills. Balance computed in JS from payment history.
--

-- 1. Drop fee_bills table (old approach — bill generation)
DROP TABLE IF EXISTS public.fee_bills CASCADE;

-- 2. fee_payments — the ONLY fee table we need now
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      uuid NOT NULL,
  parent_id      uuid NOT NULL,
  amount         integer NOT NULL CHECK (amount > 0),
  months_paid    text[] NOT NULL,
  months_count   integer NOT NULL,
  payment_date   date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'Cash',
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- 3. RLS Policies (per-operation for reliability)
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fee_payments_select" ON public.fee_payments;
CREATE POLICY "fee_payments_select" ON public.fee_payments FOR SELECT
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "fee_payments_insert" ON public.fee_payments;
CREATE POLICY "fee_payments_insert" ON public.fee_payments FOR INSERT
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "fee_payments_delete" ON public.fee_payments;
CREATE POLICY "fee_payments_delete" ON public.fee_payments FOR DELETE
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_fee_payments_parent
  ON public.fee_payments(parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fee_payments_school
  ON public.fee_payments(school_id);
