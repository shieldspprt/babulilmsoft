-- Add paid_by column to account_transactions table
ALTER TABLE public.account_transactions
ADD COLUMN paid_by text;

-- Add comment to explain the column
COMMENT ON COLUMN public.account_transactions.paid_by IS 'Name of the person who paid for this expense';