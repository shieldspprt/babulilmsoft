-- Add payment_year column to fee_payments table
ALTER TABLE fee_payments 
ADD COLUMN IF NOT EXISTS payment_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

-- Backfill existing records with 2025
UPDATE fee_payments 
SET payment_year = 2025 
WHERE payment_year IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_fee_payments_year ON fee_payments(payment_year);

-- Add pass-out columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS passout_date DATE,
ADD COLUMN IF NOT EXISTS passout_reason TEXT;