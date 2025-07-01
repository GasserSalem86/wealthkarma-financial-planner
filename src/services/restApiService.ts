import { PlannerState } from '../context/PlannerContext';

interface RestApiConfig {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
}

// Helper function with timeout and retry logic
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit, 
  timeoutMs: number = 8000,
  retries: number = 2
): Promise<Response> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx), try again
      lastError = new Error(`Server error: ${response.status}`);
      if (attempt < retries) {
        console.log(`🔄 Retrying request (attempt ${attempt + 1}/${retries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
      }
      
    } catch (error: any) {
      lastError = error;
      if (error?.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      }
      
      if (attempt < retries) {
        console.log(`🔄 Retrying after error (attempt ${attempt + 1}/${retries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};

// Quick progress save (profile + plan summary + actual progress)
export const saveProgressQuick = async (
  userId: string, 
  accessToken: string, 
  plannerState: PlannerState,
  actualProgress?: any[] // Add actualProgress parameter
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const config: RestApiConfig = {
      supabaseUrl,
      anonKey,
      accessToken
    };

    const headers = {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('💾 Quick progress save starting...');

    // 1. Save/Update User Profile
    console.log('🔄 Saving profile...');
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

    const profileResponse = await fetchWithTimeout(
      `${config.supabaseUrl}/rest/v1/profiles`, 
      {
        method: 'POST',
        headers,
        body: JSON.stringify(profileData)
      }, 
      6000, // 6 second timeout
      1 // 1 retry
    );

    if (!profileResponse.ok) {
      // Try update instead of insert
      console.log('🔄 Profile insert failed, trying update...');
      const updateResponse = await fetchWithTimeout(
        `${config.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, 
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(profileData)
        }, 
        6000, 
        1
      );
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Failed to save profile:', errorText);
        return { success: false, error: `Profile save failed: ${updateResponse.status}` };
      }
    }
    console.log('✅ Profile saved');

    // 2. Save Progress Summary + Actual Progress Data
    console.log('🔄 Saving progress summary and actual progress...');
    const planData = {
      user_id: userId,
      plan_name: `Progress Update - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      funding_style: plannerState.fundingStyle,
      total_monthly_allocation: plannerState.budget,
      plan_data: {
        currentStep: plannerState.currentStep,
        emergencyFundCreated: plannerState.emergencyFundCreated,
        bufferMonths: plannerState.bufferMonths,
        selectedPhase: plannerState.selectedPhase,
        userProfile: plannerState.userProfile,
        leftoverSavings: plannerState.leftoverSavings || 0,
        lastProgressUpdate: new Date().toISOString(),
        goalsCount: plannerState.goals.length,
        quickSave: true,
        // Include actual progress data to restore manual updates
        actualProgress: actualProgress || []
      },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const planResponse = await fetchWithTimeout(
      `${config.supabaseUrl}/rest/v1/financial_plans`, 
      {
        method: 'POST',
        headers,
        body: JSON.stringify(planData)
      }, 
      6000, 
      1
    );

    if (!planResponse.ok) {
      const errorText = await planResponse.text();
      console.error('❌ Failed to save progress summary:', errorText);
      return { success: false, error: `Progress save failed: ${planResponse.status}` };
    }

    console.log('✅ Progress saved successfully via REST API');
    return { success: true };

  } catch (error) {
    console.error('❌ Error in quick progress save:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save progress' 
    };
  }
};

// Verify API connectivity
export const testConnection = async (accessToken: string): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`, 
      { headers }, 
      3000, 
      0 // No retries for connection test
    );

    return response.ok;
  } catch {
    return false;
  }
}; 