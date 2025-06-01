import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Download, FileText, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '../../utils/calculations';

interface MonthlyRoadmapSectionProps {
  onNext: () => void;
  onBack: () => void;
}

interface MonthlyAction {
  type: 'contribution' | 'setup' | 'review' | 'milestone';
  description: string;
  amount?: number;
  priority: 'critical' | 'important' | 'optional';
}

interface MonthlyPlan {
  month: Date;
  monthName: string;
  totalAllocation: number;
  goalBreakdown: Array<{
    goalId: string;
    goalName: string;
    contribution: number;
    cumulativeTotal: number;
    progressPercentage: number;
    targetRate: number;
    riskLevel: string;
    currentPhase: string;
    bankDetails?: {
      bankName: string;
      accountType: string;
      interestRate: string;
    };
  }>;
  keyActions: MonthlyAction[];
  milestones: string[];
  rateTargets: {
    emergency: { rate: number; source: string; bankSelected: boolean };
    shortTerm: number;
    longTerm: number;
  };
}

const MonthlyRoadmapSection: React.FC<MonthlyRoadmapSectionProps> = ({ onNext, onBack }) => {
  const { state } = usePlanner();
  const { currency } = useCurrency();

  // Calculate dynamic timeline based on actual goals
  const totalMonthsNeeded = useMemo(() => {
    if (state.allocations.length === 0) return 60; // Default fallback
    
    // Find the maximum timeline from all goals
    const maxMonths = Math.max(...state.allocations.map(allocation => {
      // Find when this goal will be completed based on running balances
      const completionMonth = allocation.runningBalances.findIndex(balance => 
        balance >= allocation.goal.amount
      );
      return completionMonth === -1 ? allocation.goal.horizonMonths : completionMonth + 1;
    }));
    
    // Add buffer months for post-completion analysis and ensure minimum of 12 months
    return Math.max(maxMonths + 12, 12);
  }, [state.allocations]);

  // Helper function to get current phase and target rate for a goal
  const getGoalRateInfo = (goal: any, monthIndex: number) => {
    let currentPhase = 0;
    let monthsElapsed = 0;
    
    for (let i = 0; i < goal.returnPhases.length; i++) {
      const phase = goal.returnPhases[i];
      if (monthIndex >= monthsElapsed && monthIndex < monthsElapsed + phase.length) {
        currentPhase = i;
        break;
      }
      monthsElapsed += phase.length;
    }
    
    const phase = goal.returnPhases[currentPhase];
    const years = goal.horizonMonths / 12;
    const hasPaymentPeriod = goal.paymentPeriod && goal.paymentFrequency && goal.paymentFrequency !== 'Once';
    
    let phaseName = '';
    let riskLevel = '';
    let bankDetails = undefined;
    
    if (goal.id === 'emergency-fund') {
      phaseName = 'Liquidity';
      riskLevel = 'Very Low';
      
      // Use selected bank details if available
      if (goal.selectedBank) {
        bankDetails = {
          bankName: goal.selectedBank.bankName,
          accountType: goal.selectedBank.accountType,
          interestRate: goal.selectedBank.interestRate
        };
      }
    } else if (hasPaymentPeriod) {
      // Goals with payment periods have multiple phases based on timeline
      const totalPhases = goal.returnPhases.length;
      const isDrawdownPhase = currentPhase === totalPhases - 1;
      
      if (isDrawdownPhase) {
        // Last phase is always drawdown
        phaseName = 'Drawdown';
        riskLevel = 'Very Low';
      } else if (years <= 3) {
        // Short-term: Single conservative accumulation phase
        phaseName = 'Conservative Accumulation';
        riskLevel = 'Low';
      } else if (years <= 7) {
        // Medium-term: Growth then conservative
        if (currentPhase === 0) {
          phaseName = 'Growth Accumulation';
          riskLevel = 'Medium-High';
        } else {
          phaseName = 'Conservative Pre-Target';
          riskLevel = 'Low';
        }
      } else {
        // Long-term: Three-phase accumulation strategy
        if (currentPhase === 0) {
          phaseName = 'Growth Accumulation';
          riskLevel = 'Medium-High';
        } else if (currentPhase === 1) {
          phaseName = 'Balanced Accumulation';
          riskLevel = 'Medium';
        } else if (currentPhase === 2) {
          phaseName = 'Preservation Pre-Target';
          riskLevel = 'Low';
        }
      }
    } else if (years <= 3) {
      phaseName = 'Conservative';
      riskLevel = 'Low';
    } else if (currentPhase === 0) {
      phaseName = 'Growth';
      riskLevel = 'Medium-High';
    } else if (currentPhase === 1) {
      phaseName = 'Balanced';
      riskLevel = 'Medium';
    } else {
      phaseName = 'Preservation';
      riskLevel = 'Low';
    }
    
    return {
      targetRate: phase.rate,
      riskLevel,
      currentPhase: phaseName,
      bankDetails
    };
  };

  // Generate monthly plan data with rate targets
  const monthlyPlan = useMemo(() => {
    const startDate = new Date();
    const plans: MonthlyPlan[] = [];
    
    // Find emergency fund goal to check if bank is selected
    const emergencyFundGoal = state.allocations.find(a => a.goal.id === 'emergency-fund')?.goal;
    const emergencyBankSelected = !!emergencyFundGoal?.selectedBank;
    const emergencyRate = emergencyFundGoal?.selectedBank?.returnRate || 0.04;
    
    for (let i = 0; i < totalMonthsNeeded; i++) {
      const month = addMonths(startDate, i);
      const monthName = format(month, 'MMMM yyyy');
      
      // Calculate allocations for this month with rate targets
      let totalAllocation = 0;
      const goalBreakdown = state.allocations.map(allocation => {
        const contribution = allocation.monthlyAllocations[i] || 0;
        let cumulativeTotal = allocation.runningBalances[i] || 0;
        
        // Ensure cumulative amount never decreases
        if (i > 0) {
          const maxPreviousAmount = Math.max(
            ...allocation.runningBalances.slice(0, i).filter(balance => balance > 0)
          );
          if (maxPreviousAmount > 0) {
            cumulativeTotal = Math.max(cumulativeTotal, maxPreviousAmount);
          }
        }
        
        const progressPercentage = Math.min(100, (cumulativeTotal / allocation.goal.amount) * 100);
        totalAllocation += contribution;
        
        // Get rate information for this goal at this time
        const rateInfo = getGoalRateInfo(allocation.goal, i);
        
        return {
          goalId: allocation.goal.id,
          goalName: allocation.goal.name,
          contribution,
          cumulativeTotal,
          progressPercentage,
          targetRate: rateInfo.targetRate,
          riskLevel: rateInfo.riskLevel,
          currentPhase: rateInfo.currentPhase,
          bankDetails: rateInfo.bankDetails
        };
      });

      // Generate actions for this month
      const keyActions: MonthlyAction[] = [];
      
      if (i === 0) {
        keyActions.push({
          type: 'setup',
          description: 'Open emergency fund savings account',
          priority: 'critical'
        });
      }
      
      if (i % 3 === 0) {
        keyActions.push({
          type: 'review',
          description: 'Review and adjust plan based on performance',
          priority: 'important'
        });
      }
      
      goalBreakdown.forEach(goal => {
        if (goal.contribution > 0) {
          keyActions.push({
            type: 'contribution',
            description: `Contribute to ${goal.goalName}`,
            amount: goal.contribution,
            priority: 'critical'
          });
        }
      });

      // Generate milestones - only show when first achieved
      const milestones: string[] = [];
      goalBreakdown.forEach(goal => {
        // Find the allocation for this goal
        const goalAllocation = state.allocations.find(a => a.goal.id === goal.goalId);
        if (!goalAllocation) return;
        
        // Use original running balances (not our preserved amounts) for milestone detection
        const currentRawBalance = goalAllocation.runningBalances[i] || 0;
        const previousRawBalance = i > 0 ? (goalAllocation.runningBalances[i - 1] || 0) : 0;
        
        const currentProgress = Math.min(100, (currentRawBalance / goalAllocation.goal.amount) * 100);
        const previousProgress = Math.min(100, (previousRawBalance / goalAllocation.goal.amount) * 100);
        
        // Only show milestone when it's first crossed (not on subsequent months)
        if (currentProgress >= 10 && previousProgress < 10) {
          milestones.push(`🌱 ${goal.goalName} - Great start! 10% saved`);
        } else if (currentProgress >= 25 && previousProgress < 25) {
          milestones.push(`🎯 ${goal.goalName} - Quarter way there! 25% complete`);
        } else if (currentProgress >= 50 && previousProgress < 50) {
          milestones.push(`⭐ ${goal.goalName} - Halfway milestone reached! 50% complete`);
        } else if (currentProgress >= 75 && previousProgress < 75) {
          milestones.push(`🔥 ${goal.goalName} - Almost there! 75% complete`);
        } else if (currentProgress >= 90 && previousProgress < 90) {
          milestones.push(`🚀 ${goal.goalName} - Final stretch! 90% complete`);
        } else if (currentProgress >= 100 && previousProgress < 100) {
          milestones.push(`🎉 ${goal.goalName} - GOAL ACHIEVED! Congratulations!`);
        }
        
        // Special milestones for large amounts - use correct currency formatting
        if (currentRawBalance >= 1000 && previousRawBalance < 1000) {
          milestones.push(`💰 ${goal.goalName} - First ${formatCurrency(1000, currency)} milestone reached!`);
        }
        if (currentRawBalance >= 10000 && previousRawBalance < 10000) {
          milestones.push(`🏆 ${goal.goalName} - ${formatCurrency(10000, currency)} milestone achieved!`);
        }
        if (currentRawBalance >= 50000 && previousRawBalance < 50000) {
          milestones.push(`👑 ${goal.goalName} - Major milestone: ${formatCurrency(50000, currency)} saved!`);
        }
        if (currentRawBalance >= 100000 && previousRawBalance < 100000) {
          milestones.push(`🏅 ${goal.goalName} - Incredible achievement: ${formatCurrency(100000, currency)} saved!`);
        }
      });

      // Rate targets summary for the month
      const rateTargets = {
        emergency: {
          rate: emergencyRate,
          source: emergencyBankSelected ? emergencyFundGoal!.selectedBank.bankName : 'Target rate',
          bankSelected: emergencyBankSelected
        },
        shortTerm: 0.045, // 4.5% for short-term goals
        longTerm: 0.07 // 7% for long-term growth phase
      };

      plans.push({
        month,
        monthName,
        totalAllocation,
        goalBreakdown,
        keyActions,
        milestones,
        rateTargets
      });
    }
    
    return plans;
  }, [state.allocations]);

  const generateExcelTracker = async () => {
    try {
      // Track Excel generation
      if (window.gtag) {
        window.gtag('event', 'generate_lead', {
          value: 0,
          currency: 'USD'
        });
      }

      const planData = {
        goals: state.goals,
        totalValue: state.allocations.reduce((sum, a) => sum + a.goal.amount, 0),
        monthlyBudget: state.budget,
        allocations: state.allocations,
        totalMonths: totalMonthsNeeded,
        monthlyPlan: monthlyPlan,
        currency: currency,
        userProfile: {
          name: state.userProfile.name || 'User',
          country: state.userProfile.location || (currency.code === 'AED' ? 'UAE' : 'GCC'),
          nationality: state.userProfile.nationality || undefined,
          monthlyIncome: state.userProfile.monthlyIncome || undefined
        }
      };

      const { paymentService } = await import('../../services/paymentService');
      const result = await paymentService.generateExcelTracker(planData);
      
      if (result.error) {
        alert(`Error: ${result.error}`);
      } else if (result.url) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `WealthKarma-Financial-Tracker-${new Date().getFullYear()}.xlsx`;
        link.click();
        
        alert('Excel tracker downloaded! Open it to start tracking your financial progress.');
      }
    } catch (error) {
      console.error('Excel generation failed:', error);
      alert('Failed to generate Excel tracker. Please try again.');
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-3 lg:p-4">
      {/* Enhanced Header with Rate Targets */}
      <div className="text-center mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-theme-primary mb-3 lg:mb-4">
          Your Complete Financial Roadmap
        </h1>
        <p className="text-base lg:text-xl text-theme-secondary mb-3 lg:mb-4">
          A detailed {totalMonthsNeeded}-month plan ({Math.round(totalMonthsNeeded / 12)} years) showing exactly what to do each month to achieve your goals
        </p>
      </div>

      {/* Enhanced Monthly Timeline Preview with Rate Targets */}
      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Next 6 Months with Target Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 lg:space-y-6">
            {monthlyPlan.slice(0, 6).map((month, index) => (
              <div key={index} className="border border-theme rounded-lg p-3 lg:p-4 bg-theme-card shadow-theme">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 lg:mb-4 gap-2 sm:gap-0">
                  <h3 className="font-semibold text-base lg:text-lg text-theme-primary">{month.monthName}</h3>
                  <div className="text-lg lg:text-xl font-bold text-emerald-400">
                    {formatCurrency(month.totalAllocation, currency)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Goal Allocations with Target Rates */}
                  <div>
                    <h4 className="font-medium text-theme-secondary mb-2 lg:mb-3 text-sm lg:text-base">Monthly Allocations & Target Rates:</h4>
                    <div className="space-y-2 lg:space-y-3">
                      {month.goalBreakdown.filter(goal => goal.contribution > 0).map((goal, goalIndex) => (
                        <div key={goalIndex} className="bg-theme-tertiary rounded-lg p-2 lg:p-3 border border-theme shadow-theme-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1 sm:gap-0">
                            <span className="font-medium text-xs lg:text-sm text-theme-primary">{goal.goalName}</span>
                            <span className="font-bold text-emerald-400 text-sm lg:text-base">
                              {formatCurrency(goal.contribution, currency)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-theme-section rounded p-2 shadow-theme-sm">
                              <div className="text-theme-secondary">Target Rate:</div>
                              <div className="font-bold text-blue-400 text-sm lg:text-lg">
                                {(goal.targetRate * 100).toFixed(1)}%
                              </div>
                              {goal.bankDetails && (
                                <div className="text-xs text-green-400 mt-1">
                                  ✓ {goal.bankDetails.bankName}
                                </div>
                              )}
                            </div>
                            <div className="bg-theme-section rounded p-2 shadow-theme-sm">
                              <div className="text-theme-secondary">Phase:</div>
                              <div className="font-medium text-theme-primary text-xs lg:text-sm">{goal.currentPhase}</div>
                              <div className="text-xs text-theme-muted">{goal.riskLevel} Risk</div>
                            </div>
                          </div>
                          {goal.bankDetails && (
                            <div className="mt-2 p-2 bg-green-500/20 rounded border border-green-500/30 shadow-theme-sm">
                              <div className="text-xs text-green-600">
                                <strong>{goal.bankDetails.bankName}</strong> - {goal.bankDetails.accountType}
                                <br />Rate: {goal.bankDetails.interestRate}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Actions */}
                  <div>
                    <h4 className="font-medium text-theme-secondary mb-2 lg:mb-3 text-sm lg:text-base">Key Actions:</h4>
                    <ul className="space-y-2">
                      {month.keyActions.slice(0, 4).map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-center gap-2 text-xs lg:text-sm bg-theme-tertiary text-theme-primary rounded p-2 border border-theme shadow-theme-sm">
                          <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-400 flex-shrink-0" />
                          <span>{action.description}</span>
                          {action.amount && (
                            <span className="font-medium">
                              ({formatCurrency(action.amount, currency)})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Status */}
      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center text-lg lg:text-xl">
            <Download className="w-5 h-5 lg:w-6 lg:h-6" />
            Download Your Complete Financial Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="max-w-md w-full">
              {/* Free Excel Tracker */}
              <div className="border-2 border-emerald-500/30 rounded-lg p-4 lg:p-6 bg-emerald-500/10 relative shadow-theme">
                <div className="absolute -top-2 -right-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs">
                  New!
                </div>
                <div className="text-center mb-3 lg:mb-4">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 mx-auto mb-2 lg:mb-3 text-emerald-400 text-xl lg:text-2xl">📊</div>
                  <h3 className="font-semibold text-base lg:text-lg text-theme-primary">Complete Excel Tracker</h3>
                  <div className="text-2xl lg:text-3xl font-bold text-emerald-400">FREE</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-300">Professional Grade</div>
                </div>
                <ul className="text-xs lg:text-sm space-y-2 lg:space-y-3 mb-4 lg:mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-theme-secondary">4 essential worksheets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-theme-secondary">Monthly rate guidance (2.5%-8%+)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-theme-secondary">Investment phase transitions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-theme-secondary">Dynamic progress tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-theme-secondary">Financial calculators</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-theme-secondary">UAE/GCC expat focused</span>
                  </li>
                </ul>
                <Button 
                  onClick={generateExcelTracker}
                  variant="primary"
                  fullWidth
                  size="lg"
                >
                  Download Excel Tracker
                </Button>
                <p className="text-xs text-emerald-600 dark:text-emerald-300 text-center mt-2">
                  No signup required • Instant download
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 shadow-theme-sm">
            <h4 className="font-semibold text-blue-600 dark:text-blue-300 mb-2 text-sm lg:text-base">📧 Want updates and expat financial tips?</h4>
            <p className="text-blue-600 dark:text-blue-200 text-xs lg:text-sm mb-3">
              Get notified when we add new features and receive weekly tips for GCC expats.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="input-dark flex-1 px-3 py-3 lg:py-2 text-base lg:text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <Button variant="secondary" className="w-full sm:w-auto">
                Subscribe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Journey Options */}
      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="border border-theme rounded-lg p-4 lg:p-6 bg-theme-card shadow-theme">
              <h3 className="text-lg lg:text-xl font-semibold mb-3 text-theme-primary">🛠️ Implement Yourself</h3>
              <p className="text-theme-secondary mb-3 lg:mb-4 text-sm lg:text-base">
                Use your Excel tracker and implement your plan independently with the comprehensive guidance provided.
              </p>
              <ul className="space-y-2 mb-3 lg:mb-4">
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Complete monthly roadmap</span>
                </li>
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Investment phase guidance</span>
                </li>
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Bank and platform recommendations</span>
                </li>
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Progress tracking tools</span>
                </li>
              </ul>
              <Button 
                onClick={generateExcelTracker}
                variant="primary"
                fullWidth
                size="lg"
              >
                Download Excel Tracker
              </Button>
            </div>

            <div className="border-2 border-emerald-500/30 rounded-lg p-4 lg:p-6 bg-emerald-500/10 shadow-theme">
              <h3 className="text-lg lg:text-xl font-semibold mb-3 text-theme-primary">
                🤖 Continue with AI Guidance
              </h3>
              <p className="text-emerald-600 mb-3 lg:mb-4 text-sm lg:text-base">
                Get ongoing AI coaching, automatic optimization, and live progress tracking.
              </p>
              <ul className="space-y-2 mb-3 lg:mb-4">
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Live progress tracking dashboard</span>
                </li>
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">AI monthly coaching and optimization</span>
                </li>
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Plan adapts to life changes</span>
                </li>
                <li className="flex items-center gap-2 text-xs lg:text-sm">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400 flex-shrink-0" />
                  <span className="text-theme-secondary">Achievement celebrations</span>
                </li>
              </ul>
              <Button 
                onClick={onNext}
                variant="primary"
                fullWidth
                size="lg"
              >
                Continue to Live Dashboard
              </Button>
              <p className="text-xs text-emerald-500 text-center mt-2">
                30-day free trial • $9.99/month after
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">
        <Button 
          onClick={onBack} 
          variant="outline"
          className="w-full sm:w-auto"
        >
          ← Back
        </Button>
        <Button 
          onClick={onNext} 
          variant="primary"
          className="w-full sm:w-auto"
        >
          Continue to Dashboard →
        </Button>
      </div>
    </div>
  );
};

export default MonthlyRoadmapSection; 