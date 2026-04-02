-- ============================================================
-- STEP 1: school_members table + RPCs
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the school_members table
CREATE TABLE IF NOT EXISTS school_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager')),
  status        TEXT NOT NULL DEFAULT 'active'  CHECK (status IN ('active', 'pending', 'removed')),
  invite_token  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, email)
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sm_user_id      ON school_members(user_id)      WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sm_invite_token  ON school_members(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sm_school_id    ON school_members(school_id);

-- 3. Enable Row Level Security
ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Allow anyone to verify invite tokens (needed for /join/:token page before login)
CREATE POLICY "Public invite token lookup"
  ON school_members FOR SELECT
  USING (invite_token IS NOT NULL AND status = 'pending');

-- Authenticated users can read members of their own school
-- Uses SECURITY DEFINER function to avoid self-referencing recursion
CREATE OR REPLACE FUNCTION user_school_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM schools WHERE user_id = auth.uid()
  UNION
  SELECT school_id FROM school_members WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Read own school members"
  ON school_members FOR SELECT
  USING (school_id IN (SELECT user_school_ids()));

-- School owners can insert new members
CREATE POLICY "Owners insert members"
  ON school_members FOR INSERT
  WITH CHECK (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

-- School owners can update members
CREATE POLICY "Owners update members"
  ON school_members FOR UPDATE
  USING (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

-- School owners can delete members
CREATE POLICY "Owners delete members"
  ON school_members FOR DELETE
  USING (school_id IN (SELECT id FROM schools WHERE user_id = auth.uid()));

-- ============================================================
-- 5. RPC: Verify invite token (bypasses RLS, returns minimal info)
-- ============================================================
CREATE OR REPLACE FUNCTION verify_invite(p_token TEXT)
RETURNS TABLE(school_id UUID, school_name TEXT, email TEXT) AS $$
  SELECT sm.school_id, s.school_name, sm.email
  FROM school_members sm
  JOIN schools s ON s.id = sm.school_id
  WHERE sm.invite_token = p_token AND sm.status = 'pending';
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- 6. RPC: Claim invite (link user_id to the invitation)
-- ============================================================
CREATE OR REPLACE FUNCTION claim_invite(p_token TEXT, p_user_id UUID)
RETURNS UUID AS $$
  DECLARE v_school_id UUID;
  BEGIN
    UPDATE school_members
    SET user_id = p_user_id,
        status = 'active',
        invite_token = NULL,
        updated_at = now()
    WHERE invite_token = p_token AND status = 'pending'
    RETURNING school_id INTO v_school_id;

    RETURN v_school_id;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. SEED: Insert owner rows for ALL existing schools
-- ============================================================
INSERT INTO school_members (school_id, user_id, email, role, status)
SELECT id, user_id, email, 'owner', 'active'
FROM schools
ON CONFLICT DO NOTHING;
