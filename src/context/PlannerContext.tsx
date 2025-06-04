import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Goal, GoalResult, Profile, ReturnPhase, FundingStyle } from '../types/plannerTypes';
import { calculateSequentialAllocations, calculateRequiredPMT } from '../utils/calculations';
import { useAuth } from './AuthContext';
// Static import to avoid dynamic import failures in production
import { plannerPersistence } from '../services/plannerPersistence';
import { supabase } from '../lib/supabase';

// Define the context state type
export interface PlannerState {
  currentStep: number;
  monthlyExpenses: number;
  bufferMonths: number;
  emergencyFundCreated: boolean;
  goals: Goal[];
  budget: number;
  selectedPhase: number;
  allocations: GoalResult[];
  fundingStyle: FundingStyle;
  // User profile for AI context
  userProfile: {
    name?: string;
    nationality?: string;
    location?: string;
    monthlyIncome?: number;
    currency?: string;
  };
  // Add loading state
  isLoading: boolean;
  isDataLoaded: boolean;
}

// Define the initial state
const initialState: PlannerState = {
  currentStep: 0,
  monthlyExpenses: 0,
  bufferMonths: 3,
  emergencyFundCreated: false,
  goals: [],
  budget: 0,
  selectedPhase: 0,
  allocations: [],
  fundingStyle: 'hybrid',
  userProfile: {},
  isLoading: true,
  isDataLoaded: false
};

// Define action types
type PlannerAction =
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'SET_MONTHLY_EXPENSES'; payload: number }
  | { type: 'SET_BUFFER_MONTHS'; payload: number }
  | { type: 'CREATE_EMERGENCY_FUND'; payload: { targetMonth: number; targetYear: number } }
  | { type: 'UPDATE_EMERGENCY_FUND'; payload: { monthlyExpenses: number; bufferMonths: number; targetMonth: number; targetYear: number } }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'SET_SELECTED_PHASE'; payload: number }
  | { type: 'UPDATE_GOAL_PROFILE'; payload: { id: string; profile: Profile } }
  | { type: 'UPDATE_GOAL_RATES'; payload: { id: string; rates: { high: number; mid: number; low: number } } }
  | { type: 'SET_FUNDING_STYLE'; payload: FundingStyle }
  | { type: 'SET_USER_PROFILE'; payload: { name?: string; nationality?: string; location?: string; monthlyIncome?: number; currency?: string } }
  | { type: 'LOAD_PLANNING_DATA'; payload: Partial<PlannerState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA_LOADED'; payload: boolean };

// Helper function to recalculate allocations
const recalculateAllocations = (state: PlannerState): GoalResult[] => {
  return calculateSequentialAllocations(state.goals, state.budget, state.fundingStyle);
};

// Helper function to build return phases given profile, horizon and optional payment period / custom rates
const buildReturnPhases = (
  horizonMonths: number,
  profile: Profile,
  paymentPeriod?: number,
  customRates?: { high: number; mid: number; low: number }
): ReturnPhase[] => {
  const defaultRates = {
    Conservative: { high: 0.04, mid: 0.03, low: 0.02 },
    Balanced: { high: 0.06, mid: 0.05, low: 0.03 },
    Growth: { high: 0.08, mid: 0.07, low: 0.05 },
  } as const;

  const rates = customRates || defaultRates[profile];
  const years = horizonMonths / 12;

  // If goal carries a payment period (e.g. mortgage, tuition)
  if (paymentPeriod) {
    if (years <= 3) {
      // Short-term payment goals: Conservative throughout accumulation
      return [
        { length: horizonMonths, rate: rates.low },
        { length: paymentPeriod * 12, rate: 0.02 }
      ];
    } else if (years <= 7) {
      // Medium-term payment goals: Growth then conservative before target
      const conservative = 24; // Last 2 years before target
      return [
        { length: horizonMonths - conservative, rate: rates.high },
        { length: conservative, rate: rates.low },
        { length: paymentPeriod * 12, rate: 0.02 }
      ];
    } else {
      // Long-term payment goals: Use three-phase strategy like regular goals
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
    const mid = 24; // last 2 years low-risk
    return [
      { length: horizonMonths - mid, rate: rates.high },
      { length: mid, rate: rates.low },
    ];
  }
  // >7 years: high → mid → low according to 72/16/12 rule
  const high = Math.floor(horizonMonths * 0.72);
  const mid = Math.floor(horizonMonths * 0.16);
  const low = horizonMonths - high - mid;
  return [
    { length: high, rate: rates.high },
    { length: mid, rate: rates.mid },
    { length: low, rate: rates.low },
  ];
};

// Create the reducer function
const plannerReducer = (state: PlannerState, action: PlannerAction): PlannerState => {
  let newState: PlannerState;

  switch (action.type) {
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_MONTHLY_EXPENSES': {
      const newExpenses = action.payload;
      const updatedState = { ...state, monthlyExpenses: newExpenses };
      
      // Auto-calculate budget if we have both income and expenses
      if (state.userProfile.monthlyIncome && newExpenses > 0) {
        const availableSavings = state.userProfile.monthlyIncome - newExpenses;
        updatedState.budget = Math.max(0, availableSavings);
        updatedState.allocations = recalculateAllocations(updatedState);
      }
      
      return updatedState;
    }

    case 'SET_BUFFER_MONTHS':
      return { ...state, bufferMonths: action.payload };

    case 'CREATE_EMERGENCY_FUND': {
      const amount = state.monthlyExpenses * state.bufferMonths;
      const horizonMonths = state.bufferMonths;
      const returnPhases: ReturnPhase[] = [{ length: horizonMonths, rate: 0.01 }];
      const targetDate = new Date(action.payload.targetYear, action.payload.targetMonth);
      
      const emergencyFund: Goal = {
        id: 'emergency-fund',
        name: 'Emergency Fund',
        category: 'Home',
        targetDate,
        amount,
        horizonMonths,
        profile: 'Conservative',
        returnPhases,
        requiredPMT: calculateRequiredPMT(amount, returnPhases, horizonMonths),
      };
      
      newState = { 
        ...state, 
        goals: [emergencyFund, ...state.goals], 
        emergencyFundCreated: true,
        currentStep: 1 
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;
    }

    case 'UPDATE_EMERGENCY_FUND': {
      const { monthlyExpenses, bufferMonths, targetMonth, targetYear } = action.payload;
      const amount = monthlyExpenses * bufferMonths;
      const horizonMonths = bufferMonths;
      const returnPhases: ReturnPhase[] = [{ length: horizonMonths, rate: 0.01 }];
      const targetDate = new Date(targetYear, targetMonth);

      const updatedEmergencyFund: Goal = {
        id: 'emergency-fund',
        name: 'Emergency Fund',
        category: 'Home',
        targetDate,
        amount,
        horizonMonths,
        profile: 'Conservative',
        returnPhases,
        requiredPMT: calculateRequiredPMT(amount, returnPhases, horizonMonths),
      };

      newState = {
        ...state,
        monthlyExpenses,
        bufferMonths,
        goals: state.goals.map(goal => 
          goal.id === 'emergency-fund' ? updatedEmergencyFund : goal
        ),
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;
    }

    case 'ADD_GOAL':
      newState = { ...state, goals: [...state.goals, action.payload] };
      newState.allocations = recalculateAllocations(newState);
      return newState;

    case 'UPDATE_GOAL':
      newState = {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id ? action.payload : goal
        ),
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;

    case 'DELETE_GOAL':
      newState = {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload),
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;

    case 'SET_BUDGET':
      newState = { ...state, budget: action.payload };
      newState.allocations = recalculateAllocations(newState);
      return newState;

    case 'SET_SELECTED_PHASE':
      return { ...state, selectedPhase: action.payload };

    case 'UPDATE_GOAL_PROFILE': {
      const { id, profile } = action.payload;
      newState = {
        ...state,
        goals: state.goals.map((goal) => {
          if (goal.id === id) {
            const returnPhases = buildReturnPhases(
              goal.horizonMonths,
              profile,
              goal.paymentPeriod,
              undefined
            );
            return {
              ...goal,
              profile,
              customRates: undefined,
              returnPhases,
              requiredPMT: calculateRequiredPMT(
                goal.amount,
                returnPhases,
                goal.horizonMonths,
                goal.paymentFrequency,
                goal.paymentPeriod
              ),
            };
          }
          return goal;
        }),
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;
    }

    case 'UPDATE_GOAL_RATES': {
      const { id, rates } = action.payload;
      newState = {
        ...state,
        goals: state.goals.map((goal) => {
          if (goal.id === id) {
            const returnPhases = buildReturnPhases(
              goal.horizonMonths,
              goal.profile,
              goal.paymentPeriod,
              rates
            );
            return {
              ...goal,
              customRates: rates,
              returnPhases,
              requiredPMT: calculateRequiredPMT(
                goal.amount,
                returnPhases,
                goal.horizonMonths,
                goal.paymentFrequency,
                goal.paymentPeriod
              ),
            };
          }
          return goal;
        }),
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;
    }

    case 'SET_FUNDING_STYLE':
      newState = { ...state, fundingStyle: action.payload };
      newState.allocations = recalculateAllocations(newState);
      return newState;

    case 'SET_USER_PROFILE': {
      const newProfile = action.payload;
      const updatedState = { ...state, userProfile: newProfile };
      
      // Auto-calculate budget if we have both income and expenses
      if (newProfile.monthlyIncome && state.monthlyExpenses > 0) {
        const availableSavings = newProfile.monthlyIncome - state.monthlyExpenses;
        updatedState.budget = Math.max(0, availableSavings);
        updatedState.allocations = recalculateAllocations(updatedState);
      }
      
      return updatedState;
    }

    case 'LOAD_PLANNING_DATA': {
      const loadedData = action.payload;
      newState = {
        ...state,
        currentStep: loadedData.currentStep ?? state.currentStep,
        monthlyExpenses: loadedData.monthlyExpenses ?? state.monthlyExpenses,
        bufferMonths: loadedData.bufferMonths ?? state.bufferMonths,
        emergencyFundCreated: loadedData.emergencyFundCreated ?? state.emergencyFundCreated,
        goals: loadedData.goals ?? state.goals,
        budget: loadedData.budget ?? state.budget,
        selectedPhase: loadedData.selectedPhase ?? state.selectedPhase,
        allocations: loadedData.allocations ?? state.allocations,
        fundingStyle: loadedData.fundingStyle ?? state.fundingStyle,
        userProfile: loadedData.userProfile ?? state.userProfile,
        isLoading: loadedData.isLoading ?? false,
        isDataLoaded: loadedData.isDataLoaded ?? true
      };
      newState.allocations = recalculateAllocations(newState);
      return newState;
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_DATA_LOADED':
      return { ...state, isDataLoaded: action.payload };

    default:
      return state;
  }
};

// Create the context
interface PlannerContextType {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
  saveToSupabase: () => Promise<{ success: boolean; error?: string }>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

// Create a provider component with localStorage persistence
export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth(); // Get both user and session from AuthContext
  
  // Lazy init: attempt to load from localStorage
  const [state, dispatch] = useReducer(
    plannerReducer,
    initialState,
    (init) => {
      try {
        const saved = localStorage.getItem('planner-state');
        if (saved) {
          console.log('📱 Loading saved state from localStorage on init');
          const parsed = JSON.parse(saved);
          // Revive Date objects
          parsed.goals = (parsed.goals || []).map((g: any) => ({
            ...g,
            targetDate: new Date(g.targetDate),
          }));
          // Always ensure loading is false on init
          return { ...init, ...parsed, isLoading: false, isDataLoaded: true };
        }
      } catch (error) {
        console.warn('Failed to parse localStorage data:', error);
      }
      // Ensure loading is false when no localStorage data
      return { ...init, isLoading: false, isDataLoaded: true };
    }
  );

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadUserData = async () => {
      console.log('🔍 Load check:', { 
        hasUser: !!user, 
        userId: user?.id, 
        hasSession: !!session, 
        hasAccessToken: !!session?.access_token,
        currentIsLoading: state.isLoading
      });

      if (!user) {
        console.log('🚫 No user during init, ensuring loading is false');
        // Ensure loading state is false when no user
        if (state.isLoading) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }

      if (!session) {
        console.log('📭 No session available yet, waiting...');
        return;
      }

      if (!session.access_token) {
        console.log('📭 No access token in session, waiting...');
        return;
      }

      // CRITICAL: Use state.isLoading to prevent duplicate loads
      if (state.isLoading) {
        console.log('🔄 Already loading (state.isLoading = true), skipping...');
        return;
      }

      // Circuit breaker: Check for recent failures to prevent infinite retry loops
      const failureKey = `load_failures_${user.id}`;
      const lastFailure = sessionStorage.getItem(failureKey);
      if (lastFailure) {
        const timeSinceFailure = Date.now() - parseInt(lastFailure);
        if (timeSinceFailure < 60000) { // 1 minute cooldown after failure
          console.log('🚫 Recent load failure detected, cooling down for 1 minute');
          return;
        }
        // Clear old failure marker
        sessionStorage.removeItem(failureKey);
      }

      // Check if we already have data loaded and it's recent
      const lastLoaded = sessionStorage.getItem('last_data_load');
      if (lastLoaded) {
        const timeSinceLoad = Date.now() - parseInt(lastLoaded);
        if (timeSinceLoad < 30000 && state.isDataLoaded) { // 30 seconds
          console.log('📊 Recent data load detected, skipping reload');
          return;
        }
      }

      console.log('👤 User authenticated with valid session, loading data from Supabase...');
      console.log('🔑 Access token available:', session.access_token.substring(0, 20) + '...');
      
      // Set loading state immediately to prevent race conditions
      dispatch({ type: 'SET_LOADING', payload: true });

      // Set a maximum timeout for the entire loading process
      const maxLoadTime = 60000; // 60 seconds maximum
      timeoutId = setTimeout(() => {
        console.error('⏰ Load operation timed out after 60 seconds, forcing loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
        // Mark as failure to prevent immediate retry
        sessionStorage.setItem(failureKey, Date.now().toString());
      }, maxLoadTime);

      try {
        console.log('🎯 Calling plannerPersistence.loadPlanningData...');
        
        const result = await plannerPersistence.loadPlanningData(user.id, session.access_token);
        console.log('📋 Load result:', { success: result.success, hasData: !!result.data, error: result.error });

        if (result.success && result.data && Object.keys(result.data).length > 0) {
          console.log('✅ Successfully loaded data from Supabase');
          console.log('📊 Loaded data summary:', {
            userProfile: !!result.data.userProfile,
            goalsCount: result.data.goals?.length || 0,
            budget: result.data.budget,
            hasAllocations: !!result.data.allocations
          });
          
          dispatch({ type: 'LOAD_PLANNING_DATA', payload: result.data });
          
          // Clear localStorage only on successful load
          localStorage.removeItem('planner-state');
          console.log('🗑️ Cleared localStorage - Supabase data loaded successfully');
          
          // Mark successful load time and clear any failure markers
          sessionStorage.setItem('last_data_load', Date.now().toString());
          sessionStorage.removeItem(failureKey);
        } else {
          console.warn('⚠️ Failed to load from Supabase or no data found:', result.error);
          console.log('📱 Keeping existing data - Supabase load failed or returned empty');
          
          // If we have existing data from localStorage, keep it
          if (state.userProfile?.name || state.goals?.length > 0) {
            console.log('✅ Using existing localStorage data since Supabase had no data');
          } else {
            console.log('ℹ️ No existing data and no Supabase data - user likely needs to start planning');
          }
          
          // Don't mark as failure if it's just no data - only mark as failure for actual errors
          if (result.error && !result.success) {
            sessionStorage.setItem(failureKey, Date.now().toString());
          }
        }
        
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        console.log('📱 Keeping existing data - error occurred');
        
        // Mark as failure to prevent immediate retry
        sessionStorage.setItem(failureKey, Date.now().toString());
        
        // If we have existing data, keep it, otherwise ensure we're not stuck loading
        if (!state.userProfile?.name && (!state.goals || state.goals.length === 0)) {
          console.log('ℹ️ No existing data and load failed - user likely needs to start planning');
        }
      } finally {
        // Always clear loading state and timeout
        clearTimeout(timeoutId);
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log('🏁 Load attempt finished, loading state cleared');
      }
    };

    // Add a small delay to ensure session is available, but check loading state first
    const initTimeoutId = setTimeout(() => {
      // Double-check loading state before starting
      if (!state.isLoading) {
        loadUserData();
      } else {
        console.log('🔄 Skipping load - already in loading state');
      }
    }, 100);
    
    return () => {
      clearTimeout(initTimeoutId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, session]); // Remove state.isLoading from dependencies to fix the loop

  // Handle sign out - ONLY reset when user explicitly signs out
  useEffect(() => {
    // Check if user was previously authenticated and is now signed out
    const wasAuthenticated = sessionStorage.getItem('was-authenticated') === 'true';
    
    if (!user && !session && wasAuthenticated) {
      console.log('🔄 User signed out, performing complete cleanup...');
      
      // Reset state to initial state
      dispatch({ type: 'LOAD_PLANNING_DATA', payload: {
        ...initialState,
        isLoading: false,
        isDataLoaded: false
      }});
      
      // Clear all localStorage data
      localStorage.removeItem('planner-state');
      console.log('🗑️ Cleared all user data from localStorage in PlannerContext');
      
      // Force clear any other planner-related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('planner') || key.includes('financial')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear the authentication flag and load time
      sessionStorage.removeItem('was-authenticated');
      sessionStorage.removeItem('last_data_load');
      
      console.log('✅ Planner state reset complete');
    } else if (user && session) {
      // Mark that user was authenticated
      sessionStorage.setItem('was-authenticated', 'true');
    }
  }, [user, session]); // Listen to both user and session changes

  // Persist on every state change - but avoid saving when loading
  useEffect(() => {
    if (!state.isLoading) {
      console.log('💾 Saving planner state to localStorage');
      try {
        localStorage.setItem('planner-state', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    } else {
      console.log('🚫 Not saving to localStorage (currently loading)');
    }
  }, [state]);

  // Save function to persist changes to Supabase (kept for manual use)
  const saveToSupabase = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Saving planning data to Supabase...');
      const result = await plannerPersistence.savePlanningData(user.id, state);
      
      if (result.success) {
        console.log('Successfully saved planning data to Supabase');
      }
      
      return result;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      return { success: false, error: 'Failed to save data' };
    }
  };

  return (
    <PlannerContext.Provider value={{ state, dispatch, saveToSupabase }}>
      {children}
    </PlannerContext.Provider>
  );
};

// Create a custom hook for using the context
export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};