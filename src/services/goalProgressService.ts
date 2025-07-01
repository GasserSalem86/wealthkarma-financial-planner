import { supabase } from '../lib/supabase';

export interface GoalProgressEntry {
  id?: string;
  goal_id: string;
  user_id: string;
  month_year: string; // YYYY-MM-01 format
  planned_amount: number;
  actual_amount: number;
  cumulative_planned: number;
  cumulative_actual: number;
  variance?: number; // Calculated field
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyProgress {
  goalId: string;
  monthYear: string;
  plannedAmount: number;
  actualAmount: number;
  cumulativePlanned: number;
  cumulativeActual: number;
  variance: number;
  notes?: string;
}

/**
 * Get current month in YYYY-MM-01 format
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Get all progress entries for a user's goals
 */
export const getUserGoalProgress = async (
  userId: string,
  accessToken: string
): Promise<{ success: boolean; data?: GoalProgressEntry[]; error?: string }> => {
  try {
    console.log('📊 Fetching goal progress for user:', userId);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/goal_progress?user_id=eq.${userId}&order=month_year.desc,goal_id.asc`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch goal progress:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    console.log('✅ Goal progress fetched:', data.length, 'entries');
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error fetching goal progress:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get progress for specific goals in a specific month
 */
export const getMonthlyProgress = async (
  userId: string,
  goalIds: string[],
  monthYear: string,
  accessToken: string
): Promise<{ success: boolean; data?: GoalProgressEntry[]; error?: string }> => {
  try {
    const goalIdsFilter = goalIds.map(id => `goal_id.eq.${id}`).join(',');
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/goal_progress?user_id=eq.${userId}&month_year=eq.${monthYear}&or=(${goalIdsFilter})`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error fetching monthly progress:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Save or update progress for a specific goal and month
 */
export const saveGoalProgress = async (
  userId: string,
  goalId: string,
  monthYear: string,
  actualAmount: number,
  plannedAmount: number,
  accessToken: string,
  notes?: string
): Promise<{ success: boolean; data?: GoalProgressEntry; error?: string }> => {
  try {
    console.log('💾 Saving goal progress:', { goalId, monthYear, actualAmount, plannedAmount });

    // First, get existing progress to calculate cumulative amounts
    const existingResult = await getUserGoalProgress(userId, accessToken);
    if (!existingResult.success) {
      return { success: false, error: existingResult.error };
    }

    const existingProgress = existingResult.data || [];
    
    // Calculate cumulative amounts
    const goalProgress = existingProgress
      .filter(p => p.goal_id === goalId && p.month_year < monthYear)
      .sort((a, b) => a.month_year.localeCompare(b.month_year));

    const prevCumulativePlanned = goalProgress.length > 0 
      ? goalProgress[goalProgress.length - 1].cumulative_planned 
      : 0;
    const prevCumulativeActual = goalProgress.length > 0 
      ? goalProgress[goalProgress.length - 1].cumulative_actual 
      : 0;

    const cumulativePlanned = prevCumulativePlanned + plannedAmount;
    const cumulativeActual = prevCumulativeActual + actualAmount;

    // Check if entry already exists for this goal and month
    const existingEntry = existingProgress.find(
      p => p.goal_id === goalId && p.month_year === monthYear
    );

    const progressEntry: Partial<GoalProgressEntry> = {
      goal_id: goalId,
      user_id: userId,
      month_year: monthYear,
      planned_amount: plannedAmount,
      actual_amount: actualAmount,
      cumulative_planned: cumulativePlanned,
      cumulative_actual: cumulativeActual,
      notes: notes || undefined
    };

    let response;
    if (existingEntry) {
      // Update existing entry
      response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/goal_progress?id=eq.${existingEntry.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(progressEntry)
        }
      );
    } else {
      // Create new entry
      response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/goal_progress`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(progressEntry)
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to save goal progress:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    const savedEntry = Array.isArray(data) ? data[0] : data;
    
    console.log('✅ Goal progress saved successfully');
    return { success: true, data: savedEntry };

  } catch (error) {
    console.error('❌ Error saving goal progress:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Calculate current progress for goals based on cumulative amounts
 */
export const calculateCurrentProgress = (
  progressEntries: GoalProgressEntry[],
  goalIds: string[]
): { goalId: string; actualAmount: number; lastUpdated: Date; monthlyActual: number }[] => {
  return goalIds.map(goalId => {
    const goalEntries = progressEntries
      .filter(p => p.goal_id === goalId)
      .sort((a, b) => b.month_year.localeCompare(a.month_year));

    const latestEntry = goalEntries[0];
    
    return {
      goalId,
      actualAmount: latestEntry?.cumulative_actual || 0,
      lastUpdated: latestEntry?.updated_at ? new Date(latestEntry.updated_at) : new Date(),
      monthlyActual: latestEntry?.actual_amount || 0
    };
  });
};

/**
 * Migrate existing actualProgress data to goal_progress table
 */
export const migrateActualProgressData = async (
  userId: string,
  actualProgress: { goalId: string; actualAmount: number; lastUpdated: Date; monthlyActual: number }[],
  goals: { id: string; requiredPmt: number }[],
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Migrating actual progress data to goal_progress table...');
    
    const currentMonth = getCurrentMonth();
    
    for (const progress of actualProgress) {
      if (progress.actualAmount > 0) {
        const goal = goals.find(g => g.id === progress.goalId);
        const plannedAmount = goal?.requiredPmt || 0;
        
        const result = await saveGoalProgress(
          userId,
          progress.goalId,
          currentMonth,
          progress.actualAmount, // This will be cumulative amount
          plannedAmount,
          accessToken,
          'Migrated from JSON progress data'
        );
        
        if (!result.success) {
          console.error('❌ Failed to migrate progress for goal:', progress.goalId, result.error);
          return { success: false, error: result.error };
        }
      }
    }
    
    console.log('✅ Successfully migrated actual progress data');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error migrating progress data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 