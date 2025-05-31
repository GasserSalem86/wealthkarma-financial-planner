import { supabase } from '../lib/supabase';
import { Goal } from '../types/plannerTypes';

export interface UserProfile {
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
  async getProfile(userId: string): Promise<UserProfile | null> {
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

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
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