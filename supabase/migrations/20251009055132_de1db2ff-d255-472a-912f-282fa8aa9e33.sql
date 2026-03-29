-- Add credit_balance field to parents table to track overpayments
ALTER TABLE public.parents ADD COLUMN credit_balance NUMERIC DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.parents.credit_balance IS 'Tracks overpayments that can be applied to future fees';