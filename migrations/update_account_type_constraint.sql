-- Migration: Update Account Type Constraint
-- Created: 2024-12-30
-- Purpose: Allow additional account types from Lean API including 'credit'

-- Drop the existing constraint
ALTER TABLE connected_accounts DROP CONSTRAINT IF EXISTS valid_account_type;

-- Add the updated constraint with additional account types
ALTER TABLE connected_accounts ADD CONSTRAINT valid_account_type 
  CHECK (account_type IN ('savings', 'checking', 'current', 'deposit', 'credit', 'debit', 'investment', 'loan'));

-- Comment for documentation
COMMENT ON CONSTRAINT valid_account_type ON connected_accounts IS 'Allows common account types from Lean API including credit, debit, investment, and loan accounts'; 