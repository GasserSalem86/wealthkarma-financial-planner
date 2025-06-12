-- Rollback Migration: Remove Family Planning Support
-- Description: Removes columns added for family planning functionality
-- Date: 2024-12-24
-- Use only if you need to rollback the family planning migration

-- Remove indexes first
DROP INDEX IF EXISTS public.idx_profiles_planning_type;
DROP INDEX IF EXISTS public.idx_goals_remaining_amount;

-- Remove columns from goals table
ALTER TABLE public.goals 
DROP COLUMN IF EXISTS initial_amount,
DROP COLUMN IF EXISTS remaining_amount,
DROP COLUMN IF EXISTS family_retirement_profile;

-- Remove columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS planning_type,
DROP COLUMN IF EXISTS family_size;

-- Verify rollback success
SELECT 'Rollback completed successfully - family planning columns removed' as result; 