import { supabase } from '../lib/supabase';
import { PlannerState } from '../context/PlannerContext';
import { profileService, goalsService, plansService } from './database';

export interface PlannerPersistenceService {
  savePlanningData: (userId: string, plannerState: PlannerState) => Promise<{ success: boolean; error?: string }>;
  loadPlanningData: (userId: string) => Promise<{ success: boolean; data?: Partial<PlannerState>; error?: string }>;
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

      // 1. Save/Update User Profile
      const profileData = {
        monthly_income: plannerState.userProfile.monthlyIncome || 0,
        monthly_expenses: plannerState.monthlyExpenses || 0,
        current_savings: 0, // This could be calculated from emergency fund
        currency: plannerState.userProfile.currency || 'AED',
        full_name: plannerState.userProfile.name || '',
        country: plannerState.userProfile.location || '',
        nationality: plannerState.userProfile.nationality || '',
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

    } catch (error) {
      console.error('💥 Error saving planning data:', error);
      return { success: false, error: 'Unexpected error while saving data' };
    }
  },

  async loadPlanningData(userId: string) {
    try {
      console.log('Loading planning data for user:', userId);

      // 1. Load User Profile
      const profile = await profileService.getProfile(userId);
      if (!profile) {
        console.log('No profile found for user');
        return { success: true, data: {} }; // Not an error - user might be new
      }

      // 2. Load Goals
      const goals = await goalsService.getUserGoals(userId);

      // 3. Load Latest Financial Plan
      const plans = await plansService.getUserPlans(userId);
      const latestPlan = plans[0]; // Plans are ordered by created_at desc

      // 4. Reconstruct PlannerState
      const plannerData: Partial<PlannerState> = {
        userProfile: {
          name: profile.full_name || '',
          nationality: profile.nationality || '',
          location: profile.country || '',
          monthlyIncome: profile.monthly_income || 0,
          currency: profile.currency || 'AED'
        },
        monthlyExpenses: profile.monthly_expenses || 0,
        goals: goals,
        budget: latestPlan?.total_monthly_allocation || 0,
        fundingStyle: latestPlan?.funding_style || 'hybrid',
        
        // From plan_data if available
        ...(latestPlan?.plan_data && {
          currentStep: latestPlan.plan_data.currentStep || 0,
          emergencyFundCreated: latestPlan.plan_data.emergencyFundCreated || false,
          bufferMonths: latestPlan.plan_data.bufferMonths || 3,
          selectedPhase: latestPlan.plan_data.selectedPhase || 0,
          allocations: latestPlan.plan_data.allocations || []
        })
      };

      console.log('Successfully loaded planning data');
      return { success: true, data: plannerData };

    } catch (error) {
      console.error('Error loading planning data:', error);
      return { success: false, error: 'Failed to load planning data' };
    }
  }
}; 