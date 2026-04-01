-- =====================================================
-- FEE RECEIPTS TABLE
-- Stores generated receipt records for audit trail
-- =====================================================

-- 1. Create sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS public.receipt_no_seq;

-- 2. Create table
CREATE TABLE IF NOT EXISTS public.fee_receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no      text NOT NULL UNIQUE,
  school_id       uuid NOT NULL REFERENCES public.schools(id),
  parent_id       uuid NOT NULL REFERENCES public.parents(id),
  payment_id      uuid NOT NULL REFERENCES public.fee_payments(id),
  receipt_data    jsonb NOT NULL,  -- Full receipt snapshot
  sent_via        text[] DEFAULT '{}',  -- ['print', 'pdf', 'whatsapp']
  created_at      timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "fee_receipts_select" ON public.fee_receipts;
CREATE POLICY "fee_receipts_select" ON public.fee_receipts FOR SELECT
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "fee_receipts_insert" ON public.fee_receipts;
CREATE POLICY "fee_receipts_insert" ON public.fee_receipts FOR INSERT
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_fee_receipts_parent 
  ON public.fee_receipts(parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fee_receipts_receipt_no 
  ON public.fee_receipts(receipt_no);

CREATE INDEX IF NOT EXISTS idx_fee_receipts_payment 
  ON public.fee_receipts(payment_id);

-- 6. Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_no()
RETURNS text AS $$
DECLARE
  year text;
  seq_num int;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  seq_num := nextval('public.receipt_no_seq');
  RETURN 'R-' || year || '-' || LPAD(seq_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
