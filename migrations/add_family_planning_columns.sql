-- Migration: Add Family Planning Support
-- Description: Adds columns for family planning and current savings functionality
-- Date: 2024-12-24
-- Status: READY FOR DEPLOYMENT

-- NOTE: current_savings column already exists in profiles table (no migration needed)

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS planning_type VARCHAR DEFAULT 'individual' CHECK (planning_type IN ('individual', 'family')),
ADD COLUMN IF NOT EXISTS family_size INTEGER DEFAULT 1 CHECK (family_size >= 1 AND family_size <= 20);

-- Add new columns to goals table  
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS initial_amount DECIMAL DEFAULT 0 CHECK (initial_amount >= 0),
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL,
ADD COLUMN IF NOT EXISTS family_retirement_profile JSONB;

-- Update existing profiles with default values
UPDATE public.profiles 
SET planning_type = 'individual', family_size = 1 
WHERE planning_type IS NULL OR family_size IS NULL;

-- Update existing goals to set remaining_amount = amount for existing goals
UPDATE public.goals 
SET remaining_amount = amount 
WHERE remaining_amount IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.planning_type IS 'Type of financial planning: individual or family';
COMMENT ON COLUMN public.profiles.family_size IS 'Number of family members (1 for individual)';
COMMENT ON COLUMN public.goals.initial_amount IS 'Amount applied from current savings';
COMMENT ON COLUMN public.goals.remaining_amount IS 'Amount still needed after current savings applied';
COMMENT ON COLUMN public.goals.family_retirement_profile IS 'Family retirement configuration for joint/staggered planning';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_planning_type ON public.profiles(planning_type);
CREATE INDEX IF NOT EXISTS idx_goals_remaining_amount ON public.goals(remaining_amount);

-- Verify migration success
SELECT 'Migration completed successfully - ' || count(*) || ' profiles updated' as result 
FROM public.profiles WHERE planning_type IS NOT NULL; 