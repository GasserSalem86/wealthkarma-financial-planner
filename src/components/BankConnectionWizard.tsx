/**
 * Simple Bank Connection Wizard
 * Clean, minimal UI that connects to Lean Tech and shows real balances
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, Building2, DollarSign, AlertTriangle, CheckCircle, AlertCircle, CreditCard, Banknote, ChevronRight, Shield, Eye, EyeOff, Settings } from 'lucide-react';
import Button from './ui/Button';
import { leanService } from '../services/leanService';
import { connectedAccountsService } from '../services/database';
import { useAuth } from '../context/AuthContext';

interface BankConnectionWizardProps {
  onComplete: (result?: any) => void;
  onSkip: () => void;
  accessToken?: string;
  forceNewConnection?: boolean; // Force showing Lean popup even if connections exist
}

interface BankAccount {
  account_id: string;
  name: string;
  type: string;
  currency_code: string;
  balance?: number;
}

const BankConnectionWizard: React.FC<BankConnectionWizardProps> = ({ 
  onComplete, 
  onSkip, 
  accessToken,
  forceNewConnection = false
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [showTrackingChoice, setShowTrackingChoice] = useState(true);
  const [trackingMode, setTrackingMode] = useState<'automatic' | 'manual' | null>(null);

  const handleTrackingChoice = (mode: 'automatic' | 'manual') => {
    setTrackingMode(mode);
    setShowTrackingChoice(false);
    
    // Save user preference to localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergencyFundTrackingMode', mode);
    }
    console.log(`💾 Saved tracking mode: ${mode}`);
    
    if (mode === 'automatic') {
      // Proceed with bank connection
      handleConnect();
    } else {
      // Skip bank connection, proceed with manual tracking
      handleManualChoice();
    }
  };

  const handleManualChoice = () => {
    console.log('👤 User chose manual tracking - skipping bank connection');
    // Save user preference for manual tracking
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergencyFundTrackingMode', 'manual');
    }
    onComplete({ trackingMode: 'manual' });
  };

  const handleConnect = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    if (!leanService.isConfigured()) {
      setError('Bank connection is not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Safety timeout to prevent infinite loading state
    const safetyTimeout = setTimeout(() => {
      console.error('⏰ Connection process timed out after 45 seconds');
      setError('Connection timed out. Please try again.');
      setIsLoading(false);
    }, 45000); // 45 second safety net

    try {
      console.log('🚀 Starting bank connection process...');
      
      // ALWAYS check for existing connections first
      const customer = await leanService.getCustomer(user.id);
      const entities = await leanService.getEntities(customer.customer_id);
      
      if (entities.length > 0 && !forceNewConnection) {
        console.log('✅ Found existing Lean Tech connection!');
        console.log(`📊 Found ${entities.length} existing entities`);
        
        // Get balances for existing connection
        const entity = entities[0];
        console.log(`🔍 Using entity: ${entity.id}`);
        
        const accountsWithBalances = await leanService.getAccountsWithBalances(entity.id);
        
        if (accountsWithBalances.length > 0) {
          console.log(`🎉 Successfully loaded ${accountsWithBalances.length} accounts with balances!`);
          
          // Ensure automatic tracking mode is saved for existing connections
          if (typeof window !== 'undefined') {
            const currentMode = localStorage.getItem('emergencyFundTrackingMode');
            if (!currentMode) {
              localStorage.setItem('emergencyFundTrackingMode', 'automatic');
              setTrackingMode('automatic');
              console.log('💾 Auto-saved tracking mode as automatic for existing bank connection');
            }
          }
          
          clearTimeout(safetyTimeout);
          setAccounts(accountsWithBalances);
          setShowAccountSelection(true);
          setIsLoading(false);
          return;
        } else {
          console.warn('⚠️ Existing entity has no accounts. Will attempt new connection.');
        }
      } else if (entities.length > 0 && forceNewConnection) {
        console.log('🔄 Existing connections found, but user forced new connection');
        clearTimeout(safetyTimeout);
        setError('⚠️ You already have a bank connected. Each user can only have one bank connection per provider.\n\n🔧 To connect a different bank:\n1. Use "Manage Connected Accounts" to DELETE your current connection\n2. Then try connecting again');
        setIsLoading(false);
        return;
      } else {
        console.log('📱 No existing connections found, creating new bank connection...');
      }
      
      // Create new connection only if no entities exist or existing entity has no accounts
      await leanService.connectBank(
        user.id,
        async (result) => {
          console.log('✅ New connection successful:', result);
          clearTimeout(safetyTimeout);
          
          // Give Lean Tech a moment to process the new entity before fetching accounts
          console.log('⏳ Waiting for Lean Tech to process new entity...');
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          
          // Fetch the new balances
          try {
            console.log('🔄 Fetching updated entities and accounts...');
            const updatedEntities = await leanService.getEntities(customer.customer_id);
            console.log(`📊 Found ${updatedEntities.length} entities after connection`);
            
            if (updatedEntities.length > 0) {
              const accountsWithBalances = await leanService.getAccountsWithBalances(updatedEntities[0].id);
              console.log(`💰 Found ${accountsWithBalances.length} accounts with balances`);
              
              if (accountsWithBalances.length > 0) {
                setAccounts(accountsWithBalances);
                setShowAccountSelection(true);
                console.log('✅ Showing account selection screen');
              } else {
                console.warn('⚠️ No accounts found, showing results screen');
                setShowResults(true);
              }
            } else {
              console.warn('⚠️ No entities found after connection, showing results screen');
              setShowResults(true);
            }
          } catch (fetchError) {
            console.error('❌ Error fetching accounts after connection:', fetchError);
            console.warn('🔄 Retrying account fetch in 3 seconds...');
            
            // Retry once after a longer delay
            try {
              await new Promise(resolve => setTimeout(resolve, 3000));
              const retryEntities = await leanService.getEntities(customer.customer_id);
              if (retryEntities.length > 0) {
                const retryAccounts = await leanService.getAccountsWithBalances(retryEntities[0].id);
                if (retryAccounts.length > 0) {
                  setAccounts(retryAccounts);
                  setShowAccountSelection(true);
                  console.log('✅ Retry successful - showing account selection screen');
                } else {
                  setShowResults(true);
                }
              } else {
                setShowResults(true);
              }
            } catch (retryError) {
              console.error('❌ Retry also failed:', retryError);
              setAccounts([]);
              setShowResults(true);
            }
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ Connection failed:', error);
          clearTimeout(safetyTimeout);
          
          // Provide helpful error message for "already connected" scenario
          const errorMessage = error.message || error;
          if (errorMessage.includes('already connected') || errorMessage.includes('already exists')) {
            setError('🚫 Bank Already Connected\n\nYou already have a bank connected with this provider. Each user can only have one bank connection.\n\n✅ Solution:\n1. Use "Manage Connected Accounts" to DELETE the existing connection\n2. Then try connecting your new bank');
        } else {
            setError(`Connection failed: ${errorMessage}`);
          }
          setIsLoading(false);
        }
      );
      
    } catch (error: any) {
      console.error('❌ Error in bank connection process:', error);
      clearTimeout(safetyTimeout);
      
      const errorMessage = error.message || error;
      if (errorMessage.includes('already connected') || errorMessage.includes('already exists')) {
        setError('🚫 Bank Already Connected\n\nYou already have a bank connected. Please delete the existing connection first using "Manage Connected Accounts", then try connecting again.');
      } else {
        setError(`Error: ${errorMessage}`);
      }
      setIsLoading(false);
    }
  };

  const handleAccountSelection = async (account: BankAccount) => {
    if (!user || isSavingAccount) return;
    
    setIsSavingAccount(true);
    console.log('🔄 Starting account selection process...');
    
    try {
      console.log('💾 Saving selected account to database...');
      
      // Use the access token passed from Dashboard (guaranteed to be available)
      console.log('🔑 Using access token for account selection...');
      
      if (!accessToken) {
        throw new Error('No access token available. Please close this dialog and try again.');
      }
      
      console.log('✅ Access token available');
      
      // Step 1: Get Lean customer data
      console.log('1️⃣ Getting Lean customer data...');
      const customer = await leanService.getCustomer(user.id);
      console.log('✅ Customer data:', customer);
      
      console.log('2️⃣ Getting entities...');
      const entities = await leanService.getEntities(customer.customer_id);
      const entityId = entities[0]?.id;
      console.log('✅ Entity ID:', entityId);
      
      // Step 2: Check existing accounts via REST API
      console.log('3️⃣ Checking existing accounts via REST API...');
      const existingAccounts = await connectedAccountsService.getConnectedAccounts(user.id, accessToken);
      console.log('✅ Existing accounts:', existingAccounts);
      console.log('🔍 Looking for account with lean_account_id:', account.account_id);
      
      // Log all existing account IDs for debugging
      existingAccounts.forEach((acc, index) => {
        console.log(`📋 Existing account ${index + 1}:`, {
          id: acc.id,
          lean_account_id: acc.lean_account_id,
          institution_name: acc.institution_name,
          account_type: acc.account_type,
          is_emergency_fund: acc.is_emergency_fund
        });
      });
      
      // Find if this specific account already exists in database
      const existingAccount = existingAccounts.find(acc => acc.lean_account_id === account.account_id);
      console.log('🔍 Existing account found:', existingAccount);
      
      if (existingAccount) {
        console.log('🔄 Setting existing account as emergency fund via REST API...');
        
        // Just update the emergency fund designation for this account
        const success = await connectedAccountsService.setEmergencyFundAccount(user.id, existingAccount.id, accessToken, true);
        console.log('✅ Emergency fund update result:', success);
        
      } else {
        console.log('💾 Creating new emergency fund account via REST API...');
        
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

        const accountData = {
          user_id: user.id,
          institution_id: customer.customer_id, // Add required institution_id field
          lean_entity_id: entityId,
          lean_account_id: account.account_id,
          institution_name: account.name || 'Connected Bank',
          account_type: normalizeAccountType(account.type || 'savings'),
          account_number: `****${account.account_id.slice(-4)}`,
          balance: account.balance || 0,
          currency: account.currency_code || 'AED',
          is_emergency_fund: true,
          account_metadata: {
            original_name: account.name,
            original_type: account.type, // Store original type for reference
            lean_customer_id: customer.customer_id,
            lean_entity_id: entityId,
            account_id: account.account_id,
            connection_method: 'lean_tech',
            saved_at: new Date().toISOString()
          }
        };
        
        console.log('📝 Account data to save:', accountData);
        
        // Save new account and mark as emergency fund
        const success = await connectedAccountsService.saveConnectedAccount(accountData, accessToken);
        console.log('✅ Save result:', success);
        
        if (!success) {
          // If save failed, try to update the first existing account as emergency fund
          if (existingAccounts.length > 0) {
            console.log('🔄 Account creation failed, trying to update existing account as emergency fund...');
            const fallbackSuccess = await connectedAccountsService.setEmergencyFundAccount(user.id, existingAccounts[0].id, accessToken, true);
            if (fallbackSuccess) {
              console.log('✅ Successfully set existing account as emergency fund');
            } else {
              throw new Error('Failed to save account to database and failed to update existing account');
            }
          } else {
            throw new Error('Failed to save account to database');
          }
        }
      }
      
      console.log('🎉 Account selection process completed successfully!');
      
      // Ensure automatic tracking mode is saved (in case user didn't go through choice screen)
      if (typeof window !== 'undefined') {
        const currentMode = localStorage.getItem('emergencyFundTrackingMode');
        if (!currentMode) {
          localStorage.setItem('emergencyFundTrackingMode', 'automatic');
          setTrackingMode('automatic');
          console.log('💾 Auto-saved tracking mode as automatic after successful bank connection');
        }
      }
      
      // Set the UI state
      setSelectedAccount(account);
      setShowAccountSelection(false);
      setShowResults(true);
      
    } catch (error) {
      console.error('❌ Error in account selection process:', error);
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving account: ${errorMessage}. Please try again.`);
    } finally {
      console.log('🏁 Setting loading to false...');
      setIsSavingAccount(false);
    }
  };

  const handleBackToSelection = () => {
    setShowResults(false);
    setShowAccountSelection(true);
  };

  const handleComplete = () => {
    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    
    onComplete({
      accounts,
      selectedAccount,
      totalBalance,
      currency: accounts[0]?.currency_code || 'AED',
      trackingMode: trackingMode || 'automatic' // Include tracking mode in completion
    });
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Show tracking choice screen first
  if (showTrackingChoice) {
        return (
      <div 
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 relative z-[70]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Emergency Fund Tracking</h3>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
            </div>
            
        <div className="p-6">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              How would you like to track your emergency fund?
            </h4>
            <p className="text-gray-600">
              Choose the tracking method that works best for you. You can always change this later in settings.
              </p>
            </div>

          <div className="space-y-4 mb-6">
            {/* Automatic Tracking Option */}
            <button
              onClick={() => handleTrackingChoice('automatic')}
              className="w-full p-6 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">Connect Bank Account</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      Automatically track your real balance with secure bank integration. Updates in real-time.
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        Real-time balance updates
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        Bank-grade security (256-bit encryption)
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        No manual updates needed
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>

            {/* Manual Tracking Option */}
                <button
              onClick={() => handleTrackingChoice('manual')}
              className="w-full p-6 rounded-lg border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 text-left transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gray-100 rounded-full group-hover:bg-green-200 transition-colors">
                    <Settings className="w-6 h-6 text-gray-600 group-hover:text-green-600 transition-colors" />
                    </div>
                    <div className="flex-1">
                    <h5 className="font-semibold text-gray-900 mb-2">Manual Updates</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      Update your balance manually. Perfect if you prefer full control or have multiple accounts.
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        Complete privacy - no bank connection
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        Track multiple accounts together
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        Update anytime you want
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              💡 <strong>Recommendation:</strong> Connect your bank for effortless tracking, but manual works great too!
            </p>
            <Button
              onClick={onSkip}
              variant="outline"
              className="w-full"
            >
              I'll decide later
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showAccountSelection) {
    return (
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[70]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Choose Emergency Fund Account</h3>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
                </button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <Building2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Select Your Emergency Fund Account
            </h4>
            <p className="text-gray-600">
              Choose which account you'd like to track for your emergency fund. We recommend using a dedicated savings account.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {accounts.map((account, index) => {
              const isRecommended = account.type?.toLowerCase().includes('savings') || 
                                  account.name?.toLowerCase().includes('savings');
              
              return (
                <button
                  key={account.account_id}
                  onClick={() => handleAccountSelection(account)}
                  disabled={isSavingAccount}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    isSavingAccount 
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
                      : `hover:border-green-500 hover:bg-green-50 ${
                          isRecommended ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-green-300'
                        }`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {account.name || `${account.type} Account`}
                          {isRecommended && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Recommended
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">{account.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(account.balance || 0, account.currency_code)}
                      </p>
                      {isSavingAccount && (
                        <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
              </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              You can change this selection later in your account settings
            </p>
            <Button
              onClick={onSkip}
              variant="outline"
              className="w-full"
              disabled={isSavingAccount}
            >
                  Skip for Now
                </Button>
          </div>
            </div>
          </div>
        );
  }

  if (showResults) {
        return (
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[70]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Connection Successful!</h3>
          <button
            onClick={() => onComplete()}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
            </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              Bank Successfully Connected!
            </h4>
            <p className="text-gray-600">
              {selectedAccount ? 
                `Your ${selectedAccount.name} account has been set as your emergency fund account.` :
                'Your bank has been connected successfully.'
                }
              </p>
            </div>

          {selectedAccount && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">{selectedAccount.name}</h5>
                  <p className="text-sm text-gray-500">{selectedAccount.type}</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedAccount.balance || 0, selectedAccount.currency_code)}
                </p>
              </div>
            </div>
          )}

              <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
              Real-time balance tracking enabled
                </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
              Secure bank-grade encryption
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
              Emergency fund progress tracking active
                </div>
              </div>

          <div className="mt-6 flex space-x-3">
            {accounts.length > 1 && (
              <Button 
                onClick={handleBackToSelection}
                variant="outline"
                className="flex-1"
              >
                Change Account
              </Button>
            )}
            <Button
              onClick={handleComplete}
              className="flex-1"
            >
              Continue to Dashboard
            </Button>
          </div>
        </div>
          </div>
        );
    }

  // Main connection UI
  return (
    <div 
      className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-[70]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          {forceNewConnection ? 'Connect Additional Bank' : 'Connect Your Bank Account'}
        </h3>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
          </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 mb-2">
            {forceNewConnection ? 'Add New Bank Connection' : 'Secure Bank Connection'}
          </h4>
          <p className="text-gray-600">
            {forceNewConnection 
              ? 'Connect a new bank account to expand your options for emergency fund tracking.'
              : 'Connect your bank account to automatically track your real balance and help manage your emergency fund.'
            }
          </p>
        </div>
      
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-600 whitespace-pre-line">{error}</div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Bank-grade security</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Real-time balance updates</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>No sharing of login credentials</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              forceNewConnection ? 'Connect New Bank' : 'Connect Bank Account'
            )}
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BankConnectionWizard; 