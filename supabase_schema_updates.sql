-- Credit System Updates for ilmsoft
-- Run these in Supabase SQL Editor

-- 1. Add credit_expires_at field to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS credit_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Create admin_users table for ilmsoft administrators
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_user_id_key UNIQUE (user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin list
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
CREATE POLICY "Admins can view admin list" 
ON public.admin_users FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 3. Add trigger to automatically deduct credits daily
-- This function runs via a cron job or edge function
CREATE OR REPLACE FUNCTION public.deduct_daily_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.schools
  SET total_credits = GREATEST(0, total_credits - 1)
  WHERE credit_expires_at IS NULL 
     OR credit_expires_at > now();
     
  UPDATE public.schools
  SET credit_expires_at = NULL
  WHERE total_credits = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to approve credits (for edge function)
CREATE OR REPLACE FUNCTION public.approve_credit_request(
  request_id uuid,
  admin_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  req RECORD;
  school_rec RECORD;
  new_expiry TIMESTAMP WITH TIME ZONE;
  now_time TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = admin_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Get request
  SELECT * INTO req FROM public.credit_requests WHERE id = request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  IF req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already processed');
  END IF;

  -- Get school
  SELECT * INTO school_rec FROM public.schools WHERE id = req.school_id;
  
  -- Calculate new expiry
  IF school_rec.credit_expires_at IS NOT NULL AND school_rec.credit_expires_at > now_time THEN
    new_expiry := school_rec.credit_expires_at + (req.credits || ' days')::interval;
  ELSE
    new_expiry := now_time + (req.credits || ' days')::interval;
  END IF;

  -- Update request
  UPDATE public.credit_requests 
  SET status = 'approved' 
  WHERE id = request_id;

  -- Update school credits
  UPDATE public.schools 
  SET total_credits = COALESCE(total_credits, 0) + req.credits,
      credit_expires_at = new_expiry
  WHERE id = req.school_id;

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', req.credits,
    'new_expiry', new_expiry
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Insert the ilmsoft admin user (replace with actual admin email after signup)
-- First, an admin needs to sign up normally, then run:
-- INSERT INTO public.admin_users (user_id, email) 
-- VALUES ('auth-user-uuid-here', 'admin@ilmsoft.com');

-- Comment: To make a user an admin after they sign up:
-- 1. Have them sign up at /signup
-- 2. Get their user_id from auth.users
-- 3. Run: INSERT INTO public.admin_users (user_id, email) VALUES ('their-uuid', 'their-email');
