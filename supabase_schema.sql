-- SQL Schema for Babulilmsoft

-- 1. Create the schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  contact text NOT NULL,
  email text NOT NULL,
  logo_url text,
  total_credits integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schools_pkey PRIMARY KEY (id),
  CONSTRAINT schools_user_id_key UNIQUE (user_id)
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools can read their own data
DROP POLICY IF EXISTS "Schools can view their own profile" ON public.schools;
CREATE POLICY "Schools can view their own profile" 
ON public.schools FOR SELECT 
USING (auth.uid() = user_id);

-- Schools can update their own data
DROP POLICY IF EXISTS "Schools can update their own profile" ON public.schools;
CREATE POLICY "Schools can update their own profile" 
ON public.schools FOR UPDATE 
USING (auth.uid() = user_id);

-- Anyone can insert a school (used to be client-side, now primarily via trigger)
DROP POLICY IF EXISTS "Users can insert their school profile" ON public.schools;
CREATE POLICY "Users can insert their school profile" 
ON public.schools FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 2. Create the credit_requests table (For manual payments)
CREATE TABLE IF NOT EXISTS public.credit_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  credits integer NOT NULL,
  amount_pkr integer NOT NULL,
  payment_method text NOT NULL, -- e.g. 'JazzCash', 'Bank Transfer'
  payment_reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_requests_pkey PRIMARY KEY (id)
);

-- Enable RLS on credit_requests
ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

-- Schools can read their own requests
DROP POLICY IF EXISTS "Schools can view their own requests" ON public.credit_requests;
CREATE POLICY "Schools can view their own requests" 
ON public.credit_requests FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));

-- Schools can insert requests
DROP POLICY IF EXISTS "Schools can create requests" ON public.credit_requests;
CREATE POLICY "Schools can create requests" 
ON public.credit_requests FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.schools WHERE id = school_id));


-- 3. Trigger for Automatic Profile Creation on Signup
-- This ensures the school profile is created even if email confirmation is on.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.schools (user_id, school_name, contact, email, logo_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'school_name', 'My School'),
    COALESCE(new.raw_user_meta_data->>'contact', ''),
    new.email,
    new.raw_user_meta_data->>'logo_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
