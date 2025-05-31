import React, { useState, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { useCurrency } from '../context/CurrencyContext';
import { 
  Calendar,
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '../utils/calculations';
import { excelService, ExcelData } from '../services/excelService';

interface MonthlyPlanViewProps {
  onExport?: () => void;
  onContinue?: () => void;
}

interface MonthlyPlanData {
  month: Date;
  monthNumber: number;
  monthName: string;
  totalContributions: number;
  goalBreakdown: Array<{
    goalId: string;
    goalName: string;
    monthlyContribution: number;
    cumulativeAmount: number;
    progressPercentage: number;
    isComplete: boolean;
    targetRate: number;
    currentPhase: string;
    riskLevel: string;
    bankDetails?: {
      bankName: string;
      accountType: string;
      interestRate: string;
    };
  }>;
  keyActions: Array<{
    type: 'contribution' | 'setup' | 'review' | 'milestone' | 'optimization';
    description: string;
    amount?: number;
    priority: 'critical' | 'important' | 'optional';
  }>;
  milestones: string[];
  tips: string[];
}

const MonthlyPlanView: React.FC<MonthlyPlanViewProps> = ({ onExport, onContinue }) => {
  const { state } = usePlanner();
  const { currency } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [viewMode, setViewMode] = useState<'timeline' | 'detailed' | 'summary'>('timeline');
  const [filterGoal, setFilterGoal] = useState<string>('all');

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

  // Calculate the total timeline needed based on actual goals
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

  // Generate comprehensive monthly plan data with rate information
  const monthlyPlan = useMemo(() => {
    const startDate = new Date();
    const plans: MonthlyPlanData[] = [];
    
    for (let i = 0; i < totalMonthsNeeded; i++) {
      const month = addMonths(startDate, i);
      const monthName = format(month, 'MMMM yyyy');
      
      let totalContributions = 0;
      const goalBreakdown = state.allocations.map(allocation => {
        const monthlyContribution = allocation.monthlyAllocations[i] || 0;
        let cumulativeAmount = allocation.runningBalances[i] || 0;
        
        // Ensure cumulative amount never decreases
        if (i > 0) {
          const maxPreviousAmount = Math.max(
            ...allocation.runningBalances.slice(0, i).filter(balance => balance > 0)
          );
          if (maxPreviousAmount > 0) {
            cumulativeAmount = Math.max(cumulativeAmount, maxPreviousAmount);
          }
        }
        
        const progressPercentage = Math.min(100, (cumulativeAmount / allocation.goal.amount) * 100);
        const isComplete = progressPercentage >= 100;
        
        totalContributions += monthlyContribution;
        
        // Get rate information for this goal at this time
        const rateInfo = getGoalRateInfo(allocation.goal, i);
        
        return {
          goalId: allocation.goal.id,
          goalName: allocation.goal.name,
          monthlyContribution,
          cumulativeAmount,
          progressPercentage,
          isComplete,
          targetRate: rateInfo.targetRate,
          currentPhase: rateInfo.currentPhase,
          riskLevel: rateInfo.riskLevel,
          bankDetails: rateInfo.bankDetails
        };
      });

      // Generate key actions for this month
      const keyActions: MonthlyPlanData['keyActions'] = [];
      
      if (i === 0) {
        keyActions.push({
          type: 'setup',
          description: 'Open high-yield savings account for emergency fund',
          priority: 'critical'
        });
        keyActions.push({
          type: 'setup', 
          description: 'Set up automatic transfers for all goals',
          priority: 'critical'
        });
      }
      
      if (i === 1) {
        keyActions.push({
          type: 'setup',
          description: 'Research and select investment platforms',
          priority: 'important'
        });
      }

      if (i % 3 === 0 && i > 0) {
        keyActions.push({
          type: 'review',
          description: 'Review progress and adjust allocations if needed',
          priority: 'important'
        });
      }

      if (i % 6 === 0 && i > 0) {
        keyActions.push({
          type: 'optimization',
          description: 'Review investment performance and rebalance portfolio',
          priority: 'important'
        });
      }

      if (i % 12 === 0 && i > 0) {
        keyActions.push({
          type: 'review',
          description: 'Annual financial review and goal adjustment',
          priority: 'critical'
        });
      }
      
      // Add contribution actions
      goalBreakdown.forEach(goal => {
        if (goal.monthlyContribution > 0) {
          keyActions.push({
            type: 'contribution',
            description: `Contribute to ${goal.goalName}`,
            amount: goal.monthlyContribution,
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

      // Generate tips based on month and progress
      const tips: string[] = [];
      if (i === 0) {
        tips.push("💡 Start with emergency fund - it's your financial safety net");
        tips.push("📱 Set up mobile banking alerts for all your goal accounts");
      } else if (i === 3) {
        tips.push("📊 Time to review your first quarter progress");
        tips.push("💰 Consider increasing contributions if you got a bonus");
      } else if (i === 6) {
        tips.push("🏦 Shop around for better savings rates - GCC banks are competitive");
        tips.push("📈 Review your investment portfolio allocation");
      } else if (i === 12) {
        tips.push("🎊 Congratulations on completing your first year!");
        tips.push("📋 Update your goals based on any life changes");
      }

      plans.push({
        month,
        monthNumber: i + 1,
        monthName,
        totalContributions,
        goalBreakdown,
        keyActions,
        milestones,
        tips
      });
    }
    
    return plans;
  }, [state.allocations]);

  const filteredPlan = useMemo(() => {
    if (filterGoal === 'all') return monthlyPlan;
    return monthlyPlan.map(month => ({
      ...month,
      goalBreakdown: month.goalBreakdown.filter(goal => goal.goalId === filterGoal)
    }));
  }, [monthlyPlan, filterGoal]);

  const selectedMonthData = filteredPlan[selectedMonth];

  const handlePrevMonth = () => {
    setSelectedMonth(Math.max(0, selectedMonth - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(Math.min(totalMonthsNeeded - 1, selectedMonth + 1));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-500/10 text-theme-error';
      case 'important': return 'border-yellow-500 bg-yellow-500/10 text-theme-warning';
      case 'optional': return 'border-green-500 bg-green-500/10 text-theme-success';
      default: return 'border-theme bg-theme-section text-theme-secondary';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'contribution': return <DollarSign className="w-4 h-4" />;
      case 'setup': return <AlertCircle className="w-4 h-4" />;
      case 'review': return <Clock className="w-4 h-4" />;
      case 'milestone': return <Target className="w-4 h-4" />;
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Excel export function
  const handleExcelExport = async () => {
    try {
      // Prepare the data in the format expected by ExcelService
      const excelData: ExcelData = {
        goals: state.goals,
        totalValue: state.goals.reduce((sum, goal) => sum + goal.amount, 0),
        monthlyBudget: state.budget,
        allocations: state.allocations,
        totalMonths: totalMonthsNeeded,
        monthlyPlan: monthlyPlan.map(month => ({
          month: month.month,
          monthNumber: month.monthNumber,
          monthName: month.monthName,
          totalContributions: month.totalContributions,
          goalBreakdown: month.goalBreakdown,
          keyActions: month.keyActions,
          milestones: month.milestones,
          tips: month.tips
        })),
        currency: currency,
        userProfile: {
          name: state.userProfile.name,
          country: state.userProfile.location,
          nationality: state.userProfile.nationality,
          monthlyIncome: state.userProfile.monthlyIncome
        }
      };

      // Generate the Excel file
      const blob = await excelService.generateExcelTracker(excelData);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WealthKarma-Financial-Plan-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      // Show success message
      alert('Excel tracker downloaded successfully! Check your Downloads folder.');
      
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to export Excel tracker. Please try again.');
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-h1-sm text-theme-primary mb-4">
          Your Monthly Money Plan
        </h1>
        <p className="text-xl text-theme-secondary mb-6">
          Track your progress month by month towards achieving all your financial goals
        </p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-theme-secondary">View:</span>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as any)}
              className="input-dark border border-theme rounded-lg px-3 py-1 text-sm"
            >
              <option value="timeline">Timeline</option>
              <option value="detailed">Detailed</option>
              <option value="summary">Summary</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted" />
            <select 
              value={filterGoal} 
              onChange={(e) => setFilterGoal(e.target.value)}
              className="input-dark border border-theme rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">All Goals</option>
              {state.goals.map(goal => (
                <option key={goal.id} value={goal.id}>{goal.name}</option>
              ))}
            </select>
          </div>

          {(onExport || true) && (
            <Button onClick={handleExcelExport} variant="outline" className="ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Export Plan
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'timeline' && (
        <>
          {/* Month Navigation */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  onClick={handlePrevMonth} 
                  disabled={selectedMonth === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="text-center">
                  <h2 className="heading-h3-sm text-theme-primary">
                    {selectedMonthData?.monthName}
                  </h2>
                  <p className="text-sm text-theme-muted">
                    Month {selectedMonthData?.monthNumber} of {totalMonthsNeeded}
                  </p>
                </div>
                
                <Button 
                  onClick={handleNextMonth} 
                  disabled={selectedMonth === totalMonthsNeeded - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-theme-tertiary rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((selectedMonth + 1) / totalMonthsNeeded) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-theme-muted mt-1">
                <span>Start</span>
                <span>{((selectedMonth + 1) / totalMonthsNeeded * 100).toFixed(1)}% Complete</span>
                <span>{Math.round(totalMonthsNeeded / 12)} Years</span>
              </div>
            </CardContent>
          </Card>

          {selectedMonthData && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Monthly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-theme-secondary">Total Contributions:</span>
                      <span className="heading-stat text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(selectedMonthData.totalContributions, currency)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="heading-h5-sm text-theme-secondary">Goal Breakdown:</h4>
                      {selectedMonthData.goalBreakdown.map((goal, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-theme-primary">{goal.goalName}</h4>
                              <span className="text-sm text-theme-muted">
                                {goal.progressPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-theme-tertiary rounded-full h-2 mt-1">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full" 
                                style={{ width: `${goal.progressPercentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-theme-muted mt-1">
                              <span>{formatCurrency(goal.monthlyContribution, currency)}/month</span>
                              <span>{formatCurrency(goal.cumulativeAmount, currency)} saved</span>
                            </div>
                            <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/30 shadow-theme-sm">
                              {/* Check for rate changes */}
                              {(() => {
                                const prevMonthData = selectedMonth > 0 ? filteredPlan[selectedMonth - 1] : null;
                                const prevGoal = prevMonthData?.goalBreakdown.find(g => g.goalId === goal.goalId);
                                const rateChanged = prevGoal && Math.abs(prevGoal.targetRate - goal.targetRate) > 0.001;
                                
                                return (
                                  <>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-theme-muted">Target Rate:</span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-theme-info">
                                          {(goal.targetRate * 100).toFixed(1)}% APY
                                        </span>
                                        {rateChanged && (
                                          <span className="text-xs bg-theme-warning text-theme-warning-muted px-1 rounded">
                            NEW
                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-theme-muted mt-1">
                                      Phase: {goal.currentPhase} • Risk: {goal.riskLevel}
                                    </div>
                                    {rateChanged && prevGoal && (
                                      <div className="text-xs text-theme-brand-primary mt-1">
                                        Previous: {(prevGoal.targetRate * 100).toFixed(1)}% ({prevGoal.currentPhase})
                                      </div>
                                    )}
                                    {goal.bankDetails && (
                                      <div className="text-xs text-theme-success mt-1">
                                        ✓ {goal.bankDetails.bankName}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Actions This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedMonthData.keyActions.map((action, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border rounded-lg ${getPriorityColor(action.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getActionIcon(action.type)}
                          <div className="flex-1">
                            <p className="font-medium">{action.description}</p>
                            {action.amount && (
                              <p className="text-sm mt-1">
                                Amount: {formatCurrency(action.amount, currency)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-theme-section text-theme-muted rounded capitalize">
                            {action.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Milestones & Tips */}
              {(selectedMonthData.milestones.length > 0 || selectedMonthData.tips.length > 0) && (
                <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                  {selectedMonthData.milestones.length > 0 && (
                    <Card className="bg-theme-warning/10 border-theme-warning/30 shadow-theme">
                      <CardHeader>
                        <CardTitle className="text-theme-warning">
                          🎉 Milestones This Month
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedMonthData.milestones.map((milestone, index) => (
                            <li key={index} className="text-theme-warning-muted">
                              {milestone}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {selectedMonthData.tips.length > 0 && (
                    <Card className="bg-theme-info/10 border-theme-info/30 shadow-theme">
                      <CardHeader>
                        <CardTitle className="text-theme-info">
                          💡 Tips & Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {selectedMonthData.tips.map((tip, index) => (
                            <li key={index} className="text-theme-info-muted">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {viewMode === 'detailed' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{selectedMonthData.monthName} - Detailed View</span>
              <div className="flex gap-2">
                <Button 
                  onClick={handlePrevMonth} 
                  disabled={selectedMonth === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleNextMonth} 
                  disabled={selectedMonth >= filteredPlan.length - 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Enhanced Goal Contributions */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Goal Contributions & Target Rates
                </h3>
                <div className="space-y-4">
                  {selectedMonthData.goalBreakdown.filter(goal => goal.monthlyContribution > 0).map((goal, index) => (
                    <div key={index} className="bg-theme-card rounded-lg p-4 shadow-theme border border-theme">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-theme-primary">{goal.goalName}</h4>
                          <div className="text-sm text-theme-secondary">
                            Phase: {goal.currentPhase} • Risk: {goal.riskLevel}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">
                            {formatCurrency(goal.monthlyContribution, currency)}
                          </div>
                          <div className="text-sm text-theme-secondary">this month</div>
                        </div>
                      </div>
                      
                      {/* Rate Information */}
                      <div className="bg-theme-section rounded p-3 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-theme-secondary">Target Rate:</span>
                          <span className="font-bold text-theme-info text-lg">
                            {(goal.targetRate * 100).toFixed(1)}% APY
                          </span>
                        </div>
                        {goal.bankDetails && (
                          <div className="mt-2 text-xs text-theme-success bg-theme-success/10 rounded p-2">
                            <strong>Selected:</strong> {goal.bankDetails.bankName} - {goal.bankDetails.accountType}
                            <br />
                            <strong>Rate:</strong> {goal.bankDetails.interestRate}
                          </div>
                        )}
                      </div>
                      
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-theme-secondary">Progress</span>
                          <span className="text-theme-secondary">{goal.progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-theme-section rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-theme-muted">
                          <span>Current: {formatCurrency(goal.cumulativeAmount, currency)}</span>
                          <span>Target: {formatCurrency(state.allocations.find(a => a.goal.id === goal.goalId)?.goal.amount || 0, currency)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Actions This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedMonthData.keyActions.map((action, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border rounded-lg ${getPriorityColor(action.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getActionIcon(action.type)}
                          <div className="flex-1">
                            <p className="font-medium">{action.description}</p>
                            {action.amount && (
                              <p className="text-sm mt-1">
                                Amount: {formatCurrency(action.amount, currency)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-theme-section text-theme-muted rounded capitalize">
                            {action.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Milestones & Tips */}
            {(selectedMonthData.milestones.length > 0 || selectedMonthData.tips.length > 0) && (
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                {selectedMonthData.milestones.length > 0 && (
                  <Card className="bg-theme-warning/10 border-theme-warning/30 shadow-theme">
                    <CardHeader>
                      <CardTitle className="text-theme-warning">
                        🎉 Milestones This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedMonthData.milestones.map((milestone, index) => (
                          <li key={index} className="text-theme-warning-muted">
                            {milestone}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {selectedMonthData.tips.length > 0 && (
                  <Card className="bg-theme-info/10 border-theme-info/30 shadow-theme">
                    <CardHeader>
                      <CardTitle className="text-theme-info">
                        💡 Tips & Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedMonthData.tips.map((tip, index) => (
                          <li key={index} className="text-theme-info-muted">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle>{Math.round(totalMonthsNeeded / 12)}-Year Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="heading-stat-lg text-emerald-600 mb-2">
                  {formatCurrency(monthlyPlan.reduce((sum, month) => sum + month.totalContributions, 0), currency)}
                </div>
                <div className="text-theme-secondary">Total Contributions</div>
              </div>
              <div className="text-center">
                <div className="heading-stat-lg text-emerald-600 mb-2">
                  {state.goals.length}
                </div>
                <div className="text-theme-secondary">Financial Goals</div>
              </div>
              <div className="text-center">
                <div className="heading-stat-lg text-emerald-600 mb-2">
                  {formatCurrency(state.allocations.reduce((sum, a) => sum + a.goal.amount, 0), currency)}
                </div>
                <div className="text-theme-secondary">Total Goal Value</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-theme-primary">Year-by-Year Breakdown:</h3>
              {Array.from({ length: Math.ceil(totalMonthsNeeded / 12) }, (_, index) => index + 1).map(year => {
                const yearMonths = monthlyPlan.slice((year - 1) * 12, year * 12);
                const yearTotal = yearMonths.reduce((sum, month) => sum + month.totalContributions, 0);
                
                // Skip years with no contributions
                if (yearTotal === 0 && year > Math.ceil(totalMonthsNeeded / 12) - 1) return null;
                
                return (
                  <div key={year} className="border border-theme rounded-lg p-4 bg-theme-card shadow-theme-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-theme-primary">Year {year}</span>
                      <span className="text-emerald-600 font-semibold">
                        {formatCurrency(yearTotal, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {onContinue && (
        <div className="mt-8 text-center">
          <Button 
            onClick={onContinue}
            variant="primary"
            size="lg"
          >
            Complete Your Plan & Get Started →
          </Button>
        </div>
      )}
    </div>
  );
};

export default MonthlyPlanView;