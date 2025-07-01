import React, { useState, useEffect } from 'react';
import { X, Building2, CreditCard, Plus, Trash2, CheckCircle, ExternalLink, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { leanService } from '../services/leanService';
import { connectedAccountsService } from '../services/database';

interface BankManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  accessToken: string;
  connectedAccounts: any[];
  onAccountsUpdated: () => void;
  onConnectNewBank: () => void;
}

interface BankAccount {
  account_id: string;
  name: string;
  type: string;
  currency_code: string;
  balance?: number;
}

const BankManagementModal: React.FC<BankManagementModalProps> = ({
  isOpen,
  onClose,
  userId,
  accessToken,
  connectedAccounts,
  onAccountsUpdated,
  onConnectNewBank
}) => {
  const [availableAccounts, setAvailableAccounts] = useState<BankAccount[]>([]);
  const [allConnectedAccounts, setAllConnectedAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Balance cache to prevent API rate limiting
  const [balanceCache, setBalanceCache] = useState<Map<string, { balance: number; timestamp: number }>>(new Map());

  // Cached balance retrieval to prevent API rate limiting
  const getCachedBalance = async (entityId: string, accountId: string): Promise<number> => {
    const cacheKey = `${entityId}-${accountId}`;
    const cached = balanceCache.get(cacheKey);
    const now = Date.now();
    
    // Use cache if less than 30 seconds old
    if (cached && (now - cached.timestamp) < 30000) {
      console.log(`💾 Using cached balance for ${accountId}: ${cached.balance}`);
      return cached.balance;
    }
    
    try {
      console.log(`🔄 Fetching fresh balance for ${accountId}...`);
      const balance = await leanService.getBalance(entityId, accountId);
      
      // Update cache
      const newCache = new Map(balanceCache);
      newCache.set(cacheKey, { balance, timestamp: now });
      setBalanceCache(newCache);
      
      console.log(`✅ Fresh balance: ${balance}`);
      return balance;
    } catch (error) {
      console.warn(`⚠️ Balance API failed for ${accountId}, checking database fallback...`);
      
      // Fallback: try to get balance from database
      const dbAccount = allConnectedAccounts.find(acc => acc.lean_account_id === accountId);
      if (dbAccount && dbAccount.balance) {
        console.log(`💽 Using database balance fallback: ${dbAccount.balance}`);
        return dbAccount.balance;
      }
      
      console.warn(`⚠️ No fallback balance available for ${accountId}, using 0`);
      return 0;
    }
  };

  // Load all available accounts from connected banks
  useEffect(() => {
    const loadAvailableAccounts = async () => {
      if (!isOpen || !userId) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log('🏦 Loading all available accounts from connected banks...');
        
        // Get Lean customer and entities
        const customer = await leanService.getCustomer(userId);
        const entities = await leanService.getEntities(customer.customer_id);
        
        if (entities.length === 0) {
          setAvailableAccounts([]);
          return;
        }

        // Get all accounts from all entities with cached balance retrieval
        const allAccounts: BankAccount[] = [];
        for (const entity of entities) {
          console.log(`🏦 Getting accounts for entity: ${entity.id}...`);
          const accounts = await leanService.getAccounts(entity.id);
          
          // Get balances with caching to prevent rate limiting
          for (const account of accounts) {
            const balance = await getCachedBalance(entity.id, account.account_id);
            allAccounts.push({
              ...account,
              balance
            });
          }
        }

        setAvailableAccounts(allAccounts);
        console.log(`✅ Found ${allAccounts.length} available accounts`);
        
        // 🔍 DEBUG: Check what balance data we actually have
        console.log('🔍 DEBUG: Account balance data check:');
        allAccounts.forEach((account, index) => {
          console.log(`  Account ${index + 1}:`, {
            name: account.name,
            type: account.type,
            account_id: account.account_id,
            balance: account.balance,
            balance_type: typeof account.balance,
            currency_code: account.currency_code,
            full_account: account
          });
        });
        
      } catch (err) {
        console.error('❌ Error loading available accounts:', err);
        setError('Failed to load available accounts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableAccounts();
  }, [isOpen, userId]);

  // Load ALL connected accounts (including inactive) for management
  useEffect(() => {
    const loadAllConnectedAccounts = async () => {
      if (!isOpen || !userId || !accessToken) return;

      try {
        console.log('📊 Loading ALL connected accounts for management...');
        const allAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
        setAllConnectedAccounts(allAccounts);
        console.log('✅ Loaded all connected accounts:', allAccounts.length);
      } catch (err) {
        console.error('❌ Error loading all connected accounts:', err);
      }
    };

    loadAllConnectedAccounts();
  }, [isOpen, userId, accessToken]);

  const handleSetEmergencyFund = async (account: BankAccount) => {
    setIsUpdating(true);
    try {
      console.log('🎯 SET PATH: Setting emergency fund account:', account.name);
      console.log('📊 SET PATH: Function start state:');
      console.log('  👤 User ID:', userId);
      console.log('  🏦 Selected account:', account);
      console.log('  📋 Current allConnectedAccounts count:', allConnectedAccounts.length);
      console.log('  📋 Current allConnectedAccounts:', allConnectedAccounts);
      
      // Check if this specific account already exists in our database
      const existingAccount = allConnectedAccounts.find(acc => acc.lean_account_id === account.account_id);
      
      // Also check if we have any accounts from the same bank connection (same lean_entity_id)
      const customer = await leanService.getCustomer(userId);
      const entities = await leanService.getEntities(customer.customer_id);
      const currentEntityId = entities[0]?.id;
      
      const accountsFromSameBank = allConnectedAccounts.filter(acc => acc.lean_entity_id === currentEntityId);
      
      console.log('🔍 Account existence check:');
      console.log('  📋 Looking for specific account:', account.account_id);
      console.log('  📋 Specific account exists:', !!existingAccount);
      console.log('  📋 Current entity ID:', currentEntityId);
      console.log('  📋 Accounts from same bank:', accountsFromSameBank.length);
      console.log('  📋 Same bank accounts:', accountsFromSameBank.map(acc => ({
        id: acc.id, 
        lean_account_id: acc.lean_account_id,
        institution_name: acc.institution_name,
        is_emergency_fund: acc.is_emergency_fund,
        lean_entity_id: acc.lean_entity_id
      })));
      console.log('  📋 All connected accounts for reference:');
      allConnectedAccounts.forEach((acc, index) => {
        console.log(`    ${index + 1}. ID: ${acc.id}, lean_account_id: ${acc.lean_account_id}, lean_entity_id: ${acc.lean_entity_id}, emergency_fund: ${acc.is_emergency_fund}`);
      });
      
      console.log('🎯 Logic path check:');
      console.log('  ✅ Will take existingAccount path?', !!existingAccount);
      console.log('  ✅ Will take switch path?', !existingAccount && accountsFromSameBank.length > 0);
      console.log('  ✅ Will take new account path?', !existingAccount && accountsFromSameBank.length === 0);
      
      if (existingAccount) {
        // Update existing account to be the emergency fund
        console.log('🔄 Account exists in database, switching emergency fund designation...');
        console.log('📋 Existing account details:', {
          id: existingAccount.id,
          institution_name: existingAccount.institution_name,
          lean_account_id: existingAccount.lean_account_id,
          current_emergency_fund: existingAccount.is_emergency_fund
        });
        
        const success = await connectedAccountsService.setEmergencyFundAccount(userId, existingAccount.id, accessToken, true);
        if (success) {
          console.log('✅ Successfully switched emergency fund designation to existing account');
          
          // Refresh parent component first
          onAccountsUpdated();
          
          // Add small delay to ensure database operations are committed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Force refresh local state
          const updatedAllAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
          console.log('🔄 Refreshed allConnectedAccounts after switch:', updatedAllAccounts.length);
          setAllConnectedAccounts(updatedAllAccounts);
          
          onClose();
        } else {
          throw new Error('Failed to update emergency fund designation');
        }
      } else if (accountsFromSameBank.length > 0) {
        // Account doesn't exist but we have other accounts from same bank - this is a SWITCH operation
        console.log('🔄 Account not in database but other accounts from same bank exist - switching accounts...');
        console.log('🗑️ Will remove existing accounts from same bank and create new one');
        
        // Delete existing accounts from the same bank
        for (const existingAcc of accountsFromSameBank) {
          console.log(`🗑️ Removing existing account: ${existingAcc.id} (${existingAcc.institution_name})`);
          await connectedAccountsService.deleteConnectedAccount(existingAcc.id, userId, accessToken);
        }
        
        console.log('✅ Removed existing accounts, now creating new account entry...');
        
        // 🔍 DEBUG: Check what balance data we have for the selected account
        console.log('🔍 DEBUG: Selected account balance check:', {
          account_name: account.name,
          account_balance: account.balance,
          balance_type: typeof account.balance,
          account_currency: account.currency_code,
          full_account_object: account
        });
        
        // 💰 Get fresh balance with caching to prevent rate limiting
        console.log('💰 Getting balance for account before saving...');
        const freshBalance = await getCachedBalance(currentEntityId, account.account_id);
        
        // Create new account entry for the selected account
        const accountData = {
          user_id: userId,
          institution_id: customer.customer_id,
          lean_entity_id: currentEntityId,
          lean_account_id: account.account_id,
          institution_name: account.name || 'Connected Bank',
          account_type: normalizeAccountType(account.type || 'savings'),
          account_number: `****${account.account_id.slice(-4)}`,
          balance: freshBalance,
          currency: account.currency_code || 'AED',
          is_emergency_fund: true,
          account_metadata: {
            original_name: account.name,
            original_type: account.type, // Store original type for reference
            lean_customer_id: customer.customer_id,
            lean_entity_id: currentEntityId,
            account_id: account.account_id,
            connection_method: 'lean_tech',
            saved_at: new Date().toISOString()
          }
        };

        const success = await connectedAccountsService.saveConnectedAccount(accountData, accessToken);
        if (success) {
          console.log('✅ Successfully switched to new emergency fund account');
          
          // Refresh parent component first
          onAccountsUpdated();
          
          // Add small delay to ensure database operations are committed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Force refresh local state
          const updatedAllAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
          console.log('🔄 Refreshed allConnectedAccounts after switch:', updatedAllAccounts.length);
          console.log('🔄 Emergency fund accounts in refresh:', updatedAllAccounts.filter(acc => acc.is_emergency_fund).length);
          setAllConnectedAccounts(updatedAllAccounts);
          
          onClose();
        } else {
          throw new Error('Failed to save new emergency fund account');
        }
      } else {
        // Create new account entry - this is a completely new bank connection
        console.log('💾 Account not in database and no accounts from same bank - creating first account from this bank...');
        
        // 🔍 DEBUG: Check what balance data we have for the selected account
        console.log('🔍 DEBUG: New account balance check:', {
          account_name: account.name,
          account_balance: account.balance,
          balance_type: typeof account.balance,
          account_currency: account.currency_code,
          full_account_object: account
        });
        
        // 💰 Get fresh balance with caching to prevent rate limiting
        console.log('💰 Getting balance for new account before saving...');
        const freshBalance = await getCachedBalance(currentEntityId, account.account_id);
        
        const accountData = {
          user_id: userId,
          institution_id: customer.customer_id,
          lean_entity_id: currentEntityId,
          lean_account_id: account.account_id,
          institution_name: account.name || 'Connected Bank',
          account_type: normalizeAccountType(account.type || 'savings'),
          account_number: `****${account.account_id.slice(-4)}`,
          balance: freshBalance,
          currency: account.currency_code || 'AED',
          is_emergency_fund: true,
          account_metadata: {
            original_name: account.name,
            original_type: account.type, // Store original type for reference
            lean_customer_id: customer.customer_id,
            lean_entity_id: currentEntityId,
            account_id: account.account_id,
            connection_method: 'lean_tech',
            saved_at: new Date().toISOString()
          }
        };

        const success = await connectedAccountsService.saveConnectedAccount(accountData, accessToken);
        if (success) {
          console.log('✅ Created first emergency fund account from new bank connection');
          
          // Refresh parent component first
          onAccountsUpdated();
          
          // Add small delay to ensure database operations are committed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Force refresh local state
          const updatedAllAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
          console.log('🔄 Refreshed allConnectedAccounts after new account:', updatedAllAccounts.length);
          setAllConnectedAccounts(updatedAllAccounts);
          
          onClose();
        } else {
          throw new Error('Failed to save new emergency fund account');
        }
      }
      
    } catch (err) {
      console.error('❌ Error setting emergency fund:', err);
      setError(`Failed to set emergency fund: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    const account = allConnectedAccounts.find(acc => acc.id === accountId);
    const accountName = account?.institution_name || 'this account';
    
    const confirmMessage = `Are you sure you want to permanently delete ${accountName}?\n\n✅ This will:\n• Remove it from our database\n• Delete the connection from Lean Tech\n• Solve any "already connected" errors\n• Allow you to reconnect the same bank fresh\n\n⚠️ This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    try {
      console.log('🔌 Deleting account:', accountId);
      
      if (!account) {
        throw new Error('Account not found');
      }

      // Perform complete deletion from BOTH our database AND Lean Tech
      console.log('🗑️ Performing complete deletion (database + Lean Tech)...');
      console.log('📋 Account details:', {
        id: account.id,
        institution_name: account.institution_name,
        lean_entity_id: account.lean_entity_id,
        lean_account_id: account.lean_account_id,
        account_type: account.account_type,
        balance: account.balance
      });
      
      // Step 1: Delete from our database
      console.log('1️⃣ Starting database deletion...');
      const success = await connectedAccountsService.deleteConnectedAccount(accountId, userId, accessToken);
      console.log('🗃️ Database deletion result:', success);
      
      if (!success) {
        throw new Error('Failed to delete account from our database');
      }
      console.log('✅ Successfully deleted from our database');

      // Step 2: Delete entity from Lean Tech (if we have the entity info)
      if (account.lean_entity_id) {
        try {
          console.log('2️⃣ Starting Lean Tech entity deletion...');
          console.log('🔗 Getting customer info for Lean Tech deletion...');
          const customer = await leanService.getCustomer(userId);
          console.log('👤 Customer info:', customer);
          
          console.log(`🗑️ Attempting to delete entity ${account.lean_entity_id} from customer ${customer.customer_id}`);
          const leanDeleteSuccess = await leanService.deleteEntity(customer.customer_id, account.lean_entity_id);
          console.log('🔗 Lean Tech deletion result:', leanDeleteSuccess);
          
          if (leanDeleteSuccess) {
            console.log('✅ Successfully deleted entity from Lean Tech - "already connected" errors will be resolved!');
          } else {
            console.warn('⚠️ Failed to delete from Lean Tech, but database deletion succeeded');
            console.warn('⚠️ This means you may still get "already connected" errors when trying to reconnect');
            // Don't throw error - database deletion was successful which is most important
          }
        } catch (leanError) {
          console.warn('⚠️ Error deleting from Lean Tech:', leanError);
          console.warn('⚠️ This means you may still get "already connected" errors when trying to reconnect');
          // Don't throw error - database deletion was successful
        }
      } else {
        console.warn('⚠️ No Lean entity ID found in account - skipping Lean Tech deletion');
        console.warn('⚠️ Account data:', account);
        console.warn('⚠️ You may still get "already connected" errors when trying to reconnect');
      }
      
      console.log('✅ Account deleted successfully');
      
      // Refresh parent component first
      onAccountsUpdated();
      
      // Add small delay to ensure database operations are committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh local state
      const updatedAllAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
      console.log('🔄 Refreshed allConnectedAccounts after deletion:', updatedAllAccounts.length);
      setAllConnectedAccounts(updatedAllAccounts);
      
    } catch (err) {
      console.error('❌ Error deleting account:', err);
      setError(`Failed to delete account: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBankConnection = async (entityId: string, bankName: string) => {
    const confirmMessage = `Are you sure you want to remove the entire ${bankName} connection?\n\n⚠️ This will:\n• Remove ALL accounts from ${bankName}\n• Delete the connection from Lean Tech\n• Allow you to reconnect this bank fresh\n\n⚠️ This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsUpdating(true);
    try {
      console.log('🗑️ Removing entire bank connection:', entityId);
      console.log('📊 All connected accounts:', allConnectedAccounts);
      console.log('🔍 Looking for accounts with entity ID:', entityId);
      
      // Debug: Show what entity IDs are actually in the accounts
      console.log('🔍 Available entity IDs in accounts:', allConnectedAccounts.map(acc => ({
        id: acc.id,
        lean_entity_id: acc.lean_entity_id,
        normalized: acc.lean_entity_id || 'no-entity',
        institution_name: acc.institution_name
      })));
      
      // Find accounts for this entity (handle null/undefined entity IDs)
      let accountsToDelete = allConnectedAccounts.filter(acc => {
        const accEntityId = acc.lean_entity_id || 'no-entity';
        console.log(`🔍 Comparing: "${accEntityId}" === "${entityId}" = ${accEntityId === entityId}`);
        return accEntityId === entityId;
      });
      console.log('📋 Accounts found for this entity:', accountsToDelete);
      
      if (accountsToDelete.length === 0) {
        console.error('❌ No accounts found for entity ID:', entityId);
        console.log('🔍 Available entity IDs:', allConnectedAccounts.map(acc => acc.lean_entity_id));
        
        // Special case: if trying to delete "no-entity" and no accounts found, 
        // it might be a data inconsistency issue - try to find accounts with null/undefined entity_id
        if (entityId === 'no-entity') {
          console.log('🔧 Attempting fallback: looking for accounts with null/undefined lean_entity_id...');
          const fallbackAccounts = allConnectedAccounts.filter(acc => !acc.lean_entity_id);
          console.log('🔧 Fallback accounts found:', fallbackAccounts);
          
          if (fallbackAccounts.length > 0) {
            console.log('✅ Found accounts with null entity ID, proceeding with deletion...');
            accountsToDelete = fallbackAccounts;
          }
        }
        
        if (accountsToDelete.length === 0) {
          throw new Error(`No accounts found for this bank connection. Entity ID: ${entityId}`);
        }
      }

      // Step 1: Delete all database records for this entity
      console.log(`1️⃣ Deleting ${accountsToDelete.length} database records for this bank...`);
      
      let deletedCount = 0;
      for (const account of accountsToDelete) {
        console.log(`🗑️ Deleting account ${account.id} (${account.institution_name})`);
        const success = await connectedAccountsService.deleteConnectedAccount(account.id, userId, accessToken);
        if (success) {
          deletedCount++;
        } else {
          console.warn(`⚠️ Failed to delete account ${account.id}`);
        }
      }
      console.log(`✅ Deleted ${deletedCount}/${accountsToDelete.length} account records from database`);

      // Step 2: Delete entity from Lean Tech (only if we have a valid entity ID)
      if (entityId && entityId !== 'no-entity') {
        try {
          console.log('2️⃣ Deleting entity from Lean Tech...');
          const customer = await leanService.getCustomer(userId);
          const leanDeleteSuccess = await leanService.deleteEntity(customer.customer_id, entityId);
          
          if (leanDeleteSuccess) {
            console.log('✅ Successfully removed bank connection from Lean Tech');
          } else {
            console.warn('⚠️ Failed to remove from Lean Tech, but database cleanup succeeded');
          }
        } catch (leanError) {
          console.warn('⚠️ Error removing from Lean Tech:', leanError);
          console.warn('⚠️ Database cleanup succeeded, continuing...');
        }
      } else {
        console.log('⚠️ No valid entity ID found, skipping Lean Tech deletion');
      }
      
      console.log('✅ Bank connection removed successfully');
      
      // Clear any previous errors
      setError(null);
      
      // Refresh parent component first
      onAccountsUpdated();
      
      // Add small delay to ensure database operations are committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh local state
      const updatedAllAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
      console.log('🔄 Refreshed allConnectedAccounts after bank deletion:', updatedAllAccounts.length);
      setAllConnectedAccounts(updatedAllAccounts);
      
    } catch (err) {
      console.error('❌ Error removing bank connection:', err);
      setError(`Failed to remove bank connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSwitchEmergencyFund = async (accountId: string) => {
    setIsUpdating(true);
    try {
      console.log('🔄 SWITCH PATH: Switching emergency fund to account:', accountId);
      console.log('📊 SWITCH PATH: Current connected accounts:', allConnectedAccounts.length);
      
      // Just update the emergency fund designation
      const success = await connectedAccountsService.setEmergencyFundAccount(userId, accountId, accessToken, true);
      
      if (success) {
        console.log('✅ Emergency fund switched successfully');
        
        // Refresh parent component first
        onAccountsUpdated();
        
        // Add small delay to ensure database operations are committed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force refresh local state
        const updatedAllAccounts = await connectedAccountsService.getConnectedAccounts(userId, accessToken);
        console.log('🔄 Refreshed allConnectedAccounts after switch:', updatedAllAccounts.length);
        console.log('🔄 Emergency fund accounts in refresh:', updatedAllAccounts.filter(acc => acc.is_emergency_fund).length);
        setAllConnectedAccounts(updatedAllAccounts);
      } else {
        throw new Error('Failed to switch emergency fund designation');
      }
      
    } catch (err) {
      console.error('❌ Error switching emergency fund:', err);
      setError(`Failed to switch emergency fund: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Normalize account types from Lean API to database-accepted values
  const normalizeAccountType = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('saving')) return 'savings';
    if (lowerType.includes('current')) return 'current';
    if (lowerType.includes('checking')) return 'checking';
    if (lowerType.includes('credit')) return 'current'; // Map credit to current as fallback
    if (lowerType.includes('deposit')) return 'deposit';
    if (lowerType.includes('investment')) return 'savings'; // Map investment to savings as fallback
    if (lowerType.includes('loan')) return 'savings'; // Map loan to savings as fallback
    return 'savings'; // Default fallback
  };

  const getAccountTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('saving')) return 'text-green-600 bg-green-100';
    if (lowerType.includes('current') || lowerType.includes('checking')) return 'text-blue-600 bg-blue-100';
    if (lowerType.includes('credit')) return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  const isAccountDesignatedAsEmergencyFund = (accountId: string) => {
    return allConnectedAccounts.some(acc => acc.lean_account_id === accountId && acc.is_emergency_fund);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        // Allow closing by clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-theme-card rounded-xl shadow-theme-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-theme flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme bg-theme-section flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-theme-primary flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              Manage Bank Connections
            </h2>
            <p className="text-theme-secondary mt-1">
              Choose your emergency fund account, add new banks, or disconnect existing connections
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Help Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Bank Management</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>🔄 Switch Emergency Fund:</strong> Change which account within the same bank is your emergency fund (just updates designation).</p>
              <p><strong>🗑️ Remove Bank Connection:</strong> Permanently removes the ENTIRE bank connection and ALL its accounts from both our system and Lean Tech.</p>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-semibold text-yellow-800">⚠️ Important:</p>
                <p className="text-yellow-700">Removing a bank connection deletes <strong>ALL accounts</strong> from that bank. Use "Switch Emergency Fund" if you just want to change which account to track.</p>
              </div>
            </div>
          </div>

                  {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="text-red-800">
              <p>{error}</p>
              {error.includes('Failed to delete') && (
                <div className="mt-2 text-sm">
                  <p className="font-semibold">🛠️ Debug Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Check browser console for detailed logs</li>
                    <li>Look for database deletion result logs</li>
                    <li>Check if Lean entity ID exists in account data</li>
                    <li>Verify Lean Tech API response</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

          {/* Connected Bank Connections */}
          {allConnectedAccounts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Your Bank Connections
              </h3>
              <div className="grid gap-4">
                {(() => {
                  // Group accounts by lean_entity_id (same bank connection)
                  const bankGroups = allConnectedAccounts.reduce((groups, account) => {
                    const entityId = account.lean_entity_id || 'no-entity';
                    if (!groups[entityId]) {
                      groups[entityId] = [];
                    }
                    groups[entityId].push(account);
                    return groups;
                  }, {} as Record<string, any[]>);

                  return Object.entries(bankGroups).map(([entityId, accounts]) => {
                    const typedAccounts = accounts as any[];
                    const primaryAccount = typedAccounts[0];
                    const emergencyFundAccount = typedAccounts.find((acc: any) => acc.is_emergency_fund);
                    
                    return (
                      <Card key={entityId} className="p-6 border-2 border-blue-100">
                        {/* Bank Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-blue-100">
                              <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-theme-primary">
                                {primaryAccount.institution_name}
                              </h4>
                              <p className="text-sm text-theme-secondary">
                                {typedAccounts.length} account{typedAccounts.length !== 1 ? 's' : ''} connected
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBankConnection(entityId, primaryAccount.institution_name)}
                            disabled={isUpdating}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Bank Connection
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Accounts within this bank */}
                        <div className="space-y-3">
                          <h5 className="font-semibold text-theme-primary text-sm">Accounts in this bank:</h5>
                          {typedAccounts.map((account: any) => (
                            <div 
                              key={account.id} 
                              className={`p-4 rounded-lg border-2 ${
                                account.is_emergency_fund 
                                  ? 'border-green-300 bg-green-50' 
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    account.is_emergency_fund 
                                      ? 'bg-green-100' 
                                      : 'bg-gray-100'
                                  }`}>
                                    <CreditCard className={`w-4 h-4 ${
                                      account.is_emergency_fund 
                                        ? 'text-green-600' 
                                        : 'text-gray-600'
                                    }`} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-theme-primary">
                                        {account.account_type} • {account.account_number}
                                      </span>
                                      {account.is_emergency_fund && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                          Emergency Fund
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-sm font-semibold ${
                                      account.is_emergency_fund 
                                        ? 'text-green-600' 
                                        : 'text-theme-primary'
                                    }`}>
                                      {formatCurrency(account.balance, account.currency)}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  {!account.is_emergency_fund && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSwitchEmergencyFund(account.id)}
                                      disabled={isUpdating}
                                      className="text-green-600 border-green-200 hover:bg-green-50"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Set as Emergency Fund
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Available Accounts */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              All Available Accounts
              {isLoading && <span className="text-sm text-theme-secondary ml-2">(Loading...)</span>}
            </h3>
            
            {isLoading ? (
              <div className="grid gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-theme-section rounded-lg animate-pulse" />
                ))}
              </div>
            ) : availableAccounts.length === 0 ? (
              <Card className="p-6 text-center">
                <CreditCard className="w-12 h-12 text-theme-muted mx-auto mb-3" />
                <h4 className="font-semibold text-theme-primary mb-2">No Bank Accounts Found</h4>
                <p className="text-theme-secondary mb-4">
                  Connect your first bank account to start tracking your emergency fund
                </p>
                <Button onClick={onConnectNewBank}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect New Bank
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3">
                {availableAccounts.map((account) => {
                  const isCurrentEmergencyFund = isAccountDesignatedAsEmergencyFund(account.account_id);
                  return (
                    <Card 
                      key={account.account_id} 
                      className={`p-4 transition-all ${
                        isCurrentEmergencyFund 
                          ? 'border-green-200 bg-green-50' 
                          : 'hover:border-theme-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getAccountTypeColor(account.type)}`}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-theme-primary flex items-center gap-2">
                              {account.name}
                              {isCurrentEmergencyFund && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  Current Emergency Fund
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-theme-secondary capitalize">
                              {account.type} • {account.account_id.slice(-8)}
                            </p>
                            <p className="text-lg font-bold text-theme-primary">
                              {formatCurrency(account.balance || 0, account.currency_code)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isCurrentEmergencyFund && (
                            <Button
                              onClick={() => handleSetEmergencyFund(account)}
                              disabled={isUpdating}
                              size="sm"
                            >
                              {isUpdating ? 'Setting...' : 'Set as Emergency Fund'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Bank */}
          <div>
            <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Bank Connection
            </h3>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-theme-primary mb-2">Connect Additional Bank</h4>
                  <p className="text-theme-secondary">
                    Add another bank account to have more options for your emergency fund tracking
                  </p>
                </div>
                <Button onClick={onConnectNewBank} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Connect New Bank
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-theme flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BankManagementModal; 