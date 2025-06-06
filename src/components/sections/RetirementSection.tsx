import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import RetirementCalculator from './RetirementCalculator';
import AIGuidance from '../AIGuidance';
import { formatCurrency } from '../../utils/calculations';
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
  Heart
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

  // Find all retirement goals
  const retirementGoals = state.goals.filter(goal => goal.category === 'Retirement');

  const handleRetirementCalculation = (amount: number, targetDate: Date) => {
    const horizonMonths = Math.max(1, Math.floor((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    const newGoal = {
      id: editingGoal || `retirement-${Date.now()}`,
      name: 'Your Golden Years',
      category: 'Retirement' as const,
      targetDate,
      amount,
      horizonMonths,
      profile: 'Growth' as const,
      returnPhases: [{ length: horizonMonths, rate: 0.07 }],
      requiredPMT: 0 // Will be calculated by the system
    };

    if (editingGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: newGoal });
    } else {
      dispatch({ type: 'ADD_GOAL', payload: newGoal });
    }

    setShowRetirementCalculator(false);
    setEditingGoal(null);
  };

  const handleEditGoal = (goalId: string) => {
    setEditingGoal(goalId);
    setShowRetirementCalculator(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this retirement plan?')) {
      dispatch({ type: 'DELETE_GOAL', payload: goalId });
    }
  };

  const handleCancel = () => {
    setShowRetirementCalculator(false);
    setEditingGoal(null);
  };

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
              onClick={() => setShowRetirementCalculator(true)}
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