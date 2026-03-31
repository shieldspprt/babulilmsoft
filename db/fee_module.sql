-- =====================================================
-- FEE MODULE — Tables, RLS, Indexes
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. fee_bills (one record per parent per month)
CREATE TABLE IF NOT EXISTS fee_bills (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid NOT NULL,
  parent_id       uuid NOT NULL,
  billing_month   text NOT NULL,                -- 'YYYY-MM'
  children_data   jsonb NOT NULL DEFAULT '[]',
  total_fee       integer NOT NULL DEFAULT 0,
  carried_forward integer NOT NULL DEFAULT 0,
  amount_paid     integer NOT NULL DEFAULT 0,
  balance         integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending',
  payment_id      uuid,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(school_id, parent_id, billing_month)
);

ALTER TABLE fee_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_all_own_fee_bills" ON fee_bills
  FOR ALL USING (school_id = (SELECT id FROM schools WHERE id = auth.uid()));

CREATE INDEX idx_fee_bills_parent       ON fee_bills(parent_id, billing_month);
CREATE INDEX idx_fee_bills_parent_status ON fee_bills(parent_id, status);

-- 2. fee_payments (one record per payment transaction)
CREATE TABLE IF NOT EXISTS fee_payments (
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

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schools_all_own_fee_payments" ON fee_payments
  FOR ALL USING (school_id = (SELECT id FROM schools WHERE id = auth.uid()));

CREATE INDEX idx_fee_payments_parent ON fee_payments(parent_id, created_at DESC);
