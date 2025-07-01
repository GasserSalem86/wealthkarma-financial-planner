-- Migration: Add Connected Accounts and Bank Integration Support
-- Created: 2024-12-30
-- Purpose: Support bank connectivity via Lean service and real-time balance tracking

-- Connected bank accounts table
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lean service integration
  lean_connection_id VARCHAR(255),
  lean_account_id VARCHAR(255),
  
  -- Bank details
  institution_id VARCHAR(255) NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100), -- Masked account number for display
  account_type VARCHAR(50) NOT NULL, -- 'savings', 'checking', 'current', 'deposit'
  
  -- Financial data
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Connection status
  connection_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error', 'pending'
  connection_method VARCHAR(50) DEFAULT 'lean', -- 'lean', 'manual'
  
  -- Emergency fund designation
  is_emergency_fund BOOLEAN DEFAULT false,
  emergency_fund_target DECIMAL(15,2),
  
  -- Metadata
  account_metadata JSONB DEFAULT '{}', -- IBAN, Swift, branch codes, etc.
  
  -- Timestamps
  last_balance_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_attempt TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_balance CHECK (balance >= 0),
  CONSTRAINT valid_currency CHECK (LENGTH(currency) = 3),
  CONSTRAINT valid_account_type CHECK (account_type IN ('savings', 'checking', 'current', 'deposit')),
  CONSTRAINT valid_connection_status CHECK (connection_status IN ('active', 'inactive', 'error', 'pending')),
  CONSTRAINT valid_connection_method CHECK (connection_method IN ('lean', 'manual'))
);

-- Balance history for tracking changes over time
CREATE TABLE IF NOT EXISTS balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  
  -- Balance change details
  previous_balance DECIMAL(15,2) NOT NULL,
  new_balance DECIMAL(15,2) NOT NULL,
  change_amount DECIMAL(15,2) GENERATED ALWAYS AS (new_balance - previous_balance) STORED,
  change_type VARCHAR(50), -- 'sync', 'manual_update', 'correction'
  
  -- Source of change
  source VARCHAR(100), -- 'lean_webhook', 'manual_entry', 'scheduled_sync'
  notes TEXT,
  
  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_change_type CHECK (change_type IN ('sync', 'manual_update', 'correction'))
);

-- Bank sync events and errors
CREATE TABLE IF NOT EXISTS bank_sync_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'webhook'
  sync_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
  
  -- Results
  accounts_updated INTEGER DEFAULT 0,
  balance_changes INTEGER DEFAULT 0,
  new_transactions INTEGER DEFAULT 0,
  
  -- Error handling
  error_code VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
      ELSE NULL 
    END
  ) STORED,
  
  -- Metadata
  sync_metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT valid_sync_type CHECK (sync_type IN ('scheduled', 'manual', 'webhook')),
  CONSTRAINT valid_sync_status CHECK (sync_status IN ('success', 'failed', 'partial'))
);

-- User bank preferences and settings
CREATE TABLE IF NOT EXISTS user_bank_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Sync preferences
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_hours INTEGER DEFAULT 24, -- How often to sync (in hours)
  notification_on_sync BOOLEAN DEFAULT false,
  notification_on_large_changes BOOLEAN DEFAULT true,
  large_change_threshold DECIMAL(10,2) DEFAULT 1000.00,
  
  -- Privacy preferences
  show_full_account_numbers BOOLEAN DEFAULT false,
  allow_balance_history BOOLEAN DEFAULT true,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  
  -- Emergency fund tracking
  emergency_fund_notifications BOOLEAN DEFAULT true,
  emergency_fund_milestone_alerts BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table to support bank connection status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_connected_bank BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_connection_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS preferred_emergency_fund_bank VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_sync_enabled BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_lean_connection ON connected_accounts(lean_connection_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_emergency_fund ON connected_accounts(user_id, is_emergency_fund) WHERE is_emergency_fund = true;
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON connected_accounts(connection_status);

CREATE INDEX IF NOT EXISTS idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_recorded_at ON balance_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_balance_history_account_date ON balance_history(account_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_bank_sync_events_account_id ON bank_sync_events(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_sync_events_started_at ON bank_sync_events(started_at);
CREATE INDEX IF NOT EXISTS idx_bank_sync_events_status ON bank_sync_events(sync_status);

-- Create updated_at trigger for connected_accounts
CREATE OR REPLACE FUNCTION update_connected_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_connected_accounts_updated_at();

-- Create updated_at trigger for user_bank_preferences
CREATE OR REPLACE FUNCTION update_user_bank_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_bank_preferences_updated_at
  BEFORE UPDATE ON user_bank_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_bank_preferences_updated_at();

-- Function to update profile when bank is connected
CREATE OR REPLACE FUNCTION update_profile_bank_connection()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update profile when first bank is connected
    UPDATE profiles 
    SET 
      has_connected_bank = true,
      bank_connection_date = COALESCE(bank_connection_date, NEW.created_at)
    WHERE id = NEW.user_id;
    
    -- Create default bank preferences if they don't exist
    INSERT INTO user_bank_preferences (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if this was the last bank account
    IF NOT EXISTS (
      SELECT 1 FROM connected_accounts 
      WHERE user_id = OLD.user_id AND id != OLD.id
    ) THEN
      UPDATE profiles 
      SET has_connected_bank = false
      WHERE id = OLD.user_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_bank_connection
  AFTER INSERT OR DELETE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_bank_connection();

-- Function to automatically create balance history when balance changes
CREATE OR REPLACE FUNCTION create_balance_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create history entry if balance actually changed
  IF TG_OP = 'UPDATE' AND OLD.balance != NEW.balance THEN
    INSERT INTO balance_history (
      account_id,
      previous_balance,
      new_balance,
      change_type,
      source,
      notes
    ) VALUES (
      NEW.id,
      OLD.balance,
      NEW.balance,
      CASE 
        WHEN NEW.connection_method = 'manual' THEN 'manual_update'
        ELSE 'sync'
      END,
      CASE 
        WHEN NEW.connection_method = 'manual' THEN 'manual_entry'
        ELSE 'lean_sync'
      END,
      'Automatic balance history entry'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_balance_history
  AFTER UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_balance_history();

-- Row Level Security (RLS) policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bank_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view their own connected accounts" ON connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts" ON connected_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts" ON connected_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts" ON connected_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for balance_history
CREATE POLICY "Users can view their own balance history" ON balance_history
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM connected_accounts 
      WHERE id = balance_history.account_id
    )
  );

-- RLS Policies for bank_sync_events
CREATE POLICY "Users can view their own sync events" ON bank_sync_events
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM connected_accounts 
      WHERE id = bank_sync_events.account_id
    )
  );

-- RLS Policies for user_bank_preferences
CREATE POLICY "Users can view their own bank preferences" ON user_bank_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank preferences" ON user_bank_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank preferences" ON user_bank_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Helper views for common queries
CREATE OR REPLACE VIEW user_emergency_fund_accounts AS
SELECT 
  ca.*,
  bh.change_amount as last_change,
  bh.recorded_at as last_change_date
FROM connected_accounts ca
LEFT JOIN LATERAL (
  SELECT change_amount, recorded_at
  FROM balance_history
  WHERE account_id = ca.id
  ORDER BY recorded_at DESC
  LIMIT 1
) bh ON true
WHERE ca.is_emergency_fund = true;

CREATE OR REPLACE VIEW account_balance_summary AS
SELECT 
  ca.user_id,
  ca.currency,
  COUNT(*) as total_accounts,
  COUNT(*) FILTER (WHERE is_emergency_fund = true) as emergency_fund_accounts,
  SUM(balance) as total_balance,
  SUM(balance) FILTER (WHERE is_emergency_fund = true) as emergency_fund_balance,
  MAX(last_balance_update) as last_update
FROM connected_accounts ca
WHERE connection_status = 'active'
GROUP BY ca.user_id, ca.currency;

-- Comments for documentation
COMMENT ON TABLE connected_accounts IS 'Bank accounts connected via Lean service for real-time balance tracking';
COMMENT ON TABLE balance_history IS 'Historical record of balance changes for connected accounts';
COMMENT ON TABLE bank_sync_events IS 'Log of bank synchronization attempts and results';
COMMENT ON TABLE user_bank_preferences IS 'User preferences for bank connectivity and notifications';
COMMENT ON VIEW user_emergency_fund_accounts IS 'Emergency fund accounts with latest balance change information';
COMMENT ON VIEW account_balance_summary IS 'Summary of account balances by user and currency';

-- Grant permissions (adjust based on your auth setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON connected_accounts TO authenticated;
GRANT SELECT ON balance_history TO authenticated;
GRANT SELECT ON bank_sync_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_bank_preferences TO authenticated;
GRANT SELECT ON user_emergency_fund_accounts TO authenticated;
GRANT SELECT ON account_balance_summary TO authenticated; 