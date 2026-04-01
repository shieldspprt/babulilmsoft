-- =====================================================
-- FEE RECEIPTS TABLE
-- Stores generated receipt records for audit trail
-- =====================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.fee_receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no      text NOT NULL UNIQUE,
  school_id       uuid NOT NULL,
  parent_id       uuid NOT NULL,
  payment_id      uuid NOT NULL,
  receipt_data    jsonb NOT NULL,
  sent_via        text[],
  created_at      timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.fee_receipts ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies (safe recreation)
DROP POLICY IF EXISTS "fee_receipts_select" ON public.fee_receipts;
DROP POLICY IF EXISTS "fee_receipts_insert" ON public.fee_receipts;
DROP POLICY IF EXISTS "fee_receipts_delete" ON public.fee_receipts;

-- 4. Create RLS Policies
CREATE POLICY "fee_receipts_select" ON public.fee_receipts
  FOR SELECT USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "fee_receipts_insert" ON public.fee_receipts
  FOR INSERT WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

CREATE POLICY "fee_receipts_delete" ON public.fee_receipts
  FOR DELETE USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_fee_receipts_parent
  ON public.fee_receipts(parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fee_receipts_receipt_no
  ON public.fee_receipts(receipt_no);

-- 6. Drop and recreate the RPC function with unambiguous names
DROP FUNCTION IF EXISTS public.generate_receipt_no(p_school_id uuid);

CREATE OR REPLACE FUNCTION public.generate_receipt_no(p_school_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year text;
    v_next_num int;
    v_new_receipt_no text;
    v_count int;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Get the current max sequence number for this school and year
    SELECT COALESCE(MAX(CAST(SPLIT_PART(fr.receipt_no, '-', 3) AS INTEGER)), 0)
    INTO v_next_num
    FROM public.fee_receipts fr
    WHERE fr.school_id = p_school_id
      AND fr.receipt_no LIKE 'R-' || v_year || '-%';
    
    -- Increment and format
    v_next_num := v_next_num + 1;
    v_new_receipt_no := 'R-' || v_year || '-' || LPAD(v_next_num::text, 4, '0');
    
    -- Verify uniqueness
    SELECT COUNT(*) INTO v_count
    FROM public.fee_receipts fr2
    WHERE fr2.receipt_no = v_new_receipt_no;
    
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Receipt number collision: %', v_new_receipt_no;
    END IF;
    
    RETURN v_new_receipt_no;
END;
$$;
