import React, { useState, useMemo, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { useCurrency } from '../context/CurrencyContext';
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
  TrendingDown
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';
import { formatCurrency } from '../utils/calculations';
import { format, addMonths, differenceInMonths } from 'date-fns';

interface LiveDashboardProps {
  onOptimizePlan?: () => void;
  onUpdateProgress?: () => void;
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

const LiveDashboard: React.FC<LiveDashboardProps> = ({ onOptimizePlan, onUpdateProgress }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'insights' | 'settings'>('overview');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [actualProgress, setActualProgress] = useState<ActualProgress[]>(
    state.goals.map(goal => ({
      goalId: goal.id,
      actualAmount: 0,
      lastUpdated: new Date(),
      monthlyActual: 0
    }))
  );

  // Calculate current month progress
  const currentMonth = differenceInMonths(new Date(), new Date()) + 1;
  const maxTimelineMonths = useMemo(() => {
    if (state.allocations.length === 0) return 60;
    return Math.max(...state.allocations.map(allocation => allocation.runningBalances.length));
  }, [state.allocations]);
  
  const currentPlan = useMemo(() => {
    return state.allocations.map(allocation => {
      const plannedAmount = allocation.runningBalances[Math.min(currentMonth - 1, allocation.runningBalances.length - 1)] || 0;
      const progressData = actualProgress.find(p => p.goalId === allocation.goal.id);
      const actualAmount = progressData?.actualAmount || 0;
      const variance = actualAmount - plannedAmount;
      const progressPercentage = (actualAmount / allocation.goal.amount) * 100;
      
      return {
        ...allocation,
        plannedAmount,
        actualAmount,
        variance,
        progressPercentage,
        isOnTrack: variance >= -plannedAmount * 0.1, // Within 10% tolerance
        monthlyTarget: allocation.monthlyAllocations[Math.min(currentMonth - 1, allocation.monthlyAllocations.length - 1)] || 0
      };
    });
  }, [state.allocations, actualProgress, currentMonth]);

  // Generate AI recommendations
  const aiRecommendations = useMemo((): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];
    
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

    recommendations.push({
      type: 'rebalance',
      title: 'Portfolio rebalancing suggested',
      description: 'Your emergency fund is complete. Consider shifting excess to higher-yield investments.',
      impact: 'Potential 2-3% higher returns on excess funds',
      actionRequired: false
    });

    return recommendations;
  }, [currentPlan, currency]);

  const updateActualAmount = (goalId: string, amount: number) => {
    setActualProgress(prev => 
      prev.map(p => 
        p.goalId === goalId 
          ? { ...p, actualAmount: amount, lastUpdated: new Date() }
          : p
      )
    );
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
    const currentEmergencyFund = state.goals.find(goal => goal.id === 'emergency-fund');
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-h1-sm text-theme-primary mb-4">
          Live Progress Dashboard
        </h1>
        <p className="text-lg text-theme-secondary">
          Track your real progress and get AI-powered optimization recommendations
        </p>
      </div>

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
                <p className="text-sm font-medium text-theme-secondary">This Month</p>
                <p className="heading-stat text-theme-primary">Month {currentMonth}</p>
                <p className="text-xs text-theme-muted">of {maxTimelineMonths}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Calendar className="w-6 h-6 text-theme-info" />
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
                <Target className="w-6 h-6 text-theme-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-secondary">AI Recommendations</p>
                <p className="heading-stat text-theme-primary">
                  {aiRecommendations.filter(r => r.actionRequired).length}
                </p>
                <p className="text-xs text-theme-muted">Action required</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-full">
                <Zap className="w-6 h-6 text-theme-brand-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-theme mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'goals', label: 'Goals Progress', icon: Target },
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
                        </label>
                        <div className="relative">
                          <DollarSign className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                          <input
                            type="number"
                            value={goal.actualAmount}
                            onChange={(e) => updateActualAmount(goal.goal.id, parseFloat(e.target.value) || 0)}
                            className="input-dark w-full pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                          This Month's Contribution
                        </label>
                        <div className="relative">
                          <PlusCircle className="w-5 h-5 text-theme-muted absolute left-3 top-3" />
                          <input
                            type="number"
                            value={actualProgress.find(p => p.goalId === goal.goal.id)?.monthlyActual || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setActualProgress(prev => 
                                prev.map(p => 
                                  p.goalId === goal.goal.id 
                                    ? { ...p, monthlyActual: value }
                                    : p
                                )
                              );
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

                <Button className="w-full" variant="primary" onClick={onUpdateProgress}>
                  Update Progress
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
                {state.goals.filter(g => g.id !== 'emergency-fund').map((goal) => (
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