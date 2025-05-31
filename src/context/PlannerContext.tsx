import React, { createContext, useContext, useReducer } from 'react';
import { Goal, Profile, ReturnPhase, FundingStyle } from '../types/plannerTypes';
import { calculateRequiredPMT, calculateSequentialAllocations, GoalResult } from '../utils/calculations';

// Define the context state type
interface PlannerState {
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
  userProfile: {}
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
  | { type: 'SET_USER_PROFILE'; payload: { name?: string; nationality?: string; location?: string; monthlyIncome?: number; currency?: string } };

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

    default:
      return state;
  }
};

// Create the context
interface PlannerContextType {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

// Create a provider component with localStorage persistence
export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy init: attempt to load from localStorage
  const [state, dispatch] = useReducer(
    plannerReducer,
    initialState,
    (init) => {
      try {
        const saved = localStorage.getItem('planner-state');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Revive Date objects
          parsed.goals = (parsed.goals || []).map((g: any) => ({
            ...g,
            targetDate: new Date(g.targetDate),
          }));
          return { ...init, ...parsed } as PlannerState;
        }
      } catch (_) {}
      return init;
    }
  );

  // Persist on every state change
  React.useEffect(() => {
    try {
      localStorage.setItem('planner-state', JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  return (
    <PlannerContext.Provider value={{ state, dispatch }}>
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