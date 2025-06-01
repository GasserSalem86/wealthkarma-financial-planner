import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Goal, GoalCategory, PaymentFrequency, GOAL_CATEGORIES, PAYMENT_FREQUENCIES } from '../../types/plannerTypes';
import { calculateRequiredPMT, monthDiff, getRecommendedProfile } from '../../utils/calculations';
import { formatCurrency } from '../../utils/calculations';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Calendar, DollarSign, Edit, Trash2, GraduationCap, Plane, Gift, Home, Target } from 'lucide-react';
import AIGuidance from '../AIGuidance';
import { UserContext } from '../../services/aiService';

interface GoalsSectionProps {
  onNext: () => void;
  onBack: () => void;
}

const getCategoryIcon = (category: GoalCategory) => {
  switch (category) {
    case 'Education':
      return <GraduationCap className="w-4 h-4" />;
    case 'Travel':
      return <Plane className="w-4 h-4" />;
    case 'Gift':
      return <Gift className="w-4 h-4" />;
    case 'Home':
      return <Home className="w-4 h-4" />;
    case 'Retirement':
      return <Target className="w-4 h-4" />;
  }
};

const GoalsSection: React.FC<GoalsSectionProps> = ({ onNext, onBack }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('Education');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('Once');
  const [paymentPeriod, setPaymentPeriod] = useState<number>(4);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  const [editMode, setEditMode] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 41 }, (_, i) => currentYear + i);

  const displayGoals = state.goals.filter((goal) => goal.id !== 'emergency-fund' && goal.category !== 'Retirement');

  const shouldShowPaymentOptions = (category: GoalCategory) => {
    return category === 'Education' || category === 'Home';
  };

  const handleAddGoal = () => {
    if (goalName && goalAmount > 0) {
      const targetDate = new Date(targetYear, targetMonth - 1);
      const today = new Date();
      const horizonMonths = monthDiff(today, targetDate);
      
      // Debug logging for date validation issues
      console.log('Date validation debug:', {
        targetMonth,
        targetYear,
        targetDate: targetDate.toISOString(),
        today: today.toISOString(),
        horizonMonths,
        isFuture: horizonMonths > 0
      });
      
      if (horizonMonths <= 0) {
        alert(`Target date must be in the future. You selected ${targetDate.toLocaleDateString()}, but today is ${today.toLocaleDateString()}. Please choose a later date.`);
        return;
      }
      
      const profile = getRecommendedProfile(horizonMonths);
      
      let rHigh = 0.04;
      let rMid = 0.03;
      let rLow = 0.02;

      switch (profile) {
        case 'Conservative':
          rHigh = 0.04;
          rMid = 0.03;
          rLow = 0.02;
          break;
        case 'Balanced':
          rHigh = 0.06;
          rMid = 0.05;
          rLow = 0.03;
          break;
        case 'Growth':
          rHigh = 0.08;
          rMid = 0.07;
          rLow = 0.05;
          break;
      }
      
      let returnPhases = [];
      const years = horizonMonths / 12;
      
      if (years <= 3) {
        returnPhases = [{ length: horizonMonths, rate: rLow }];
      } else if (years <= 7) {
        const mid = 24;
        returnPhases = [
          { length: horizonMonths - mid, rate: rHigh },
          { length: mid, rate: rLow },
        ];
      } else {
        const high = Math.floor(horizonMonths * 0.72);
        const mid = Math.floor(horizonMonths * 0.16);
        const low = horizonMonths - high - mid;
        returnPhases = [
          { length: high, rate: rHigh },
          { length: mid, rate: rMid },
          { length: low, rate: rLow },
        ];
      }
      
      const newGoal: Goal = {
        id: editMode && editingGoalId ? editingGoalId : `goal-${Date.now()}`,
        name: goalName,
        category: goalCategory,
        targetDate,
        amount: goalAmount,
        horizonMonths,
        profile,
        returnPhases,
        requiredPMT: calculateRequiredPMT(
          goalAmount,
          returnPhases,
          horizonMonths,
          shouldShowPaymentOptions(goalCategory) && paymentFrequency !== 'Once' ? paymentFrequency : undefined,
          shouldShowPaymentOptions(goalCategory) && paymentFrequency !== 'Once' ? paymentPeriod : undefined
        ),
        paymentFrequency: shouldShowPaymentOptions(goalCategory) ? paymentFrequency : undefined,
        paymentPeriod: shouldShowPaymentOptions(goalCategory) && paymentFrequency !== 'Once' ? paymentPeriod : undefined,
      };
      
      if (editMode && editingGoalId) {
        dispatch({ type: 'UPDATE_GOAL', payload: newGoal });
      } else {
        dispatch({ type: 'ADD_GOAL', payload: newGoal });
      }
      
      setGoalName('');
      setGoalAmount(0);
      setGoalCategory('Education');
      setPaymentFrequency('Once');
      setPaymentPeriod(4);
      setTargetMonth(new Date().getMonth() + 1);
      setTargetYear(new Date().getFullYear() + 1);
      setEditMode(false);
      setEditingGoalId(null);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalName(goal.name);
    setGoalAmount(goal.amount);
    setGoalCategory(goal.category);
    setPaymentFrequency(goal.paymentFrequency || 'Once');
    setPaymentPeriod(goal.paymentPeriod || 4);
    setTargetMonth(goal.targetDate.getMonth() + 1);
    setTargetYear(goal.targetDate.getFullYear());
    setEditMode(true);
    setEditingGoalId(goal.id);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      dispatch({ type: 'DELETE_GOAL', payload: id });
    }
  };

  const handleCancelEdit = () => {
    setGoalName('');
    setGoalAmount(0);
    setGoalCategory('Education');
    setPaymentFrequency('Once');
    setPaymentPeriod(4);
    setTargetMonth(new Date().getMonth() + 1);
    setTargetYear(new Date().getFullYear() + 1);
    setEditMode(false);
    setEditingGoalId(null);
  };

  const handleCategorySelect = (category: GoalCategory) => {
    setGoalCategory(category);
  };

  // AI form filling function
  const handleGoalFormFill = (formData: {
    goalName?: string;
    goalAmount?: number;
    goalCategory?: GoalCategory;
    targetMonth?: number;
    targetYear?: number;
    paymentFrequency?: PaymentFrequency;
    paymentPeriod?: number;
  }) => {
    console.log('AI form filling with data:', formData);
    
    if (formData.goalName !== undefined) setGoalName(formData.goalName);
    if (formData.goalAmount !== undefined) setGoalAmount(formData.goalAmount);
    if (formData.goalCategory !== undefined) setGoalCategory(formData.goalCategory);
    
    // Validate date before setting it
    if (formData.targetMonth !== undefined && formData.targetYear !== undefined) {
      const proposedDate = new Date(formData.targetYear, formData.targetMonth - 1);
      const today = new Date();
      const proposedHorizonMonths = monthDiff(today, proposedDate);
      
      console.log('AI date validation:', {
        proposedMonth: formData.targetMonth,
        proposedYear: formData.targetYear,
        proposedDate: proposedDate.toISOString(),
        today: today.toISOString(),
        proposedHorizonMonths,
        isFuture: proposedHorizonMonths > 0
      });
      
      if (proposedHorizonMonths > 0) {
        setTargetMonth(formData.targetMonth);
        setTargetYear(formData.targetYear);
      } else {
        console.warn('AI provided invalid future date, using safe fallback');
        // Use safe fallback - 6 months from now
        const safeDate = new Date();
        safeDate.setMonth(safeDate.getMonth() + 6);
        setTargetMonth(safeDate.getMonth() + 1);
        setTargetYear(safeDate.getFullYear());
      }
    }
    
    if (formData.paymentFrequency !== undefined) setPaymentFrequency(formData.paymentFrequency);
    if (formData.paymentPeriod !== undefined) setPaymentPeriod(formData.paymentPeriod);
  };

  // Create AI context with goals information
  const createAIContext = (): UserContext => {
    return {
      name: state.userProfile.name,
      nationality: state.userProfile.nationality,
      location: state.userProfile.location,
      monthlyIncome: state.userProfile.monthlyIncome,
      monthlyExpenses: state.monthlyExpenses,
      currency: currency.code,
      currentStep: 'financial-goals',
      goals: state.goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        category: goal.category,
        amount: goal.amount,
        targetDate: goal.targetDate,
        horizonMonths: goal.horizonMonths,
        profile: goal.profile,
        requiredPMT: goal.requiredPMT,
        paymentFrequency: goal.paymentFrequency,
        paymentPeriod: goal.paymentPeriod
      })),
      currentFormData: {
        goalName,
        goalAmount,
        goalCategory,
        targetMonth,
        targetYear,
        paymentFrequency,
        paymentPeriod,
        isEditMode: editMode,
        editingGoalId: editingGoalId || undefined
      }
    };
  };

  // Filter out retirement category for this section
  const availableCategories = GOAL_CATEGORIES.filter(cat => cat !== 'Retirement');

  return (
    <div className="container mx-auto max-w-3xl px-4 lg:px-0">
      <div className="text-center mb-6 lg:mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-theme-primary mb-3 lg:mb-4">Your Life Dreams</h2>
        <p className="text-sm lg:text-base text-theme-secondary mb-4 lg:mb-6">
          Set your personal and lifestyle goals - from education and travel to buying a home. 
          We'll handle retirement planning separately in the next step.
        </p>
      </div>

      <Card className="mb-6 lg:mb-8">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">{editMode ? 'Edit Goal' : 'Add New Goal'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-2">
                Goal Type
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`flex items-center justify-center space-x-1 lg:space-x-2 p-2 lg:p-3 rounded-lg border transition-colors shadow-theme-sm hover:shadow-theme ${
                      goalCategory === category
                        ? 'bg-blue-600 border-blue-500 text-white shadow-theme-lg'
                        : 'border-theme text-theme-secondary hover:border-theme-hover hover:bg-theme-tertiary'
                    }`}
                  >
                    {getCategoryIcon(category)}
                    <span className="text-xs lg:text-sm">{category}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="goal-name" className="block text-sm font-medium text-theme-secondary mb-1">
                Goal Name
              </label>
              <input
                id="goal-name"
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={`e.g., ${
                  goalCategory === 'Education' ? "Master's Degree" :
                  goalCategory === 'Travel' ? 'Europe Trip' :
                  goalCategory === 'Gift' ? 'Wedding Gift' :
                  goalCategory === 'Home' ? 'Down Payment' :
                  'Retirement Fund'
                }`}
                className="input-dark block w-full px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="goal-amount" className="block text-sm font-medium text-theme-secondary mb-1">
                Target Amount ({currency.code})
              </label>
              <div className="relative">
                <input
                  id="goal-amount"
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(Number(e.target.value))}
                  className="input-dark block w-full pr-16 pl-3 lg:pl-4 py-3 lg:py-2 text-base lg:text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-muted text-sm">
                  {currency.code}
                </span>
              </div>
            </div>

            {shouldShowPaymentOptions(goalCategory) && (
              <>
                <div>
                  <label htmlFor="payment-frequency" className="block text-sm font-medium text-theme-secondary mb-1">
                    Payment Frequency
                  </label>
                  <select
                    id="payment-frequency"
                    value={paymentFrequency}
                    onChange={(e) => {
                      const newFrequency = e.target.value as PaymentFrequency;
                      setPaymentFrequency(newFrequency);
                      if (newFrequency === 'Once') {
                        setPaymentPeriod(4);
                      }
                    }}
                    className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {PAYMENT_FREQUENCIES.map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {frequency}
                      </option>
                    ))}
                  </select>
                </div>

                {paymentFrequency !== 'Once' && (
                  <div>
                    <label htmlFor="payment-period" className="block text-sm font-medium text-theme-secondary mb-1">
                      Payment Period
                    </label>
                    <input
                      id="payment-period"
                      type="number"
                      min="1"
                      max="30"
                      value={paymentPeriod}
                      onChange={(e) => setPaymentPeriod(Number(e.target.value))}
                      className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="mt-1 text-xs lg:text-sm text-theme-muted">
                      {goalCategory === 'Education' 
                        ? 'Number of years over which payments will be spread after the target date'
                        : 'Duration of mortgage or payment plan'}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label htmlFor="target-month" className="block text-sm font-medium text-theme-secondary mb-1">
                  Target Month
                </label>
                <select
                  id="target-month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(Number(e.target.value))}
                  className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {monthOptions.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="target-year" className="block text-sm font-medium text-theme-secondary mb-1">
                  Target Year
                </label>
                <select
                  id="target-year"
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full">
            {editMode ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button fullWidth onClick={handleAddGoal} disabled={!goalName || goalAmount <= 0}>
                  Update Goal
                </Button>
              </>
            ) : (
              <Button fullWidth onClick={handleAddGoal} disabled={!goalName || goalAmount <= 0}>
                Add Goal
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {displayGoals.length > 0 ? (
        <Card className="mb-6 lg:mb-8">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">Your Goals</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-theme">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider whitespace-nowrap">
                      Goal
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider whitespace-nowrap">
                      Amount
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider whitespace-nowrap">
                      Target Date
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-theme-secondary uppercase tracking-wider whitespace-nowrap">
                      Payment Details
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-right text-xs font-medium text-theme-secondary uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-theme-card divide-y divide-theme">
                  {displayGoals
                    .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
                    .map((goal) => (
                      <tr key={goal.id} className="hover:bg-theme-tertiary transition-colors">
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 mr-2 text-theme-secondary">
                              {getCategoryIcon(goal.category)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-theme-primary">{goal.name}</div>
                              <div className="text-xs text-theme-muted">{goal.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">
                          <div className="text-sm text-theme-primary font-medium">{formatCurrency(goal.amount, currency)}</div>
                        </td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">
                          <div className="text-sm text-theme-primary">
                            {monthOptions[goal.targetDate.getMonth()]} {goal.targetDate.getFullYear()}
                          </div>
                          <div className="text-xs text-theme-muted">
                            {Math.round(goal.horizonMonths / 12)} years {goal.horizonMonths % 12} months
                          </div>
                        </td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">
                          {shouldShowPaymentOptions(goal.category) ? (
                            <div>
                              <div className="text-sm text-theme-primary">{goal.paymentFrequency}</div>
                              {goal.paymentPeriod && (
                                <div className="text-xs text-theme-muted">
                                  Over {goal.paymentPeriod} years
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-theme-muted">-</div>
                          )}
                        </td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="text-blue-600 hover:text-blue-500 mr-4 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-red-600 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      ) : (
        <div className="text-center text-theme-secondary p-8 bg-theme-card rounded-lg mb-8 shadow-theme">
          <p>You haven't added any financial goals yet. Start by adding your first goal above.</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="primary" onClick={onNext}>
          Next
        </Button>
      </div>

      {/* AI Guidance Component - Only show if user profile is complete */}
      {state.userProfile.name && state.userProfile.nationality && state.userProfile.location && (
        <AIGuidance 
          step="financial-goals" 
          context={createAIContext()}
          onGoalFormFill={handleGoalFormFill}
          componentId="goals-section"
        />
      )}
    </div>
  );
};

export default GoalsSection;