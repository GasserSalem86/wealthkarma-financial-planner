import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import RetirementCalculator from './RetirementCalculator';
import AIGuidance from '../AIGuidance';
import { formatCurrency, calculateRetirementScenarios } from '../../utils/calculations';
import { 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  Sparkles,
  CheckCircle,
  Plus,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  Heart,
  Users,
  User,
  Info,
  HelpCircle
} from 'lucide-react';

interface RetirementSectionProps {
  onNext: () => void;
  onBack: () => void;
}

const RetirementSection: React.FC<RetirementSectionProps> = ({ onNext, onBack }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  const [showRetirementCalculator, setShowRetirementCalculator] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'joint' | 'staggered'>('joint');

  // Find all retirement goals
  const retirementGoals = state.goals.filter(goal => goal.category === 'Retirement');
  
  // Note: Family retirement features available but banner not displayed
  
  // Get family context for internal logic (but don't show banner)
  const planningType = state.userProfile.planningType || 'individual';
  const familySize = state.userProfile.familySize || 1;
  const isFamily = planningType === 'family' && familySize > 1;

  // Calculate retirement scenarios for family planning
  const retirementScenarios = isFamily ? calculateRetirementScenarios(
    planningType,
    35, // Default primary age - could be user input
    32, // Default spouse age - could be user input
    selectedStrategy
  ) : [];

  const handleRetirementCalculation = (amount: number, targetDate: Date, familyRetirementProfile?: any) => {
    const horizonMonths = Math.max(1, Math.floor((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    const newGoal = {
      id: editingGoal || `retirement-${Date.now()}`,
      name: isFamily ? `Family Retirement Plan (${selectedStrategy})` : 'Your Golden Years',
      category: 'Retirement' as const,
      targetDate,
      amount,
      horizonMonths,
      profile: 'Growth' as const,
      returnPhases: [{ length: horizonMonths, rate: 0.07 }],
      requiredPMT: 0, // Will be calculated by the system
      familyRetirementProfile: isFamily ? {
        primaryAge: familyRetirementProfile?.primaryAge || 35,
        spouseAge: familyRetirementProfile?.spouseAge || 32,
        primaryRetirementAge: familyRetirementProfile?.primaryRetirementAge || 65,
        spouseRetirementAge: familyRetirementProfile?.spouseRetirementAge || 65,
        strategy: familyRetirementProfile?.strategy || selectedStrategy,
        expenseRatio: 0.8 // 80% of current expenses in retirement
      } : undefined
    };

    if (editingGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: newGoal });
    } else {
      dispatch({ type: 'ADD_GOAL', payload: newGoal });
    }

    setShowRetirementCalculator(false);
    setShowStrategySelector(false);
    setEditingGoal(null);
  };

  const handleEditGoal = (goalId: string) => {
    setEditingGoal(goalId);
    const goal = retirementGoals.find(g => g.id === goalId);
    if (goal?.familyRetirementProfile) {
      setSelectedStrategy(goal.familyRetirementProfile.strategy);
    }
    if (isFamily) {
      setShowStrategySelector(true);
    } else {
      setShowRetirementCalculator(true);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this retirement plan?')) {
      dispatch({ type: 'DELETE_GOAL', payload: goalId });
    }
  };

  const handleCancel = () => {
    setShowRetirementCalculator(false);
    setShowStrategySelector(false);
    setEditingGoal(null);
  };

  const handleStrategySelect = (strategy: 'joint' | 'staggered') => {
    setSelectedStrategy(strategy);
    setShowStrategySelector(false);
    setShowRetirementCalculator(true);
  };

  const handleStartPlanning = () => {
    if (isFamily) {
      setShowStrategySelector(true);
    } else {
      setShowRetirementCalculator(true);
    }
  };

  // Family retirement strategy selector
  if (showStrategySelector) {
    return (
      <div className="container mx-auto max-w-4xl px-4 lg:px-0">
        <div className="mb-4 lg:mb-6">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="transition-all duration-200"
          >
            ← Back to Retirement Planning
          </Button>
        </div>
        
        <Card className="border-0 shadow-xl bg-theme-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="heading-gradient heading-h1 flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-orange-400 rounded-full flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <span>Choose Your Family Retirement Strategy</span>
            </CardTitle>
            <p className="text-lg text-theme-secondary mt-4">
              How would you like to plan your family's retirement? Both approaches have their benefits.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Strategy Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Joint Retirement */}
              <div 
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedStrategy === 'joint' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg transform scale-105' 
                    : 'border-theme bg-theme-section hover:border-emerald-300'
                }`}
                onClick={() => setSelectedStrategy('joint')}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedStrategy === 'joint' ? 'bg-emerald-500' : 'bg-theme-muted'
                  }`}>
                    <Users className={`w-5 h-5 ${selectedStrategy === 'joint' ? 'text-white' : 'text-theme-secondary'}`} />
                  </div>
                  <h3 className="heading-h3-sm text-theme-primary">Joint Retirement</h3>
                  {selectedStrategy === 'joint' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                </div>
                
                <div className="space-y-3">
                  <p className="text-theme-secondary">
                    <strong>Both retire at the same time</strong> - typically when the younger spouse reaches retirement age.
                  </p>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <h4 className="font-semibold text-emerald-600 mb-2">✨ Benefits:</h4>
                    <ul className="text-sm text-emerald-600 space-y-1">
                      <li>• Start retirement journey together</li>
                      <li>• Synchronized lifestyle changes</li>
                      <li>• Shared retirement activities and travel</li>
                      <li>• Simplified financial planning</li>
                    </ul>
                  </div>
                  
                  <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-lg p-3">
                    <h4 className="font-semibold text-theme-warning mb-2">⚠️ Considerations:</h4>
                    <ul className="text-sm text-theme-warning space-y-1">
                      <li>• May require higher savings if one retires early</li>
                      <li>• Potential income loss if higher earner retires early</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Staggered Retirement */}
              <div 
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedStrategy === 'staggered' 
                    ? 'border-orange-500 bg-orange-500/10 shadow-lg transform scale-105' 
                    : 'border-theme bg-theme-section hover:border-orange-300'
                }`}
                onClick={() => setSelectedStrategy('staggered')}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedStrategy === 'staggered' ? 'bg-orange-500' : 'bg-theme-muted'
                  }`}>
                    <Clock className={`w-5 h-5 ${selectedStrategy === 'staggered' ? 'text-white' : 'text-theme-secondary'}`} />
                  </div>
                  <h3 className="heading-h3-sm text-theme-primary">Staggered Retirement</h3>
                  {selectedStrategy === 'staggered' && <CheckCircle className="w-5 h-5 text-orange-500" />}
                </div>
                
                <div className="space-y-3">
                  <p className="text-theme-secondary">
                    <strong>Each person retires when optimal</strong> - typically based on age, career stage, or financial readiness.
                  </p>
                  
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <h4 className="font-semibold text-orange-600 mb-2">✨ Benefits:</h4>
                    <ul className="text-sm text-orange-600 space-y-1">
                      <li>• Optimized timing for each person's career</li>
                      <li>• Continued income from working spouse</li>
                      <li>• Gradual lifestyle transition</li>
                      <li>• Potentially lower overall savings needed</li>
                    </ul>
                  </div>
                  
                  <div className="bg-theme-warning/10 border border-theme-warning/30 rounded-lg p-3">
                    <h4 className="font-semibold text-theme-warning mb-2">⚠️ Considerations:</h4>
                    <ul className="text-sm text-theme-warning space-y-1">
                      <li>• Different schedules and availability</li>
                      <li>• More complex planning and coordination</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Helper */}
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">💡 Need Help Deciding?</h4>
                    <p className="text-sm text-blue-600 mb-3">
                      Consider your family's priorities, career stages, and financial goals. You can always adjust this later.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-medium text-blue-600">Choose Joint if:</p>
                        <ul className="text-blue-600 ml-4 space-y-1">
                          <li>• You want to enjoy retirement together</li>
                          <li>• Similar ages and career stages</li>
                          <li>• Comfortable with higher savings target</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-blue-600">Choose Staggered if:</p>
                        <ul className="text-blue-600 ml-4 space-y-1">
                          <li>• Significant age difference</li>
                          <li>• Different career timelines</li>
                          <li>• Want to optimize each person's timing</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCancel}>
              ← Back
            </Button>
            <Button 
              onClick={() => handleStrategySelect(selectedStrategy)}
              className="bg-gradient-to-r from-emerald-500 to-orange-500 text-white"
            >
              Continue with {selectedStrategy === 'joint' ? 'Joint' : 'Staggered'} Strategy
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showRetirementCalculator) {
    return (
      <div className="container mx-auto max-w-4xl px-4 lg:px-0">
        <div className="mb-4 lg:mb-6">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="transition-all duration-200"
          >
            ← Back to Retirement Planning
          </Button>
        </div>
        <RetirementCalculator
          onCalculate={handleRetirementCalculation}
          onCancel={handleCancel}
          familyContext={isFamily ? {
            strategy: selectedStrategy,
            familySize,
            planningType
          } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 lg:px-0">


      {/* Congratulations Section - Show when user has goals (excluding emergency fund) */}
      {state.goals.filter(goal => goal.id !== 'emergency-fund' && goal.category !== 'Retirement').length > 0 && (
        <div className="space-y-6 lg:space-y-8 mb-8 lg:mb-12">
          {/* Congratulations Section */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-4xl">🎉</div>
                <h3 className="text-xl lg:text-2xl font-bold text-green-600">
                  Amazing Progress! Your Goals Are Planned!
                </h3>
                <p className="text-sm lg:text-base text-theme-secondary max-w-2xl mx-auto">
                  You've successfully planned your life goals and dreams. Now it's time for the most important step - 
                  securing your golden years and ensuring you can enjoy the retirement lifestyle you deserve!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="border-orange-500/30 bg-orange-500/5">
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
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Your Goals</span>
                  </div>
                  <div className="w-8 h-1 bg-orange-500"></div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-sm text-orange-600 font-medium">Retirement Plan</span>
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 max-w-lg mx-auto">
                  <p className="text-sm text-orange-600 font-medium">
                    🌟 Fantastic momentum! You've built a solid foundation. Now let's secure your future with a retirement plan that gives you true financial freedom.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create New Retirement Plan */}
      <Card className="mb-8 lg:mb-12 border-0 shadow-xl bg-theme-card">
        <CardHeader className="pb-3 lg:pb-4">
          <CardTitle className="flex items-center space-x-2 lg:space-x-3 text-lg lg:text-2xl text-theme-primary">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-green-400 to-orange-400 rounded-lg flex items-center justify-center">
              <Plus className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
            </div>
            <span>Create Your Retirement Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Why Retirement Planning Matters Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-6 lg:mb-8">
            <div>
              <h4 className="font-bold text-theme-primary mb-3 lg:mb-4 flex items-center text-sm lg:text-base">
                <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-theme-error mr-2" />
                Why This Matters for GCC Expats
              </h4>
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-theme-tertiary rounded-lg shadow-theme-sm">
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-theme-info mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-theme-primary text-sm lg:text-base">No Local Pensions</p>
                    <p className="text-xs lg:text-sm text-theme-secondary">You're responsible for your own retirement security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-theme-tertiary rounded-lg shadow-theme-sm">
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-theme-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-theme-primary text-sm lg:text-base">Visa Dependency</p>
                    <p className="text-xs lg:text-sm text-theme-secondary">Plan for potential relocation and global mobility</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-theme-tertiary rounded-lg shadow-theme-sm">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-theme-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-theme-primary text-sm lg:text-base">Tax Advantages</p>
                    <p className="text-xs lg:text-sm text-theme-secondary">Zero income tax means more money to save and invest</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-theme-primary mb-3 lg:mb-4 flex items-center text-sm lg:text-base">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-theme-success mr-2" />
                Your Retirement Advantages
              </h4>
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-theme-tertiary rounded-lg shadow-theme-sm">
                  <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-theme-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-theme-primary text-sm lg:text-base">Early Retirement Potential</p>
                    <p className="text-xs lg:text-sm text-theme-secondary">High savings rates enable earlier financial freedom</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-theme-tertiary rounded-lg shadow-theme-sm">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-theme-info mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-theme-primary text-sm lg:text-base">Global Lifestyle</p>
                    <p className="text-xs lg:text-sm text-theme-secondary">Build wealth for retirement anywhere in the world</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 lg:space-x-3 p-2 lg:p-3 bg-theme-tertiary rounded-lg shadow-theme-sm">
                  <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-theme-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-theme-primary text-sm lg:text-base">High Earning Potential</p>
                    <p className="text-xs lg:text-sm text-theme-secondary">GCC salaries enable accelerated wealth building</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-green-400 to-orange-400 rounded-xl p-4 lg:p-8">
            <h4 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-white dark:text-gray-800">Ready to Secure Your Future?</h4>
            <p className="mb-4 lg:mb-6 opacity-90 text-white dark:text-gray-800 text-sm lg:text-base">
              Our AI-powered retirement calculator will help you discover amazing destinations and 
              calculate exactly how much you need to save for your dream retirement.
            </p>
            <Button
              onClick={handleStartPlanning}
              className="bg-white text-green-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-green-300 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 py-3"
              size="lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Start Planning My Retirement</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator - Show only when there are retirement goals */}
      {retirementGoals.length > 0 && (
        <div className="mb-8">
          <div className="bg-theme-success/10 border border-theme-success/30 rounded-xl p-6 shadow-theme">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-theme-success rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="heading-brand-success">Great Progress!</h3>
                  <p className="text-sm text-theme-success">You have {retirementGoals.length} retirement plan{retirementGoals.length > 1 ? 's' : ''} active</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-theme-success">
                  {formatCurrency(retirementGoals.reduce((sum, goal) => sum + goal.amount, 0), currency)}
                </p>
                <p className="text-sm text-theme-success">Total retirement target</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Retirement Goals */}
      {retirementGoals.length > 0 && (
        <div className="mb-12">
          <h3 className="heading-h3 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-3 text-theme-success" />
            Your Retirement Plans
          </h3>
          <div className="grid gap-6">
            {retirementGoals.map((goal, index) => (
              <Card key={goal.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-theme-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="heading-h4 mb-3 text-theme-primary">{goal.name}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-theme-tertiary rounded-lg p-3 border border-theme shadow-theme-sm">
                            <div className="flex items-center space-x-2 text-theme-info mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-medium">Target Date</span>
                            </div>
                            <p className="font-semibold text-theme-primary">{goal.targetDate.toLocaleDateString()}</p>
                          </div>
                          
                          <div className="bg-theme-tertiary rounded-lg p-3 border border-theme shadow-theme-sm">
                            <div className="flex items-center space-x-2 text-theme-success mb-1">
                              <Target className="w-4 h-4" />
                              <span className="text-sm font-medium">Target Amount</span>
                            </div>
                            <p className="font-semibold text-theme-primary">{formatCurrency(goal.amount, currency)}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-theme-muted" />
                          <span className="text-sm text-theme-secondary">
                            {Math.round(goal.horizonMonths / 12)} years, {goal.horizonMonths % 12} months to retirement
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGoal(goal.id)}
                        className="transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-theme-error hover:text-theme-error-light hover:bg-red-500/10 hover:border-red-500 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          ← Back to Dreams
        </Button>
        <Button 
          variant="primary"
          onClick={onNext}
        >
          Continue to Risk Assessment →
        </Button>
      </div>

      {/* AI Guidance - Only show on retirement step */}
      {state.currentStep === 3 && (
      <AIGuidance 
        step="retirement-plan" 
        context={{
          name: state.userProfile.name,
          nationality: state.userProfile.nationality,
          location: state.userProfile.location,
          monthlyIncome: state.userProfile.monthlyIncome,
          monthlyExpenses: state.monthlyExpenses,
          currency: currency.code,
          currentStep: 'retirement-plan',
          goals: retirementGoals
        }}
        componentId="retirement-section"
      />
      )}
    </div>
  );
};

export default RetirementSection; 