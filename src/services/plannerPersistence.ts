import { supabase } from '../lib/supabase';
import { PlannerState } from '../context/PlannerContext';
import { profileService, goalsService, plansService } from './database';

// Direct REST API data loading function (no hanging Supabase client calls)
async function loadDataViaRestAPI(userId: string, accessToken: string): Promise<{ success: boolean; data?: Partial<PlannerState>; error?: string }> {
  try {
    console.log('🌐 Loading data via REST API...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('✅ Using provided JWT token for REST API authentication');
    
    const headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`, // Use provided user JWT token
      'Content-Type': 'application/json'
    };

    // Helper function to add timeout to fetch calls
    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error?.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
      }
    };

    // 1. Load User Profile
    console.log('🌐 Loading profile via REST API with user JWT...');
    const profileResponse = await fetchWithTimeout(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers
    }, 8000); // 8 second timeout
    
    let profile = null;
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      profile = profileData[0] || null;
      console.log('✅ Profile loaded via REST API');
    } else {
      const errorText = await profileResponse.text();
      console.warn('⚠️ Profile not found via REST API:', errorText);
    }

    if (!profile) {
      console.log('ℹ️ No profile found for user');
      return { success: true, data: {} };
    }

    // 2. Load Goals
    console.log('🌐 Loading goals via REST API...');
    const goalsResponse = await fetchWithTimeout(`${supabaseUrl}/rest/v1/goals?user_id=eq.${userId}&is_active=eq.true&order=created_at.asc&select=*`, {
      headers
    }, 8000); // 8 second timeout
    
    let goals: any[] = [];
    if (goalsResponse.ok) {
      const goalsData = await goalsResponse.json();
      
      // Helper function to rebuild return phases (same logic as PlannerContext)
      const buildReturnPhases = (
        horizonMonths: number,
        profile: any,
        paymentPeriod?: number,
        customRates?: { high: number; mid: number; low: number }
      ) => {
        const defaultRates = {
          Conservative: { high: 0.04, mid: 0.03, low: 0.02 },
          Balanced: { high: 0.06, mid: 0.05, low: 0.03 },
          Growth: { high: 0.08, mid: 0.07, low: 0.05 },
        } as const;

        const rates = customRates || defaultRates[profile as keyof typeof defaultRates];
        const years = horizonMonths / 12;

        // If goal carries a payment period (e.g. mortgage, tuition)
        if (paymentPeriod) {
          if (years <= 3) {
            return [
              { length: horizonMonths, rate: rates.low },
              { length: paymentPeriod * 12, rate: 0.02 }
            ];
          } else if (years <= 7) {
            const conservative = 24;
            return [
              { length: horizonMonths - conservative, rate: rates.high },
              { length: conservative, rate: rates.low },
              { length: paymentPeriod * 12, rate: 0.02 }
            ];
          } else {
            const high = Math.floor(horizonMonths * 0.72);
            const mid = Math.floor(horizonMonths * 0.16);
            const low = horizonMonths - high - mid;
            return [
              { length: high, rate: rates.high },
              { length: mid, rate: rates.mid },
              { length: low, rate: rates.low },
              { length: paymentPeriod * 12, rate: 0.02 }
            ];
          }
        }

        if (years <= 3) {
          return [{ length: horizonMonths, rate: rates.low }];
        }
        if (years <= 7) {
          const mid = 24;
          return [
            { length: horizonMonths - mid, rate: rates.high },
            { length: mid, rate: rates.low },
          ];
        }
        const high = Math.floor(horizonMonths * 0.72);
        const mid = Math.floor(horizonMonths * 0.16);
        const low = horizonMonths - high - mid;
        return [
          { length: high, rate: rates.high },
          { length: mid, rate: rates.mid },
          { length: low, rate: rates.low },
        ];
      };
      
      goals = goalsData.map((goal: any) => {
        // Reconstruct return phases based on goal profile and horizon
        const returnPhases = buildReturnPhases(
          goal.horizon_months,
          goal.profile,
          goal.payment_period,
          goal.custom_rates
        );
        
        return {
          id: goal.id,
          name: goal.name,
          category: goal.category,
          targetDate: new Date(goal.target_date),
          amount: goal.amount,
          horizonMonths: goal.horizon_months,
          profile: goal.profile,
          requiredPMT: goal.required_pmt || 0,
          paymentFrequency: goal.payment_frequency,
          paymentPeriod: goal.payment_period,
          customRates: goal.custom_rates,
          monthlyAllocations: goal.monthly_allocations || [],
          bufferMonths: goal.buffer_months,
          selectedBank: goal.selected_bank,
          initialAmount: goal.initial_amount || 0,
          remainingAmount: goal.remaining_amount || goal.amount,
          familyRetirementProfile: goal.family_retirement_profile,
          returnPhases // Properly reconstructed return phases!
        };
      });
      console.log(`✅ Loaded ${goals.length} goals via REST API`);
    } else {
      const errorText = await goalsResponse.text();
      console.warn('⚠️ Failed to load goals via REST API:', errorText);
    }

    // 3. Load Latest Financial Plan
    console.log('🌐 Loading plans via REST API...');
    const plansResponse = await fetchWithTimeout(`${supabaseUrl}/rest/v1/financial_plans?user_id=eq.${userId}&is_active=eq.true&order=created_at.desc&select=*`, {
      headers
    }, 8000); // 8 second timeout
    
    let latestPlan = null;
    if (plansResponse.ok) {
      const plansData = await plansResponse.json();
      latestPlan = plansData[0] || null;
      console.log('✅ Plans loaded via REST API');
    } else {
      const errorText = await plansResponse.text();
      console.warn('⚠️ Failed to load plans via REST API:', errorText);
    }

    // 4. Reconstruct PlannerState
    const plannerData: Partial<PlannerState> = {
      userProfile: {
        name: profile.full_name || '',
        nationality: profile.nationality || '',
        location: profile.country || '',
        monthlyIncome: profile.monthly_income || 0,
        currency: profile.currency || 'AED',
        planningType: profile.planning_type || 'individual',
        familySize: profile.family_size || 1,
        currentSavings: profile.current_savings || 0
      },
      monthlyExpenses: profile.monthly_expenses || 0,
      goals: goals,
      budget: latestPlan?.total_monthly_allocation || 0,
      fundingStyle: latestPlan?.funding_style || 'hybrid',
      leftoverSavings: latestPlan?.plan_data?.leftoverSavings || 0,
      
      // From plan_data if available
      ...(latestPlan?.plan_data && {
        currentStep: latestPlan.plan_data.currentStep || 0,
        emergencyFundCreated: latestPlan.plan_data.emergencyFundCreated || false,
        bufferMonths: latestPlan.plan_data.bufferMonths || 3,
        selectedPhase: latestPlan.plan_data.selectedPhase || 0,
        allocations: latestPlan.plan_data.allocations || []
      })
    };

    console.log('✅ Successfully reconstructed planning data via REST API');
    return { success: true, data: plannerData };

  } catch (error) {
    console.error('💥 Error loading data via REST API:', error);
    return { success: false, error: `Failed to load data via REST API: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// REST API save function for when Supabase client hangs  
async function saveDataViaRestAPI(userId: string, plannerState: PlannerState): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🌐 Saving data via REST API...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Get user JWT token for proper authentication
    const { supabase } = await import('../lib/supabase');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('❌ Failed to get user session for REST API');
      return { success: false, error: 'User session required for saving data' };
    }
    
    console.log('✅ Got user JWT token for REST API authentication');
    
    const headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${session.access_token}`, // Use user JWT token, not anon key
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 1. Save/Update User Profile
    const profileData = {
      id: userId,
      monthly_income: plannerState.userProfile.monthlyIncome || 0,
      monthly_expenses: plannerState.monthlyExpenses || 0,
      current_savings: plannerState.userProfile.currentSavings || 0,
      currency: plannerState.userProfile.currency || 'AED',
      full_name: plannerState.userProfile.name || '',
      country: plannerState.userProfile.location || '',
      nationality: plannerState.userProfile.nationality || '',
      planning_type: plannerState.userProfile.planningType || 'individual',
      family_size: plannerState.userProfile.familySize || 1,
      risk_profile: (plannerState.selectedPhase === 0 ? 'Conservative' : 
                   plannerState.selectedPhase === 1 ? 'Balanced' : 'Growth'),
      updated_at: new Date().toISOString()
    };

    console.log('🌐 Saving profile via REST API with user JWT...');
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData)
    });

    if (!profileResponse.ok) {
      // Try update instead of insert
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(profileData)
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Failed to save profile via REST API:', errorText);
        return { success: false, error: `Failed to save profile data: ${updateResponse.status}` };
      }
    }
    console.log('✅ Profile saved via REST API');

    // 2. Save Goals
    if (plannerState.goals.length > 0) {
      console.log(`🌐 Saving ${plannerState.goals.length} goals via REST API...`);
      
      for (const goal of plannerState.goals) {
        const goalData = {
          user_id: userId,
          name: goal.name,
          category: goal.category,
          target_date: goal.targetDate.toISOString(),
          amount: goal.amount,
          horizon_months: goal.horizonMonths,
          profile: goal.profile,
          required_pmt: goal.requiredPMT || 0,
          payment_frequency: goal.paymentFrequency,
          payment_period: goal.paymentPeriod,
          custom_rates: goal.customRates,
          monthly_allocations: goal.monthlyAllocations || [],
          buffer_months: goal.bufferMonths,
          selected_bank: goal.selectedBank,
          initial_amount: goal.initialAmount || 0,
          remaining_amount: goal.remainingAmount || goal.amount,
          family_retirement_profile: goal.familyRetirementProfile,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const goalResponse = await fetch(`${supabaseUrl}/rest/v1/goals`, {
          method: 'POST',
          headers,
          body: JSON.stringify(goalData)
        });

        if (!goalResponse.ok) {
          const errorText = await goalResponse.text();
          console.error('❌ Failed to save goal via REST API:', goal.name, errorText);
          return { success: false, error: `Failed to save goal: ${goal.name} (${goalResponse.status})` };
        }
      }
      console.log('✅ All goals saved via REST API');
    }

    // 3. Save Financial Plan
    const planData = {
      user_id: userId,
      plan_name: `Financial Plan - ${new Date().toLocaleDateString()}`,
      funding_style: plannerState.fundingStyle,
      total_monthly_allocation: plannerState.budget,
      plan_data: {
        currentStep: plannerState.currentStep,
        emergencyFundCreated: plannerState.emergencyFundCreated,
        bufferMonths: plannerState.bufferMonths,
        selectedPhase: plannerState.selectedPhase,
        allocations: plannerState.allocations,
        userProfile: plannerState.userProfile,
        leftoverSavings: plannerState.leftoverSavings || 0,
        completedAt: new Date().toISOString()
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🌐 Saving financial plan via REST API...');
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/financial_plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(planData)
    });

    if (!planResponse.ok) {
      const errorText = await planResponse.text();
      console.error('❌ Failed to save financial plan via REST API:', errorText);
      return { success: false, error: `Failed to save financial plan: ${planResponse.status}` };
    }

    console.log('✅ Successfully saved all planning data via REST API');
    return { success: true };

  } catch (error) {
    console.error('💥 Error saving data via REST API:', error);
    return { success: false, error: 'Failed to save data via REST API' };
  }
}

export interface PlannerPersistenceService {
  savePlanningData: (userId: string, plannerState: PlannerState) => Promise<{ success: boolean; error?: string }>;
  loadPlanningData: (userId: string, accessToken?: string) => Promise<{ success: boolean; data?: Partial<PlannerState>; error?: string }>;
}

export const plannerPersistence: PlannerPersistenceService = {
  async savePlanningData(userId: string, plannerState: PlannerState) {
    try {
      console.log('💾 Starting to save planning data for user:', userId);
      console.log('📊 Planning state summary:', {
        userProfile: plannerState.userProfile,
        goalsCount: plannerState.goals.length,
        budget: plannerState.budget,
        selectedPhase: plannerState.selectedPhase
      });

      // Test if Supabase client works before proceeding
      console.log('🔌 Testing Supabase client for saving...');
      let supabaseClientWorking = false;
      
      try {
        const { supabase } = await import('../lib/supabase');
        const testPromise = supabase.from('profiles').select('id').limit(1);
        const testTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Save test timeout')), 5000);
        });
        
        await Promise.race([testPromise, testTimeout]);
        supabaseClientWorking = true;
        console.log('✅ Supabase client working for saves');
      } catch {
        supabaseClientWorking = false;
        console.log('❌ Supabase client failed for saves, using REST API...');
      }

      // Use REST API if Supabase client doesn't work
      if (!supabaseClientWorking) {
        return await saveDataViaRestAPI(userId, plannerState);
      }

      // Add timeout protection for saving
      const saveWithTimeout = async () => {
      // 1. Save/Update User Profile
      const profileData = {
        monthly_income: plannerState.userProfile.monthlyIncome || 0,
        monthly_expenses: plannerState.monthlyExpenses || 0,
        current_savings: plannerState.userProfile.currentSavings || 0,
        currency: plannerState.userProfile.currency || 'AED',
        full_name: plannerState.userProfile.name || '',
        country: plannerState.userProfile.location || '',
        nationality: plannerState.userProfile.nationality || '',
        planning_type: plannerState.userProfile.planningType || 'individual',
        family_size: plannerState.userProfile.familySize || 1,
        risk_profile: (plannerState.selectedPhase === 0 ? 'Conservative' : 
                     plannerState.selectedPhase === 1 ? 'Balanced' : 'Growth') as 'Conservative' | 'Balanced' | 'Growth',
        updated_at: new Date().toISOString()
      };

      console.log('💾 Saving profile data:', profileData);
      const profileSaved = await profileService.updateProfile(userId, profileData);
      if (!profileSaved) {
        console.error('❌ Failed to save profile data');
        return { success: false, error: 'Failed to save profile data' };
      }
      console.log('✅ Profile saved successfully');

      // 2. Save Goals
      if (plannerState.goals.length > 0) {
        console.log(`💾 Saving ${plannerState.goals.length} goals...`);
        const goalPromises = plannerState.goals.map((goal, index) => {
          console.log(`📝 Goal ${index + 1}:`, {
            name: goal.name,
            amount: goal.amount,
            category: goal.category
          });
          return goalsService.saveGoal(userId, goal);
        });
        const goalResults = await Promise.all(goalPromises);
        
        if (goalResults.some((result: boolean) => !result)) {
          console.error('❌ Failed to save some goals');
          return { success: false, error: 'Failed to save some goals' };
        }
        console.log('✅ All goals saved successfully');
      } else {
        console.log('ℹ️ No goals to save');
      }

      // 3. Save Financial Plan
      const planData = {
        plan_name: `Financial Plan - ${new Date().toLocaleDateString()}`,
        funding_style: plannerState.fundingStyle,
        total_monthly_allocation: plannerState.budget,
        plan_data: {
          currentStep: plannerState.currentStep,
          emergencyFundCreated: plannerState.emergencyFundCreated,
          bufferMonths: plannerState.bufferMonths,
          selectedPhase: plannerState.selectedPhase,
          allocations: plannerState.allocations,
          userProfile: plannerState.userProfile,
          leftoverSavings: plannerState.leftoverSavings || 0,
          completedAt: new Date().toISOString()
        }
      };

      console.log('💾 Saving financial plan:', planData);
      const planId = await plansService.savePlan(userId, planData);
      if (!planId) {
        console.error('❌ Failed to save financial plan');
        return { success: false, error: 'Failed to save financial plan' };
      }

      console.log('✅ Successfully saved all planning data with plan ID:', planId);
      return { success: true };
      };

      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out after 60 seconds')), 60000);
      });

      const result = await Promise.race([saveWithTimeout(), timeoutPromise]) as any;
      return result;

    } catch (error) {
      console.error('💥 Error saving planning data:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          return { success: false, error: 'Save operation timed out. Please check your connection and try again.' };
        }
        return { success: false, error: `Save failed: ${error.message}` };
      }
      
      return { success: false, error: 'Unexpected error while saving data' };
    }
  },

  async loadPlanningData(userId: string, accessToken?: string) {
    try {
      console.log('📥 Loading planning data for user:', userId);

      // Add timeout protection for loading
      const loadWithTimeout = async () => {
        const startTime = Date.now();
        
        console.log('🌐 Using REST API for data loading (direct approach)...');
        
        // Need access token for REST API
        if (!accessToken) {
          console.error('❌ No access token provided for REST API');
          return { success: false, error: 'Access token required for data loading' };
        }
        
        console.log('✅ Access token available, proceeding with REST API calls...');
        return await loadDataViaRestAPI(userId, accessToken);
      };

      // Add timeout protection (shorter timeout for faster recovery)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load operation timed out after 20 seconds')), 20000);
      });

      const result = await Promise.race([loadWithTimeout(), timeoutPromise]) as any;
      return result;

    } catch (error) {
      console.error('💥 Error loading planning data:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          return { success: false, error: 'Load operation timed out. Please check your connection.' };
        }
        return { success: false, error: `Load failed: ${error.message}` };
      }
      
      return { success: false, error: 'Failed to load planning data' };
    }
  }
}; 