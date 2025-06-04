import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CURRENCIES } from '../../types/currencyTypes';
import { formatCurrency } from '../../utils/calculations';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import AIGuidance from '../AIGuidance';
import { Bot, Target, TrendingUp, DollarSign, Shield, Sparkles, Brain, Zap, PiggyBank } from 'lucide-react';

interface WelcomeProfileSectionProps {
  onNext: () => void;
}

const WelcomeProfileSection: React.FC<WelcomeProfileSectionProps> = ({ onNext }) => {
  const { state, dispatch } = usePlanner();
  const { currency, setCurrency } = useCurrency();

  // Local state for form
  const [name, setName] = useState(state.userProfile.name || '');
  const [nationality, setNationality] = useState(state.userProfile.nationality || '');
  const [location, setLocation] = useState(state.userProfile.location || '');
  const [selectedCurrency, setSelectedCurrency] = useState(state.userProfile.currency || 'USD');
  const [monthlyIncome, setMonthlyIncome] = useState(state.userProfile.monthlyIncome || 0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(state.monthlyExpenses || 0);

  // Calculate monthly savings
  const monthlySavings = Math.max(0, (monthlyIncome || 0) - (monthlyExpenses || 0));
  const hasBothIncomeAndExpenses = monthlyIncome > 0 && monthlyExpenses > 0;

  // Validation
  const isFormValid = name && nationality && location && selectedCurrency && monthlyIncome > 0 && monthlyExpenses > 0;

  // Options
  const nationalityOptions = [
    'American', 'British', 'Canadian', 'Australian', 'German', 'French', 
    'Italian', 'Spanish', 'Dutch', 'Swedish', 'Norwegian', 'Danish',
    'Indian', 'Pakistani', 'Filipino', 'Egyptian', 'Lebanese', 'Jordanian',
    'South African', 'Other'
  ];

  const locationOptions = [
    'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Riyadh, Saudi Arabia', 
    'Jeddah, Saudi Arabia', 'Dammam, Saudi Arabia', 'Doha, Qatar', 
    'Kuwait City, Kuwait', 'Manama, Bahrain', 'Muscat, Oman'
  ];

  const currencyOptions = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'QAR', name: 'Qatari Riyal' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'OMR', name: 'Omani Rial' }
  ];

  // Handle currency change to sync both contexts
  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    
    // Update CurrencyContext to sync with sidebar selector
    const selected = CURRENCIES.find(c => c.code === currencyCode);
    if (selected) {
      setCurrency(selected);
    }
  };

  // Update state when form values change
  useEffect(() => {
    dispatch({ 
      type: 'SET_USER_PROFILE', 
      payload: { 
        name,
        nationality: nationality || undefined, 
        location: location || undefined,
        monthlyIncome: monthlyIncome || undefined,
        currency: selectedCurrency || undefined
      } 
    });
    
    if (monthlyExpenses > 0) {
      dispatch({ type: 'SET_MONTHLY_EXPENSES', payload: monthlyExpenses });
    }
  }, [name, nationality, location, selectedCurrency, monthlyIncome, monthlyExpenses, dispatch]);

  const handleContinue = () => {
    // Ensure all data is saved before proceeding
    dispatch({ 
      type: 'SET_USER_PROFILE', 
      payload: { name, nationality, location, monthlyIncome, currency: selectedCurrency } 
    });
    dispatch({ type: 'SET_MONTHLY_EXPENSES', payload: monthlyExpenses });
    onNext();
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 lg:px-0">
      {/* Welcome Header */}
      <div className="text-center mb-6 lg:mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-orange-500/20 border border-green-500/30 rounded-full px-3 lg:px-4 py-2 mb-3 lg:mb-4">
          <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-green-400" />
          <span className="text-xs lg:text-sm font-semibold text-green-300">WealthKarma AI Financial Planner</span>
          <Brain className="w-3 h-3 lg:w-4 lg:h-4 text-orange-400" />
        </div>
        <h1 className="text-2xl lg:text-4xl xl:text-5xl font-bold text-theme-light mb-3 lg:mb-4">
          Plan Your Financial Future
        </h1>
        <p className="text-base lg:text-xl text-theme-secondary max-w-3xl mx-auto px-4 lg:px-0">
          I'm your personal AI financial advisor, specialized in helping GCC expats build wealth and plan for the future. 
          Let's start by getting to know you and your financial situation.
        </p>
      </div>

      {/* Your AI Journey */}
      <Card className="mb-6 lg:mb-8 border-green-500/30 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <Brain className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
            What to Expect from Your AI Financial Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-orange-500/30">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Smart Emergency Planning</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                AI-recommended emergency fund size and best local banks for your situation
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-yellow-500/30">
                <Target className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Personalized Goals</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                Common expat goals with realistic timelines based on your profile
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-green-500/30">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Investment Strategy</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                Risk assessment and platform recommendations for international investing
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:scale-110 transition-transform border border-purple-500/30">
                <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-1 lg:mb-2 text-theme-light text-sm lg:text-base">Action Plan</h3>
              <p className="text-xs lg:text-sm text-theme-secondary leading-relaxed">
                Step-by-step implementation guide with ongoing coaching and adjustments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Collection */}
      <Card className="mb-6 lg:mb-8 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Tell Me About Yourself</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 lg:space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                What should I call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Nationality and Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Nationality
                </label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select your nationality</option>
                  {nationalityOptions.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Current Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select your location</option>
                  {locationOptions.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency and Income */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Preferred Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="input-dark w-full rounded-lg px-3 lg:px-4 py-3 lg:py-2 text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                  <option value="">Select currency</option>
                  {currencyOptions.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                  Monthly Income ({selectedCurrency || 'USD'})
                </label>
                  <input
                    type="number"
                  value={monthlyIncome || ''}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  placeholder="e.g., 15000"
                  className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
            {/* Monthly Expenses */}
              <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1 lg:mb-2">
                Monthly Expenses ({selectedCurrency || 'USD'})
                </label>
                  <input
                    type="number"
                value={monthlyExpenses || ''}
                    onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                placeholder="e.g., 8000"
                className="input-dark w-full px-3 lg:px-4 py-3 lg:py-2 rounded-lg text-base lg:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              <p className="text-sm text-theme-muted mt-1">
                Include rent, food, transportation, utilities, and other regular expenses
                </p>
              </div>

            {/* Monthly Savings Display */}
            {hasBothIncomeAndExpenses && (
              <div className={`border rounded-lg p-3 lg:p-4 ${
                monthlySavings > 0 
                  ? 'bg-theme-card border-green-500/30' 
                  : 'bg-theme-card border-red-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${
                      monthlySavings > 0 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}>
                      <PiggyBank className={`w-4 h-4 lg:w-5 lg:h-5 ${
                        monthlySavings > 0 ? 'text-green-400' : 'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${
                        monthlySavings > 0 ? 'text-green-300' : 'text-red-300'
                      }`}>
                        Monthly Savings Available
                      </label>
                      <p className={`text-xs ${
                        monthlySavings > 0 ? 'text-theme-secondary' : 'text-red-200'
                      }`}>
                        {monthlySavings > 0 
                          ? 'This amount will be used for your emergency fund and financial goals'
                          : 'Your expenses exceed your income - consider adjusting your budget'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`text-xl lg:text-2xl font-bold ${
                      monthlySavings > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(monthlySavings, currency)}
                    </span>
                    <div className={`text-xs ${
                      monthlySavings > 0 ? 'text-theme-muted' : 'text-red-300'
                    }`}>
                      {monthlySavings > 0 
                        ? `${((monthlySavings / monthlyIncome) * 100).toFixed(0)}% of income`
                        : 'Budget deficit'
                      }
                    </div>
                  </div>
                </div>
                
                {monthlySavings > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-500/20">
                    <div className="flex items-center gap-2 text-green-300 text-sm">
                      <Brain className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="font-medium">AI Insight:</span>
                    </div>
                    <p className="text-theme-secondary text-xs lg:text-sm mt-1 leading-relaxed">
                      {monthlySavings >= monthlyIncome * 0.2 
                        ? "Excellent! You're saving 20%+ of your income. This gives you great flexibility for multiple financial goals."
                        : monthlySavings >= monthlyIncome * 0.1
                        ? "Good savings rate! You can comfortably build an emergency fund and work towards other goals."
                        : "Consider reviewing your expenses to increase your savings rate for faster goal achievement."
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
            <Button 
              onClick={handleContinue}
              disabled={!isFormValid}
              variant="primary"
              fullWidth
              size="lg"
            >
            Continue to Emergency Fund Planning →
            </Button>
        </CardFooter>
      </Card>
      
      {/* AI Guidance - Only show on welcome/profile step */}
      {(name && state.currentStep === 0) && (
        <AIGuidance 
          step="profile-setup"
          context={{
            name,
            nationality,
            location,
            monthlyIncome,
            monthlyExpenses,
            currency: selectedCurrency,
            currentStep: 'profile-setup'
          }}
        />
      )}
    </div>
  );
};

export default WelcomeProfileSection; 