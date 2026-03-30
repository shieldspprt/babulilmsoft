-- Credit System Updates for ilmsoft
-- Run these in Supabase SQL Editor

-- 1. Add credit_expires_at field to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS credit_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Create admin_users table for ilmsoft administrators
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_user_id_key UNIQUE (user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all admin users
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
CREATE POLICY "Admins can view admin list" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (true);

-- 3. Update the trigger function for new user signup (includes credit_expires_at)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.schools (user_id, school_name, contact, email, logo_url, total_credits, credit_expires_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'school_name', 'My School'),
    COALESCE(new.raw_user_meta_data->>'contact', ''),
    new.email,
    new.raw_user_meta_data->>'logo_url',
    0,
    NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function for admin to approve credit requests and add credits
CREATE OR REPLACE FUNCTION public.approve_credit_request(
  request_id uuid,
  admin_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  req RECORD;
  school RECORD;
  new_credits INTEGER;
  new_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the request details
  SELECT * INTO req FROM public.credit_requests WHERE id = request_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get the school
  SELECT * INTO school FROM public.schools WHERE id = req.school_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate new credits and expiry
  IF school.credit_expires_at IS NULL OR school.credit_expires_at < NOW() THEN
    -- Credits expired or never had credits, start fresh
    new_credits := req.credits;
    new_expires := NOW() + (req.credits || ' days')::INTERVAL;
  ELSE
    -- Has active credits, add to them
    new_credits := school.total_credits + req.credits;
    new_expires := school.credit_expires_at + (req.credits || ' days')::INTERVAL;
  END IF;
  
  -- Update school credits
  UPDATE public.schools 
  SET total_credits = new_credits, 
      credit_expires_at = new_expires
  WHERE id = req.school_id;
  
  -- Mark request as approved
  UPDATE public.credit_requests 
  SET status = 'approved' 
  WHERE id = request_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function for admin to reject credit requests
CREATE OR REPLACE FUNCTION public.reject_credit_request(
  request_id uuid
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.credit_requests 
  SET status = 'rejected' 
  WHERE id = request_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;