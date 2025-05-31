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
  Shield
} from 'lucide-react';
import { aiService, RetirementPlanningResponse, RetirementDestinationSuggestion, RetirementButton } from '../../services/aiService';

interface RetirementCalculatorProps {
  onCalculate: (amount: number, targetDate: Date) => void;
  onCancel: () => void;
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

const RetirementCalculator: React.FC<RetirementCalculatorProps> = ({ onCalculate, onCancel }) => {
  const { currency } = useCurrency();
  const { state } = usePlanner();
  const [currentStep, setCurrentStep] = useState<'initial' | 'destinations' | 'manual-entry' | 'cost-breakdown' | 'final'>('initial');
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [destination, setDestination] = useState('');
  const [monthlyCosts, setMonthlyCosts] = useState(0);
  
  // Smart inflation rate default based on user's location
  const [inflationRate, setInflationRate] = useState(() => 
    getDefaultInflationRate(state.userProfile.location)
  );
  
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

  // Get AI context from planner state
  const getAIContext = () => ({
    name: state.userProfile.name,
    nationality: state.userProfile.nationality,
    location: state.userProfile.location,
    monthlyIncome: state.userProfile.monthlyIncome,
    monthlyExpenses: state.monthlyExpenses,
    currency: currency.code,
    currentStep: 'retirement-plan',
    goals: state.goals
  });

  const handleGetDestinationSuggestions = async () => {
    setIsLoadingDestinations(true);
    try {
      const response = await aiService.getRetirementDestinationSuggestions(getAIContext());
      setDestinationSuggestions(response.destinationSuggestions || []);
      setAiResponse(response.message);
      setCurrentStep('destinations');
    } catch (error) {
      console.error('Error getting destination suggestions:', error);
      setAiResponse("I'm having trouble getting destination suggestions. You can proceed manually.");
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  const handleDestinationSelect = async (suggestion: RetirementDestinationSuggestion, index: number) => {
    // Set loading state immediately for the clicked card
    setSelectedDestinationIndex(index);
    setIsLoadingCostBreakdown(true);
    
    setSelectedDestination(suggestion);
    setDestination(suggestion.destination);
    setMonthlyCosts(suggestion.estimatedMonthlyCost);
    
    try {
      const response = await aiService.getRetirementCostBreakdown(suggestion.destination, getAIContext());
      setCostBreakdown(response.selectedDestination);
      if (response.selectedDestination?.estimatedMonthlyCost) {
        setMonthlyCosts(response.selectedDestination.estimatedMonthlyCost);
      }
      setAiResponse(response.message);
      setCurrentStep('cost-breakdown');
    } catch (error) {
      console.error('Error getting cost breakdown:', error);
      setCurrentStep('final');
    } finally {
      setIsLoadingCostBreakdown(false);
      setSelectedDestinationIndex(null);
    }
  };

  const handleManualEntry = () => {
    setCurrentStep('manual-entry');
  };

  const handleManualDestinationAnalysis = async () => {
    if (!manualDestinationInput.trim()) return;
    
    setIsLoadingManualAnalysis(true);
    setDestination(manualDestinationInput.trim());
    
    try {
      // Create a mock destination suggestion for the manual entry
      const manualDestination: RetirementDestinationSuggestion = {
        destination: manualDestinationInput.trim(),
        country: manualDestinationInput.trim().split(',')[1]?.trim() || manualDestinationInput.trim(),
        estimatedMonthlyCost: 1500, // Default estimate
        costOfLivingRank: "Medium" as const,
        highlights: ["Your chosen destination", "Requires cost analysis", "Personalized choice"],
        weather: "Analyzing...",
        healthcare: "Analyzing...",
        visaRequirements: "Analyzing..."
      };
      
      setSelectedDestination(manualDestination);
      
      // Get AI analysis for the manual destination
      const response = await aiService.getRetirementCostBreakdown(manualDestinationInput.trim(), getAIContext());
      setCostBreakdown(response.selectedDestination);
      if (response.selectedDestination?.estimatedMonthlyCost) {
        setMonthlyCosts(response.selectedDestination.estimatedMonthlyCost);
      } else {
        setMonthlyCosts(1500); // Default fallback
      }
      setAiResponse(response.message);
      setCurrentStep('cost-breakdown');
    } catch (error) {
      console.error('Error analyzing manual destination:', error);
      // Fallback to final step if AI analysis fails
      setMonthlyCosts(1500);
      setCurrentStep('final');
    } finally {
      setIsLoadingManualAnalysis(false);
    }
  };

  const calculateRetirementNeeds = () => {
    const yearsUntilRetirement = retirementAge - currentAge;
    
    // Calculate future monthly costs accounting for inflation
    const futureMonthlyCosts = monthlyCosts * Math.pow(1 + inflationRate/100, yearsUntilRetirement);
    
    // Calculate annual expenses
    const annualExpenses = futureMonthlyCosts * 12;
    
    // Using the 4% rule: multiply annual expenses by 25
    const totalNeeded = Math.ceil(annualExpenses * 25);
    
    // Set target date to retirement age
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + yearsUntilRetirement);
    
    onCalculate(totalNeeded, targetDate);
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
    const steps = ['Setup', 'Destinations', 'Cost Analysis', 'Summary'];
    const stepMap = {
      'initial': 0,
      'destinations': 1,
      'manual-entry': 1, // Manual entry is same level as destinations
      'cost-breakdown': 2,
      'final': 3
    };
    const currentStepIndex = stepMap[currentStep];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                index <= currentStepIndex 
                  ? 'bg-gradient-to-r from-green-400 to-orange-400 text-white' 
                  : 'bg-theme-tertiary text-theme-muted'
              }`}>
                {index < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`ml-2 font-medium ${
                index <= currentStepIndex ? 'text-green-500' : 'text-theme-muted'
              }`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-4 ${
                  index < currentStepIndex ? 'text-green-500' : 'text-theme-muted'
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
                <div className="bg-theme-tertiary p-6 rounded-xl shadow-md">
                  <label className="block text-sm font-semibold text-theme-secondary mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-theme-info" />
                      <span>Your Current Age</span>
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
                      <Clock className="w-5 h-5 text-theme-success" />
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
                    onClick={handleGetDestinationSuggestions}
                    disabled={isLoadingDestinations || retirementAge <= currentAge}
                    className="bg-gradient-to-r from-green-400 to-orange-400 hover:from-green-500 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 flex-1 py-3"
                    size="lg"
                  >
                    <div className="flex items-center justify-center space-x-2">
                    {isLoadingDestinations ? (
                      <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Getting tips...</span>
                      </>
                    ) : (
                      <>
                          <Sparkles className="w-5 h-5" />
                          <span>Get AI Destination Suggestions</span>
                      </>
                    )}
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
                    <p className="text-theme-warning font-medium">In {retirementAge - currentAge} Years</p>
                    <p className="heading-stat text-theme-warning">
                      {formatCurrency(Math.ceil(monthlyCosts * Math.pow(1 + inflationRate/100, retirementAge - currentAge)), currency)}
                    </p>
                    <p className="text-theme-warning text-xs">Same purchasing power</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-theme-warning">
                    📈 Your money needs to grow by {((Math.pow(1 + inflationRate/100, retirementAge - currentAge) - 1) * 100).toFixed(0)}% 
                    just to maintain today's lifestyle
                  </p>
                </div>
              </div>

              {/* Main Calculation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-theme-card p-4 rounded-lg border border-theme shadow-theme-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-theme-info" />
                    <p className="font-semibold text-theme-secondary">Time Horizon</p>
                </div>
                  <p className="heading-stat text-theme-info">{retirementAge - currentAge} years</p>
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
                    {formatCurrency(Math.ceil(monthlyCosts * Math.pow(1 + inflationRate/100, retirementAge - currentAge)), currency)}
                  </p>
                  <p className="text-theme-warning text-xs">Inflation-adjusted amount</p>
                </div>
                
                <div className="bg-theme-card p-4 rounded-lg border border-theme shadow-theme-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-theme-success" />
                    <p className="font-semibold text-theme-secondary">Total Retirement Goal</p>
                  </div>
                  <p className="heading-stat text-theme-success">
                    {formatCurrency(Math.ceil(monthlyCosts * 12 * Math.pow(1 + inflationRate/100, retirementAge - currentAge) * 25), currency)}
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
                  With your target amount, you can withdraw 4% annually ({formatCurrency(Math.ceil(monthlyCosts * 12 * Math.pow(1 + inflationRate/100, retirementAge - currentAge) * 25 * 0.04), currency)}/year) 
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