-- ============================================================
-- HOTFIX: Fix infinite recursion in school_members RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "Read own school members" ON school_members;

-- 2. Create a SECURITY DEFINER helper function that bypasses RLS
--    This avoids the self-referencing recursion
CREATE OR REPLACE FUNCTION user_school_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM schools WHERE user_id = auth.uid()
  UNION
  SELECT school_id FROM school_members WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Recreate the policy using the helper function
CREATE POLICY "Read own school members"
  ON school_members FOR SELECT
  USING (school_id IN (SELECT user_school_ids()));
