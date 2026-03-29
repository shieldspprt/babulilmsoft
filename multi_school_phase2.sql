-- PHASE 2: Credit Management Functions

-- Function to consume credits
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_school_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Credit consumption'
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT credit_balance INTO current_balance FROM public.schools WHERE id = p_school_id;
  
  -- Check if enough credits
  IF current_balance < p_amount THEN
    RETURN false;
  END IF;
  
  -- Deduct credits
  UPDATE public.schools 
  SET credit_balance = credit_balance - p_amount 
  WHERE id = p_school_id;
  
  -- Record consumption
  INSERT INTO public.school_credits (school_id, amount, type, description, status)
  VALUES (p_school_id, -p_amount, 'consumption', p_description, 'completed');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (manual/admin)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_school_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_amount_paid DECIMAL(10,2) DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  credit_id UUID;
BEGIN
  -- Add credit record
  INSERT INTO public.school_credits (
    school_id, amount, type, payment_method, payment_reference, 
    amount_paid, description, status
  ) VALUES (
    p_school_id, p_amount, p_type, p_payment_method, p_payment_reference,
    p_amount_paid, p_description, 'pending'
  ) RETURNING id INTO credit_id;
  
  RETURN credit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve credits (admin)
CREATE OR REPLACE FUNCTION public.approve_credits(
  p_credit_id UUID,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_school_id UUID;
  v_amount INTEGER;
BEGIN
  -- Get credit details
  SELECT school_id, amount INTO v_school_id, v_amount 
  FROM public.school_credits WHERE id = p_credit_id;
  
  IF v_school_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update credit record
  UPDATE public.school_credits 
  SET status = 'completed', processed_at = now(), processed_by = p_admin_id
  WHERE id = p_credit_id;
  
  -- Add to school balance
  UPDATE public.schools 
  SET credits = credits + v_amount,
      credit_balance = credit_balance + v_amount,
      total_paid = total_paid + COALESCE((SELECT amount_paid FROM public.school_credits WHERE id = p_credit_id), 0),
      last_payment_at = now()
  WHERE id = v_school_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get school stats
CREATE OR REPLACE FUNCTION public.get_school_stats(p_school_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'school_name', s.name,
    'credits', s.credits,
    'credit_balance', s.credit_balance,
    'status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'total_purchases', COALESCE((SELECT SUM(amount) FROM public.school_credits WHERE school_id = p_school_id AND type = 'purchase' AND status = 'completed'), 0),
    'total_consumed', COALESCE((SELECT SUM(ABS(amount)) FROM public.school_credits WHERE school_id = p_school_id AND type = 'consumption'), 0)
  ) INTO result
  FROM public.schools s
  WHERE s.id = p_school_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create payment_packages table for pricing
CREATE TABLE public.payment_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PKR',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Insert default packages
INSERT INTO public.payment_packages (name, credits, price, sort_order) VALUES
  ('Starter', 500, 5000.00, 1),
  ('Standard', 1200, 10000.00, 2),
  ('Premium', 3000, 20000.00, 3),
  ('Enterprise', 10000, 50000.00, 4);

ALTER TABLE public.payment_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.payment_packages FOR SELECT USING (is_active = true);

SELECT 'Phase 2 complete: Credit functions and packages created' as status;
