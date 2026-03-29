-- Create balance_writeoffs table
CREATE TABLE public.balance_writeoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  writeoff_type TEXT NOT NULL CHECK (writeoff_type IN ('monthly_fee', 'collection', 'general_balance')),
  original_amount NUMERIC NOT NULL CHECK (original_amount >= 0),
  writeoff_amount NUMERIC NOT NULL CHECK (writeoff_amount > 0 AND writeoff_amount <= original_amount),
  reason TEXT NOT NULL,
  approved_by UUID NOT NULL,
  writeoff_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  related_payment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.balance_writeoffs ENABLE ROW LEVEL SECURITY;

-- Only admins can insert write-offs
CREATE POLICY "Only admins can create write-offs"
ON public.balance_writeoffs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can view write-offs
CREATE POLICY "Only admins can view write-offs"
ON public.balance_writeoffs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_balance_writeoffs_parent_id ON public.balance_writeoffs(parent_id);
CREATE INDEX idx_balance_writeoffs_student_id ON public.balance_writeoffs(student_id);
CREATE INDEX idx_balance_writeoffs_writeoff_date ON public.balance_writeoffs(writeoff_date);