import React, { useState, useMemo, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/calculations';
import { calculateSequentialAllocations, calculateRequiredPMT } from '../utils/calculations';
import { Goal, ReturnPhase } from '../types/plannerTypes';
import { Settings, AlertTriangle, CheckCircle, Lightbulb, RotateCcw, Save, TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';

interface OptimizedGoal extends Goal {
  originalAmount: number;
  originalTargetDate: Date;
  isModified: boolean;
}

interface SmartSuggestion {
  id: string;
  type: 'reduce_amount' | 'extend_timeline' | 'adjust_budget';
  goalId: string;
  goalName: string;
  description: string;
  impact: string;
  newAmount?: number;
  newTargetDate?: Date;
}

const GoalOptimizer: React.FC = () => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  
  // Sandbox state - copy of goals for experimentation
  const [optimizedGoals, setOptimizedGoals] = useState<OptimizedGoal[]>([]);
  const [isOptimizationMode, setIsOptimizationMode] = useState(false);

  // Initialize optimized goals when entering optimization mode
  useEffect(() => {
    if (isOptimizationMode && optimizedGoals.length === 0) {
      const editableGoals = state.goals.filter(goal => goal.id !== 'emergency-fund');
      const optimized = editableGoals.map(goal => ({
        ...goal,
        originalAmount: goal.amount,
        originalTargetDate: new Date(goal.targetDate),
        isModified: false
      }));
      setOptimizedGoals(optimized);
    }
  }, [isOptimizationMode, state.goals, optimizedGoals.length]);

  // Calculate projections for optimized goals
  const optimizedProjections = useMemo(() => {
    if (!isOptimizationMode || optimizedGoals.length === 0) return null;
    
    const allGoals = [
      ...state.goals.filter(goal => goal.id === 'emergency-fund'), // Keep emergency fund as-is
      ...optimizedGoals
    ];
    
    return calculateSequentialAllocations(allGoals, state.budget, state.fundingStyle);
  }, [optimizedGoals, state.budget, state.fundingStyle, state.goals, isOptimizationMode]);

  // Check if plan is feasible
  const feasibilityCheck = useMemo(() => {
    if (!optimizedProjections) return { isFeasible: true, totalRequired: 0, overBudget: 0 };
    
    const totalRequired = optimizedProjections.reduce((sum, proj) => sum + proj.requiredPMT, 0);
    const overBudget = Math.max(0, totalRequired - state.budget);
    
    return {
      isFeasible: totalRequired <= state.budget,
      totalRequired,
      overBudget
    };
  }, [optimizedProjections, state.budget]);

  // Generate smart suggestions for fixing budget issues
  const smartSuggestions = useMemo((): SmartSuggestion[] => {
    if (!optimizedProjections || feasibilityCheck.isFeasible) return [];
    
    const suggestions: SmartSuggestion[] = [];
    const overBudget = feasibilityCheck.overBudget;
    
    // Sort goals by flexibility (furthest target dates first)
    const sortedGoals = [...optimizedGoals].sort((a, b) => 
      b.targetDate.getTime() - a.targetDate.getTime()
    );

    sortedGoals.forEach(goal => {
      const currentProjection = optimizedProjections.find(p => p.goal.id === goal.id);
      if (!currentProjection) return;

      // Suggestion 1: Reduce goal amount by 10-20%
      const reductionAmount = Math.ceil(goal.amount * 0.15);
      const newAmount = goal.amount - reductionAmount;
      suggestions.push({
        id: `reduce_${goal.id}`,
        type: 'reduce_amount',
        goalId: goal.id,
        goalName: goal.name,
        description: `Reduce ${goal.name} target by ${formatCurrency(reductionAmount, currency)}`,
        impact: `Saves ~${formatCurrency(Math.ceil(reductionAmount / (goal.horizonMonths || 12)), currency)}/month`,
        newAmount
      });

      // Suggestion 2: Extend timeline by 6-12 months
      const currentDate = new Date(goal.targetDate);
      const extendedDate = new Date(currentDate.setMonth(currentDate.getMonth() + 8));
      suggestions.push({
        id: `extend_${goal.id}`,
        type: 'extend_timeline',
        goalId: goal.id,
        goalName: goal.name,
        description: `Extend ${goal.name} timeline by 8 months`,
        impact: `Reduces monthly payment by ~${formatCurrency(Math.ceil(currentProjection.requiredPMT * 0.2), currency)}`,
        newTargetDate: extendedDate
      });
    });

    return suggestions.slice(0, 4); // Limit to top 4 suggestions
  }, [optimizedProjections, feasibilityCheck, optimizedGoals, currency]);

  const handleGoalAmountChange = (goalId: string, newAmount: number) => {
    setOptimizedGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const isModified = newAmount !== goal.originalAmount || 
                          goal.targetDate.getTime() !== goal.originalTargetDate.getTime();
        
        // Recalculate horizon months and return phases for new amount
        const today = new Date();
        const horizonMonths = Math.max(1, Math.round((goal.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
        
        return {
          ...goal,
          amount: newAmount,
          horizonMonths,
          isModified,
          requiredPMT: calculateRequiredPMT(newAmount, goal.returnPhases, horizonMonths, goal.paymentFrequency, goal.paymentPeriod)
        };
      }
      return goal;
    }));
  };

  const handleGoalDateChange = (goalId: string, newDate: Date) => {
    setOptimizedGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const isModified = goal.amount !== goal.originalAmount || 
                          newDate.getTime() !== goal.originalTargetDate.getTime();
        
        // Recalculate horizon months for new date
        const today = new Date();
        const horizonMonths = Math.max(1, Math.round((newDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
        
        return {
          ...goal,
          targetDate: newDate,
          horizonMonths,
          isModified,
          requiredPMT: calculateRequiredPMT(goal.amount, goal.returnPhases, horizonMonths, goal.paymentFrequency, goal.paymentPeriod)
        };
      }
      return goal;
    }));
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    if (suggestion.type === 'reduce_amount' && suggestion.newAmount) {
      handleGoalAmountChange(suggestion.goalId, suggestion.newAmount);
    } else if (suggestion.type === 'extend_timeline' && suggestion.newTargetDate) {
      handleGoalDateChange(suggestion.goalId, suggestion.newTargetDate);
    }
  };

  const resetOptimization = () => {
    const resetGoals = optimizedGoals.map(goal => ({
      ...goal,
      amount: goal.originalAmount,
      targetDate: new Date(goal.originalTargetDate),
      isModified: false,
      requiredPMT: calculateRequiredPMT(goal.originalAmount, goal.returnPhases, goal.horizonMonths, goal.paymentFrequency, goal.paymentPeriod)
    }));
    setOptimizedGoals(resetGoals);
  };

  const applyChanges = () => {
    // Apply changes to actual goals
    optimizedGoals.forEach(optimizedGoal => {
      if (optimizedGoal.isModified) {
        // Create a clean Goal object by extracting only Goal properties
        const updatedGoal: Goal = {
          id: optimizedGoal.id,
          name: optimizedGoal.name,
          category: optimizedGoal.category,
          targetDate: optimizedGoal.targetDate,
          amount: optimizedGoal.amount,
          horizonMonths: optimizedGoal.horizonMonths,
          profile: optimizedGoal.profile,
          returnPhases: optimizedGoal.returnPhases,
          requiredPMT: optimizedGoal.requiredPMT,
          paymentFrequency: optimizedGoal.paymentFrequency,
          paymentPeriod: optimizedGoal.paymentPeriod
        };
        
        dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
      }
    });
    
    // Exit optimization mode
    setIsOptimizationMode(false);
    setOptimizedGoals([]);
  };

  const exitOptimization = () => {
    setIsOptimizationMode(false);
    setOptimizedGoals([]);
  };

  if (!isOptimizationMode) {
    return (
      <Card className="mb-8 shadow-theme-lg border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-theme p-6 rounded-t-xl">
          <h3 className="heading-h3-sm text-theme-primary mb-2 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-500" />
            Optimize Your Plan
          </h3>
          <p className="text-theme-secondary">Fine-tune your goals to perfectly fit your budget. Try different amounts and timelines in a safe sandbox.</p>
        </div>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h4 className="heading-h4 text-theme-primary mb-2">Ready to Optimize?</h4>
              <p className="text-theme-secondary max-w-md mx-auto">
                Experiment with different goal amounts and timelines. Don't worry - nothing will change until you choose to apply your adjustments.
              </p>
            </div>
            <Button
              onClick={() => setIsOptimizationMode(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Start Optimizing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 shadow-theme-lg border-0 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-theme p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="heading-h3-sm text-theme-primary mb-2 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-500" />
              Optimize Your Plan
              <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-600 text-xs rounded-full font-medium">
                SANDBOX MODE
              </span>
            </h3>
            <p className="text-theme-secondary">Adjust your goals below. Changes are temporary until you apply them.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={resetOptimization}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={exitOptimization}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Budget Status */}
        <div className={`mb-6 p-4 rounded-xl border-2 ${
          feasibilityCheck.isFeasible 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {feasibilityCheck.isFeasible ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <div className="font-semibold text-theme-primary">
                  Budget Status: {feasibilityCheck.isFeasible ? 'Feasible' : 'Over Budget'}
                </div>
                <div className="text-sm text-theme-secondary">
                  Using {formatCurrency(feasibilityCheck.totalRequired, currency)} of {formatCurrency(state.budget, currency)} monthly budget
                  {!feasibilityCheck.isFeasible && (
                    <span className="text-red-500 ml-1">
                      (Over by {formatCurrency(feasibilityCheck.overBudget, currency)})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                feasibilityCheck.isFeasible ? 'text-green-500' : 'text-red-500'
              }`}>
                {Math.round((feasibilityCheck.totalRequired / state.budget) * 100)}%
              </div>
              <div className="text-sm text-theme-muted">of budget</div>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-theme-primary">Smart Suggestions</h4>
            </div>
            <p className="text-sm text-theme-secondary mb-4">Here are some ways to make your plan work within your budget:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {smartSuggestions.map(suggestion => (
                <div key={suggestion.id} className="bg-theme-card p-3 rounded-lg border border-theme">
                  <div className="font-medium text-theme-primary text-sm mb-1">
                    {suggestion.description}
                  </div>
                  <div className="text-xs text-theme-secondary mb-2">
                    {suggestion.impact}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applySuggestion(suggestion)}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal Adjustment Cards */}
        <div className="space-y-4 mb-6">
          {optimizedGoals.map((goal, index) => {
            const projection = optimizedProjections?.find(p => p.goal.id === goal.id);
            const colors = [
              'from-emerald-500 to-teal-500',
              'from-blue-500 to-indigo-500',
              'from-purple-500 to-pink-500',
              'from-orange-500 to-red-500',
              'from-teal-500 to-cyan-500',
              'from-pink-500 to-rose-500'
            ];
            const gradientColor = colors[index % colors.length];

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  goal.isModified
                    ? 'border-blue-500/50 bg-blue-500/5'
                    : 'border-theme bg-theme-card'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${gradientColor}`}></div>
                    <h4 className="font-semibold text-theme-primary">{goal.name}</h4>
                    {goal.isModified && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-600 text-xs rounded-full font-medium">
                        Modified
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-theme-primary">
                      {formatCurrency(projection?.requiredPMT || 0, currency)}/month
                    </div>
                    <div className="text-xs text-theme-muted">Required payment</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount Adjustment */}
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Target Amount
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={Math.round(goal.originalAmount * 0.5)}
                        max={Math.round(goal.originalAmount * 1.5)}
                        step={Math.round(goal.originalAmount * 0.01)}
                        value={goal.amount}
                        onChange={(e) => handleGoalAmountChange(goal.id, Number(e.target.value))}
                        className="w-full h-2 bg-theme-section rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-theme-muted">
                        <span>{formatCurrency(goal.originalAmount * 0.5, currency)}</span>
                        <span className="font-medium text-theme-primary">
                          {formatCurrency(goal.amount, currency)}
                        </span>
                        <span>{formatCurrency(goal.originalAmount * 1.5, currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date Adjustment */}
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={goal.targetDate.toISOString().split('T')[0]}
                      onChange={(e) => handleGoalDateChange(goal.id, new Date(e.target.value))}
                      className="w-full px-3 py-2 bg-theme-tertiary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="text-xs text-theme-muted mt-1">
                      Original: {goal.originalTargetDate.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Apply Changes */}
        <div className="flex items-center justify-between pt-4 border-t border-theme">
          <div className="text-sm text-theme-secondary">
            {optimizedGoals.filter(g => g.isModified).length} goal(s) modified
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={exitOptimization}>
              Cancel Changes
            </Button>
            <Button
              onClick={applyChanges}
              disabled={!optimizedGoals.some(g => g.isModified)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalOptimizer; 