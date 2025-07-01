import React, { useState, useMemo, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { 
  getUserGoalProgress, 
  saveGoalProgress, 
  calculateCurrentProgress,
  migrateActualProgressData,
  getCurrentMonth,
  type GoalProgressEntry 
} from '../services/goalProgressService';
import { 
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  Edit3,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Zap,
  Bell,
  Settings,
  Download,
  RefreshCw,
  PlusCircle,
  TrendingDown,
  Building2,
  AlertCircle,
  Clock
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import { formatCurrency } from '../utils/calculations';
import { format, addMonths, differenceInMonths } from 'date-fns';

interface LiveDashboardProps {
  onOptimizePlan?: () => void;
  onUpdateProgress?: () => void;
  onConnectBank?: () => void;
  onManageBanks?: () => void;
  connectedAccounts?: any[];
  bankConnectionStatus?: 'none' | 'partial' | 'complete';
}

interface ActualProgress {
  goalId: string;
  actualAmount: number;
  lastUpdated: Date;
  monthlyActual: number;
}

interface AIRecommendation {
  type: 'increase' | 'decrease' | 'rebalance' | 'optimize' | 'warning' | 'celebration';
  title: string;
  description: string;
  impact: string;
  actionRequired: boolean;
}

interface ImplementationStep {
  id: string;
  phase: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  ctaText: string;
  ctaAction: () => void;
  isAvailable: boolean;
  completedDate?: Date;
  icon: any;
}

const LiveDashboard: React.FC<LiveDashboardProps> = ({ 
  onOptimizePlan, 
  onUpdateProgress, 
  onConnectBank,
  onManageBanks,
  connectedAccounts = [],
  bankConnectionStatus = 'none'
}) => {
  const { state, dispatch, saveToSupabase, accessToken } = usePlanner();
  
  // Get user and session for REST API
  const { user } = useAuth();
  const session = { access_token: accessToken };
  const { currency } = useCurrency();
  
  // Simple formatting function
  const formatAmount = (amount: number) => {
    return `${currency.symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'insights' | 'settings'>('overview');
  const [trackingMode, setTrackingMode] = useState<'automatic' | 'manual' | null>(() => {
    return (localStorage.getItem('emergencyFundTrackingMode') as 'automatic' | 'manual') || null;
  });

  // Add state for progress updates and user feedback
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Load tracking mode preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('emergencyFundTrackingMode') as 'automatic' | 'manual' | null;
    setTrackingMode(savedMode);
  }, []); // Only run on mount

  // Auto-fix: If user has a connected emergency fund account but no tracking mode set
  useEffect(() => {
    const savedMode = localStorage.getItem('emergencyFundTrackingMode');
    const hasEmergencyAccount = connectedAccounts.some(acc => acc.is_emergency_fund);
    
    // Only auto-set to automatic if user explicitly chose bank connection and has no saved preference
    if (!savedMode && hasEmergencyAccount && trackingMode === null) {
      console.log('🔧 Auto-detected connected bank, but not auto-setting mode. User should choose.');
      // Don't auto-set anymore - let user choose explicitly
    }
  }, [connectedAccounts.length, connectedAccounts.some(acc => acc.is_emergency_fund), trackingMode]); // Stable dependencies
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  
  // New goal progress system
  const [goalProgressEntries, setGoalProgressEntries] = useState<GoalProgressEntry[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  
  // Local state for input fields (immediate UI updates)
  const [localProgress, setLocalProgress] = useState<{[goalId: string]: {actualAmount: number; monthlyActual: number}}>({});

  // Load goal progress data on component mount and when user/access token changes
  useEffect(() => {
    const loadGoalProgress = async () => {
      if (!user?.id || !accessToken) {
        console.log('⏳ Waiting for user and access token to load goal progress...');
        return;
      }

      setIsLoadingProgress(true);
      setProgressError(null);

      try {
        console.log('📊 Loading goal progress from database...');
        const result = await getUserGoalProgress(user.id, accessToken);
        
        if (result.success && result.data) {
          setGoalProgressEntries(result.data);
          console.log('✅ Goal progress loaded:', result.data.length, 'entries');
          
          // If no progress data exists but we have savedActualProgress, migrate it
          if (result.data.length === 0 && state.savedActualProgress && state.savedActualProgress.length > 0) {
            console.log('🔄 Migrating existing progress data...');
            const migrationResult = await migrateActualProgressData(
              user.id,
              state.savedActualProgress,
                             state.goals.map(g => ({ id: g.id, requiredPmt: g.requiredPMT || 0 })),
              accessToken
            );
            
            if (migrationResult.success) {
              // Reload progress after migration
              const reloadResult = await getUserGoalProgress(user.id, accessToken);
              if (reloadResult.success && reloadResult.data) {
                setGoalProgressEntries(reloadResult.data);
                console.log('✅ Progress migrated and reloaded');
              }
            }
          }
        } else {
          setProgressError(result.error || 'Failed to load progress');
        }
      } catch (error) {
        console.error('❌ Error loading goal progress:', error);
        setProgressError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadGoalProgress();
  }, [user?.id, accessToken, state.goals.length]); // Reload when goals change

  // Calculate current progress for each goal
  const actualProgress = useMemo(() => {
    let progressData;
    
    if (isLoadingProgress || goalProgressEntries.length === 0) {
      // Return default progress while loading or if no data
      progressData = state.goals.map(goal => ({
        goalId: goal.id,
        actualAmount: 0,
        lastUpdated: new Date(),
        monthlyActual: 0
      }));
    } else {
      progressData = calculateCurrentProgress(goalProgressEntries, state.goals.map(g => g.id));
    }

    // Initialize local progress state from actual progress
    const newLocalProgress: {[goalId: string]: {actualAmount: number; monthlyActual: number}} = {};
    progressData.forEach(progress => {
      newLocalProgress[progress.goalId] = {
        actualAmount: progress.actualAmount,
        monthlyActual: progress.monthlyActual
      };
    });
    
    // Only update if significantly different to avoid infinite loops
    if (Object.keys(localProgress).length === 0 || 
        JSON.stringify(newLocalProgress) !== JSON.stringify(localProgress)) {
      setLocalProgress(newLocalProgress);
    }

    return progressData;
  }, [goalProgressEntries, state.goals, isLoadingProgress]);

  // Calculate current month progress
  const currentMonth = differenceInMonths(new Date(), new Date()) + 1;
  const maxTimelineMonths = useMemo(() => {
    if (state.allocations.length === 0) return 60;
    return Math.max(...state.allocations.map(allocation => allocation.runningBalances.length));
  }, [state.allocations]);
  
  const currentPlan = useMemo(() => {
    // Reduced logging - only essential information
    console.log('🔄 Plan calculation:', {
      goals: state.allocations.length,
      accounts: connectedAccounts.length,
      emergency: connectedAccounts.some(acc => acc.is_emergency_fund)
    });
    
    return state.allocations.map(allocation => {
      const plannedAmount = allocation.runningBalances[Math.min(currentMonth - 1, allocation.runningBalances.length - 1)] || 0;
      
      // For emergency fund, calculate progress directly using bank account data
      let actualAmount = 0;
      let progressPercentage = 0;
      let isOnTrack = false;
      
      if (allocation.goal.id === 'emergency-fund' || allocation.goal.name === 'Safety Net') {
        // Find emergency fund account from connected accounts
        const emergencyAccount = connectedAccounts.find(acc => acc.is_emergency_fund);
        
        // Use bank data only if tracking mode is automatic AND bank account is connected
        if (trackingMode === 'automatic' && emergencyAccount && emergencyAccount.balance !== undefined && allocation.goal.amount > 0) {
          actualAmount = emergencyAccount.balance;
          progressPercentage = (actualAmount / allocation.goal.amount) * 100;
          isOnTrack = progressPercentage >= 80; // 80%+ = on track
          
          console.log(`🏦 Emergency fund (automatic): ${actualAmount.toLocaleString()}/${allocation.goal.amount.toLocaleString()} AED (${progressPercentage.toFixed(1)}%)`);
        } else {
          // Use manual progress tracking for emergency fund when in manual mode
          const progressData = actualProgress.find(p => p.goalId === allocation.goal.id);
          actualAmount = progressData?.actualAmount || 0;
          progressPercentage = allocation.goal.amount > 0 ? (actualAmount / allocation.goal.amount) * 100 : 0;
          isOnTrack = actualAmount >= plannedAmount * 0.9; // Within 10% tolerance
          
          console.log(`📝 Emergency fund (manual): ${actualAmount.toLocaleString()}/${allocation.goal.amount.toLocaleString()} AED (${progressPercentage.toFixed(1)}%)`);
        }
      } else {
        // Use manual progress tracking for other goals
        const progressData = actualProgress.find(p => p.goalId === allocation.goal.id);
        actualAmount = progressData?.actualAmount || 0;
        progressPercentage = allocation.goal.amount > 0 ? (actualAmount / allocation.goal.amount) * 100 : 0;
        isOnTrack = actualAmount >= plannedAmount * 0.9; // Within 10% tolerance
      }
      
      const variance = actualAmount - plannedAmount;
      
      return {
        ...allocation,
        plannedAmount,
        actualAmount,
        variance,
        progressPercentage,
        isOnTrack,
        monthlyTarget: allocation.monthlyAllocations[Math.min(currentMonth - 1, allocation.monthlyAllocations.length - 1)] || 0
      };
    });
  }, [state.allocations, actualProgress, currentMonth, connectedAccounts, trackingMode]);

  // Generate AI recommendations
  const aiRecommendations = useMemo((): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];
    
    // Bank connection recommendation if not connected
    if (bankConnectionStatus === 'none' && state.goals.some(goal => goal.id === 'emergency-fund' || goal.name === 'Safety Net')) {
      recommendations.push({
        type: 'warning',
        title: 'Connect your bank account',
        description: 'Link your emergency fund account for automatic progress tracking.',
        impact: 'Enable real-time balance updates and milestone notifications',
        actionRequired: true
      });
    }
    
    currentPlan.forEach(goal => {
      if (goal.variance < -goal.plannedAmount * 0.2) {
        recommendations.push({
          type: 'warning',
          title: `${goal.goal.name} is behind target`,
          description: `You're ${formatCurrency(Math.abs(goal.variance), currency)} behind your planned progress.`,
          impact: 'May delay goal completion by 3-6 months',
          actionRequired: true
        });
      } else if (goal.variance > goal.plannedAmount * 0.2) {
        recommendations.push({
          type: 'celebration',
          title: `${goal.goal.name} is ahead of schedule!`,
          description: `You're ${formatCurrency(goal.variance, currency)} ahead of your planned progress.`,
          impact: 'Goal may be completed 2-4 months early',
          actionRequired: false
        });
      }
    });

    // Market-based recommendations
    recommendations.push({
      type: 'optimize',
      title: 'GCC bank rates have improved',
      description: 'ADCB and Emirates NBD have increased their savings rates by 0.5%.',
      impact: 'Potential additional income of AED 200-500/month',
      actionRequired: true
    });

    if (bankConnectionStatus === 'complete') {
      recommendations.push({
        type: 'rebalance',
        title: 'Portfolio rebalancing suggested',
        description: 'Your emergency fund is complete. Consider shifting excess to higher-yield investments.',
        impact: 'Potential 2-3% higher returns on excess funds',
        actionRequired: false
      });
    }

    return recommendations;
  }, [currentPlan, currency, bankConnectionStatus, state.goals]);

  // Debounced save function to avoid saving on every keystroke
  const [saveTimeouts, setSaveTimeouts] = useState<{[goalId: string]: NodeJS.Timeout}>({});

  const debouncedSaveProgress = (goalId: string, amount: number, delay: number = 1000) => {
    // Clear existing timeout for this goal
    if (saveTimeouts[goalId]) {
      clearTimeout(saveTimeouts[goalId]);
    }

    // Set new timeout
    const timeoutId = setTimeout(async () => {
      await saveActualAmountToDatabase(goalId, amount);
      // Remove timeout from state
      setSaveTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[goalId];
        return newTimeouts;
      });
    }, delay);

    // Store timeout ID
    setSaveTimeouts(prev => ({ ...prev, [goalId]: timeoutId }));
  };

  const saveActualAmountToDatabase = async (goalId: string, amount: number) => {
    // Only prevent manual updates for emergency fund if user chose automatic tracking AND has connected account
    const emergencyAccount = connectedAccounts.find(acc => acc.is_emergency_fund);
    const goal = state.goals.find(g => g.id === goalId);
    const isEmergencyFund = goal && (goal.id === 'emergency-fund' || goal.name === 'Safety Net');
    
    if (isEmergencyFund && trackingMode === 'automatic' && emergencyAccount) {
      console.log('⚠️ Emergency fund is automatically tracked from bank account');
      return;
    }

    if (!user?.id || !accessToken) {
      console.error('❌ User authentication required to update progress');
      return;
    }

    try {
      const currentMonth = getCurrentMonth();
      const plannedAmount = goal?.requiredPMT || 0;
      
      // Save progress to goal_progress table
      const result = await saveGoalProgress(
        user.id,
        goalId,
        currentMonth,
        amount, // This is the cumulative amount
        plannedAmount,
        accessToken,
        'Manual progress update'
      );

      if (result.success) {
        // Reload progress data to refresh the UI
        const progressResult = await getUserGoalProgress(user.id, accessToken);
        if (progressResult.success && progressResult.data) {
          setGoalProgressEntries(progressResult.data);
          console.log('✅ Progress updated and reloaded');
        }
      } else {
        console.error('❌ Failed to update progress:', result.error);
      }
    } catch (error) {
      console.error('❌ Error updating actual amount:', error);
    }
  };

  // Immediate local update for responsive UI
  const updateActualAmount = (goalId: string, amount: number) => {
    // Update local state immediately for responsive UI
    setLocalProgress(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        actualAmount: amount
      }
    }));

    // Save to database with debounce
    debouncedSaveProgress(goalId, amount);
  };

  // Update monthly contribution (local state only, saves via Update Progress button)
  const updateMonthlyContribution = (goalId: string, amount: number) => {
    setLocalProgress(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        monthlyActual: amount
      }
    }));
  };

  // Goal editing functions
  const updateGoalAmount = async (goalId: string, newAmount: number) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedGoal = { ...goal, amount: newAmount };
    dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
  };

  const updateGoalDate = async (goalId: string, newDate: Date) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    // Recalculate horizon months
    const horizonMonths = Math.max(1, Math.ceil((newDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    const updatedGoal = { 
      ...goal, 
      targetDate: newDate,
      horizonMonths
    };
    dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
  };

  const updateBudget = async (newBudget: number) => {
    dispatch({ type: 'SET_BUDGET', payload: newBudget });
  };

  const updateEmergencyFund = async (newExpenses: number, newBufferMonths: number) => {
    const currentEmergencyFund = state.goals.find(goal => goal.id === 'emergency-fund' || goal.name === 'Safety Net');
    if (currentEmergencyFund) {
      dispatch({
        type: 'UPDATE_EMERGENCY_FUND',
        payload: {
          monthlyExpenses: newExpenses,
          bufferMonths: newBufferMonths,
          targetMonth: currentEmergencyFund.targetDate.getMonth(),
          targetYear: currentEmergencyFund.targetDate.getFullYear()
        }
      });
    }
  };

  // Comprehensive Update Progress function
  const handleUpdateProgress = async () => {
    if (isUpdatingProgress) return; // Prevent double-clicks
    
    setIsUpdatingProgress(true);
    setUpdateMessage({ type: 'info', text: 'Saving your progress...' });
    
    try {
      // 1. Save Progress to Database via REST API
      setUpdateMessage({ type: 'info', text: 'Testing connection...' });
      
      // Import REST API service
      const { saveProgressQuick, testConnection } = await import('../services/restApiService');
      
      // Check connection first
      if (!accessToken || !user) {
        throw new Error('User authentication required');
      }
      
      const isConnected = await testConnection(accessToken);
      if (!isConnected) {
        throw new Error('Unable to connect to database. Please check your connection.');
      }
      
      setUpdateMessage({ type: 'info', text: 'Saving your progress...' });
      console.log('💾 Saving progress to goal_progress table...');
      
      // Save each goal's progress to the goal_progress table using local progress
      const currentMonth = getCurrentMonth();
      let saveErrors: string[] = [];
      
      for (const goal of state.goals) {
        const localData = localProgress[goal.id];
        const actualAmount = localData?.actualAmount || 0;
        
        if (actualAmount > 0) {
          const plannedAmount = goal.requiredPMT || 0;
          
          const result = await saveGoalProgress(
            user.id,
            goal.id,
            currentMonth,
            actualAmount,
            plannedAmount,
            accessToken,
            'Progress update from dashboard'
          );
          
          if (!result.success) {
            saveErrors.push(`${goal.name || goal.id}: ${result.error}`);
          }
        }
      }
      
      if (saveErrors.length > 0) {
        throw new Error(`Failed to save some progress: ${saveErrors.join('; ')}`);
      }
      
      // Also save profile and plan data for compatibility
      // Merge local progress with actual progress for legacy save
      const mergedProgress = actualProgress.map(progress => ({
        ...progress,
        actualAmount: localProgress[progress.goalId]?.actualAmount ?? progress.actualAmount,
        monthlyActual: localProgress[progress.goalId]?.monthlyActual ?? progress.monthlyActual
      }));
      
      const legacyResult = await saveProgressQuick(user.id, accessToken, state, mergedProgress);
      if (!legacyResult.success) {
        console.warn('Legacy progress save failed:', legacyResult.error);
        // Don't fail completely, as the main progress is saved in goal_progress table
      }
      
      // 2. Trigger recalculations by dispatching state updates
      setUpdateMessage({ type: 'info', text: 'Updating calculations...' });
      console.log('🔄 Triggering recalculations...');
      
      // Force recalculation of all allocations
      const recalculatedState = {
        ...state,
        // This will trigger the recalculateAllocations function in the reducer
        budget: state.budget // Trigger by updating budget (even if same value)
      };
      
      // Dispatch updates to refresh calculations
      dispatch({ type: 'SET_BUDGET', payload: state.budget });
      
      // 3. Sync progress data
      console.log('📊 Syncing progress data...');
      
      // Reload progress data from database to get latest state
      const progressResult = await getUserGoalProgress(user.id, accessToken);
      if (progressResult.success && progressResult.data) {
        setGoalProgressEntries(progressResult.data);
      }
      
      // 4. Update Timeline calculations
      console.log('📅 Updating timeline calculations...');
      
      // Calculate new completion dates based on current progress
      const updatedGoals = state.goals.map(goal => {
        const localData = localProgress[goal.id];
        const currentAmount = localData?.actualAmount || actualProgress.find(p => p.goalId === goal.id)?.actualAmount || 0;
        
        if (currentAmount > 0) {
          // Calculate remaining amount needed
          const remainingAmount = Math.max(0, goal.amount - currentAmount);
          const monthlyContribution = goal.requiredPMT || 0;
          
          if (monthlyContribution > 0) {
            // Calculate new target date based on remaining amount and monthly payment
            const remainingMonths = Math.ceil(remainingAmount / monthlyContribution);
            const newTargetDate = new Date();
            newTargetDate.setMonth(newTargetDate.getMonth() + remainingMonths);
            
            return {
              ...goal,
              // Only update if significantly different to avoid constant changes
              targetDate: remainingMonths !== goal.horizonMonths ? newTargetDate : goal.targetDate,
              horizonMonths: remainingMonths !== goal.horizonMonths ? remainingMonths : goal.horizonMonths
            };
          }
        }
        return goal;
      });
      
      // Update goals with new timelines if changed
      updatedGoals.forEach(goal => {
        const originalGoal = state.goals.find(g => g.id === goal.id);
        if (originalGoal && (
          goal.targetDate.getTime() !== originalGoal.targetDate.getTime() ||
          goal.horizonMonths !== originalGoal.horizonMonths
        )) {
          dispatch({ type: 'UPDATE_GOAL', payload: goal });
        }
      });
      
      // 5. Show success message
      setUpdateMessage({ 
        type: 'success', 
        text: '✅ Progress saved successfully! Your financial plan has been updated.' 
      });
      
      // 6. Call parent callback if provided
      if (onUpdateProgress) {
        onUpdateProgress();
      }
      
      console.log('✅ Update Progress completed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      setUpdateMessage({ 
        type: 'error', 
        text: `❌ Failed to save progress: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUpdateMessage(null);
      }, 5000);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const getRecommendationColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'warning': return 'border-red-500 bg-red-500/10 text-theme-error';
      case 'celebration': return 'border-green-500 bg-green-500/10 text-theme-success';
      case 'optimize': return 'border-blue-500 bg-blue-500/10 text-theme-info';
      case 'rebalance': return 'border-purple-500 bg-purple-500/10 text-theme-brand-secondary';
      default: return 'border-theme bg-theme-section text-theme-secondary';
    }
  };

  const getRecommendationIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'celebration': return <CheckCircle className="w-5 h-5" />;
      case 'optimize': return <TrendingUp className="w-5 h-5" />;
      case 'rebalance': return <RefreshCw className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const totalActual = currentPlan.reduce((sum, goal) => sum + goal.actualAmount, 0);
  const totalPlanned = currentPlan.reduce((sum, goal) => sum + goal.plannedAmount, 0);
  const totalVariance = totalActual - totalPlanned;

  // Bank connection summary
  const bankConnectionSummary = useMemo(() => {
    if (bankConnectionStatus === 'complete' && connectedAccounts.length > 0) {
      const totalBalance = connectedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      const emergencyFundAccount = connectedAccounts.find(acc => acc.is_emergency_fund);
      
      return {
        hasConnection: true,
        totalBalance,
        emergencyFundAccount,
        accountCount: connectedAccounts.length,
        status: 'connected'
      };
    }
    return {
      hasConnection: false,
      totalBalance: 0,
      emergencyFundAccount: null,
      accountCount: 0,
      status: bankConnectionStatus || 'none'
    };
  }, [bankConnectionStatus, connectedAccounts]);

  // Implementation Journey Steps
  const implementationSteps: ImplementationStep[] = [
    {
      id: 'bank-connection',
      phase: 1,
      title: 'Connect Your Bank Account',
      description: 'Enable real-time tracking of your emergency fund and automate progress monitoring',
      status: bankConnectionStatus === 'complete' ? 'completed' : 
             bankConnectionStatus === 'partial' ? 'in-progress' : 'pending',
      ctaText: bankConnectionStatus === 'complete' ? 'Manage Banks' : 
               bankConnectionStatus === 'partial' ? 'Complete Setup' : 'Connect Bank',
      ctaAction: () => {
        if (bankConnectionStatus === 'complete' && onManageBanks) {
          onManageBanks();
        } else if (onConnectBank) {
          onConnectBank();
        }
      },
      isAvailable: true,
      completedDate: bankConnectionStatus === 'complete' ? new Date() : undefined,
      icon: Building2
    },
    {
      id: 'ai-recommendations',
      phase: 2,
      title: 'Get AI Investment Recommendations',
      description: 'Receive personalized analysis of financial products and investment strategies',
      status: 'pending',
      ctaText: 'Get Recommendations',
      ctaAction: () => console.log('AI recommendations coming soon'),
      isAvailable: bankConnectionStatus === 'complete',
      icon: Zap
    },
    {
      id: 'paper-trading',
      phase: 3,
      title: 'Start Paper Trading',
      description: 'Practice with virtual trading using Alpaca Markets before investing real money',
      status: 'pending',
      ctaText: 'Start Trading',
      ctaAction: () => console.log('Paper trading coming soon'),
      isAvailable: false,
      icon: TrendingUp
    },
    {
      id: 'monthly-reviews',
      phase: 4,
      title: 'Monthly AI Reviews',
      description: 'Receive automated portfolio analysis and optimization recommendations',
      status: 'pending',
      ctaText: 'Enable Reviews',
      ctaAction: () => console.log('Monthly reviews coming soon'),
      isAvailable: false,
      icon: Calendar
    }
  ];

  // Calculate completion stats
  const completedSteps = implementationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = implementationSteps.length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-h1-sm text-theme-primary mb-2">
          Welcome to Your Wealth Management Platform
        </h1>
        <p className="text-lg text-theme-secondary">
          Complete your implementation journey to unlock the full power of AI-driven wealth management
        </p>
      </div>

      {/* Implementation Journey Section */}
      <Card className="mb-8 border-2 border-emerald-500/20 bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-theme-primary flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                Implementation Journey
              </CardTitle>
              <p className="text-theme-secondary mt-1">
                Transform your financial plan into an active wealth management system
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-600">
                {completedSteps}/{totalSteps}
              </div>
              <div className="text-xs text-theme-muted">Steps Completed</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-theme-muted mb-2">
              <span>Progress</span>
              <span>{Math.round((completedSteps / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-theme-section rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4">
            {implementationSteps.map((step, index) => (
              <div key={step.id} className={`relative p-4 rounded-lg border transition-all ${
                step.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' :
                step.status === 'in-progress' ? 'border-yellow-500/30 bg-yellow-500/5' :
                step.isAvailable ? 'border-theme bg-theme-card hover:border-emerald-500/30 hover:bg-emerald-500/5' :
                'border-theme bg-theme-section opacity-60'
              }`}>
                
                {/* Connection line to next step */}
                {index < implementationSteps.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-8 bg-theme-border"></div>
                )}
                
                <div className="flex items-start gap-4">
                  {/* Step Icon & Status */}
                  <div className="flex flex-col items-center">
                    <div className={`p-3 rounded-full border-2 ${
                      step.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white' :
                      step.status === 'in-progress' ? 'border-yellow-500 bg-yellow-500 text-white' :
                      step.isAvailable ? 'border-theme-primary bg-theme-card text-theme-primary' :
                      'border-theme bg-theme-section text-theme-muted'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs text-theme-muted mt-1 font-medium">
                      Phase {step.phase}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-1 ${
                          step.isAvailable ? 'text-theme-primary' : 'text-theme-muted'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm mb-3 ${
                          step.isAvailable ? 'text-theme-secondary' : 'text-theme-muted'
                        }`}>
                          {step.description}
                        </p>
                        
                        {/* Additional status info */}
                        {step.status === 'completed' && step.completedDate && (
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            Completed {step.completedDate.toLocaleDateString()}
                          </div>
                        )}
                        
                        {step.status === 'in-progress' && step.id === 'bank-connection' && (
                          <div className="flex items-center gap-2 text-xs text-yellow-600">
                            <AlertCircle className="w-3 h-3" />
                            {connectedAccounts.length} account(s) connected
                          </div>
                        )}
                        
                        {!step.isAvailable && (
                          <div className="flex items-center gap-1 text-xs text-theme-muted">
                            <Clock className="w-3 h-3" />
                            Complete previous steps to unlock
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <div className="flex-shrink-0">
                        <Button
                          onClick={step.ctaAction}
                          variant={step.status === 'completed' ? 'outline' : 
                                  step.isAvailable ? 'primary' : 'secondary'}
                          size="sm"
                          disabled={!step.isAvailable}
                          className={step.status === 'pending' && step.isAvailable ? 
                            'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                        >
                          {step.ctaText}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Journey Benefits */}
          <div className="mt-6 p-4 bg-theme-section rounded-lg">
            <h4 className="font-semibold text-theme-primary mb-2">What You'll Achieve:</h4>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-theme-secondary">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Real-time financial tracking
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                AI-powered investment guidance
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Risk-free practice trading
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Automated portfolio optimization
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-secondary">Total Progress</p>
                <p className="heading-stat text-theme-primary">
                  {formatCurrency(totalActual, currency)}
                </p>
                <p className="text-xs text-theme-muted">
                  Target: {formatCurrency(totalPlanned, currency)}
                </p>
              </div>
              <div className={`p-2 rounded-full ${totalVariance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {totalVariance >= 0 ? 
                  <TrendingUp className="w-6 h-6 text-theme-success" /> :
                  <TrendingDown className="w-6 h-6 text-theme-error" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-secondary">Implementation</p>
                <p className="heading-stat text-theme-primary">{completedSteps}/{totalSteps}</p>
                <p className="text-xs text-theme-muted">Steps completed</p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-secondary">Goals On Track</p>
                <p className="heading-stat text-theme-primary">
                  {currentPlan.filter(g => g.isOnTrack).length}/{currentPlan.length}
                </p>
                <p className="text-xs text-theme-muted">
                  {((currentPlan.filter(g => g.isOnTrack).length / currentPlan.length) * 100).toFixed(0)}% success rate
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <CheckCircle className="w-6 h-6 text-theme-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-secondary">Connected Accounts</p>
                <p className="heading-stat text-theme-primary">
                  {connectedAccounts.length}
                </p>
                <p className="text-xs text-theme-muted">Bank accounts linked</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Building2 className="w-6 h-6 text-theme-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-theme mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Goals Overview', icon: BarChart3 },
            { id: 'goals', label: 'Detailed Progress', icon: Target },
            { id: 'insights', label: 'AI Insights', icon: Zap },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-theme-success'
                  : 'border-transparent text-theme-muted hover:text-theme-secondary hover:border-theme-hover'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentPlan.map((goal, index) => (
                  <div key={goal.goal.id} className="border border-theme rounded-lg p-4 bg-theme-card shadow-theme">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-theme-primary">{goal.goal.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          goal.isOnTrack ? 'bg-green-500/10 text-theme-success' : 'bg-red-500/10 text-theme-error'
                        }`}>
                          {goal.isOnTrack ? 'On Track' : 'Behind'}
                        </span>
                        <Button 
                          onClick={() => setEditingGoal(goal.goal.id)}
                          size="sm" 
                          variant="outline"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-theme-secondary">Planned Progress</p>
                        <p className="font-semibold text-theme-primary">{formatCurrency(goal.plannedAmount, currency)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-theme-secondary">Actual Progress</p>
                        <p className="font-semibold text-theme-primary">{formatCurrency(goal.actualAmount, currency)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-theme-secondary">Variance</p>
                        <p className={`font-semibold ${goal.variance >= 0 ? 'text-theme-success' : 'text-theme-error'}`}>
                          {goal.variance >= 0 ? '+' : ''}{formatCurrency(goal.variance, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-theme-section rounded-full h-3">
                      <div 
                        className="bg-emerald-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-theme-muted mt-1">
                      <span>{goal.progressPercentage.toFixed(1)}% complete</span>
                      <span>{formatCurrency(goal.goal.amount, currency)} target</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {currentPlan.map((goal) => (
                  <div key={goal.goal.id} className="border border-theme rounded-lg p-4 bg-theme-card shadow-theme">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-theme-primary">{goal.goal.name}</h4>
                      <span className="text-sm text-theme-muted">
                        Target: {formatCurrency(goal.goal.amount, currency)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                          Current Amount Saved
                          {(goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && trackingMode === 'automatic' && connectedAccounts.find(acc => acc.is_emergency_fund) && (
                            <span className="ml-2 px-2 py-0.5 bg-green-500/10 text-green-600 text-xs rounded-full">
                              🏦 Live Bank Tracking
                            </span>
                          )}
                        </label>
                        <div className="relative">
                                                      {(goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && trackingMode === 'automatic' && connectedAccounts.find(acc => acc.is_emergency_fund) ? (
                            <Building2 className="w-5 h-5 text-green-600 absolute left-3 top-3" />
                          ) : (
                            <DollarSign className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                          )}
                          <input
                            type="number"
                            value={localProgress[goal.goal.id]?.actualAmount ?? goal.actualAmount}
                            onChange={(e) => updateActualAmount(goal.goal.id, parseFloat(e.target.value) || 0)}
                            disabled={(goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && trackingMode === 'automatic' && connectedAccounts.find(acc => acc.is_emergency_fund)}
                            className={`input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              (goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && trackingMode === 'automatic' && connectedAccounts.find(acc => acc.is_emergency_fund) 
                                ? 'bg-green-500/5 border-green-500/30 cursor-not-allowed' 
                                : ''
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                                                  {(goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && trackingMode === 'automatic' && connectedAccounts.find(acc => acc.is_emergency_fund) && (
                          <div className="mt-1">
                            <p className="text-xs text-green-600">
                              ✅ Automatically updated from {connectedAccounts.find(acc => acc.is_emergency_fund)?.institution_name || 'bank account'}
                            </p>
                            <button
                              onClick={() => {
                                console.log('🔄 Switching to manual tracking');
                                setTrackingMode('manual');
                                localStorage.setItem('emergencyFundTrackingMode', 'manual');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                            >
                              Switch to manual tracking →
                            </button>
                          </div>
                        )}
                        {(goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && trackingMode === 'manual' && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 mb-2">
                              💡 <strong>Manual Tracking:</strong> Update your emergency fund balance manually whenever it changes.
                            </p>
                            <button
                              onClick={() => {
                                setTrackingMode('automatic');
                                localStorage.setItem('emergencyFundTrackingMode', 'automatic');
                                onConnectBank?.();
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Want automatic updates? Connect your bank →
                            </button>

                          </div>
                        )}
                        {(goal.goal.id === 'emergency-fund' || goal.goal.name === 'Safety Net') && !trackingMode && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-700 mb-2">
                              ⚡ <strong>Choose Your Tracking Method:</strong> Would you like automatic or manual tracking?
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setTrackingMode('automatic');
                                  localStorage.setItem('emergencyFundTrackingMode', 'automatic');
                                  onConnectBank?.();
                                }}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                              >
                                Connect Bank
                              </button>
                              <button
                                onClick={() => {
                                  setTrackingMode('manual');
                                  localStorage.setItem('emergencyFundTrackingMode', 'manual');
                                }}
                                className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                              >
                                Manual Updates
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                          This Month's Contribution
                        </label>
                        <div className="relative">
                          <PlusCircle className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                          <input
                            type="number"
                            value={localProgress[goal.goal.id]?.monthlyActual ?? (actualProgress.find(p => p.goalId === goal.goal.id)?.monthlyActual || 0)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateMonthlyContribution(goal.goal.id, value);
                            }}
                            className="input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-theme-muted mt-1">
                          Target: {formatCurrency(goal.monthlyTarget, currency)}/month
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-theme-section rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-theme-secondary">Progress:</span>
                        <span className="font-medium text-theme-primary">{goal.progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-theme-tertiary rounded-full h-2 mt-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Update Progress Feedback */}
                {updateMessage && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    updateMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    updateMessage.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {updateMessage.text}
                  </div>
                )}

                <Button 
                  className="w-full" 
                  variant="primary" 
                  onClick={handleUpdateProgress}
                  disabled={isUpdatingProgress}
                >
                  {isUpdatingProgress ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving Progress...
                    </div>
                  ) : (
                    'Update Progress'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI-Powered Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    className={`p-4 border rounded-lg ${getRecommendationColor(rec.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getRecommendationIcon(rec.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{rec.title}</h4>
                        <p className="mb-2">{rec.description}</p>
                        <p className="text-sm font-medium">Impact: {rec.impact}</p>
                        {rec.actionRequired && (
                          <Button size="sm" className="mt-3">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Budget Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">
                    Monthly Savings Budget
                    </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                    <input
                      type="number"
                      value={state.budget}
                      onChange={(e) => updateBudget(parseFloat(e.target.value) || 0)}
                      className="input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-theme-muted mt-1">
                    Current allocation across all goals
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">
                    Monthly Income
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                    <input
                      type="number"
                      value={state.userProfile.monthlyIncome || 0}
                      onChange={(e) => {
                        const newIncome = parseFloat(e.target.value) || 0;
                        dispatch({ 
                          type: 'SET_USER_PROFILE', 
                          payload: { ...state.userProfile, monthlyIncome: newIncome }
                        });
                        // Auto-calculate budget
                        const newBudget = Math.max(0, newIncome - state.monthlyExpenses);
                        updateBudget(newBudget);
                      }}
                      className="input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Fund Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Fund Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-theme-section rounded-lg">
                <h4 className="font-medium text-theme-primary mb-3">Tracking Mode</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-theme-secondary">
                      Current mode: <span className="font-medium">
                        {trackingMode === 'automatic' ? '🏦 Automatic Bank Tracking' : 
                         trackingMode === 'manual' ? '✋ Manual Updates' : 
                         '❓ Not Set'}
                      </span>
                    </p>
                    {trackingMode === 'automatic' && connectedAccounts.find(acc => acc.is_emergency_fund) && (
                      <p className="text-xs text-green-600 mt-1">
                        Connected to: {connectedAccounts.find(acc => acc.is_emergency_fund)?.institution_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {trackingMode === 'manual' && (
                      <Button
                        onClick={() => {
                          setTrackingMode('automatic');
                          localStorage.setItem('emergencyFundTrackingMode', 'automatic');
                          onConnectBank?.();
                        }}
                        size="sm"
                        variant="primary"
                      >
                        Connect Bank
                      </Button>
                    )}
                    {trackingMode === 'automatic' && (
                      <Button
                        onClick={() => {
                          setTrackingMode('manual');
                          localStorage.setItem('emergencyFundTrackingMode', 'manual');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Switch to Manual
                      </Button>
                    )}
                    {connectedAccounts.find(acc => acc.is_emergency_fund) && (
                      <Button
                        onClick={onManageBanks}
                        size="sm"
                        variant="outline"
                      >
                        Manage Banks
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">
                    Monthly Expenses
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                    <input
                      type="number"
                      value={state.monthlyExpenses}
                      onChange={(e) => {
                        const newExpenses = parseFloat(e.target.value) || 0;
                        updateEmergencyFund(newExpenses, state.bufferMonths);
                      }}
                      className="input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">
                    Buffer Months
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={state.bufferMonths}
                    onChange={(e) => {
                      const newBuffer = parseInt(e.target.value) || 3;
                      updateEmergencyFund(state.monthlyExpenses, newBuffer);
                    }}
                    className="input-dark w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="3"
                  />
                  <p className="text-xs text-theme-muted mt-1">
                    Recommended: 3-6 months of expenses
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-theme-section rounded-lg">
                <p className="text-sm text-theme-secondary">
                  Emergency Fund Target: <span className="font-semibold text-theme-primary">
                    {formatCurrency(state.monthlyExpenses * state.bufferMonths, currency)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Goal Management */}
          <Card>
            <CardHeader>
              <CardTitle>Goal Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                      {state.goals.filter(g => g.id !== 'emergency-fund' && g.name !== 'Safety Net').map((goal) => (
                  <div key={goal.id} className="border border-theme rounded-lg p-4 bg-theme-card shadow-theme">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-theme-primary">{goal.name}</h4>
                      <Button 
                        onClick={() => setEditingGoal(goal.id)}
                        size="sm" 
                        variant="outline"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-theme-secondary">Target Amount</p>
                        <p className="font-semibold text-theme-primary">{formatCurrency(goal.amount, currency)}</p>
                      </div>
                      <div>
                        <p className="text-theme-secondary">Target Date</p>
                        <p className="font-semibold text-theme-primary">{goal.targetDate.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-theme-secondary">Monthly Required</p>
                        <p className="font-semibold text-theme-primary">{formatCurrency(goal.requiredPMT || 0, currency)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Edit Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card rounded-lg p-6 w-full max-w-md mx-4 border border-theme shadow-theme-xl">
            <h3 className="text-lg font-semibold text-theme-primary mb-4">Edit Goal</h3>
            
            {(() => {
              const goal = state.goals.find(g => g.id === editingGoal);
              if (!goal) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                      Goal Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                      <input
                        type="number"
                        value={goal.amount}
                        onChange={(e) => updateGoalAmount(goal.id, parseFloat(e.target.value) || 0)}
                        className="input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goal.targetDate.toISOString().split('T')[0]}
                      onChange={(e) => updateGoalDate(goal.id, new Date(e.target.value))}
                      className="input-dark w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingGoal(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setEditingGoal(null)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <div className="flex gap-3">
        <Button variant="outline" onClick={onOptimizePlan}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Optimize Plan
        </Button>
        </div>
        <Button variant="primary">
          <Download className="w-4 h-4 mr-2" />
          Export Updated Plan
        </Button>
      </div>
    </div>
  );
};

export default LiveDashboard; 