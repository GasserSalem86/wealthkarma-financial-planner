import { ReturnPhase, Goal, Profile, FundingStyle } from '../types/plannerTypes';
import { Currency } from '../types/currencyTypes';

export interface GoalResult {
  goal: Goal;
  requiredPMT: number;
  amountAtTarget: number;
  remainingGap: number;
  monthlyAllocations: number[];
  initialPMT: number;
  runningBalances: number[];
}

export const monthDiff = (startDate: Date, endDate: Date): number => {
  return (
    endDate.getMonth() -
    startDate.getMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  );
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const formatMonth = (date: Date): string => {
  return date.toLocaleString('default', { month: 'short' });
};

export const getRecommendedProfile = (horizonMonths: number): Profile => {
  const years = horizonMonths / 12;
  if (years <= 3) return 'Conservative';
  if (years <= 7) return 'Balanced';
  return 'Growth';
};

export const computeSumF = (returnPhases: ReturnPhase[], horizonMonths: number): number => {
  let t = 0, sumF = 0;
  returnPhases.forEach(({ length, rate }) => {
    for (let i = 1; i <= length; i++, t++) {
      const monthsToCompound = horizonMonths - t;
      sumF += Math.pow(1 + rate/12, monthsToCompound);
    }
  });
  return sumF;
};

export const calculateRequiredPMT = (
  targetAmount: number,
  returnPhases: ReturnPhase[],
  horizonMonths: number,
  paymentFrequency?: string,
  paymentPeriod?: number
): number => {
  if (!paymentFrequency || paymentFrequency === 'Once') {
    const sumF = computeSumF(returnPhases, horizonMonths);
    return targetAmount / sumF;
  }

  // For goals with payment frequency and period
  let paymentsPerYear = 12; // Monthly
  switch (paymentFrequency) {
    case 'Annual':
      paymentsPerYear = 1;
      break;
    case 'Biannual':
      paymentsPerYear = 2;
      break;
    case 'Quarterly':
      paymentsPerYear = 4;
      break;
  }

  // For education/home goals with payment periods
  if (paymentPeriod) {
    // Calculate present value of future payments
    const rate = returnPhases[0].rate; // Use first phase rate for PV calculation
    const totalPayments = paymentPeriod * paymentsPerYear;
    const paymentAmount = targetAmount / totalPayments;
    
    // Calculate PV using payment frequency
    const ratePerPeriod = rate / paymentsPerYear;
    const pvFactor = (1 - Math.pow(1 + ratePerPeriod, -totalPayments)) / ratePerPeriod;
    
    return paymentAmount / pvFactor;
  }

  // If no specific payment period supplied, fall back to saving a lump‐sum by target date
  const sumF = computeSumF(returnPhases, horizonMonths);
  return targetAmount / sumF;
};

export const calculateSequentialAllocations = (
  goals: Goal[],
  budget: number,
  fundingStyle: FundingStyle = 'hybrid',
  leftoverSavings?: number
): GoalResult[] => {
  if (!goals.length || budget <= 0) return [];

  const sortedGoals = [...goals].sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

  const today = new Date();
  const lastDate = sortedGoals[sortedGoals.length - 1].targetDate;
  const totalMonths = monthDiff(today, lastDate);

  // Initialize results array with initial PMT calculations
  const results: GoalResult[] = sortedGoals.map(goal => {
    const horizonMonths = monthDiff(today, goal.targetDate);
    
    // Use remaining amount if goal has initial amount applied from current savings
    const targetAmount = goal.remainingAmount || goal.amount;
    const initialAmount = goal.initialAmount || 0;
    
    const initialPMT = targetAmount > 0 ? calculateRequiredPMT(
      targetAmount,
      goal.returnPhases,
      horizonMonths,
      goal.paymentFrequency,
      goal.paymentPeriod
    ) : 0;

    return {
      goal,
      requiredPMT: initialPMT,
      amountAtTarget: initialAmount, // Start with initial amount from current savings
      remainingGap: targetAmount,    // Only need to fund remaining amount
      monthlyAllocations: new Array(totalMonths).fill(0),
      initialPMT,
      runningBalances: new Array(totalMonths).fill(initialAmount) // Start with initial amount
    };
  });

  // Check if total required PMT exceeds budget
  const totalRequiredPMT = results.reduce((sum, r) => sum + r.initialPMT, 0);
  if (totalRequiredPMT > budget) {
    console.warn(`Total required PMT (${totalRequiredPMT}) exceeds monthly budget (${budget})`);
  }

  // For hybrid strategy, assign goals to buckets based on INITIAL timeline and keep them there
  let hybridBuckets: GoalResult[][] = [];
  if (fundingStyle === 'hybrid') {
    const emergencyFund = results.filter(r => r.goal.id === 'emergency-fund');
    const nearGoals = results.filter(r => {
      const initialMonthsLeft = monthDiff(today, r.goal.targetDate);
      return initialMonthsLeft > 0 && initialMonthsLeft <= 60 && r.goal.id !== 'emergency-fund';
    });
    const farGoals = results.filter(r => {
      const initialMonthsLeft = monthDiff(today, r.goal.targetDate);
      return initialMonthsLeft > 60;
    });

    // Build buckets in priority order
    if (emergencyFund.length) hybridBuckets.push(emergencyFund);
    if (nearGoals.length) hybridBuckets.push(nearGoals);
    if (farGoals.length) hybridBuckets.push(farGoals);
  }

  // Process month by month
  for (let month = 0; month < totalMonths; month++) {
    let monthlyBudget = budget;
    const currentDate = addMonths(today, month);

    // Helper: check if goal is still fundable (before target date)
    const isStillFundable = (goal: Goal) => monthDiff(currentDate, goal.targetDate) > 0;

    // Determine active goals based on funding style
    let activeGoals: GoalResult[] = [];

    switch (fundingStyle) {
      case 'waterfall': {
        const unfundedGoal = results
          .filter(r => r.remainingGap > 0 && isStillFundable(r.goal))
          .sort((a, b) => a.goal.targetDate.getTime() - b.goal.targetDate.getTime())[0];
        if (unfundedGoal) {
          activeGoals = [unfundedGoal];
        }
        break;
      }

      case 'hybrid': {
        // Use consistent bucket assignment - find first bucket with unfunded goals
        for (const bucket of hybridBuckets) {
          const unfundedInBucket = bucket.filter(r => r.remainingGap > 0 && isStillFundable(r.goal));
          if (unfundedInBucket.length > 0) {
            activeGoals = unfundedInBucket;
            break; // Only fund the highest priority bucket that has unfunded goals
          }
        }
        break;
      }

      case 'parallel':
      default: {
        // All unfunded goals with remaining time
        activeGoals = results.filter(r => {
          const mLeft = monthDiff(currentDate, r.goal.targetDate);
          return mLeft >= 0 && r.remainingGap > 0;
        });
      }
    }

    if (activeGoals.length === 0) continue;

    // Calculate total initial PMT for active goals
    const totalInitialPMT = activeGoals.reduce((sum, r) => sum + r.initialPMT, 0);

    // Distribute budget proportionally based on initial PMT ratios
    if (totalInitialPMT > 0) {
      activeGoals.forEach(result => {
        const share = result.initialPMT / totalInitialPMT;
        // Round to 2 decimal places to avoid floating point issues
        const allocation = Math.round(Math.min(monthlyBudget * share, result.initialPMT) * 100) / 100;
        result.monthlyAllocations[month] = allocation;
        monthlyBudget -= allocation;

        // Update running balance with compound interest
        const prevBalance = month === 0 ? (result.goal.initialAmount || 0) : result.runningBalances[month - 1];

        const horizonMonths = monthDiff(today, result.goal.targetDate);
        if (month >= horizonMonths) {
          // Goal already reached target date – keep balance growing at last phase rate
          const lastRate = result.goal.returnPhases[result.goal.returnPhases.length - 1].rate;
          result.runningBalances[month] = prevBalance * (1 + lastRate / 12) + allocation;
        } else {
        let currentPhase = 0;
        let monthsInPreviousPhases = 0;
        let currentRate = 0;

        while (currentPhase < result.goal.returnPhases.length) {
          const phase = result.goal.returnPhases[currentPhase];
          if (monthsInPreviousPhases + phase.length > month) {
            currentRate = phase.rate;
            break;
          }
          monthsInPreviousPhases += phase.length;
          currentPhase++;
        }

          // fallback to last phase rate
        if (currentPhase >= result.goal.returnPhases.length) {
          currentRate = result.goal.returnPhases[result.goal.returnPhases.length - 1].rate;
        }

          const grown = prevBalance * (1 + currentRate / 12);
          result.runningBalances[month] = grown + allocation;
        }

        // Update amount at target and remaining gap
        result.amountAtTarget = result.runningBalances[month];
        result.remainingGap = Math.max(result.goal.amount - result.amountAtTarget, 0);

        // Handle budget surplus if goal is fully funded
        if (result.remainingGap <= 0) {
          const surplus = result.monthlyAllocations[month];
          result.monthlyAllocations[month] = 0;
          monthlyBudget += surplus;
        }
      });
    }

    // Distribute any remaining budget to goals with remaining gaps
    if (monthlyBudget > 0) {
      const unfundedGoals = activeGoals.filter(r => r.remainingGap > 0);
      const totalGap = unfundedGoals.reduce((sum, r) => sum + r.remainingGap, 0);
      
      if (totalGap > 0) {
        unfundedGoals.forEach(result => {
          const share = result.remainingGap / totalGap;
          const additionalAllocation = Math.round(monthlyBudget * share * 100) / 100;
          result.monthlyAllocations[month] += additionalAllocation;

          // Update running balance
          result.runningBalances[month] += additionalAllocation;
          result.amountAtTarget = result.runningBalances[month];
          result.remainingGap = Math.max(result.goal.amount - result.amountAtTarget, 0);
        });
      }
    }
  }

  // Calculate final PMT as average of non-zero allocations
  results.forEach(result => {
    const nonZero = result.monthlyAllocations.filter(a => a > 0);
    result.requiredPMT = nonZero.length ? Math.round(nonZero.reduce((s, a) => s + a, 0) / nonZero.length * 100) / 100 : 0;
  });

  return results;
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  // For major currencies with symbols, use proper currency formatting
  if (['USD', 'EUR', 'GBP', 'JPY'].includes(currency.code)) {
  return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  // For all currencies, use symbol prefix
  return `${currency.symbol} ${new Intl.NumberFormat('en', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

export const formatPercentage = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`;
};

// New utility functions for current savings allocation
export interface SavingsAllocationResult {
  allocatedGoals: Goal[];
  leftoverAmount: number;
  totalAllocated: number;
}

/**
 * Apply current savings to goals in priority order:
 * 1. Emergency Fund first
 * 2. Remaining goals by target date (earliest first)
 */
export const applySavingsToGoals = (
  goals: Goal[],
  currentSavings: number
): SavingsAllocationResult => {
  if (currentSavings <= 0 || goals.length === 0) {
    return {
      allocatedGoals: goals,
      leftoverAmount: currentSavings,
      totalAllocated: 0
    };
  }

  // Sort goals by priority: Emergency fund first, then by target date
  const sortedGoals = [...goals].sort((a, b) => {
    // Emergency fund gets highest priority
    if (a.id === 'emergency-fund' && b.id !== 'emergency-fund') return -1;
    if (b.id === 'emergency-fund' && a.id !== 'emergency-fund') return 1;
    
    // Otherwise sort by target date (earliest first)
    return a.targetDate.getTime() - b.targetDate.getTime();
  });

  let remainingSavings = currentSavings;
  let totalAllocated = 0;
  const allocatedGoals: Goal[] = [];

  for (const goal of sortedGoals) {
    const goalAmount = goal.amount;
    const amountToAllocate = Math.min(remainingSavings, goalAmount);
    
    if (amountToAllocate > 0) {
      // Create updated goal with allocated savings
      const updatedGoal: Goal = {
        ...goal,
        initialAmount: amountToAllocate,
        remainingAmount: goalAmount - amountToAllocate
      };
      
      allocatedGoals.push(updatedGoal);
      remainingSavings -= amountToAllocate;
      totalAllocated += amountToAllocate;
    } else {
      // No savings left, just add goal as-is
      allocatedGoals.push({
        ...goal,
        initialAmount: 0,
        remainingAmount: goalAmount
      });
    }

    // If no savings left, add remaining goals without allocation
    if (remainingSavings <= 0) {
      const remainingGoals = sortedGoals.slice(allocatedGoals.length);
      remainingGoals.forEach(g => {
        allocatedGoals.push({
          ...g,
          initialAmount: 0,
          remainingAmount: g.amount
        });
      });
      break;
    }
  }

  return {
    allocatedGoals,
    leftoverAmount: remainingSavings,
    totalAllocated
  };
};

/**
 * Recalculate required PMT for a goal considering initial amount from savings
 */
export const calculateAdjustedPMT = (
  goal: Goal,
  horizonMonths: number
): number => {
  const remainingAmount = goal.remainingAmount || goal.amount;
  
  if (remainingAmount <= 0) {
    return 0; // Goal fully funded by current savings
  }

  return calculateRequiredPMT(
    remainingAmount,
    goal.returnPhases,
    horizonMonths,
    goal.paymentFrequency,
    goal.paymentPeriod
  );
};

// Family-Specific Calculation Functions

/**
 * Calculate family emergency fund amount considering family size
 */
export const calculateFamilyEmergencyFund = (
  monthlyExpenses: number,
  bufferMonths: number,
  planningType: 'individual' | 'family',
  familySize?: number
): number => {
  // Base emergency fund calculation
  const baseAmount = monthlyExpenses * bufferMonths;
  
  // For family planning, use total household expenses as provided
  // No additional family size multiplier needed since expenses should already reflect family needs
  return baseAmount;
};

/**
 * Get recommended buffer months for families vs individuals
 */
export const getRecommendedBufferMonths = (
  planningType: 'individual' | 'family',
  familySize?: number
): { min: number; recommended: number; max: number } => {
  if (planningType === 'family') {
    return {
      min: 6,        // Families need more stability
      recommended: 9, // 9 months is ideal for families
      max: 12
    };
  }
  
  return {
    min: 3,        // Individuals can be more flexible
    recommended: 6, // Standard recommendation
    max: 9
  };
};

/**
 * Calculate retirement scenarios for families with different strategies
 */
export const calculateRetirementScenarios = (
  planningType: 'individual' | 'family',
  primaryAge: number,
  spouseAge: number,
  strategy: 'joint' | 'staggered'
) => {
  if (planningType === 'individual') {
    return [];
  }

  const scenarios = [];
  
  if (strategy === 'joint') {
    // Joint retirement - both retire when younger spouse reaches 65
    const youngerAge = Math.min(primaryAge, spouseAge);
    const yearsToRetirement = 65 - youngerAge;
    
    scenarios.push({
      name: 'Joint Retirement',
      description: 'Both retire together when younger spouse turns 65',
      retirementAge: 65,
      yearsToRetirement,
      benefits: [
        'Start retirement journey together',
        'Synchronized lifestyle changes',
        'Shared activities and travel',
        'Simplified financial planning'
      ],
      considerations: [
        'May require higher savings if older spouse retires early',
        'Potential income loss if higher earner retires early'
      ]
    });
  } else {
    // Staggered retirement - each person retires optimally
    scenarios.push({
      name: 'Primary Retirement',
      description: 'Primary earner retires at 65',
      retirementAge: 65,
      yearsToRetirement: 65 - primaryAge,
      benefits: [
        'Optimal career timing',
        'Continued household income from spouse',
        'Gradual lifestyle transition'
      ]
    });
    
    scenarios.push({
      name: 'Spouse Retirement', 
      description: 'Spouse retires at 65',
      retirementAge: 65,
      yearsToRetirement: 65 - spouseAge,
      benefits: [
        'Optimal career timing',
        'Potentially reduced overall savings needed',
        'Flexible retirement transition'
      ]
    });
  }
  
  return scenarios;
};

/**
 * Adjust goal amounts based on family size for certain goal types
 */
export const adjustGoalAmountForFamily = (
  baseAmount: number,
  goalCategory: string,
  planningType: 'individual' | 'family',
  familySize?: number
): number => {
  if (planningType === 'individual' || !familySize || familySize <= 1) {
    return baseAmount;
  }
  
  // Family-specific adjustments for certain goal types
  switch (goalCategory) {
    case 'Home':
      // Larger families may need bigger homes
      if (familySize >= 4) return baseAmount * 1.3;
      if (familySize >= 3) return baseAmount * 1.15;
      return baseAmount;
      
    case 'Education':
      // Multiple children increase education costs
      if (familySize >= 4) return baseAmount * (familySize - 1); // Assuming 2 parents + children
      if (familySize >= 3) return baseAmount * 1.5;
      return baseAmount;
      
    case 'Travel':
      // Travel costs scale with family size
      return baseAmount * Math.min(familySize, 6); // Cap at reasonable family size
      
    case 'Gift':
      // Gift/vehicle costs may scale with family size
      if (familySize >= 5) return baseAmount * 1.5;
      if (familySize >= 4) return baseAmount * 1.2;
      return baseAmount;
      
    default:
      // Most other goals don't scale directly with family size
      return baseAmount;
  }
};

/**
 * Calculate leftover savings redistribution prioritization for families
 */
export const redistributeLeftoverSavings = (
  leftoverAmount: number,
  goals: Goal[],
  planningType: 'individual' | 'family',
  familySize?: number
): Goal[] => {
  if (leftoverAmount <= 0 || goals.length === 0) {
    return goals;
  }
  
  // Sort goals by family priority
  const sortedGoals = [...goals].sort((a, b) => {
    const getFamilyPriority = (goal: Goal): number => {
      if (planningType === 'individual') return 0;
      
      // Family-specific prioritization
      switch (goal.category) {
        case 'Other': return 1; // Emergency fund falls under Other, highest priority
        case 'Home': return 2;
        case 'Education': return 3;
        case 'Retirement': return 4;
        case 'Gift': return 5;
        case 'Travel': return 6;
        default: return 7;
      }
    };
    
    const aPriority = getFamilyPriority(a);
    const bPriority = getFamilyPriority(b);
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort by target date
    return a.targetDate.getTime() - b.targetDate.getTime();
  });
  
  // Apply additional leftover savings to highest priority goals
  let remainingLeftover = leftoverAmount;
  const updatedGoals = sortedGoals.map(goal => {
    if (remainingLeftover <= 0) return goal;
    
    const currentInitial = goal.initialAmount || 0;
    const currentRemaining = goal.remainingAmount || goal.amount;
    
    const additionalAmount = Math.min(remainingLeftover, currentRemaining);
    
    if (additionalAmount > 0) {
      remainingLeftover -= additionalAmount;
      return {
        ...goal,
        initialAmount: currentInitial + additionalAmount,
        remainingAmount: currentRemaining - additionalAmount
      };
    }
    
    return goal;
  });
  
  return updatedGoals;
};