-- Create collections table for custom fee collections (paper fund, tour fund, etc.)
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  is_class_specific BOOLEAN DEFAULT false,
  class_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create collection_payments table
CREATE TABLE public.collection_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE DEFAULT generate_receipt_number(),
  collection_id UUID REFERENCES public.collections(id) NOT NULL,
  parent_id UUID REFERENCES public.parents(id) NOT NULL,
  student_id UUID REFERENCES public.students(id),
  amount_paid NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Admin/staff can manage collections"
ON public.collections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can view collections"
ON public.collections
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- RLS policies for collection_payments
CREATE POLICY "Admin/staff can manage collection payments"
ON public.collection_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admin/staff can view collection payments"
ON public.collection_payments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));