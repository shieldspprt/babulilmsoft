-- =====================================================
-- FEE MODULE — fee_payments table (Subscription Model)
-- Run this in Supabase SQL Editor
-- =====================================================
--
-- HOW IT WORKS:
-- 1. Child admitted → subscription starts from admission month
-- 2. Every month from admission → current month is "payable"
-- 3. Parent pays for 1 or more months (any amount)
-- 4. Underpaid? Balance carries forward. Overpaid? Advance carries forward.
-- 5. Balance is computed in JS — no bills table needed.
--
-- BALANCE FORMULA:
--   running_balance = (payable_months × monthly_fee) - total_paid
--     positive = parent owes money
--     negative = parent has advance
-- =====================================================

-- 1. Create table
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

-- 2. Enable Row Level Security
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (per-operation for reliability)
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
