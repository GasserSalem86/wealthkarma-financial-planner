export type Profile = 'Conservative' | 'Balanced' | 'Growth';

export type GoalCategory = 'Education' | 'Travel' | 'Gift' | 'Home' | 'Retirement';

export type PaymentFrequency = 'Once' | 'Monthly' | 'Quarterly' | 'Biannual' | 'Annual';

export type FundingStyle = 'waterfall' | 'parallel' | 'hybrid';

export interface ReturnPhase {
  length: number; // in months
  rate: number; // annual rate (e.g., 0.05 for 5%)
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetDate: Date;
  amount: number;
  horizonMonths: number;
  profile: Profile;
  returnPhases: ReturnPhase[];
  requiredPMT: number;
  paymentFrequency?: PaymentFrequency;
  paymentPeriod?: number; // Number of years to spread payments over
  customRates?: {
    high: number;
    mid: number;
    low: number;
  };
  monthlyAllocations?: number[];
  bufferMonths?: number;
  selectedBank?: any; // Bank selection for emergency fund
}

export interface Step {
  id: number;
  label: string;
}

export const STEPS: Step[] = [
  { id: 0, label: 'Getting Started' },
  { id: 1, label: 'Safety Net' },
  { id: 2, label: 'Your Dreams' },
  { id: 3, label: 'Retirement Plan' },
  { id: 4, label: 'How Risky?' },
  { id: 5, label: 'Your Money Plan' },
  { id: 6, label: 'Monthly View' },
  { id: 7, label: 'Monthly Roadmap' },
  { id: 8, label: 'Get Started' }
];

export const GOAL_CATEGORIES: GoalCategory[] = ['Education', 'Travel', 'Gift', 'Home', 'Retirement'];

export const PAYMENT_FREQUENCIES: PaymentFrequency[] = ['Once', 'Monthly', 'Quarterly', 'Biannual', 'Annual'];

export const DEFAULT_RATES = {
  Conservative: { high: 0.04, mid: 0.03, low: 0.02 },
  Balanced: { high: 0.06, mid: 0.05, low: 0.03 },
  Growth: { high: 0.08, mid: 0.07, low: 0.05 }
} as const;

export interface GoalResult {
  goal: Goal;
  requiredPMT: number;
  amountAtTarget: number;
  remainingGap: number;
  monthlyAllocations: number[];
  initialPMT: number;
  runningBalances: number[];
}