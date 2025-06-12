/**
 * Auto Data Service - Save user planning data during signup
 * Uses the exact same working REST API method from LiveDashboard manual save button
 */

// Direct REST API save function (copied from working LiveDashboard.tsx)
export const saveUserDataOnSignup = async (userId: string, plannerState: any, accessToken: string) => {
  try {
    console.log('💾 Auto-saving user data on signup via REST API...');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`, // Use user JWT token
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // 1. Save/Update User Profile (EXACT SAME AS MANUAL SAVE)
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

    console.log('🌐 Auto-saving profile via REST API...');
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
        console.error('❌ Failed to auto-save profile:', errorText);
        return { success: false, error: `Profile save failed: ${updateResponse.status}` };
      }
    }
    console.log('✅ Profile auto-saved successfully');

    // 2. Save Goals (EXACT SAME AS MANUAL SAVE)
    if (plannerState.goals.length > 0) {
      console.log(`🌐 Auto-saving ${plannerState.goals.length} goals...`);
      
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
          console.error('❌ Failed to auto-save goal:', goal.name, errorText);
          return { success: false, error: `Goal save failed: ${goal.name}` };
        }
      }
      console.log('✅ All goals auto-saved successfully');
    }

    // 3. Save Financial Plan (EXACT SAME AS MANUAL SAVE)
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

    console.log('🌐 Auto-saving financial plan...');
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/financial_plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify(planData)
    });

    if (!planResponse.ok) {
      const errorText = await planResponse.text();
      console.error('❌ Failed to auto-save financial plan:', errorText);
      return { success: false, error: `Financial plan save failed: ${planResponse.status}` };
    }

    console.log('✅ All user data auto-saved successfully via REST API');
    return { success: true };

  } catch (error: any) {
    console.error('💥 Auto-save REST API error:', error);
    return { success: false, error: error?.message || 'Auto-save REST API failed' };
  }
}; 