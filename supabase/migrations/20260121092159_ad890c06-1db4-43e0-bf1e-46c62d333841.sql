-- Rename the 'staff' value to 'user' in the app_role enum
-- First, update any existing rows that have 'staff' role to use the new value
-- We need to do this carefully since we're changing an enum value

-- Step 1: Add 'user' as a new enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';

-- Step 2: Update existing 'staff' roles to 'user'
UPDATE public.user_roles SET role = 'user' WHERE role = 'staff';

-- Note: PostgreSQL doesn't support removing enum values directly, but 'staff' will no longer be used
-- The valid roles will now be 'admin' and 'user'