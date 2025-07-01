import { supabase } from '../lib/supabase';
import { Goal } from '../types/plannerTypes';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  nationality: string | null;
  monthly_income: number | null;
  monthly_expenses: number | null;
  current_savings: number | null;
  currency: string | null;
  risk_profile: 'Conservative' | 'Balanced' | 'Growth' | null;
  planning_type: 'individual' | 'family' | null;
  family_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialPlan {
  id: string;
  user_id: string;
  plan_name: string;
  funding_style: 'waterfall' | 'parallel' | 'hybrid' | null;
  total_monthly_allocation: number | null;
  plan_data: any;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  user_id: string;
  month_year: string;
  planned_amount: number;
  actual_amount: number | null;
  cumulative_planned: number;
  cumulative_actual: number | null;
  variance: number | null;
  notes: string | null;
}

// Profile operations
export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }
    return true;
  }
};

// Goals operations
export const goalsService = {
  async getUserGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      return [];
    }

    // Convert database format to app format
    return data.map(goal => ({
      id: goal.id,
      name: goal.name,
      category: goal.category as any,
      targetDate: new Date(goal.target_date),
      amount: goal.amount,
      horizonMonths: goal.horizon_months,
      profile: goal.profile as any,
      requiredPMT: goal.required_pmt || 0,
      paymentFrequency: goal.payment_frequency as any,
      paymentPeriod: goal.payment_period,
      customRates: goal.custom_rates,
      monthlyAllocations: goal.monthly_allocations || [],
      bufferMonths: goal.buffer_months,
      selectedBank: goal.selected_bank,
      initialAmount: goal.initial_amount || 0,
      remainingAmount: goal.remaining_amount || goal.amount,
      familyRetirementProfile: goal.family_retirement_profile,
      returnPhases: [] // Will be calculated client-side
    }));
  },

  async saveGoal(userId: string, goal: Goal): Promise<boolean> {
    const goalData = {
      user_id: userId,
      name: goal.name,
      category: goal.category,
      target_date: goal.targetDate.toISOString().split('T')[0],
      amount: goal.amount,
      horizon_months: goal.horizonMonths,
      profile: goal.profile,
      required_pmt: goal.requiredPMT,
      payment_frequency: goal.paymentFrequency,
      payment_period: goal.paymentPeriod,
      custom_rates: goal.customRates,
      monthly_allocations: goal.monthlyAllocations,
      buffer_months: goal.bufferMonths,
      selected_bank: goal.selectedBank,
      initial_amount: goal.initialAmount || 0,
      remaining_amount: goal.remainingAmount || goal.amount,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('goals')
      .upsert(goalData, { onConflict: 'id' });

    if (error) {
      console.error('Error saving goal:', error);
      return false;
    }
    return true;
  },

  async deleteGoal(goalId: string): Promise<boolean> {
    const { error } = await supabase
      .from('goals')
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
    return true;
  }
};

// Financial Plans operations
export const plansService = {
  async getUserPlans(userId: string): Promise<FinancialPlan[]> {
    const { data, error } = await supabase
      .from('financial_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
    return data;
  },

  async savePlan(userId: string, planData: {
    plan_name: string;
    funding_style: 'waterfall' | 'parallel' | 'hybrid';
    total_monthly_allocation: number;
    plan_data: any;
  }): Promise<string | null> {
    const { data, error } = await supabase
      .from('financial_plans')
      .insert({
        user_id: userId,
        ...planData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving plan:', error);
      return null;
    }
    return data.id;
  },

  async updatePlan(planId: string, updates: Partial<FinancialPlan>): Promise<boolean> {
    const { error } = await supabase
      .from('financial_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);

    if (error) {
      console.error('Error updating plan:', error);
      return false;
    }
    return true;
  }
};

// Goal Progress operations
export const progressService = {
  async getGoalProgress(userId: string, goalId?: string): Promise<GoalProgress[]> {
    let query = supabase
      .from('goal_progress')
      .select('*')
      .eq('user_id', userId)
      .order('month_year', { ascending: true });

    if (goalId) {
      query = query.eq('goal_id', goalId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching goal progress:', error);
      return [];
    }
    return data;
  },

  async updateProgress(userId: string, goalId: string, monthYear: string, actualAmount: number, notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('goal_progress')
      .upsert({
        goal_id: goalId,
        user_id: userId,
        month_year: monthYear,
        actual_amount: actualAmount,
        notes: notes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'goal_id,month_year' });

    if (error) {
      console.error('Error updating progress:', error);
      return false;
    }
    return true;
  },

  async initializeGoalProgress(userId: string, goalId: string, monthlyPlan: { month_year: string; planned_amount: number; cumulative_planned: number }[]): Promise<boolean> {
    const progressData = monthlyPlan.map(month => ({
      goal_id: goalId,
      user_id: userId,
      month_year: month.month_year,
      planned_amount: month.planned_amount,
      cumulative_planned: month.cumulative_planned,
      actual_amount: 0,
      cumulative_actual: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('goal_progress')
      .upsert(progressData, { onConflict: 'goal_id,month_year' });

    if (error) {
      console.error('Error initializing goal progress:', error);
      return false;
    }
    return true;
  }
};

// Subscription operations
export const subscriptionService = {
  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
    return data;
  },

  async updateSubscription(userId: string, subscriptionData: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    plan_type?: 'free' | 'premium' | 'professional';
    status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
    current_period_start?: string;
    current_period_end?: string;
    trial_end?: string;
  }): Promise<boolean> {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        ...subscriptionData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
    return true;
  }
};

// Export operations
export const exportService = {
  async createExport(userId: string, exportData: {
    export_type: 'free_pdf' | 'premium_pdf' | 'excel' | 'complete_package';
    stripe_payment_intent_id?: string;
    amount?: number;
    currency?: string;
    download_url?: string;
    expires_at?: string;
  }): Promise<string | null> {
    const { data, error } = await supabase
      .from('exports')
      .insert({
        user_id: userId,
        ...exportData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating export:', error);
      return null;
    }
    return data.id;
  },

  async updateExportStatus(exportId: string, status: 'pending' | 'completed' | 'failed', downloadUrl?: string): Promise<boolean> {
    const { error } = await supabase
      .from('exports')
      .update({
        status,
        download_url: downloadUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId);

    if (error) {
      console.error('Error updating export status:', error);
      return false;
    }
    return true;
  },

  async getUserExports(userId: string) {
    const { data, error } = await supabase
      .from('exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exports:', error);
      return [];
    }
    return data;
  }
}; 

// Connected Accounts operations
export const connectedAccountsService = {
  async getConnectedAccounts(userId: string, accessToken: string): Promise<any[]> {
    try {
      console.log('🔍 REST API: Getting connected accounts for user:', userId);
      console.log('🎟️ REST API: Using provided access token');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const url = `${supabaseUrl}/rest/v1/connected_accounts?user_id=eq.${userId}&order=created_at.desc&select=*`;
      console.log('📡 REST API: Making request to:', url);
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      };

      console.log('⏳ REST API: Starting fetch request...');
      const response = await fetch(url, { headers });
      console.log('✅ REST API: Response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ REST API: Error response:', response.status, response.statusText);
        console.error('❌ REST API: Error body:', errorText);
        return [];
      }

      console.log('📖 REST API: Parsing JSON response...');
      const data = await response.json();
      console.log('✅ REST API: Data received:', data);
      console.log('📊 REST API: Number of accounts found:', Array.isArray(data) ? data.length : 'Not an array');
      
      return data || [];
    } catch (error) {
      console.error('❌ REST API: Exception in getConnectedAccounts:', error);
      return [];
    }
  },

  async getActiveConnectedAccounts(userId: string, accessToken: string): Promise<any[]> {
    try {
      console.log('🔍 REST API: Getting ACTIVE connected accounts for user:', userId);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const url = `${supabaseUrl}/rest/v1/connected_accounts?user_id=eq.${userId}&connection_status=eq.active&order=created_at.desc&select=*`;
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ REST API: Error response:', response.status, response.statusText);
        console.error('❌ REST API: Error body:', errorText);
        return [];
      }

      const data = await response.json();
      console.log('✅ REST API: Active accounts found:', Array.isArray(data) ? data.length : 'Not an array');
      
      return data || [];
    } catch (error) {
      console.error('❌ REST API: Exception in getActiveConnectedAccounts:', error);
      return [];
    }
  },

  async saveConnectedAccount(accountData: {
    user_id: string;
    institution_id?: string;
    lean_connection_id?: string;
    lean_entity_id?: string;
    lean_account_id?: string;
    institution_name: string;
    account_type: string;
    account_number?: string;
    balance: number;
    currency: string;
    is_emergency_fund?: boolean;
    account_metadata?: any;
  }, accessToken: string): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const insertData = {
        ...accountData,
        connection_method: 'lean',
        connection_status: 'active',
        last_balance_update: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/connected_accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(insertData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error saving connected account:');
        console.error('📋 Status:', response.status, response.statusText);
        console.error('📄 Error details:', errorText);
        console.error('📊 Data sent:', JSON.stringify(insertData, null, 2));
        return false;
      }
      
      console.log('✅ Connected account saved to database');
      return true;
    } catch (error) {
      console.error('Error in saveConnectedAccount:', error);
      return false;
    }
  },

  async updateAccountBalance(lean_account_id: string, balance: number, currency: string): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('No access token available');
        return false;
      }

      const updateData = {
        balance,
        currency,
        last_balance_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/connected_accounts?lean_account_id=eq.${lean_account_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        console.error('Error updating account balance:', response.statusText);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateAccountBalance:', error);
      return false;
    }
  },

  async setEmergencyFundAccount(userId: string, accountId: string, accessToken: string, isEmergencyFund: boolean = true): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🔄 Starting emergency fund switch process...');
      console.log('👤 User ID:', userId);
      console.log('🎯 Target account ID:', accountId);
      console.log('✅ Setting emergency fund:', isEmergencyFund);

      // First, remove emergency fund designation from all other accounts
      console.log('1️⃣ Removing emergency fund designation from ALL accounts...');
      const clearResponse = await fetch(`${supabaseUrl}/rest/v1/connected_accounts?user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_emergency_fund: false })
      });

      if (!clearResponse.ok) {
        const clearErrorText = await clearResponse.text();
        console.error('❌ Error clearing emergency fund designations:', clearResponse.status, clearResponse.statusText);
        console.error('❌ Clear error details:', clearErrorText);
        return false;
      }
      console.log('✅ Successfully cleared emergency fund designations from all accounts');

      // Then set the selected account as emergency fund
      console.log('2️⃣ Setting selected account as emergency fund...');
      const response = await fetch(`${supabaseUrl}/rest/v1/connected_accounts?id=eq.${accountId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          is_emergency_fund: isEmergencyFund,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error setting emergency fund account:', response.status, response.statusText);
        console.error('❌ Set error details:', errorText);
        return false;
      }
      
      console.log('✅ Emergency fund account designation updated successfully');
      console.log('🎯 Account', accountId, 'is now the emergency fund');
      
      // Verification: Check the final state of all accounts
      console.log('3️⃣ Verifying final state of all accounts...');
      const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/connected_accounts?user_id=eq.${userId}&select=id,institution_name,account_type,is_emergency_fund`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.ok) {
        const allAccounts = await verifyResponse.json();
        console.log('🔍 Final account states:');
        allAccounts.forEach((acc: any) => {
          console.log(`  📋 ${acc.institution_name} (${acc.id}): emergency_fund = ${acc.is_emergency_fund}`);
        });
        const emergencyFundCount = allAccounts.filter((acc: any) => acc.is_emergency_fund).length;
        console.log(`🎯 Total emergency fund accounts: ${emergencyFundCount}`);
      } else {
        console.warn('⚠️ Could not verify final account states');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in setEmergencyFundAccount:', error);
      return false;
    }
  },

  async getEmergencyFundAccount(userId: string, accessToken: string): Promise<any | null> {
    try {
      console.log('🎯 REST API: Getting emergency fund account for user:', userId);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/connected_accounts?user_id=eq.${userId}&is_emergency_fund=eq.true&connection_status=eq.active&select=*`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ Error fetching emergency fund account:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('📊 REST API: Emergency fund accounts found:', data.length);
      
      // Return first emergency fund account or null if none found
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Error in getEmergencyFundAccount:', error);
      return null;
    }
  },

  async deleteConnectedAccount(accountId: string, userId: string, accessToken: string): Promise<boolean> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🗑️ Deleting connected account:', accountId);

      const response = await fetch(`${supabaseUrl}/rest/v1/connected_accounts?id=eq.${accountId}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error deleting connected account:', response.status, response.statusText);
        console.error('❌ Error details:', errorText);
        return false;
      }
      
      console.log('✅ Connected account deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteConnectedAccount:', error);
      return false;
    }
  }
}; 