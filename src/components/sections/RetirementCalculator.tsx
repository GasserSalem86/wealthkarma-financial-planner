import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { usePlanner } from '../../context/PlannerContext';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { formatCurrency } from '../../utils/calculations';
import { 
  Wallet, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  Bot, 
  Loader2, 
  Home, 
  UtensilsCrossed, 
  Heart, 
  Car, 
  PartyPopper, 
  Zap,
  ChevronRight,
  ChevronLeft,
  Target,
  TrendingUp,
  Globe,
  Clock,
  CheckCircle,
  Star,
  Info,
  Shield,
  Settings
} from 'lucide-react';
import { aiService, RetirementPlanningResponse, RetirementDestinationSuggestion, RetirementButton } from '../../services/aiService';

interface RetirementCalculatorProps {
  onCalculate: (amount: number, targetDate: Date, familyRetirementProfile?: any) => void;
  onCancel: () => void;
  familyContext?: {
    strategy: 'joint' | 'staggered';
    familySize: number;
    planningType: 'family';
  };
}

// Inflation rate configurations
const INFLATION_RATES = {
  default: 3.0,
  conservative: 2.5,
  aggressive: 3.5,
  
  // Region-specific defaults for GCC countries
  byCountry: {
    'UAE': 2.5,
    'Saudi Arabia': 2.5,
    'Qatar': 2.5,
    'Kuwait': 3.0,
    'Bahrain': 3.0,
    'Oman': 3.0
  } as Record<string, number>
};

const INFLATION_OPTIONS = [
  { value: 2.0, label: "Conservative (2%)", description: "Lower risk, minimal protection" },
  { value: 2.5, label: "Moderate-Conservative (2.5%)", description: "Good for stable economies" },
  { value: 3.0, label: "Industry Standard (3%)", description: "Most widely used assumption" },
  { value: 3.5, label: "Moderate-Aggressive (3.5%)", description: "Extra protection buffer" },
  { value: 4.0, label: "Aggressive (4%)", description: "Maximum inflation protection" }
];

const getDefaultInflationRate = (location?: string): number => {
  if (!location) return INFLATION_RATES.default;
  
  // Extract country from location string (e.g., "Dubai, UAE" -> "UAE")
  const locationParts = location.split(',');
  const country = locationParts.length > 1 ? locationParts[1].trim() : locationParts[0].trim();
  
  return INFLATION_RATES.byCountry[country] || INFLATION_RATES.default;
};

const getRegionalInflationContext = (location?: string): string => {
  if (!location) return 'We use the industry standard 3% for long-term retirement planning';
  
  if (location.includes('UAE') || location.includes('Saudi') || location.includes('Qatar')) {
    return 'USD-pegged currencies provide more stability, so we use a conservative 2.5%';
  }
  
  if (location.includes('Kuwait') || location.includes('Bahrain') || location.includes('Oman')) {
    return 'Economic diversification suggests using 3% for extra protection';
  }
  
  return 'We use the industry standard 3% for long-term retirement planning';
};

const RetirementCalculator: React.FC<RetirementCalculatorProps> = ({ onCalculate, onCancel, familyContext }) => {
  const { currency } = useCurrency();
  const { state } = usePlanner();
  const [currentStep, setCurrentStep] = useState<'initial' | 'preferences' | 'destinations' | 'manual-entry' | 'cost-breakdown' | 'final'>('initial');
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [destination, setDestination] = useState('');
  const [monthlyCosts, setMonthlyCosts] = useState(0);
  
  // Smart inflation rate default based on user's location
  const [inflationRate, setInflationRate] = useState(() => 
    getDefaultInflationRate(state.userProfile.location)
  );
  
  // Retirement preferences questionnaire state
  const [retirementPreferences, setRetirementPreferences] = useState({
    budgetPriority: '' as 'low-cost' | 'moderate' | 'comfortable' | '',
    weatherPreference: '' as 'warm' | 'temperate' | 'cool' | 'no-preference' | '',
    lifestyleType: '' as 'quiet-peaceful' | 'active-social' | 'cultural-urban' | 'beach-coastal' | ''
  });
  
  // AI assistance state
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [isLoadingCostBreakdown, setIsLoadingCostBreakdown] = useState(false);
  const [isLoadingManualAnalysis, setIsLoadingManualAnalysis] = useState(false);
  const [destinationSuggestions, setDestinationSuggestions] = useState<RetirementDestinationSuggestion[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<RetirementDestinationSuggestion | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState<number | null>(null);
  const [manualDestinationInput, setManualDestinationInput] = useState('');

  // Family-specific staggered retirement state
  const [primaryAge, setPrimaryAge] = useState(35);
  const [spouseAge, setSpouseAge] = useState(32);
  const [primaryRetirementAge, setPrimaryRetirementAge] = useState(65);
  const [spouseRetirementAge, setSpouseRetirementAge] = useState(65);

  // Get enhanced AI context from planner state
  const getAIContext = () => {
    // Only include preferences if all values are selected (not empty strings)
    const validPreferences = retirementPreferences.budgetPriority && 
                            retirementPreferences.weatherPreference && 
                            retirementPreferences.lifestyleType
      ? {
          budgetPriority: retirementPreferences.budgetPriority as 'low-cost' | 'moderate' | 'comfortable',
          weatherPreference: retirementPreferences.weatherPreference as 'warm' | 'temperate' | 'cool' | 'no-preference',
          lifestyleType: retirementPreferences.lifestyleType as 'quiet-peaceful' | 'active-social' | 'cultural-urban' | 'beach-coastal'
        }
      : undefined;

    return {
    name: state.userProfile.name,
    nationality: state.userProfile.nationality,
    location: state.userProfile.location,
    monthlyIncome: state.userProfile.monthlyIncome,
    monthlyExpenses: state.monthlyExpenses,
    currency: currency.code,
    currentStep: 'retirement-plan',
      goals: state.goals,
      // Enhanced with family and preferences context
      planningType: (familyContext?.planningType || 'individual') as 'family' | 'individual',
      familySize: familyContext?.familySize,
      retirementPreferences: validPreferences
    };
  };

  const handleGetDestinationSuggestions = async () => {
    setIsLoadingDestinations(true);
    try {
      const response = await aiService.getComprehensiveRetirementPlan(getAIContext());
      setDestinationSuggestions(response.destinationSuggestions || []);
      setCostBreakdown(response.selectedDestination);
      setAiResponse(response.message);
      setCurrentStep('destinations');
    } catch (error) {
      console.error('Error getting comprehensive retirement plan:', error);
      setAiResponse("I'm having trouble getting your retirement plan. You can proceed manually.");
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  const handlePreferencesNext = () => {
    const isValid = retirementPreferences.budgetPriority && 
                   retirementPreferences.weatherPreference && 
                   retirementPreferences.lifestyleType;
    
    if (isValid) {
      handleGetDestinationSuggestions();
    }
  };

  const handleDestinationSelect = async (suggestion: RetirementDestinationSuggestion, index: number) => {
    setSelectedDestination(suggestion);
    setSelectedDestinationIndex(index);
    setDestination(suggestion.destination);
    setMonthlyCosts(suggestion.estimatedMonthlyCost);
    
    // Since we already have the detailed breakdown from the comprehensive call,
    // we can proceed directly to cost-breakdown or final step
      setCurrentStep('cost-breakdown');
  };

  const handleManualEntry = () => {
    setCurrentStep('manual-entry');
  };

  const handleManualDestinationAnalysis = async () => {
    if (!manualDestinationInput.trim()) return;
    
    setIsLoadingManualAnalysis(true);
    try {
      // For manual destination, we'll call the comprehensive method
      // The AI will naturally focus on the user's preferred location based on the context
      const response = await aiService.getComprehensiveRetirementPlan(getAIContext());
      
      setCostBreakdown(response.selectedDestination);
      setDestination(manualDestinationInput.trim());
      if (response.selectedDestination?.estimatedMonthlyCost) {
        setMonthlyCosts(response.selectedDestination.estimatedMonthlyCost);
      }
      setAiResponse(response.message);
      setCurrentStep('cost-breakdown');
    } catch (error) {
      console.error('Error getting manual destination analysis:', error);
      // Fallback: proceed without AI analysis
      setDestination(manualDestinationInput.trim());
      setCurrentStep('final');
    } finally {
      setIsLoadingManualAnalysis(false);
    }
  };

  // Calculate effective retirement info based on strategy
  const getEffectiveRetirementInfo = () => {
    if (!familyContext) {
      return {
        effectiveAge: currentAge,
        effectiveRetirementAge: retirementAge,
        yearsToRetirement: retirementAge - currentAge,
        strategy: 'individual' as const
      };
    }

    if (familyContext.strategy === 'joint') {
      // Joint retirement - plan for when both can retire (later timeline)
      const youngerAge = Math.min(primaryAge, spouseAge);
      const jointRetirementAge = Math.max(primaryRetirementAge, spouseRetirementAge);
      return {
        effectiveAge: youngerAge,
        effectiveRetirementAge: jointRetirementAge,
        yearsToRetirement: jointRetirementAge - youngerAge,
        strategy: 'joint' as const,
        primaryAge,
        spouseAge,
        primaryRetirementAge,
        spouseRetirementAge
      };
    } else {
      // Staggered retirement - plan for the longer timeline (need savings for both)
      const primaryYears = primaryRetirementAge - primaryAge;
      const spouseYears = spouseRetirementAge - spouseAge;
      
      // Plan for the person who retires later (needs more time to save)
      if (primaryYears >= spouseYears) {
        return {
          effectiveAge: primaryAge,
          effectiveRetirementAge: primaryRetirementAge,
          yearsToRetirement: primaryYears,
          strategy: 'staggered' as const,
          primaryTimeline: { age: primaryAge, retirementAge: primaryRetirementAge, years: primaryYears },
          spouseTimeline: { age: spouseAge, retirementAge: spouseRetirementAge, years: spouseYears }
        };
      } else {
        return {
          effectiveAge: spouseAge,
          effectiveRetirementAge: spouseRetirementAge,
          yearsToRetirement: spouseYears,
          strategy: 'staggered' as const,
          primaryTimeline: { age: primaryAge, retirementAge: primaryRetirementAge, years: primaryYears },
          spouseTimeline: { age: spouseAge, retirementAge: spouseRetirementAge, years: spouseYears }
        };
      }
    }
  };

  const calculateRetirementNeeds = () => {
    const retirementInfo = getEffectiveRetirementInfo();
    
    // Calculate future monthly costs accounting for inflation
    const futureMonthlyCosts = monthlyCosts * Math.pow(1 + inflationRate/100, retirementInfo.yearsToRetirement);
    
    // Calculate annual expenses
    const annualExpenses = futureMonthlyCosts * 12;
    
    // For staggered retirement, we may need to account for partial income during transition
    let totalNeeded;
    if (retirementInfo.strategy === 'staggered' && retirementInfo.primaryTimeline && retirementInfo.spouseTimeline) {
      // Staggered retirement calculation
      const earlierRetirement = Math.min(retirementInfo.primaryTimeline.years, retirementInfo.spouseTimeline.years);
      const laterRetirement = Math.max(retirementInfo.primaryTimeline.years, retirementInfo.spouseTimeline.years);
      
      // During transition period (one person retired, one still working), we need less
      const transitionYears = laterRetirement - earlierRetirement;
      const transitionExpenseRatio = 0.7; // 70% of full expenses during transition
      
      // Full retirement needs (using 4% rule)
      const fullRetirementNeeds = annualExpenses * 25;
      
      // Transition period needs (reduced expenses, but earlier start)
      const transitionMonthlyCosts = monthlyCosts * Math.pow(1 + inflationRate/100, earlierRetirement);
      const transitionAnnualExpenses = transitionMonthlyCosts * 12 * transitionExpenseRatio;
      const transitionNeeds = transitionAnnualExpenses * transitionYears;
      
      totalNeeded = Math.ceil(fullRetirementNeeds + transitionNeeds);
    } else {
      // Joint retirement or individual - standard 4% rule
      totalNeeded = Math.ceil(annualExpenses * 25);
    }
    
    // Set target date to effective retirement age
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + retirementInfo.yearsToRetirement);
    
    onCalculate(totalNeeded, targetDate, familyContext ? {
      strategy: retirementInfo.strategy,
      primaryAge: retirementInfo.primaryAge,
      spouseAge: retirementInfo.spouseAge,
      primaryRetirementAge: retirementInfo.primaryRetirementAge,
      spouseRetirementAge: retirementInfo.spouseRetirementAge
    } : undefined);
  };

  // Helper function to get breakdown icon
  const getBreakdownIcon = (category: string) => {
    switch (category) {
      case 'housing': return <Home className="w-4 h-4" />;
      case 'food': return <UtensilsCrossed className="w-4 h-4" />;
      case 'healthcare': return <Heart className="w-4 h-4" />;
      case 'transportation': return <Car className="w-4 h-4" />;
      case 'entertainment': return <PartyPopper className="w-4 h-4" />;
      case 'utilities': return <Zap className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  // Step Progress Component
  const StepProgress = () => {
    const steps = {
      initial: 1,
      preferences: 2,
      destinations: 3,
      'manual-entry': 3,
      'cost-breakdown': 4,
      final: 5
    };
    
    const currentStepNumber = steps[currentStep];
    const totalSteps = 5;
    
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step <= currentStepNumber 
                  ? 'bg-gradient-to-r from-green-400 to-orange-400 text-white shadow-lg' 
                  : 'bg-theme-tertiary text-theme-muted border border-theme'
              }`}>
                {step}
              </div>
              {step < totalSteps && (
                <div className={`w-12 h-0.5 transition-all duration-300 ${
                  step < currentStepNumber ? 'bg-gradient-to-r from-green-400 to-orange-400' : 'bg-theme'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Initial Step
  if (currentStep === 'initial') {
    return (
      <div className="max-w-2xl mx-auto">
        <StepProgress />
        <Card className="border-0 shadow-xl bg-theme-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="heading-gradient heading-h1 flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-orange-400 rounded-full flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span>Plan Your Golden Years</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-orange-400 text-white p-6 rounded-xl mb-6">
                  <h4 className="heading-h4 mb-2 text-white dark:text-white">Let's Build Your Retirement Dream!</h4>
                  <p className="opacity-90 text-white dark:text-white">
                    I'll help you discover amazing retirement destinations and estimate what you'll need to live comfortably there.
                    We'll use the proven 4% rule to calculate your retirement savings goal.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age inputs based on family context */}
                {familyContext?.strategy === 'staggered' ? (
                  <>
                    {/* Primary person inputs */}
                <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                  <label className="block text-sm font-semibold text-theme-secondary mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-theme-info" />
                          <span>Primary Person Current Age</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={primaryAge}
                        onChange={(e) => setPrimaryAge(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min="18"
                        max="100"
                      />
                    </div>
                    
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-theme-warning" />
                          <span>Primary Retirement Age</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={primaryRetirementAge}
                        onChange={(e) => setPrimaryRetirementAge(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        min={primaryAge + 1}
                        max="100"
                      />
                    </div>

                    {/* Spouse inputs */}
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-theme-info" />
                          <span>Spouse Current Age</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={spouseAge}
                        onChange={(e) => setSpouseAge(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min="18"
                        max="100"
                      />
                    </div>
                    
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-theme-warning" />
                          <span>Spouse Retirement Age</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={spouseRetirementAge}
                        onChange={(e) => setSpouseRetirementAge(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        min={spouseAge + 1}
                        max="100"
                      />
                    </div>
                  </>
                ) : familyContext?.strategy === 'joint' ? (
                  <>
                    {/* Joint retirement - use primary/spouse ages but same retirement age */}
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-theme-info" />
                          <span>Primary Person Age</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={primaryAge}
                        onChange={(e) => setPrimaryAge(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min="18"
                        max="100"
                      />
                    </div>
                    
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-theme-info" />
                          <span>Spouse Age</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={spouseAge}
                        onChange={(e) => setSpouseAge(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min="18"
                        max="100"
                      />
                    </div>

                    {/* Single retirement age for joint strategy */}
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md md:col-span-2">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-theme-warning" />
                          <span>Joint Retirement Age (when both retire)</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        value={primaryRetirementAge}
                        onChange={(e) => {
                          setPrimaryRetirementAge(Number(e.target.value));
                          setSpouseRetirementAge(Number(e.target.value));
                        }}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        min={Math.max(primaryAge + 1, spouseAge + 1)}
                        max="100"
                      />
                      <p className="text-xs text-theme-muted mt-2">
                        Both will retire together at this age
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Individual retirement - original inputs */}
                    <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                      <label className="block text-sm font-semibold text-theme-secondary mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-theme-info" />
                          <span>Current Age</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    min="18"
                    max="100"
                  />
                </div>
                
                <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                  <label className="block text-sm font-semibold text-theme-secondary mb-3">
                    <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-theme-warning" />
                      <span>When do you want to retire?</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                    className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    min={currentAge + 1}
                    max="100"
                  />
                </div>
                  </>
                )}
              </div>

              {/* Years until retirement display */}
              {retirementAge > currentAge && (
                <div className="text-center bg-theme-success/10 border border-theme-success/30 rounded-xl p-6 shadow-theme">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="w-6 h-6 text-theme-success" />
                    <span className="heading-stat text-theme-success">
                      {retirementAge - currentAge} Years
                    </span>
                  </div>
                  <p className="text-theme-success">Time to build your retirement fund</p>
                </div>
              )}

              <div className="text-center space-y-6">
                <div className="bg-theme-success/10 border border-theme-success/30 rounded-xl p-6 shadow-theme">
                  <p className="text-theme-success font-semibold mb-2">Ready to explore your retirement options?</p>
                  <p className="text-sm text-theme-success">
                    I can suggest amazing destinations perfect for your budget and lifestyle, or you can enter your own preferences.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => setCurrentStep('preferences')}
                    disabled={retirementAge <= currentAge}
                    className="bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 py-3"
                    size="lg"
                  >
                    <div className="flex items-center justify-center space-x-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Get AI Destination Suggestions</span>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleManualEntry}
                    disabled={retirementAge <= currentAge}
                    className="flex-1 py-3 transition-all duration-200"
                    size="lg"
                  >
                    Enter My Own Details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={onCancel} fullWidth size="lg">
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // NEW: Preferences Step
  if (currentStep === 'preferences') {
    const isValid = retirementPreferences.budgetPriority && 
                   retirementPreferences.weatherPreference && 
                   retirementPreferences.lifestyleType;

    return (
      <div className="max-w-4xl mx-auto">
        <StepProgress />
        <Card className="border-0 shadow-xl bg-theme-card">
          <CardHeader className="text-center">
            <CardTitle className="heading-h1-sm flex items-center justify-center space-x-3">
              <Settings className="w-8 h-8 text-theme-success" />
              <span>Your Retirement Preferences</span>
            </CardTitle>
            <p className="text-theme-secondary mt-2">
              Tell me about your ideal retirement so I can suggest the perfect destinations for you
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Question 1: Budget Priority */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-orange-400 text-white font-bold flex items-center justify-center">
                    1
                  </div>
                  <h3 className="heading-h3 text-theme-primary">What's your budget priority for retirement?</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-11">
                  {[
                    { id: 'low-cost', label: 'Affordable Living', desc: 'Stretch my savings, focus on low costs', icon: '💰' },
                    { id: 'moderate', label: 'Balanced Budget', desc: 'Comfortable lifestyle without excess', icon: '⚖️' },
                    { id: 'comfortable', label: 'Premium Comfort', desc: 'High quality living, budget flexible', icon: '✨' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setRetirementPreferences(prev => ({ ...prev, budgetPriority: option.id as any }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        retirementPreferences.budgetPriority === option.id
                          ? 'border-green-500 bg-theme-success/10'
                          : 'border-theme hover:border-green-300 bg-theme-card'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-theme-primary">{option.label}</div>
                      <div className="text-sm text-theme-secondary mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Weather Preference */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-orange-400 text-white font-bold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="heading-h3 text-theme-primary">What's your ideal climate?</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ml-11">
                  {[
                    { id: 'warm', label: 'Warm & Sunny', desc: 'Tropical, year-round warmth', icon: '☀️' },
                    { id: 'temperate', label: 'Mild Seasons', desc: 'Mediterranean, four seasons', icon: '🌤️' },
                    { id: 'cool', label: 'Cool & Fresh', desc: 'Cooler temperatures, crisp air', icon: '🌨️' },
                    { id: 'no-preference', label: 'Any Climate', desc: 'Weather isn\'t important to me', icon: '🌍' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setRetirementPreferences(prev => ({ ...prev, weatherPreference: option.id as any }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        retirementPreferences.weatherPreference === option.id
                          ? 'border-green-500 bg-theme-success/10'
                          : 'border-theme hover:border-green-300 bg-theme-card'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-theme-primary">{option.label}</div>
                      <div className="text-sm text-theme-secondary mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Lifestyle Type */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-orange-400 text-white font-bold flex items-center justify-center">
                    3
                  </div>
                  <h3 className="heading-h3 text-theme-primary">What retirement lifestyle appeals to you?</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                  {[
                    { id: 'quiet-peaceful', label: 'Quiet & Peaceful', desc: 'Relaxed pace, nature, tranquility', icon: '🏞️' },
                    { id: 'active-social', label: 'Active & Social', desc: 'Vibrant expat community, activities', icon: '🎾' },
                    { id: 'cultural-urban', label: 'Cultural & Urban', desc: 'Museums, arts, city amenities', icon: '🏛️' },
                    { id: 'beach-coastal', label: 'Beach & Coastal', desc: 'Ocean views, marine activities', icon: '🏖️' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setRetirementPreferences(prev => ({ ...prev, lifestyleType: option.id as any }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        retirementPreferences.lifestyleType === option.id
                          ? 'border-green-500 bg-theme-success/10'
                          : 'border-theme hover:border-green-300 bg-theme-card'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-semibold text-theme-primary">{option.label}</div>
                      <div className="text-sm text-theme-secondary mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Indicator */}
              {isValid && (
                <div className="bg-theme-success/10 border border-theme-success/30 rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center space-x-2 text-theme-success">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Perfect! I have everything I need to find your ideal destinations.</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('initial')}
              className="flex items-center justify-center"
              size="lg"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={handlePreferencesNext}
              disabled={!isValid || isLoadingDestinations}
              fullWidth
              size="lg"
              className="bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                {isLoadingDestinations ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Finding Your Perfect Destinations...</span>
                  </>
                ) : (
                  <>
                    <span>Get My Personalized Suggestions</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </div>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Destinations Step
  if (currentStep === 'destinations') {
    return (
      <div className="max-w-4xl mx-auto">
        <StepProgress />
        <Card className="border-0 shadow-xl bg-theme-card">
          <CardHeader className="text-center">
            <CardTitle className="heading-h1-sm flex items-center justify-center space-x-3">
              <Globe className="w-8 h-8 text-theme-success" />
              <span>Choose Your Retirement Destination</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {aiResponse && (
                <div className="bg-theme-success/10 border border-theme-success/30 p-6 rounded-xl shadow-theme">
                  <div className="flex items-start space-x-3">
                    <Bot className="w-6 h-6 text-theme-success mt-0.5 flex-shrink-0" />
                    <p className="text-theme-success leading-relaxed">{aiResponse}</p>
                  </div>
                </div>
              )}

              {/* AI's Top Recommendation Section */}
              {costBreakdown && (
                <div className="bg-gradient-to-br from-emerald-50 to-orange-50 dark:from-emerald-950 dark:to-orange-950 border-2 border-emerald-400/50 rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-orange-500 text-white font-bold text-lg flex items-center justify-center">
                        ⭐
                      </div>
                      <div>
                        <h3 className="heading-h3 text-emerald-700 dark:text-emerald-300">AI's Top Recommendation</h3>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Based on your preferences and budget</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="heading-stat text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(costBreakdown.estimatedMonthlyCost, currency)}
                      </p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">per month</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-lg mb-2">{costBreakdown.name}</h4>
                    {costBreakdown.whyRecommended && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">{costBreakdown.whyRecommended}</p>
                    )}
                  </div>

                  {costBreakdown.comparisonToCurrentExpenses && (
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 mb-4">
                      <h5 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Cost Comparison to Your Current Expenses
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">Current Expenses</p>
                          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(costBreakdown.comparisonToCurrentExpenses.currentMonthlyExpenses, currency)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">Retirement Costs</p>
                          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(costBreakdown.comparisonToCurrentExpenses.projectedMonthlyExpenses, currency)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">Difference</p>
                          <p className={`text-lg font-bold ${
                            costBreakdown.comparisonToCurrentExpenses.difference >= 0 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {costBreakdown.comparisonToCurrentExpenses.difference >= 0 ? '+' : ''}
                            {formatCurrency(costBreakdown.comparisonToCurrentExpenses.difference, currency)}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            ({costBreakdown.comparisonToCurrentExpenses.percentageChange >= 0 ? '+' : ''}{costBreakdown.comparisonToCurrentExpenses.percentageChange.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                      {costBreakdown.comparisonToCurrentExpenses.explanation && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-700/50">
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 italic">
                            {costBreakdown.comparisonToCurrentExpenses.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      onClick={() => {
                        setDestination(costBreakdown.name);
                        setMonthlyCosts(costBreakdown.estimatedMonthlyCost);
                        setCurrentStep('cost-breakdown');
                      }}
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-orange-500 hover:from-emerald-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Choose Top Recommendation</span>
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDestination(costBreakdown.name);
                        setMonthlyCosts(costBreakdown.estimatedMonthlyCost);
                        setCurrentStep('cost-breakdown');
                      }}
                      size="lg"
                      className="border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <h4 className="heading-h4 text-theme-primary mb-2">All Destination Options</h4>
                <p className="text-theme-secondary">Compare all suggested destinations based on your preferences</p>
              </div>

              <div className="grid gap-6">
                {destinationSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-6 transition-all duration-300 bg-theme-card relative ${
                      selectedDestinationIndex === index 
                        ? 'border-green-500 shadow-xl bg-theme-tertiary' 
                        : 'border-theme hover:border-green-500 hover:shadow-lg cursor-pointer'
                    }`}
                    onClick={() => selectedDestinationIndex === null && handleDestinationSelect(suggestion, index)}
                  >
                    {/* Loading Overlay - Only show text notification, not full overlay */}
                    {selectedDestinationIndex === index && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-theme-success/10 border border-theme-success/30 rounded-lg px-3 py-1 flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-theme-success" />
                          <span className="text-sm font-medium text-theme-success">Processing...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                          selectedDestinationIndex === index 
                            ? 'bg-gradient-to-br from-green-500 to-orange-500' 
                            : 'bg-gradient-to-br from-green-400 to-orange-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="heading-h4 text-theme-primary">
                            {suggestion.destination}
                          </h4>
                          <p className="text-theme-secondary flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {suggestion.country}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="heading-stat text-theme-success">
                          {formatCurrency(suggestion.estimatedMonthlyCost, currency)}
                        </p>
                        <p className="text-sm text-theme-muted">per month</p>
                        <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                          suggestion.costOfLivingRank === 'Low' 
                            ? 'bg-theme-success/10 text-theme-success border border-theme-success/30'
                            : suggestion.costOfLivingRank === 'Medium'
                            ? 'bg-theme-warning/10 text-theme-warning border border-theme-warning/30'
                            : 'bg-theme-error/10 text-theme-error border border-theme-error/30'
                        }`}>
                          {suggestion.costOfLivingRank} Cost
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="font-semibold text-theme-secondary mb-2 flex items-center">
                          <Star className="w-4 h-4 text-theme-warning mr-1" />
                          Highlights:
                        </p>
                        <ul className="space-y-1">
                          {suggestion.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              <span className="text-theme-secondary">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-theme-tertiary rounded-lg p-3 shadow-theme-sm">
                          <p className="font-semibold text-theme-secondary">Weather:</p>
                          <p className="text-theme-secondary">{suggestion.weather}</p>
                        </div>
                        <div className="bg-theme-tertiary rounded-lg p-3 shadow-theme-sm">
                          <p className="font-semibold text-theme-secondary">Healthcare:</p>
                          <p className="text-theme-secondary">{suggestion.healthcare}</p>
                        </div>
                        <div className="bg-theme-tertiary rounded-lg p-3 shadow-theme-sm">
                          <p className="font-semibold text-theme-secondary">Visa:</p>
                          <p className="text-theme-secondary">{suggestion.visaRequirements}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-theme">
                      <Button
                        size="lg"
                        className={`w-full transition-all duration-300 ${
                          selectedDestinationIndex === index 
                            ? 'bg-green-600 hover:bg-green-700 cursor-wait' 
                            : 'bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500'
                        }`}
                        disabled={selectedDestinationIndex !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedDestinationIndex === null) {
                            handleDestinationSelect(suggestion, index);
                          }
                        }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                        {selectedDestinationIndex === index ? (
                          <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                              <span>Choose This Destination</span>
                              <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                        </div>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-6 border-t border-theme">
                <Button variant="outline" onClick={handleManualEntry} size="lg">
                  Enter My Own Destination Instead
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('initial')} 
              fullWidth 
              size="lg"
              className="flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Setup
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Manual Entry Step
  if (currentStep === 'manual-entry') {
    return (
      <div className="max-w-2xl mx-auto">
        <StepProgress />
        <Card className="border-0 shadow-xl bg-theme-card">
          <CardHeader className="text-center">
            <CardTitle className="heading-h1-sm flex items-center justify-center space-x-3">
              <MapPin className="w-8 h-8 text-theme-success" />
              <span>Enter Your Dream Destination</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-orange-400 text-white p-6 rounded-xl mb-6">
                  <h4 className="heading-h4 mb-2 text-white dark:text-white">Tell me where you'd like to retire!</h4>
                  <p className="opacity-90 text-white dark:text-white">
                    I'll analyze your chosen destination and provide detailed cost breakdowns, 
                    lifestyle information, and everything you need to know about retiring there.
                  </p>
                </div>
              </div>

              <div className="bg-theme-tertiary p-8 rounded-xl border border-theme shadow-theme">
                <label className="block text-sm font-semibold text-theme-secondary mb-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-theme-success" />
                    <span>Where would you like to retire?</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={manualDestinationInput}
                  onChange={(e) => setManualDestinationInput(e.target.value)}
                  placeholder="e.g., Lisbon, Portugal or Bali, Indonesia or New York, USA"
                  className="input-dark block w-full px-6 py-4 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && manualDestinationInput.trim()) {
                      handleManualDestinationAnalysis();
                    }
                  }}
                />
                <p className="text-sm text-theme-muted mt-3">
                  💡 Tip: Include both city and country for best results (e.g., "Barcelona, Spain")
                </p>
              </div>

              <div className="bg-theme-success/10 border border-theme-success/30 rounded-xl p-6 shadow-theme">
                <h4 className="font-semibold text-theme-success mb-3">What I'll analyze for you:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-theme-success">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Monthly living costs breakdown</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Healthcare quality & costs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Home className="w-4 h-4" />
                    <span>Housing market insights</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Visa & legal requirements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Food & dining costs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4" />
                    <span>Transportation options</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={handleManualDestinationAnalysis}
                  disabled={!manualDestinationInput.trim() || isLoadingManualAnalysis}
                  className="bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                  size="lg"
                >
                  <div className="flex items-center justify-center space-x-2">
                  {isLoadingManualAnalysis ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing {manualDestinationInput}...</span>
                    </>
                  ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        <span>Analyze This Destination</span>
                    </>
                  )}
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('initial')} 
              fullWidth 
              size="lg"
              className="flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Setup
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Cost Breakdown Step
  if (currentStep === 'cost-breakdown') {
    return (
      <div className="max-w-3xl mx-auto">
        <StepProgress />
        <Card className="border-0 shadow-xl bg-theme-card">
          <CardHeader className="text-center">
            <CardTitle className="heading-h1-sm flex items-center justify-center space-x-3">
              <DollarSign className="w-8 h-8 text-theme-success" />
              <span>Your Retirement Costs in {selectedDestination?.destination}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {isLoadingCostBreakdown ? (
                <div className="text-center p-12">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-green-600" />
                  <h3 className="heading-h3-sm text-theme-primary mb-2">Calculating your retirement costs...</h3>
                  <p className="text-theme-secondary">Analyzing the best cost breakdown for your lifestyle</p>
                </div>
              ) : (
                <>
                  {aiResponse && (
                    <div className="bg-theme-success/10 border border-theme-success/30 p-6 rounded-xl shadow-theme">
                      <div className="flex items-start space-x-3">
                        <Bot className="w-6 h-6 text-theme-success mt-0.5 flex-shrink-0" />
                        <p className="text-theme-success leading-relaxed">{aiResponse}</p>
                      </div>
                    </div>
                  )}

                  {costBreakdown && (
                    <div className="bg-theme-tertiary p-8 rounded-xl border border-theme shadow-theme">
                      <h4 className="heading-h4 text-theme-primary mb-6 text-center">Monthly Cost Breakdown</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {Object.entries(costBreakdown.breakdown).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between p-4 bg-theme-card rounded-lg shadow-sm border border-theme">
                            <div className="flex items-center space-x-3">
                              {getBreakdownIcon(category)}
                              <span className="capitalize font-semibold text-theme-secondary">{category}</span>
                            </div>
                            <span className="heading-stat-sm text-theme-primary">{formatCurrency(typeof amount === 'number' ? amount : 0, currency)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-r from-green-400 to-orange-400 text-white p-6 rounded-lg text-center">
                        <p className="text-lg font-semibold mb-2 text-white dark:text-white">Total Monthly Cost:</p>
                        <p className="heading-stat-lg text-white dark:text-white">
                          {formatCurrency(costBreakdown.estimatedMonthlyCost, currency)}
                        </p>
                      </div>
                    </div>
                  )}

                  {costBreakdown?.comparisonToCurrentExpenses && (
                    <div className="bg-theme-tertiary rounded-xl p-6 shadow-theme">
                      <h4 className="heading-h4 text-theme-primary mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-theme-success" />
                        Cost Comparison to Your Current Expenses
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-theme-card rounded-lg">
                          <p className="text-sm text-theme-secondary">Current Monthly Expenses</p>
                          <p className="heading-stat text-theme-primary">
                            {formatCurrency(costBreakdown.comparisonToCurrentExpenses.currentMonthlyExpenses, currency)}
                          </p>
                          {familyContext && (
                            <p className="text-xs text-theme-muted mt-1">(Adjusted for 2 adults)</p>
                          )}
                        </div>
                        
                        <div className="text-center p-4 bg-theme-card rounded-lg">
                          <p className="text-sm text-theme-secondary">Projected Retirement Costs</p>
                          <p className="heading-stat text-theme-primary">
                            {formatCurrency(costBreakdown.comparisonToCurrentExpenses.projectedMonthlyExpenses, currency)}
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-theme-card rounded-lg">
                          <p className="text-sm text-theme-secondary">Monthly Difference</p>
                          <p className={`heading-stat ${
                            costBreakdown.comparisonToCurrentExpenses.difference < 0 
                              ? 'text-theme-success' 
                              : 'text-theme-warning'
                          }`}>
                            {costBreakdown.comparisonToCurrentExpenses.difference < 0 ? '-' : '+'}
                            {formatCurrency(Math.abs(costBreakdown.comparisonToCurrentExpenses.difference), currency)}
                          </p>
                          <p className={`text-sm font-semibold ${
                            costBreakdown.comparisonToCurrentExpenses.difference < 0 
                              ? 'text-theme-success' 
                              : 'text-theme-warning'
                          }`}>
                            ({costBreakdown.comparisonToCurrentExpenses.percentageChange > 0 ? '+' : ''}{costBreakdown.comparisonToCurrentExpenses.percentageChange.toFixed(0)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                    <label className="block text-sm font-semibold text-theme-secondary mb-3">
                      Adjust Monthly Costs (if needed)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={monthlyCosts}
                        onChange={(e) => setMonthlyCosts(Number(e.target.value))}
                        className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        min="0"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-muted font-medium">
                        {currency.code}/month
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => setCurrentStep('final')}
                      className="bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
                      size="lg"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Looks Good - Calculate My Retirement Goal</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('destinations')} 
              fullWidth 
              size="lg"
              className="flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Choose Different Destination
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Final Step - Manual entry or confirmation
  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress />
      <Card className="border-0 shadow-xl bg-theme-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-3 text-2xl text-theme-primary">
            <Wallet className="w-8 h-8 text-theme-warning" />
            <span>Retirement Calculator (Smart 4% Rule)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
          <div className="space-y-8">
            <div className="bg-orange-500/10 border border-orange-500/30 p-6 rounded-xl shadow-theme">
              <h4 className="font-semibold text-theme-warning mb-3">About the Smart 4% Rule</h4>
              <p className="text-theme-warning leading-relaxed">
                This proven rule says you can safely withdraw 4% of your retirement savings each year 
                and your money should last 30+ years. We'll calculate how much you need to save!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                <label className="block text-sm font-semibold text-theme-secondary mb-3">
                <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-theme-info" />
                  <span>Current Age</span>
                </div>
              </label>
              <input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                min="18"
                max="100"
              />
            </div>
            
              <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                <label className="block text-sm font-semibold text-theme-secondary mb-3">
                <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-theme-warning" />
                    <span>When do you want to retire?</span>
                </div>
              </label>
              <input
                type="number"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                min={currentAge + 1}
                max="100"
              />
            </div>
          </div>

            <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
              <label className="block text-sm font-semibold text-theme-secondary mb-3">
              <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-theme-success" />
                <span>Retirement Destination</span>
              </div>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g., Bali, Portugal, Florida"
                className="input-dark block w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
          </div>

            <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
              <label className="block text-sm font-semibold text-theme-secondary mb-3">
              <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-theme-warning" />
                  <span>How much do you want to spend monthly at {destination || 'your dream destination'}?</span>
              </div>
            </label>
            <div className="relative">
              <input
                type="number"
                value={monthlyCosts}
                onChange={(e) => setMonthlyCosts(Number(e.target.value))}
                  className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                min="0"
              />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-muted font-medium">
                  {currency.code}/month
              </span>
            </div>
          </div>

            <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
              <label className="block text-sm font-semibold text-theme-secondary mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-theme-warning" />
                  <span>Expected Annual Inflation (%)</span>
                  <Shield className="w-4 h-4 text-theme-info" />
                </div>
            </label>
              
              {/* Educational Context */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4 shadow-theme-sm">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-theme-warning mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-theme-warning font-medium mb-1">
                      Smart Default: {getDefaultInflationRate(state.userProfile.location)}% for {state.userProfile.location || 'your region'}
                    </p>
                    <p className="text-theme-warning mb-2">
                      {getRegionalInflationContext(state.userProfile.location)}
                    </p>
                    <p className="text-theme-warning">
                      💡 GCC historical average: 2.1% (2010-2023) • Industry best practice: Slightly higher for safety buffer
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Options */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                {INFLATION_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 shadow-theme-sm ${
                      inflationRate === option.value
                        ? 'border-orange-500 bg-orange-500/10 shadow-theme'
                        : 'border-theme hover:border-orange-500 hover:bg-orange-500/5'
                    }`}
                    onClick={() => setInflationRate(option.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          inflationRate === option.value
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-theme-muted'
                        }`}>
                          {inflationRate === option.value && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-theme-secondary">{option.label}</p>
                          <p className="text-sm text-theme-muted">{option.description}</p>
                        </div>
                      </div>
                      {option.value === getDefaultInflationRate(state.userProfile.location) && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Input */}
              <div className="border-t border-theme pt-4">
                <label className="block text-sm font-medium text-theme-secondary mb-2">
                  Or enter custom rate:
                </label>
                <div className="relative">
            <input
              type="number"
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
                    className="input-dark block w-full px-4 py-3 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              min="0"
              max="10"
              step="0.1"
            />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-theme-muted font-medium">
                    %
                  </span>
                </div>
                <p className="text-xs text-theme-muted mt-1">
                  💡 Most financial planners use 2.5-3.5% for long-term planning
                </p>
              </div>
          </div>

            <div className="bg-theme-section border border-theme p-8 rounded-xl shadow-theme">
              <h4 className="heading-h4 text-theme-primary mb-6 text-center flex items-center justify-center">
                <Target className="w-6 h-6 mr-2" />
                Your Retirement Calculation
              </h4>
              
              {/* Impact of Inflation Visualization */}
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6 shadow-theme-sm">
                <h5 className="heading-h5-sm text-theme-warning mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  How Inflation Affects Your Retirement ({inflationRate}% annually)
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-theme-warning font-medium">Today's Purchasing Power</p>
                    <p className="heading-stat text-theme-success">{formatCurrency(monthlyCosts, currency)}</p>
                    <p className="text-theme-success text-xs">What you can buy today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-theme-warning font-medium">
                      In {familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge} Years
                    </p>
                    <p className="heading-stat text-theme-warning">
                      {formatCurrency(Math.ceil(monthlyCosts * Math.pow(1 + inflationRate/100, familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge)), currency)}
                    </p>
                    <p className="text-theme-warning text-xs">Same purchasing power</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-theme-warning">
                    📈 Your money needs to grow by {((Math.pow(1 + inflationRate/100, familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge) - 1) * 100).toFixed(0)}% 
                    just to maintain today's lifestyle
                  </p>
                </div>
              </div>

              {/* Family Retirement Timeline Visualization */}
              {familyContext && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-6 shadow-theme-sm">
                  <h5 className="heading-h5-sm text-purple-600 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Family Retirement Timeline ({familyContext.strategy === 'joint' ? 'Joint Strategy' : 'Staggered Strategy'})
                  </h5>
                  
                  {familyContext.strategy === 'staggered' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Primary Timeline */}
                        <div className="bg-theme-card border border-theme rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h6 className="font-semibold text-theme-secondary">Primary Person</h6>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Current Age:</span>
                              <span className="font-medium text-blue-600">{primaryAge} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Retirement Age:</span>
                              <span className="font-medium text-blue-600">{primaryRetirementAge} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Years to Retirement:</span>
                              <span className="font-medium text-blue-600">{primaryRetirementAge - primaryAge} years</span>
                            </div>
                          </div>
                        </div>

                        {/* Spouse Timeline */}
                        <div className="bg-theme-card border border-theme rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h6 className="font-semibold text-theme-secondary">Spouse</h6>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Current Age:</span>
                              <span className="font-medium text-green-600">{spouseAge} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Retirement Age:</span>
                              <span className="font-medium text-green-600">{spouseRetirementAge} years</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-theme-muted">Years to Retirement:</span>
                              <span className="font-medium text-green-600">{spouseRetirementAge - spouseAge} years</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Staggered Strategy Benefits */}
                      <div className="bg-theme-section border border-emerald-500/30 rounded-lg p-4">
                        <h6 className="text-sm font-semibold text-emerald-600 mb-2">✨ Staggered Retirement Benefits:</h6>
                        <ul className="text-xs text-emerald-600 space-y-1">
                          <li>• Each person retires at their optimal time</li>
                          <li>• Continued household income during transition period</li>
                          <li>• Potentially lower total savings needed</li>
                          <li>• Flexible retirement lifestyle adjustment</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Joint Retirement Summary */}
                      <div className="bg-theme-card border border-theme rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <h6 className="font-semibold text-theme-secondary">Joint Retirement Plan</h6>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-theme-muted mb-1">Primary Person:</p>
                            <p className="font-medium text-purple-600">{primaryAge} → {primaryRetirementAge} years</p>
                          </div>
                          <div>
                            <p className="text-theme-muted mb-1">Spouse:</p>
                            <p className="font-medium text-purple-600">{spouseAge} → {spouseRetirementAge} years</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-theme">
                          <div className="flex justify-between text-sm">
                            <span className="text-theme-muted">Both retire together in:</span>
                            <span className="font-bold text-purple-600">{Math.max(primaryRetirementAge - primaryAge, spouseRetirementAge - spouseAge)} years</span>
                          </div>
                        </div>
                      </div>

                      {/* Joint Strategy Benefits */}
                      <div className="bg-theme-section border border-emerald-500/30 rounded-lg p-4">
                        <h6 className="text-sm font-semibold text-emerald-600 mb-2">✨ Joint Retirement Benefits:</h6>
                        <ul className="text-xs text-emerald-600 space-y-1">
                          <li>• Start retirement journey together</li>
                          <li>• Synchronized lifestyle changes</li>
                          <li>• Shared retirement activities and travel</li>
                          <li>• Simplified financial planning</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Main Calculation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-theme-card p-4 rounded-lg border border-theme shadow-theme-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-theme-info" />
                    <p className="font-semibold text-theme-secondary">Time Horizon</p>
                </div>
                  <p className="heading-stat text-theme-info">
                    {familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge} years
                  </p>
                  <p className="text-theme-info text-xs">To build your retirement fund</p>
                </div>
                
                <div className="bg-theme-card p-4 rounded-lg border border-theme shadow-theme-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-theme-success" />
                    <p className="font-semibold text-theme-secondary">Monthly Budget (Today)</p>
                  </div>
                  <p className="heading-stat text-theme-success">{formatCurrency(monthlyCosts, currency)}</p>
                  <p className="text-theme-success text-xs">Current purchasing power</p>
                </div>
                
                <div className="bg-theme-card p-4 rounded-lg border border-theme shadow-theme-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-theme-warning" />
                    <p className="font-semibold text-theme-secondary">Future Monthly Need</p>
                  </div>
                  <p className="heading-stat text-theme-warning">
                    {formatCurrency(Math.ceil(monthlyCosts * Math.pow(1 + inflationRate/100, familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge)), currency)}
                  </p>
                  <p className="text-theme-warning text-xs">Inflation-adjusted amount</p>
                </div>
                
                <div className="bg-theme-card p-4 rounded-lg border border-theme shadow-theme-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-theme-success" />
                    <p className="font-semibold text-theme-secondary">Total Retirement Goal</p>
                  </div>
                  <p className="heading-stat text-theme-success">
                    {formatCurrency(Math.ceil(monthlyCosts * 12 * Math.pow(1 + inflationRate/100, familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge) * 25), currency)}
                  </p>
                  <p className="text-theme-success text-xs">Using 4% withdrawal rule</p>
                </div>
              </div>

              {/* 4% Rule Explanation */}
              <div className="mt-6 bg-theme-success/10 border border-theme-success/30 rounded-lg p-4 shadow-theme-sm">
                <h6 className="heading-h6 text-theme-info mb-2 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Why the 4% Rule Works
                </h6>
                <p className="text-xs text-theme-info leading-relaxed">
                  With your target amount, you can withdraw 4% annually ({formatCurrency(Math.ceil(monthlyCosts * 12 * Math.pow(1 + inflationRate/100, familyContext ? getEffectiveRetirementInfo().yearsToRetirement : retirementAge - currentAge) * 25 * 0.04), currency)}/year) 
                  and your savings should last 30+ years while growing with investments.
                </p>
              </div>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex space-x-4 w-full">
            <Button 
              variant="outline" 
              onClick={() => {
                // Determine where to go back based on the flow
                if (selectedDestination || costBreakdown) {
                  // Came from cost breakdown
                  setCurrentStep('cost-breakdown');
                } else if (destinationSuggestions.length > 0) {
                  // Came from AI destinations
                  setCurrentStep('destinations');
                } else {
                  // Direct manual entry or cancel
                  onCancel();
                }
              }}
              className="flex items-center justify-center"
              size="lg"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              {selectedDestination || costBreakdown ? 'Back to Cost Analysis' : 
               destinationSuggestions.length > 0 ? 'Back to Destinations' : 'Cancel'}
          </Button>
          <Button
            onClick={calculateRetirementNeeds}
            disabled={!destination || monthlyCosts <= 0}
            fullWidth
              size="lg"
              className="bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>Calculate & Add Goal</span>
              <CheckCircle className="w-5 h-5" />
            </div>
          </Button>
        </div>
      </CardFooter>
    </Card>
    </div>
  );
};

export default RetirementCalculator;