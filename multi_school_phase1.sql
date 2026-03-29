-- PHASE 1: Multi-School Foundation
-- Create schools and school_credits tables

-- Drop if exists (clean slate)
DROP TABLE IF EXISTS public.school_credits CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  credits INTEGER DEFAULT 0,
  credit_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  total_paid DECIMAL(10,2) DEFAULT 0,
  last_payment_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id)
);

-- Create school_credits table
CREATE TABLE public.school_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'bonus')),
  payment_method TEXT,
  payment_reference TEXT,
  amount_paid DECIMAL(10,2),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES auth.users(id)
);

-- Create user_schools junction table
CREATE TABLE public.user_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_schools ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools
CREATE POLICY "School owners can manage their schools" ON public.schools FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Users can view their schools" ON public.schools FOR SELECT 
USING (id IN (SELECT school_id FROM public.user_schools WHERE user_id = auth.uid()));

-- RLS Policies for school_credits
CREATE POLICY "Users can view their school credits" ON public.school_credits FOR SELECT 
USING (school_id IN (SELECT school_id FROM public.user_schools WHERE user_id = auth.uid()));

-- RLS Policies for user_schools
CREATE POLICY "Users can view their school memberships" ON public.user_schools FOR SELECT USING (user_id = auth.uid());

-- Insert dummy data
INSERT INTO public.schools (name, subdomain, email, phone, credits, credit_balance, status, trial_ends_at) VALUES
  ('Test School Alpha', 'alpha', 'admin@alpha.edu.pk', '03001234567', 100, 100, 'trial', now() + interval '14 days'),
  ('Test School Beta', 'beta', 'admin@beta.edu.pk', '03011234567', 500, 500, 'active', null),
  ('Test School Gamma', 'gamma', 'admin@gamma.edu.pk', '03021234567', 0, 0, 'suspended', null),
  ('Demo Academy', 'demo', 'demo@academy.pk', '03031234567', 1200, 950, 'active', null);

-- Function to create school on signup
CREATE OR REPLACE FUNCTION public.create_school_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
BEGIN
  -- Create school for new user
  INSERT INTO public.schools (name, email, owner_id, credits, credit_balance, status, trial_ends_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'school_name', 'My School'),
    NEW.email,
    NEW.id,
    100,
    100,
    'trial',
    now() + interval '14 days'
  )
  RETURNING id INTO new_school_id;
  
  -- Link user to school
  INSERT INTO public.user_schools (user_id, school_id, role)
  VALUES (NEW.id, new_school_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_school_on_signup();

SELECT 'Phase 1 complete: Schools and credits tables created' as status;
