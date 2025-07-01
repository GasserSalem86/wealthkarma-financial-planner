-- Rollback Migration: Remove Connected Accounts and Bank Integration Support
-- Created: 2024-12-30
-- Purpose: Safely remove bank connectivity tables and related functionality

-- Drop views first
DROP VIEW IF EXISTS user_emergency_fund_accounts;
DROP VIEW IF EXISTS account_balance_summary;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_connected_accounts_updated_at ON connected_accounts;
DROP TRIGGER IF EXISTS trigger_user_bank_preferences_updated_at ON user_bank_preferences;
DROP TRIGGER IF EXISTS trigger_update_profile_bank_connection ON connected_accounts;
DROP TRIGGER IF EXISTS trigger_create_balance_history ON connected_accounts;

-- Drop functions
DROP FUNCTION IF EXISTS update_connected_accounts_updated_at();
DROP FUNCTION IF EXISTS update_user_bank_preferences_updated_at();
DROP FUNCTION IF EXISTS update_profile_bank_connection();
DROP FUNCTION IF EXISTS create_balance_history();

-- Drop indexes
DROP INDEX IF EXISTS idx_connected_accounts_user_id;
DROP INDEX IF EXISTS idx_connected_accounts_lean_connection;
DROP INDEX IF EXISTS idx_connected_accounts_emergency_fund;
DROP INDEX IF EXISTS idx_connected_accounts_status;

DROP INDEX IF EXISTS idx_balance_history_account_id;
DROP INDEX IF EXISTS idx_balance_history_recorded_at;
DROP INDEX IF EXISTS idx_balance_history_account_date;

DROP INDEX IF EXISTS idx_bank_sync_events_account_id;
DROP INDEX IF EXISTS idx_bank_sync_events_started_at;
DROP INDEX IF EXISTS idx_bank_sync_events_status;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can insert their own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can update their own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can delete their own connected accounts" ON connected_accounts;

DROP POLICY IF EXISTS "Users can view their own balance history" ON balance_history;
DROP POLICY IF EXISTS "Users can view their own sync events" ON bank_sync_events;

DROP POLICY IF EXISTS "Users can view their own bank preferences" ON user_bank_preferences;
DROP POLICY IF EXISTS "Users can insert their own bank preferences" ON user_bank_preferences;
DROP POLICY IF EXISTS "Users can update their own bank preferences" ON user_bank_preferences;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS bank_sync_events;
DROP TABLE IF EXISTS balance_history;
DROP TABLE IF EXISTS user_bank_preferences;
DROP TABLE IF EXISTS connected_accounts;

-- Remove columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS has_connected_bank,
DROP COLUMN IF EXISTS bank_connection_date,
DROP COLUMN IF EXISTS preferred_emergency_fund_bank,
DROP COLUMN IF EXISTS bank_sync_enabled;

-- Revoke permissions
REVOKE ALL ON user_emergency_fund_accounts FROM authenticated;
REVOKE ALL ON account_balance_summary FROM authenticated; 