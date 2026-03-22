-- ============================================================
--  MERCH PUP — Migration 002
--  Rename role value 'venue' → 'promoter'
--  Run this in the Supabase SQL editor against your live DB.
-- ============================================================

-- 1. Update any existing accounts that have role = 'venue'
UPDATE public.profiles SET role = 'promoter' WHERE role = 'venue';

-- 2. Drop the old check constraint and replace it
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('fan', 'promoter'));
