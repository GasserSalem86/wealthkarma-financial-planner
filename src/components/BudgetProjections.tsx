import React, { useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/calculations';
import { LineChart, ArrowRight, AlertTriangle, Layers, Split, BarChart2, TrendingUp, PiggyBank, Target, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import GoalProgressChart from './GoalProgressChart';
import CombinedProgressChart from './CombinedProgressChart';
import { FundingStyle } from '../types/plannerTypes';
import Button from './ui/Button';

const BudgetBanner = () => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  
  const handleBudgetChange = (value: number) => {
    dispatch({ type: 'SET_BUDGET', payload: value });
  };

  const handleFundingStyleChange = (style: FundingStyle) => {
    dispatch({ type: 'SET_FUNDING_STYLE', payload: style });
  };

  return (
    <>
      {/* Enhanced CSS styles */}
      <style>{`
        .budget-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 6px;
          outline: none;
          transition: all 0.3s ease;
          background: linear-gradient(to right, #10b981 0%, #10b981 var(--value-percent, 0%), #9ca3af var(--value-percent, 0%), #9ca3af 100%);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .budget-slider:hover {
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(5, 150, 105, 0.1);
        }
        
        .budget-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #059669, #10b981);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 0 3px rgba(5, 150, 105, 0.2);
          transition: all 0.3s ease;
          border: none;
        }
        
        .budget-slider::-webkit-slider-thumb:hover {
          background: linear-gradient(135deg, #047857, #059669);
          transform: scale(1.1);
          box-shadow: 0 3px 8px rgba(5, 150, 105, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 0 4px rgba(5, 150, 105, 0.3);
        }
        
        .budget-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #059669, #10b981);
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3), 0 0 0 1px rgba(5, 150, 105, 0.2);
          transition: all 0.3s ease;
        }
        
        .funding-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .funding-card:hover {
          transform: translateY(-1px);
        }
        
        .funding-card.selected {
          transform: translateY(-1px);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .slide-in {
          animation: slideIn 0.6s ease-out;
        }
      `}</style>
      
      <div className="rounded-lg border border-theme overflow-hidden mb-4 lg:mb-6 shadow-theme bg-theme-card">
        {/* Header similar to other cards */}
        <div className="bg-gradient-to-r from-green-500/10 to-orange-500/10 border-b border-theme p-4 lg:p-6 rounded-t-xl">
          <h3 className="text-lg lg:text-xl font-bold text-theme-primary mb-1 lg:mb-2">
            Your Money Plan
          </h3>
          <p className="text-sm lg:text-base text-theme-secondary">Choose your savings strategy and set your monthly budget</p>
        </div>

        {/* Content with background */}
        <div className="bg-theme-card p-3 lg:p-4">
          {/* Compact Funding Strategy & Budget Layout */}
          <div className="space-y-3 lg:space-y-4">
            {/* Funding Strategy Cards - With Descriptions */}
            <div>
              <h3 className="text-center text-base lg:text-lg font-bold text-theme-primary mb-2 lg:mb-3">Choose Your Savings Strategy</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
                <div 
                  className={`funding-card p-3 lg:p-4 rounded-lg border cursor-pointer text-center transition-all ${
                    state.fundingStyle === 'waterfall' 
                      ? 'border-emerald-500 bg-theme-tertiary shadow-theme ring-2 ring-emerald-500/30' 
                      : 'border-theme bg-theme-tertiary hover:border-emerald-400'
                  }`}
                  onClick={() => handleFundingStyleChange('waterfall')}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Layers className={`w-3 h-3 lg:w-4 lg:h-4 ${
                      state.fundingStyle === 'waterfall' ? 'text-emerald-400' : 'text-theme-muted'
                    }`} />
                    <span className="text-xs lg:text-sm font-medium text-theme-primary">One at a Time</span>
                    {state.fundingStyle === 'waterfall' && (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    Complete each goal fully before moving to the next. Perfect for focused achievers.
                  </p>
                </div>

                <div 
                  className={`funding-card p-3 lg:p-4 rounded-lg border cursor-pointer text-center transition-all ${
                    state.fundingStyle === 'parallel' 
                      ? 'border-emerald-500 bg-theme-tertiary shadow-theme ring-2 ring-emerald-500/30' 
                      : 'border-theme bg-theme-tertiary hover:border-emerald-400'
                  }`}
                  onClick={() => handleFundingStyleChange('parallel')}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Split className={`w-3 h-3 lg:w-4 lg:h-4 ${
                      state.fundingStyle === 'parallel' ? 'text-emerald-400' : 'text-theme-muted'
                    }`} />
                    <span className="text-xs lg:text-sm font-medium text-theme-primary">Split Evenly</span>
                    {state.fundingStyle === 'parallel' && (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    Divide your monthly savings across all goals. Great for making progress simultaneously.
                  </p>
                </div>

                <div 
                  className={`funding-card p-3 lg:p-4 rounded-lg border cursor-pointer text-center transition-all ${
                    state.fundingStyle === 'hybrid' 
                      ? 'border-emerald-500 bg-theme-tertiary shadow-theme ring-2 ring-emerald-500/30' 
                      : 'border-theme bg-theme-tertiary hover:border-emerald-400'
                  }`}
                  onClick={() => handleFundingStyleChange('hybrid')}
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <BarChart2 className={`w-3 h-3 lg:w-4 lg:h-4 ${
                      state.fundingStyle === 'hybrid' ? 'text-emerald-400' : 'text-theme-muted'
                    }`} />
                    <span className="text-xs lg:text-sm font-medium text-theme-primary">Smart Mix</span>
                    {state.fundingStyle === 'hybrid' && (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    Prioritize safety net and urgent goals first, then distribute remaining funds across long-term dreams.
                  </p>
                </div>
              </div>
            </div>

            {/* Compact Budget Section */}
            <div className="bg-theme-tertiary rounded-lg p-3 lg:p-4 border border-theme shadow-theme-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 items-center">
                {/* Left: Budget Display & Input */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-base lg:text-lg font-bold text-theme-primary">
                        {formatCurrency(state.budget, currency)}
                      </div>
                      <div className="text-xs text-theme-muted">Monthly Budget</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center lg:justify-start">
                    <div className="relative w-40">
                      <input
                        type="number"
                        value={state.budget}
                        onChange={(e) => handleBudgetChange(Number(e.target.value))}
                        className="input-dark w-full px-3 py-2 pr-12 text-center font-medium text-sm"
                        min="0"
                        step="50"
                        placeholder="Amount"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted text-xs pointer-events-none">
                        {currency.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Slider */}
                <div className="space-y-2">
                  <div className="text-xs text-theme-secondary text-center lg:text-left">Adjust Budget</div>
                  {(() => {
                    const monthlyIncome = state.userProfile.monthlyIncome || 0;
                    const calculatedMax = monthlyIncome > 0 
                      ? monthlyIncome * 0.9
                      : Math.max(state.budget * 2, 10000);
                    
                    return (
                      <div>
                        <input
                          type="range"
                          min="0"
                          max={calculatedMax}
                          step="50"
                          value={state.budget}
                          onChange={(e) => handleBudgetChange(Number(e.target.value))}
                          className="budget-slider w-full h-2"
                          style={{
                            '--value-percent': `${(state.budget / calculatedMax) * 100}%`
                          } as React.CSSProperties}
                        />
                        <div className="flex justify-between text-xs text-theme-muted mt-1">
                          <span>0</span>
                          <span>{formatCurrency(calculatedMax, currency)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Compact Financial Overview */}
              {state.userProfile.monthlyIncome && state.monthlyExpenses > 0 && (
                <div className="mt-4 pt-3 border-t border-theme">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-theme-section rounded text-center shadow-theme-sm">
                      <div className="text-xs text-theme-secondary">Income</div>
                      <div className="text-sm font-semibold text-theme-primary">{formatCurrency(state.userProfile.monthlyIncome, currency)}</div>
                    </div>
                    <div className="p-2 bg-theme-section rounded text-center shadow-theme-sm">
                      <div className="text-xs text-theme-secondary">Expenses</div>
                      <div className="text-sm font-semibold text-theme-primary">{formatCurrency(state.monthlyExpenses, currency)}</div>
                    </div>
                    <div className="p-2 bg-theme-section rounded text-center shadow-theme-sm border border-emerald-500/30">
                      <div className="text-xs text-theme-secondary">Available</div>
                      <div className="text-sm font-semibold text-theme-primary">
                        {formatCurrency(state.userProfile.monthlyIncome - state.monthlyExpenses, currency)}
                      </div>
                    </div>
                  </div>
                  
                  {state.budget > (state.userProfile.monthlyIncome - state.monthlyExpenses) && (
                    <div className="mt-3 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="text-amber-600 dark:text-amber-200 text-xs">
                        <span className="font-medium">Budget exceeds available income.</span>
                        <span className="ml-1">Consider adjusting.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AllocationTable = () => {
  const { state } = usePlanner();
  const { currency } = useCurrency();
  const { goals, allocations } = state;

  const handleScrollToGoal = (goalId: string) => {
    const element = document.getElementById(`goal-tab-${goalId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate budget reallocation
  const reallocations = useMemo(() => {
    const result = new Map<string, number>();
    let pot = 0;
    
    allocations.forEach(a => {
      if (a.amountAtTarget >= a.goal.amount && a.requiredPMT < a.initialPMT) {
        pot += a.initialPMT - a.requiredPMT;
      }
      if (a.requiredPMT > a.initialPMT) {
        result.set(a.goal.id, a.requiredPMT - a.initialPMT);
      }
    });

    result.set('UNALLOCATED', pot);
    return result;
  }, [allocations]);

  return (
    <Card className="mb-8 shadow-theme-lg border-0 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500/10 to-orange-500/10 border-b border-theme p-6 rounded-t-xl">
        <h3 className="heading-h3-sm text-theme-primary mb-2">
          Where Your Money Goes
        </h3>
        <p className="text-theme-secondary">See how your monthly budget is allocated across your financial goals</p>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-theme-tertiary border-b border-theme">
              <tr>
                <th className="px-6 py-4 text-left heading-table">
                  Goal
                </th>
                <th className="px-6 py-4 text-left heading-table">
                  Monthly Amount
                </th>
                <th className="px-6 py-4 text-left heading-table">
                  Extra Money
                </th>
                <th className="px-6 py-4 text-left heading-table">
                  Final Monthly
                </th>
                <th className="px-6 py-4 text-left heading-table">
                  Progress
                </th>
                <th className="px-6 py-4 text-right heading-table">
                  Chart
                </th>
              </tr>
            </thead>
            <tbody className="bg-theme-card divide-y divide-theme">
              {allocations.map((allocation, index) => {
                const reallocation = reallocations.get(allocation.goal.id) || 0;
                const firstNonZero = allocation.monthlyAllocations.find(a => a > 0) ?? 0;
                const firstActual = Math.min(state.budget, firstNonZero);
                const finalPMT = allocation.requiredPMT;
                const progressPercentage = Math.min(100, (allocation.amountAtTarget / allocation.goal.amount) * 100);
                
                return (
                  <tr key={allocation.goal.id} className="hover:bg-theme-tertiary transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          (() => {
                            // Use consistent color scheme across both tables and tabs
                            const colors = [
                              'bg-emerald-500',  // Emerald for first goal
                              'bg-blue-500',     // Blue for second goal  
                              'bg-purple-500',   // Purple for third goal
                              'bg-orange-500',   // Orange for fourth goal
                              'bg-teal-500',     // Teal for fifth goal
                              'bg-pink-500',     // Pink for sixth goal
                            ];
                            return colors[index % colors.length] || 'bg-theme-success';
                          })()
                        }`}></div>
                        <span className="text-sm font-semibold text-theme-primary">{allocation.goal.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {firstNonZero > state.budget && (
                          <span title="Exceeds current monthly budget">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          </span>
                        )}
                        <span className="text-sm font-medium text-theme-primary" title={`Theoretical PMT: ${formatCurrency(allocation.initialPMT, currency)}`}>
                          {formatCurrency(firstActual, currency)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {reallocation > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          +{formatCurrency(reallocation, currency)}
                        </span>
                      ) : (
                        <span className="text-theme-muted text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-theme-primary">
                        {formatCurrency(finalPMT, currency)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 h-3 bg-theme-section rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-theme-secondary min-w-[3rem]">
                          {progressPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => handleScrollToGoal(allocation.goal.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        <LineChart className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const GoalTabs = () => {
  const { state } = usePlanner();
  const [activeGoal, setActiveGoal] = React.useState<string>(state.goals[0]?.id || '');

  const sortedGoals = useMemo(() => {
    return [...state.goals].sort((a, b) => {
      if (a.id === 'emergency-fund') return -1;
      if (b.id === 'emergency-fund') return 1;
      return a.targetDate.getTime() - b.targetDate.getTime();
    });
  }, [state.goals]);

  if (state.goals.length === 0) return null;

  return (
    <div className="rounded-2xl border border-theme overflow-hidden mt-12 shadow-theme-lg bg-theme-card">
      <div className="bg-gradient-to-r from-green-500/10 to-orange-500/10 border-b border-theme p-6 rounded-t-xl">
        <h3 className="heading-h3-sm text-theme-primary mb-2">
          Track Each Goal
        </h3>
        <p className="text-theme-secondary">See how each goal is growing! Click between your goals to explore your progress.</p>
      </div>
      
      <div className="flex overflow-x-auto bg-theme-tertiary border-b border-theme">
        {sortedGoals.map((goal, index) => {
          const isActive = activeGoal === goal.id;
          
          // Enhanced color logic for better consistency
          const getIndicatorColor = () => {
            if (isActive) {
              // Active state - use emerald to match the active tab styling
              return 'bg-emerald-500';
            }
            
            // Inactive state - use a more diverse and theme-aware color palette
            const colors = [
              'bg-emerald-400',  // Emerald for first goal
              'bg-blue-400',     // Blue for second goal  
              'bg-purple-400',   // Purple for third goal
              'bg-orange-400',   // Orange for fourth goal
              'bg-teal-400',     // Teal for fifth goal
              'bg-pink-400',     // Pink for sixth goal
            ];
            
            return colors[index % colors.length] || 'bg-theme-success';
          };
          
          return (
            <button
              key={goal.id}
              id={`goal-tab-${goal.id}`}
              onClick={() => setActiveGoal(goal.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all flex items-center space-x-2 ${
                isActive
                  ? 'text-emerald-400 border-b-3 border-emerald-400 bg-theme-card'
                  : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-section'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-colors ${getIndicatorColor()}`}></div>
              <span>{goal.name}</span>
            </button>
          );
        })}
      </div>
      
      <div className="p-6 bg-theme-card">
        {sortedGoals.map((goal) => {
          const allocation = state.allocations.find(a => a.goal.id === goal.id);
          const monthlyAllocations = allocation?.monthlyAllocations || [];
          const runningBalances = allocation?.runningBalances || [];
          
          return (
            <div
              key={goal.id}
              className={`transition-opacity duration-300 ${
                activeGoal === goal.id ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            >
              <GoalProgressChart
                goal={goal}
                monthlyAllocations={monthlyAllocations}
                runningBalances={runningBalances}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BudgetProjectionsProps {
  onNext?: () => void;
  onBack?: () => void;
}

const BudgetProjections: React.FC<BudgetProjectionsProps> = ({ onNext, onBack }) => {
  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="heading-gradient-primary heading-h1 mb-4">
          Your Money Plan
        </h1>
        <p className="text-xl text-theme-secondary max-w-3xl mx-auto">
          Set up your savings strategy and see how your money will grow to achieve your financial goals
        </p>
      </div>

      <BudgetBanner />
      <AllocationTable />
      <CombinedProgressChart />
      <GoalTabs />
      
      {/* Enhanced Navigation */}
      {(onNext || onBack) && (
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-theme">
          {onBack ? (
            <Button
              onClick={onBack}
              variant="outline"
            >
              ← Back
            </Button>
          ) : (
            <div />
          )}
          
          {onNext && (
            <Button
              onClick={onNext}
              variant="primary"
            >
              Continue to Monthly Plan
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetProjections;