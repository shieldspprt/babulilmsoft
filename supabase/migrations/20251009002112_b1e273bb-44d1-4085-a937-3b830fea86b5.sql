-- Fix security definer view by enabling security invoker
-- This ensures the view respects RLS policies and uses the querying user's permissions
ALTER VIEW public.student_outstanding_collections SET (security_invoker = on);