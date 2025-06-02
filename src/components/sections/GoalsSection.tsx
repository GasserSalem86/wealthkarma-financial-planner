import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Goal, GoalCategory, PaymentFrequency, GOAL_CATEGORIES, PAYMENT_FREQUENCIES } from '../../types/plannerTypes';
import { calculateRequiredPMT, monthDiff, getRecommendedProfile } from '../../utils/calculations';
import { formatCurrency } from '../../utils/calculations';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Calendar, DollarSign, Edit, Trash2, GraduationCap, Plane, Gift, Home, Target, Plus, HelpCircle } from 'lucide-react';
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
    case 'Other':
      return <HelpCircle className="w-4 h-4" />;
  }
};

const GoalsSection: React.FC<GoalsSectionProps> = ({ onNext, onBack }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  
  // Main flow state
  const [currentStep, setCurrentStep] = useState<'intro' | 'category' | 'when' | 'amount' | 'payment' | 'review'>('intro');
  const [showAddAnother, setShowAddAnother] = useState(false);
  
  // Goal creation state
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('Education');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('Once');
  const [paymentPeriod, setPaymentPeriod] = useState<number>(4);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  
  // Edit mode state
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

  // Reset form
  const resetForm = () => {
    setGoalName('');
    setGoalAmount(0);
    setGoalCategory('Education');
    setCustomCategoryName('');
    setPaymentFrequency('Once');
    setPaymentPeriod(4);
    setTargetMonth(new Date().getMonth() + 1);
    setTargetYear(new Date().getFullYear() + 1);
    setEditMode(false);
    setEditingGoalId(null);
    setCurrentStep('category');
  };

  // Handle goal creation/update
  const handleSaveGoal = () => {
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
        name: goalCategory === 'Other' ? customCategoryName || goalName : goalName,
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
        setEditMode(false);
        setEditingGoalId(null);
        setCurrentStep('intro');
      } else {
        dispatch({ type: 'ADD_GOAL', payload: newGoal });
        setShowAddAnother(true);
      }
      
      resetForm();
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalName(goal.name);
    setGoalAmount(goal.amount);
    setGoalCategory(goal.category);
    if (goal.category === 'Other') {
      setCustomCategoryName(goal.name);
    }
    setPaymentFrequency(goal.paymentFrequency || 'Once');
    setPaymentPeriod(goal.paymentPeriod || 4);
    setTargetMonth(goal.targetDate.getMonth() + 1);
    setTargetYear(goal.targetDate.getFullYear());
    setEditMode(true);
    setEditingGoalId(goal.id);
    setCurrentStep('category');
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      dispatch({ type: 'DELETE_GOAL', payload: id });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
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

  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6 lg:space-y-8">
            {/* Congratulations Section */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-xl lg:text-2xl font-bold text-green-600">
                    Congratulations! Your Safety Net is Ready!
                  </h3>
                  <p className="text-sm lg:text-base text-theme-secondary max-w-2xl mx-auto">
                    You've taken the most important step in financial planning by securing your emergency fund. 
                    Now you're financially protected against unexpected events, giving you the confidence to pursue your dreams!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold text-theme-primary">Your Financial Journey</h3>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Emergency Fund</span>
                    </div>
                    <div className="w-8 h-1 bg-green-500"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <span className="text-sm text-blue-600 font-medium">Your Goals</span>
                    </div>
                    <div className="w-8 h-1 bg-theme-muted"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-theme-muted rounded-full flex items-center justify-center">
                        <span className="text-theme-secondary text-sm font-bold">3</span>
                      </div>
                      <span className="text-sm text-theme-secondary">Retirement Plan</span>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 max-w-lg mx-auto">
                    <p className="text-sm text-blue-600 font-medium">
                      🚀 You're building momentum! Let's turn your dreams into achievable financial goals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Introduction */}
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 text-xl lg:text-2xl">
                  <Target className="w-6 h-6" />
                  Now Let's Plan Your Life Dreams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-theme-secondary">
                  <p className="text-sm lg:text-base leading-relaxed">
                    With your safety net secured, you're ready to plan for the exciting things in life! 
                    Whether it's advancing your education, exploring the world, buying a home, or any other personal goal - 
                    we'll help you create a clear, realistic plan to make it happen.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-theme-section p-4 rounded-lg border border-purple-500/30">
                      <h4 className="font-semibold text-purple-600 mb-2">✨ What We'll Plan Together</h4>
                      <ul className="text-xs space-y-1">
                        <li>🎓 Education & skill development</li>
                        <li>✈️ Travel & unforgettable experiences</li>
                        <li>🏠 Home purchases & improvements</li>
                        <li>🎁 Special gifts & celebrations</li>
                        <li>💫 Any other dreams you want to achieve</li>
                      </ul>
                    </div>
                    <div className="bg-theme-section p-4 rounded-lg border border-blue-500/30">
                      <h4 className="font-semibold text-blue-600 mb-2">🎯 How We'll Make It Happen</h4>
                      <ul className="text-xs space-y-1">
                        <li>🤖 AI-powered realistic cost estimation</li>
                        <li>📈 Smart inflation-adjusted planning</li>
                        <li>📅 Flexible payment schedules</li>
                        <li>⏰ Achievable timeline setting</li>
                        <li>💰 Clear monthly savings breakdown</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-theme-primary">
                      🌟 <strong>You're already ahead of 80% of people</strong> by having an emergency fund! 
                      Now let's channel that financial discipline into making your dreams reality.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => setCurrentStep('category')} fullWidth className="bg-purple-600 hover:bg-purple-700 text-lg py-4">
                  🚀 Let's Start Planning My Dreams!
                </Button>
              </CardFooter>
            </Card>

            {/* Existing Goals Display */}
            {displayGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Current Goals</span>
                    <Button onClick={() => setCurrentStep('category')} className="text-sm px-4 py-2">
                      <Plus className="w-4 h-4 mr-1" />
                      Add New Goal
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayGoals
                      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime())
                      .map((goal) => (
                        <div key={goal.id} className="flex items-center justify-between p-4 bg-theme-section rounded-lg border border-theme">
                          <div className="flex items-center space-x-3">
                            <div className="text-theme-secondary">
                              {getCategoryIcon(goal.category)}
                            </div>
                            <div>
                              <h4 className="font-medium text-theme-primary">{goal.name}</h4>
                              <p className="text-sm text-theme-secondary">
                                {formatCurrency(goal.amount, currency)} • {monthOptions[goal.targetDate.getMonth()]} {goal.targetDate.getFullYear()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" onClick={() => handleEditGoal(goal)} className="text-xs px-3 py-1">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" onClick={() => handleDeleteGoal(goal.id)} className="text-xs px-3 py-1 text-red-600 hover:text-red-700">
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'category':
        return (
          <div className="space-y-6">
            <Card className="border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                  What Goal Would You Like to Plan For?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-theme-secondary mb-6">
                  Select the type of goal you want to save for. Each category helps us provide more specific guidance and recommendations.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setGoalCategory(category);
                        setCurrentStep('when');
                      }}
                      className={`p-4 rounded-lg border transition-all hover:shadow-lg ${
                        goalCategory === category
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                          : 'border-theme text-theme-secondary hover:border-blue-500/50 hover:bg-blue-500/5'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`text-2xl ${goalCategory === category ? 'text-white' : 'text-blue-600'}`}>
                          {getCategoryIcon(category)}
                        </div>
                        <h3 className="font-semibold text-base">{category}</h3>
                        <p className={`text-xs text-center ${goalCategory === category ? 'text-blue-100' : 'text-theme-muted'}`}>
                          {category === 'Education' && 'University, courses, certifications'}
                          {category === 'Travel' && 'Vacations, adventures, experiences'}
                          {category === 'Gift' && 'Weddings, celebrations, special occasions'}
                          {category === 'Home' && 'Down payment, renovations, property'}
                          {category === 'Other' && 'Custom goal - you define it!'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {goalCategory === 'Other' && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-600 mb-2">📝 Tell us about your custom goal</h4>
                      <p className="text-sm text-theme-secondary mb-3">
                        Describe what you're saving for. This will be the name of your goal.
                      </p>
                      <input
                        type="text"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="e.g., Start a business, Buy a car, Medical treatment..."
                        className="input-dark block w-full px-4 py-3 text-sm rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <Button 
                      onClick={() => setCurrentStep('when')} 
                      disabled={!customCategoryName.trim()}
                      className="w-full"
                    >
                      Continue with "{customCategoryName || 'Custom Goal'}"
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => setCurrentStep('intro')} className="w-full">
                  ← Back to Overview
                </Button>
              </CardFooter>
            </Card>
          </div>
        );

      case 'when':
        return (
          <div className="space-y-6">
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</span>
                  When Do You Need This Goal?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-theme-secondary mb-6">
                  Select the target month and year when you'll need this goal. This helps us calculate how much time you have to save.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Month Selection */}
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-3">Target Month</label>
                    <div className="grid grid-cols-3 gap-2">
                      {monthOptions.map((month, index) => (
                        <button
                          key={month}
                          onClick={() => setTargetMonth(index + 1)}
                          className={`p-3 rounded-lg border text-xs transition-all hover:shadow-md ${
                            targetMonth === index + 1
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                              : 'border-theme text-theme-secondary hover:border-purple-500/50 hover:bg-purple-500/5'
                          }`}
                        >
                          {month.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year Selection */}
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-3">Target Year</label>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {yearOptions.slice(0, 15).map((year) => (
                        <button
                          key={year}
                          onClick={() => setTargetYear(year)}
                          className={`p-3 rounded-lg border text-sm transition-all hover:shadow-md ${
                            targetYear === year
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                              : 'border-theme text-theme-secondary hover:border-purple-500/50 hover:bg-purple-500/5'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Date Display */}
                {targetMonth && targetYear && (
                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                    <p className="text-sm text-purple-600 font-medium">
                      🎯 Target Date: <strong>{monthOptions[targetMonth - 1]} {targetYear}</strong>
                    </p>
                    <p className="text-xs text-theme-muted mt-1">
                      You have approximately {Math.round(monthDiff(new Date(), new Date(targetYear, targetMonth - 1)) / 12)} years to save for this goal
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" onClick={() => setCurrentStep('category')} className="flex-1">
                    ← Back to Goal Type
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('amount')} 
                    disabled={!targetMonth || !targetYear}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Continue to Amount →
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      case 'amount':
        return (
          <div className="space-y-6">
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</span>
                  How Much Will This Goal Cost?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Side - Form */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-theme-secondary mb-4">
                        Enter the estimated cost for your goal. If you're unsure, use our AI assistant to help calculate realistic costs with inflation adjustments!
                      </p>
                      
                      {/* Goal Name Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-theme-secondary mb-2">Goal Name</label>
                        <input
                          type="text"
                          value={goalName}
                          onChange={(e) => setGoalName(e.target.value)}
                          placeholder={`e.g., ${
                            goalCategory === 'Education' ? "Master's Degree in UK" :
                            goalCategory === 'Travel' ? 'Family Europe Trip' :
                            goalCategory === 'Gift' ? "Sister's Wedding Gift" :
                            goalCategory === 'Home' ? 'Dubai Apartment Down Payment' :
                            goalCategory === 'Other' ? customCategoryName || 'Custom Goal' :
                            'My Goal'
                          }`}
                          className="input-dark block w-full px-4 py-3 text-sm rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm font-medium text-theme-secondary mb-2">
                          Estimated Cost ({currency.code})
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={goalAmount || ''}
                            onChange={(e) => setGoalAmount(Number(e.target.value))}
                            placeholder="Enter estimated amount"
                            className="input-dark block w-full pl-4 pr-20 py-3 text-sm rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-muted text-sm">
                            {currency.code}
                          </span>
                        </div>
                      </div>

                      {/* Sample Costs for Reference */}
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <h4 className="font-semibold text-green-600 mb-2">💡 Typical Cost Ranges</h4>
                        <div className="text-xs space-y-1 text-theme-secondary">
                          {goalCategory === 'Education' && (
                            <>
                              <p>• Local Masters: {formatCurrency(15000, currency)} - {formatCurrency(40000, currency)}</p>
                              <p>• International Masters: {formatCurrency(50000, currency)} - {formatCurrency(150000, currency)}</p>
                              <p>• Professional Certification: {formatCurrency(2000, currency)} - {formatCurrency(15000, currency)}</p>
                            </>
                          )}
                          {goalCategory === 'Travel' && (
                            <>
                              <p>• Regional Trip (1 week): {formatCurrency(3000, currency)} - {formatCurrency(8000, currency)}</p>
                              <p>• Europe Trip (2 weeks): {formatCurrency(8000, currency)} - {formatCurrency(20000, currency)}</p>
                              <p>• World Tour (1 month): {formatCurrency(20000, currency)} - {formatCurrency(50000, currency)}</p>
                            </>
                          )}
                          {goalCategory === 'Home' && (
                            <>
                              <p>• Apartment Down Payment: {formatCurrency(50000, currency)} - {formatCurrency(200000, currency)}</p>
                              <p>• Villa Down Payment: {formatCurrency(150000, currency)} - {formatCurrency(500000, currency)}</p>
                              <p>• Home Renovation: {formatCurrency(20000, currency)} - {formatCurrency(100000, currency)}</p>
                            </>
                          )}
                          {goalCategory === 'Gift' && (
                            <>
                              <p>• Wedding Gift: {formatCurrency(5000, currency)} - {formatCurrency(25000, currency)}</p>
                              <p>• Graduation Gift: {formatCurrency(2000, currency)} - {formatCurrency(10000, currency)}</p>
                              <p>• Anniversary Gift: {formatCurrency(1000, currency)} - {formatCurrency(15000, currency)}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - AI Assistant */}
                  <div className="lg:border-l lg:border-theme lg:pl-6">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
                        🤖 AI Cost Calculator
                        <span className="text-xs bg-blue-500/20 px-2 py-1 rounded-full">Recommended</span>
                      </h4>
                      <p className="text-xs text-theme-secondary mb-3">
                        Get personalized cost estimates with inflation adjustments based on your location, timeline, and goal type.
                      </p>
                      <div className="text-xs space-y-1 text-blue-600">
                        <p>✨ Inflation-adjusted pricing</p>
                        <p>📍 Location-specific costs</p>
                        <p>🎯 Goal-specific guidance</p>
                        <p>💰 Budget recommendations</p>
                      </div>
                    </div>

                    {/* AI Component will be positioned here */}
                    <div className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-lg p-4 text-center">
                      <p className="text-sm text-theme-secondary mb-2">
                        💬 <strong>Need help calculating costs?</strong>
                      </p>
                      <p className="text-xs text-theme-muted">
                        The AI assistant (bottom right) can help you estimate realistic costs for your goal with inflation adjustments.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" onClick={() => setCurrentStep('when')} className="flex-1">
                    ← Back to Timeline
                  </Button>
                  <Button 
                    onClick={() => {
                      if (shouldShowPaymentOptions(goalCategory)) {
                        setCurrentStep('payment');
                      } else {
                        setCurrentStep('review');
                      }
                    }}
                    disabled={!goalName.trim() || !goalAmount || goalAmount <= 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Continue to {shouldShowPaymentOptions(goalCategory) ? 'Payment Options' : 'Review'} →
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <Card className="border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</span>
                  Payment Schedule Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-theme-secondary mb-4">
                      {goalCategory === 'Education' 
                        ? 'Will you pay the full amount when education starts, or spread payments over the study period?'
                        : 'Will you pay the full amount upfront, or spread payments over time (like a mortgage)?'
                      }
                    </p>
                    
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-blue-600 mb-2">💡 Understanding Payment Options</h4>
                      <div className="text-xs space-y-2 text-theme-secondary">
                        <p><strong>Target Date:</strong> When you need this goal (when payments BEGIN)</p>
                        {goalCategory === 'Education' && (
                          <p><strong>Payment Period:</strong> How long you'll pay tuition fees AFTER starting (e.g., 4 years of university)</p>
                        )}
                        {goalCategory === 'Home' && (
                          <p><strong>Payment Period:</strong> Mortgage duration AFTER buying the home (e.g., 20-25 years)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Frequency Selection */}
                  <div>
                    <label className="block text-sm font-medium text-theme-secondary mb-3">Payment Frequency</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PAYMENT_FREQUENCIES.map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setPaymentFrequency(freq)}
                          className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                            paymentFrequency === freq
                              ? 'bg-orange-600 border-orange-500 text-white shadow-lg'
                              : 'border-theme text-theme-secondary hover:border-orange-500/50 hover:bg-orange-500/5'
                          }`}
                        >
                          <div className="text-center">
                            <h3 className="font-semibold text-sm">{freq}</h3>
                            <p className={`text-xs mt-1 ${paymentFrequency === freq ? 'text-orange-100' : 'text-theme-muted'}`}>
                              {freq === 'Once' && 'Pay full amount upfront'}
                              {freq === 'Monthly' && 'Monthly payments'}
                              {freq === 'Quarterly' && 'Every 3 months'}
                              {freq === 'Biannual' && 'Every 6 months'}
                              {freq === 'Annual' && 'Yearly payments'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Period Selection (only if not "Once") */}
                  {paymentFrequency !== 'Once' && (
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-3">
                        Payment Period (Years)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 10, 15, 20, 25].map((years) => (
                          <button
                            key={years}
                            onClick={() => setPaymentPeriod(years)}
                            className={`p-3 rounded-lg border text-sm transition-all hover:shadow-md ${
                              paymentPeriod === years
                                ? 'bg-orange-600 border-orange-500 text-white shadow-lg'
                                : 'border-theme text-theme-secondary hover:border-orange-500/50 hover:bg-orange-500/5'
                            }`}
                          >
                            {years} {years === 1 ? 'Year' : 'Years'}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-xs text-orange-600">
                          💰 You'll pay approximately <strong>{formatCurrency(goalAmount / (paymentPeriod * (paymentFrequency === 'Monthly' ? 12 : paymentFrequency === 'Quarterly' ? 4 : paymentFrequency === 'Biannual' ? 2 : 1)), currency)}</strong> per payment
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-3 w-full">
                  <Button variant="outline" onClick={() => setCurrentStep('amount')} className="flex-1">
                    ← Back to Amount
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('review')}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    Continue to Review →
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">6</span>
                  Review & Save Your Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-sm text-theme-secondary">
                    Please review your goal details before saving. You can always edit these later.
                  </p>
                  
                  {/* Goal Summary */}
                  <div className="bg-purple-500/5 border border-purple-500/30 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">
                        {getCategoryIcon(goalCategory)}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg text-theme-primary">
                            {goalCategory === 'Other' ? customCategoryName : goalName}
                          </h3>
                          <p className="text-sm text-theme-muted">{goalCategory} Goal</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-theme-secondary">Target Amount:</span>
                            <p className="text-theme-primary font-semibold">{formatCurrency(goalAmount, currency)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-theme-secondary">Target Date:</span>
                            <p className="text-theme-primary">{monthOptions[targetMonth - 1]} {targetYear}</p>
                          </div>
                          {shouldShowPaymentOptions(goalCategory) && (
                            <>
                              <div>
                                <span className="font-medium text-theme-secondary">Payment Frequency:</span>
                                <p className="text-theme-primary">{paymentFrequency}</p>
                              </div>
                              {paymentFrequency !== 'Once' && (
                                <div>
                                  <span className="font-medium text-theme-secondary">Payment Period:</span>
                                  <p className="text-theme-primary">{paymentPeriod} {paymentPeriod === 1 ? 'Year' : 'Years'}</p>
                                </div>
                              )}
                            </>
                          )}
                          <div>
                            <span className="font-medium text-theme-secondary">Time to Save:</span>
                            <p className="text-theme-primary">
                              {Math.floor(monthDiff(new Date(), new Date(targetYear, targetMonth - 1)) / 12)} years, {monthDiff(new Date(), new Date(targetYear, targetMonth - 1)) % 12} months
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Calculation Preview */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="font-semibold text-green-600 mb-2">💰 Monthly Savings Required</h4>
                    <p className="text-sm text-theme-secondary mb-2">
                      Based on your timeline and goal amount, here's what you'll need to save monthly:
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      Approximately {formatCurrency(goalAmount / Math.max(1, monthDiff(new Date(), new Date(targetYear, targetMonth - 1))), currency)} per month
                    </div>
                    <p className="text-xs text-theme-muted mt-1">
                      *This is a basic calculation. The actual amount will be optimized in your investment strategy.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-3 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(shouldShowPaymentOptions(goalCategory) ? 'payment' : 'amount')} 
                    className="flex-1"
                  >
                    ← Back to {shouldShowPaymentOptions(goalCategory) ? 'Payment Options' : 'Amount'}
                  </Button>
                  <Button 
                    onClick={handleSaveGoal} 
                    disabled={!goalName.trim() || !goalAmount || goalAmount <= 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {editMode ? 'Update Goal' : 'Save Goal'} ✅
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 lg:px-0">
      <h2 className="text-2xl lg:text-3xl font-bold text-theme-light mb-6 lg:mb-8">
        {editMode ? 'Update Goal' : 'Financial Goals Planning'}
      </h2>

      {renderStep()}

      {/* Add Another Goal Dialog */}
      {showAddAnother && (
        <Card className="border-green-500/30 bg-green-500/5 mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-3xl">✅</div>
              <h3 className="text-lg font-semibold text-green-600">Goal Added Successfully!</h3>
              <p className="text-sm text-theme-secondary">
                Your goal has been added to your financial plan. Would you like to add another goal?
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => {
                    resetForm();
                    setShowAddAnother(false);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Another Goal
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAddAnother(false);
                    setCurrentStep('intro');
                  }}
                >
                  Done Adding Goals
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      {!showAddAnother && currentStep === 'intro' && (
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>
            Continue to Retirement Planning
          </Button>
        </div>
      )}

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