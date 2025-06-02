import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import AIGuidance from '../AIGuidance';
import { formatPercentage } from '../../utils/calculations';
import { Profile, DEFAULT_RATES } from '../../types/plannerTypes';
import { Settings, X } from 'lucide-react';

interface RiskReturnsSectionProps {
  onNext: () => void;
  onBack: () => void;
}

interface RateEditorProps {
  goalId: string;
  profile: Profile;
  customRates?: { high: number; mid: number; low: number };
  onSave: (rates: { high: number; mid: number; low: number }) => void;
  onClose: () => void;
}

const RateEditor: React.FC<RateEditorProps> = ({ goalId, profile, customRates, onSave, onClose }) => {
  const defaultRates = customRates || DEFAULT_RATES[profile];
  const [rates, setRates] = useState({
    high: defaultRates.high * 100,
    mid: defaultRates.mid * 100,
    low: defaultRates.low * 100
  });

  const handleSave = () => {
    onSave({
      high: rates.high / 100,
      mid: rates.mid / 100,
      low: rates.low / 100
    });
  };

  return (
    <div className="bg-theme-tertiary p-3 lg:p-4 rounded-lg shadow-lg border border-theme">
      <div className="flex justify-between items-center mb-3 lg:mb-4">
        <h3 className="text-base lg:text-lg font-medium text-theme-primary">Customize Return Rates</h3>
        <button onClick={onClose} className="text-theme-muted hover:text-theme-secondary transition-colors">
          <X className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </div>

      <div className="space-y-3 lg:space-y-4">
        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">
            High Return Rate (%)
          </label>
          <input
            type="number"
            value={rates.high}
            onChange={(e) => setRates(prev => ({ ...prev, high: Number(e.target.value) }))}
            step="0.1"
            min="0"
            max="15"
            className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">
            Mid Return Rate (%)
          </label>
          <input
            type="number"
            value={rates.mid}
            onChange={(e) => setRates(prev => ({ ...prev, mid: Number(e.target.value) }))}
            step="0.1"
            min="0"
            max="15"
            className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-secondary mb-1">
            Low Return Rate (%)
          </label>
          <input
            type="number"
            value={rates.low}
            onChange={(e) => setRates(prev => ({ ...prev, low: Number(e.target.value) }))}
            step="0.1"
            min="0"
            max="15"
            className="input-dark block w-full px-3 py-3 lg:py-2 text-base lg:text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

const RiskReturnsSection: React.FC<RiskReturnsSectionProps> = ({ onNext, onBack }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  const [editingRates, setEditingRates] = useState<string | null>(null);

  // Automatically fix goals with incorrect return phases when component loads
  useEffect(() => {
    // Find goals that need updating due to hardcoded rates
    const goalsNeedingUpdate = state.goals.filter(goal => {
      const expectedRates = DEFAULT_RATES[goal.profile];
      
      // Check for retirement goals with single hardcoded 0.07 rate
      if (goal.category === 'Retirement' && 
          goal.returnPhases.length === 1 && 
          goal.returnPhases[0].rate === 0.07) {
        console.log(`Detected retirement goal with hardcoded 0.07 rate: ${goal.name}`);
        return true;
      }
      
      // Check for any goals with rates that don't match DEFAULT_RATES
      const hasIncorrectRates = goal.returnPhases.some(phase => {
        const rateExists = Object.values(expectedRates).some(expectedRate => 
          Math.abs(expectedRate - phase.rate) < 0.001 // Allow for small floating point differences
        );
        return !rateExists && phase.rate !== 0.02; // 0.02 is the drawdown rate, which is valid
      });
      
      if (hasIncorrectRates) {
        console.log(`Detected goal with incorrect rates: ${goal.name}`, {
          currentRates: goal.returnPhases.map(p => p.rate),
          expectedRates: Object.values(expectedRates)
        });
        return true;
      }
      
      return false;
    });

    // Update goals that need fixing
    if (goalsNeedingUpdate.length > 0) {
      console.log(`Auto-fixing ${goalsNeedingUpdate.length} goals with incorrect return phases`);
      
      goalsNeedingUpdate.forEach(goal => {
        dispatch({
          type: 'UPDATE_GOAL_PROFILE',
          payload: { id: goal.id, profile: goal.profile }
        });
      });
    }
  }, [state.goals, dispatch]);

  const handleProfileChange = (goalId: string, profile: Profile) => {
    dispatch({
      type: 'UPDATE_GOAL_PROFILE',
      payload: { id: goalId, profile },
    });
  };

  const handleRateChange = (goalId: string, rates: { high: number; mid: number; low: number }) => {
    dispatch({
      type: 'UPDATE_GOAL_RATES',
      payload: { id: goalId, rates },
    });
    setEditingRates(null);
  };

  // Sort goals by target date
  const sortedGoals = [...state.goals].sort(
    (a, b) => a.targetDate.getTime() - b.targetDate.getTime()
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 lg:px-0">
      {/* Enhanced Introduction Section for Novice Users */}
      <div className="text-center mb-8 lg:mb-10">
        <h2 className="text-2xl lg:text-3xl font-bold text-theme-primary mb-4 lg:mb-6">
          🎯 Investment Strategy & Risk Settings
        </h2>
        <p className="text-base lg:text-lg text-theme-secondary mb-6 max-w-3xl mx-auto leading-relaxed">
          Here's how we'll invest your money to reach each goal. We've chosen the best strategy for each goal's timeline, 
          but you can adjust these settings if you prefer a different approach.
        </p>
      </div>

      {/* Educational Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">🛡️</span>
              </div>
              <h3 className="font-semibold text-blue-600">Conservative (Low Risk)</h3>
              <div className="text-sm text-theme-secondary space-y-1">
                <p><strong>Returns:</strong> 2-4% annually</p>
                <p><strong>Risk:</strong> Very low chance of loss</p>
                <p><strong>Best for:</strong> Goals within 3 years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">⚖️</span>
              </div>
              <h3 className="font-semibold text-green-600">Balanced (Medium Risk)</h3>
              <div className="text-sm text-theme-secondary space-y-1">
                <p><strong>Returns:</strong> 3-6% annually</p>
                <p><strong>Risk:</strong> Some ups and downs</p>
                <p><strong>Best for:</strong> Goals in 3-7 years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-sm">🚀</span>
              </div>
              <h3 className="font-semibold text-yellow-600">Growth (Higher Risk)</h3>
              <div className="text-sm text-theme-secondary space-y-1">
                <p><strong>Returns:</strong> 5-8% annually</p>
                <p><strong>Risk:</strong> More volatility, higher potential</p>
                <p><strong>Best for:</strong> Goals 7+ years away</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Investment Strategy Explanation */}
      <Card className="border-purple-500/30 bg-purple-500/5 mb-8">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-purple-600 mb-6 text-center">
            ⏰ How Time Shapes Your Investment Strategy
          </h3>
          
          {/* Main Concept */}
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm text-theme-secondary mb-2">
              The more time you have until your goal, the more investment risk you can handle - because you have time to recover from temporary losses.
            </p>
            <p className="text-xs text-theme-muted">
              We automatically adjust your strategy as you get closer to your goal date, maximizing growth when you have time and preserving capital when you don't.
            </p>
          </div>

          {/* Time-Based Strategy Examples */}
          <div className="space-y-6">
            
            {/* Short-term Goals (0-3 years) */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">0-3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-theme-primary">Short-term Goals (0-3 years)</h4>
                    <p className="text-xs text-theme-muted">Emergency Fund, Vacation, Wedding</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">2-4%</div>
                  <div className="text-xs text-theme-muted">Conservative Strategy</div>
                </div>
              </div>
              
              {/* Visual Timeline */}
              <div className="mb-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    🛡️ Conservative (2-4% returns) - Safe & Stable
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-theme-muted">
                  <span>Today</span>
                  <span>Goal Date</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">🛡️ Conservative Strategy</div>
                  <div className="text-blue-700 dark:text-blue-300 text-xs">
                    • High-yield savings accounts<br/>
                    • Fixed deposits & bonds<br/>
                    • Capital protection priority
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                  <div className="font-medium text-red-800 dark:text-red-200 mb-1">⚠️ Why Conservative?</div>
                  <div className="text-red-700 dark:text-red-300 text-xs">
                    • No time to recover losses<br/>
                    • Need money soon<br/>
                    • Certainty over growth
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                  <div className="font-medium text-green-800 dark:text-green-200 mb-1">💰 Example Result</div>
                  <div className="text-green-700 dark:text-green-300 text-xs">
                    • KWD 300/month @ 3%<br/>
                    • After 2 years: ~KWD 7,380<br/>
                    • Money safe when needed
                  </div>
                </div>
              </div>
            </div>

            {/* Medium-term Goals (3-7 years) */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3-7</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-theme-primary">Medium-term Goals (3-7 years)</h4>
                    <p className="text-xs text-theme-muted">Car Purchase, Home Down Payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">3-6%</div>
                  <div className="text-xs text-theme-muted">Balanced Strategy</div>
                </div>
              </div>
              
              {/* Visual Timeline with Two Phases */}
              <div className="mb-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex">
                  <div className="h-full bg-green-600 flex-grow flex items-center justify-center text-white text-sm font-medium">
                    ⚖️ Balanced Phase (3-6%)
                  </div>
                  <div className="h-full bg-blue-600 w-1/3 flex items-center justify-center text-white text-sm font-medium">
                    🛡️ Safety Phase
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-theme-muted">
                  <span>Today</span>
                  <span>Switch to Safe (Last 2 years)</span>
                  <span>Goal Date</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                  <div className="font-medium text-green-800 dark:text-green-200 mb-1">⚖️ Balanced Strategy</div>
                  <div className="text-green-700 dark:text-green-300 text-xs">
                    • Mix of stocks & bonds<br/>
                    • Moderate growth potential<br/>
                    • Reduced volatility risk
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">🎯 Smart Transition</div>
                  <div className="text-yellow-700 dark:text-yellow-300 text-xs">
                    • Start balanced for growth<br/>
                    • Switch to safe 2 years before<br/>
                    • Best of both approaches
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">💰 Example Result</div>
                  <div className="text-blue-700 dark:text-blue-300 text-xs">
                    • KWD 200/month @ 5%<br/>
                    • After 5 years: ~KWD 13,270<br/>
                    • Protected final 2 years
                  </div>
                </div>
              </div>
            </div>

            {/* Long-term Goals (7+ years) */}
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">7+</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-theme-primary">Long-term Goals (7+ years)</h4>
                    <p className="text-xs text-theme-muted">Retirement, Children's University</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">5-8%</div>
                  <div className="text-xs text-theme-muted">Growth Strategy</div>
                </div>
              </div>
              
              {/* Visual Timeline with Three Phases */}
              <div className="mb-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex">
                  <div className="h-full bg-yellow-500 flex-grow flex items-center justify-center text-white text-sm font-medium">
                    🚀 Growth (5-8%)
                  </div>
                  <div className="h-full bg-green-600 w-1/4 flex items-center justify-center text-white text-sm font-medium">
                    ⚖️ Balanced
                  </div>
                  <div className="h-full bg-blue-600 w-1/5 flex items-center justify-center text-white text-sm font-medium">
                    🛡️ Safe
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-theme-muted">
                  <span>Today</span>
                  <span>Middle Years</span>
                  <span>Near Goal</span>
                  <span>Goal Date</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">🚀 High Growth Strategy</div>
                  <div className="text-yellow-700 dark:text-yellow-300 text-xs">
                    • Stocks & equity investments<br/>
                    • Market volatility acceptable<br/>
                    • Maximum compound growth
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                  <div className="font-medium text-green-800 dark:text-green-200 mb-1">🎢 Three-Phase Journey</div>
                  <div className="text-green-700 dark:text-green-300 text-xs">
                    • Early: Maximum growth potential<br/>
                    • Middle: Balanced for stability<br/>
                    • Final: Conservative protection
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">💰 Example Result</div>
                  <div className="text-blue-700 dark:text-blue-300 text-xs">
                    • KWD 100/month @ 7%<br/>
                    • After 10 years: ~KWD 17,300<br/>
                    • After 20 years: ~KWD 52,400
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Key Principles Summary */}
          <div className="mt-6 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h5 className="font-semibold text-purple-800 dark:text-purple-200 text-center mb-3">🎯 The Golden Rule of Time & Risk</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl">⏰</div>
                <div className="text-sm font-medium text-theme-primary">More Time</div>
                <div className="text-xs text-theme-secondary">= Can handle more risk<br/>= Higher potential returns</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">⚖️</div>
                <div className="text-sm font-medium text-theme-primary">Balanced Time</div>
                <div className="text-xs text-theme-secondary">= Moderate risk<br/>= Steady reliable growth</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🏃‍♂️</div>
                <div className="text-sm font-medium text-theme-primary">Less Time</div>
                <div className="text-xs text-theme-secondary">= Safety first<br/>= Preserve what you have</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase-Based Strategy Explanation */}
      <Card className="border-gray-500/30 bg-gray-500/5 mb-8">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-theme-primary">🎢 Phase-Based Approach</h4>
            <ul className="text-sm text-theme-secondary space-y-2">
              <li>• <strong>Early Years:</strong> Higher growth to maximize time</li>
              <li>• <strong>Middle Years:</strong> Balanced approach for steady growth</li>
              <li>• <strong>Near Target:</strong> Conservative to protect your money</li>
              <li>• <strong>Payment Period:</strong> Safe investments while you use the money</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-theme-primary">🎯 Why This Works</h4>
            <ul className="text-sm text-theme-secondary space-y-2">
              <li>• <strong>Time = Safety:</strong> More time means we can take more risk for higher returns</li>
              <li>• <strong>Less Time = Caution:</strong> Near your goal date, we protect what you've built</li>
              <li>• <strong>Automatic Adjustment:</strong> Strategy becomes more conservative as you get closer</li>
              <li>• <strong>Proven Method:</strong> This is how financial professionals manage money</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Customization Guidance */}
      <Card className="border-orange-500/30 bg-orange-500/5 mb-8">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-orange-600 mb-4 text-center">
            🛠️ Want to Customize? Here's What You Should Know
          </h3>
          <div className="space-y-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-theme-primary mb-2">✅ When to Consider Changing Settings:</h4>
              <ul className="text-sm text-theme-secondary space-y-1">
                <li>• You're very conservative and want lower risk even if it means lower returns</li>
                <li>• You're comfortable with market volatility and want to maximize growth potential</li>
                <li>• You have specific investment knowledge or preferences</li>
                <li>• Your financial situation has unique requirements</li>
              </ul>
            </div>
            <div className="bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-600 mb-2">⚠️ Important Reminders:</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Our recommendations are based on proven financial principles</li>
                <li>• Being too conservative might mean you don't reach your goals</li>
                <li>• Being too aggressive near your goal date increases risk of loss</li>
                <li>• You can always ask our AI assistant for personalized advice</li>
              </ul>
            </div>
            <div className="text-center">
              <p className="text-sm text-theme-secondary mb-3">
                💬 <strong>Not sure what to choose?</strong> Use the AI assistant below for personalized guidance.
              </p>
              <p className="text-xs text-theme-muted">
                Click the ⚙️ <strong>Customize</strong> button next to any goal to adjust its investment strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRESERVE EXISTING GOAL CARDS WITH INVESTMENT PHASES */}
      <div className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
        {sortedGoals.map((goal) => {
          const years = Math.floor(goal.horizonMonths / 12);
          const months = goal.horizonMonths % 12;
          const timeframe = `${years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : ''} ${months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : ''}`.trim();
          const hasPaymentPeriod = goal.paymentFrequency && goal.paymentFrequency !== 'Once';

          // Get recommendation explanation
          const getRecommendationExplanation = () => {
            if (goal.id === 'emergency-fund') {
              return "Emergency funds need to be completely safe and instantly accessible, so we always use conservative investments like savings accounts.";
            }
            
            if (years <= 3) {
              return `Since you need this money in ${timeframe}, we recommend a Conservative approach to protect your savings from short-term market volatility.`;
            } else if (years <= 7) {
              return `With ${timeframe} to save, we recommend a Balanced approach - starting with some growth potential but becoming more conservative as you get closer to your goal.`;
            } else {
              return `Since you have ${timeframe} to save, we recommend a Growth approach - maximizing growth potential early on, then gradually becoming more conservative as your goal approaches.`;
            }
          };

          return (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  <div className="space-y-1">
                    <span className="text-base lg:text-lg">{goal.name} ({timeframe})</span>
                    {!goal.id.includes('emergency-fund') && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-theme-muted">Recommended:</span>
                        <span className={`text-sm font-semibold ${
                          goal.profile === 'Conservative' ? 'text-blue-600' :
                          goal.profile === 'Balanced' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {goal.profile}
                        </span>
                      </div>
                    )}
                  </div>
                  {!goal.id.includes('emergency-fund') && (
                    <button
                      onClick={() => setEditingRates(goal.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-theme-tertiary hover:bg-theme-card border border-theme rounded-md text-sm text-theme-secondary hover:text-theme-primary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Customize
                    </button>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {/* Explanation Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Why this strategy:</strong> {getRecommendationExplanation()}
                  </p>
                </div>

                {/* PRESERVE ALL EXISTING GOAL CONTENT */}
                {goal.id === 'emergency-fund' ? (
                  <div className="mb-3 lg:mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2 lg:mb-3 gap-2 sm:gap-0">
                      <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
                        Conservative ({goal.selectedBank ? 
                          `${(goal.selectedBank.returnRate * 100).toFixed(1)}% p.a. - ${goal.selectedBank.bankName}` : 
                          '1% p.a.'
                        })
                      </span>
                      <span className="text-xs lg:text-sm text-theme-muted sm:ml-2">
                        Emergency funds should always stay in safe, liquid investments
                      </span>
                    </div>
                    {goal.selectedBank && (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2 lg:p-3 mb-2 lg:mb-3 shadow-theme-sm">
                        <div className="text-xs lg:text-sm text-green-600">
                          <strong>Selected Bank:</strong> {goal.selectedBank.bankName} - {goal.selectedBank.accountType}
                          <br />
                          <strong>Interest Rate:</strong> {goal.selectedBank.interestRate}
                          <br />
                          <strong>Features:</strong> {goal.selectedBank.features}
                        </div>
                      </div>
                    )}
                    <div className="h-3 lg:h-4 bg-white dark:bg-gray-800 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <div className="h-full bg-blue-600 rounded-full flex-shrink-0" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                ) : hasPaymentPeriod ? (
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2 lg:mb-3 gap-2 sm:gap-0">
                      <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
                        {goal.paymentFrequency} payments over {goal.paymentPeriod} years
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3 text-theme-primary">Accumulation Phase Risk Profile</h4>
                      <div className="flex space-x-2 mb-4">
                        {['Conservative', 'Balanced', 'Growth'].map((profile) => (
                          <button
                            key={profile}
                            onClick={() => handleProfileChange(goal.id, profile as Profile)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                              goal.profile === profile
                                ? profile === 'Conservative'
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : profile === 'Balanced'
                                  ? 'bg-teal-600 text-white shadow-lg'
                                  : 'bg-yellow-500 text-white shadow-lg'
                                : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-card border border-theme'
                            }`}
                          >
                            {profile}
                          </button>
                        ))}
                      </div>
                    </div>

                    {editingRates === goal.id ? (
                      <RateEditor
                        goalId={goal.id}
                        profile={goal.profile}
                        customRates={goal.customRates}
                        onSave={(rates) => handleRateChange(goal.id, rates)}
                        onClose={() => setEditingRates(null)}
                      />
                    ) : (
                      <>
                        <div className="bg-theme-tertiary p-4 rounded-lg shadow-theme">
                          <h4 className="font-medium mb-2 text-theme-primary">Investment Phases Timeline</h4>
                          <div className="space-y-2">
                            {/* Show accumulation phases (excluding the last phase which is drawdown) */}
                            {goal.returnPhases.slice(0, -1).map((phase, index) => {
                              const years = goal.horizonMonths / 12;
                              let phaseName = '';
                              
                              if (years <= 3) {
                                phaseName = 'Conservative Accumulation';
                              } else if (years <= 7) {
                                phaseName = index === 0 ? 'Growth Accumulation' : 'Conservative Pre-Target';
                              } else {
                                phaseName = index === 0 ? 'Growth Accumulation' : 
                                          index === 1 ? 'Balanced Accumulation' : 'Preservation Pre-Target';
                              }
                              
                              return (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-theme-secondary">{phaseName}:</span>
                                  <span className="font-medium text-theme-primary">
                                    {formatPercentage(phase.rate)} p.a.
                                  </span>
                                </div>
                              );
                            })}
                            <div className="flex justify-between text-sm">
                              <span className="text-theme-secondary">Drawdown Phase:</span>
                              <span className="font-medium text-theme-primary">2.0% p.a.</span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="h-4 bg-white dark:bg-gray-800 rounded-full overflow-hidden flex border-2 border-gray-300 dark:border-gray-600">
                              {goal.returnPhases.map((phase, index) => {
                                const isDrawdown = index === goal.returnPhases.length - 1;
                                
                                // Simple equal distribution with minimum visibility
                                const totalPhases = goal.returnPhases.length;
                                let width = Math.max(20, 100 / totalPhases); // Each segment gets equal space with 20% minimum
                                
                                let bgColor = '';
                                if (isDrawdown) {
                                  bgColor = 'bg-red-600'; // Drawdown phase - strong red
                                } else if (phase.rate > 0.07) {
                                  bgColor = 'bg-yellow-500'; // Growth (>7%) - bright yellow
                                } else if (phase.rate >= 0.045) {
                                  bgColor = 'bg-green-600'; // Balanced (4.5-7%) - strong green
                                } else {
                                  bgColor = 'bg-blue-600'; // Conservative (<4.5%) - strong blue
                                }
                                
                                return (
                                  <div
                                    key={index}
                                    className={`h-full ${bgColor} ${index > 0 ? 'border-l border-white dark:border-gray-800' : ''}`}
                                    style={{ width: `${width}%` }}
                                  ></div>
                                );
                              })}
                            </div>
                            <div className="flex justify-between mt-1 text-xs text-theme-muted">
                              <span>Now</span>
                              <span>Target Date</span>
                              <span>End of Payments</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-theme-secondary mt-2">
                          <p>
                            {(() => {
                              const years = goal.horizonMonths / 12;
                              if (years <= 3) {
                                return 'Short-term goal with conservative accumulation to preserve capital before payments begin.';
                              } else if (years <= 7) {
                                return 'Medium-term goal with initial growth phase followed by capital preservation as target date approaches.';
                              } else {
                                return 'Long-term goal with multi-phase strategy: growth, balanced, then preservation phases before transitioning to drawdown.';
                              }
                            })()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        {['Conservative', 'Balanced', 'Growth'].map((profile) => (
                          <button
                            key={profile}
                            onClick={() => handleProfileChange(goal.id, profile as Profile)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                              goal.profile === profile
                                ? profile === 'Conservative'
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : profile === 'Balanced'
                                  ? 'bg-teal-600 text-white shadow-lg'
                                  : 'bg-yellow-500 text-white shadow-lg'
                                : 'bg-theme-tertiary text-theme-secondary hover:bg-theme-card border border-theme'
                            }`}
                          >
                            {profile}
                          </button>
                        ))}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-theme-secondary">Recommended: </span>
                        <span className="text-blue-600 font-medium">
                          {goal.horizonMonths < 36
                            ? 'Conservative'
                            : goal.horizonMonths < 84
                            ? 'Balanced'
                            : 'Growth'}
                        </span>
                      </div>
                    </div>

                    {editingRates === goal.id ? (
                      <RateEditor
                        goalId={goal.id}
                        profile={goal.profile}
                        customRates={goal.customRates}
                        onSave={(rates) => handleRateChange(goal.id, rates)}
                        onClose={() => setEditingRates(null)}
                      />
                    ) : (
                      <>
                        <div className="bg-theme-tertiary p-4 rounded-lg shadow-theme mb-4">
                          <h4 className="font-medium mb-2 text-theme-primary">Investment Phases Timeline</h4>
                          <div className="space-y-2">
                            {goal.returnPhases.map((phase, index) => {
                              const years = goal.horizonMonths / 12;
                              let phaseName = '';
                              
                              if (years <= 3) {
                                phaseName = 'Conservative';
                              } else if (index === 0) {
                                phaseName = 'Growth Phase';
                              } else if (index === 1) {
                                phaseName = goal.returnPhases.length === 2 ? 'Conservative Phase' : 'Balanced Phase';
                              } else {
                                phaseName = 'Conservative Phase';
                              }
                              
                              return (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-theme-secondary">{phaseName}:</span>
                                  <span className="font-medium text-theme-primary">
                                    {formatPercentage(phase.rate)} p.a.
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mb-2">
                          <div className="h-4 bg-white dark:bg-gray-800 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex">
                            {goal.returnPhases.map((phase, index) => {
                              // Simple equal distribution - each phase gets equal space  
                              const totalPhases = goal.returnPhases.length;
                              let width = Math.max(20, 100 / totalPhases); // Each segment gets equal space with 20% minimum
                              
                              let bgColor = '';
                              if (phase.rate >= 0.07) bgColor = 'bg-yellow-500'; // Growth - bright yellow
                              else if (phase.rate >= 0.05) bgColor = 'bg-green-600'; // Balanced - strong green
                              else bgColor = 'bg-blue-600'; // Conservative - strong blue
                              
                              return (
                                <div
                                  key={index}
                                  className={`${bgColor} h-full ${index > 0 ? 'border-l border-white dark:border-gray-800' : ''}`}
                                  style={{ width: `${width}%` }}
                                ></div>
                              );
                            })}
                          </div>
                          <div className="flex mt-1">
                            {goal.returnPhases.map((phase, index) => {
                              const totalPhases = goal.returnPhases.length;
                              let width = Math.max(20, 100 / totalPhases); // Match the progress bar widths
                              let months = phase.length;
                              
                              return (
                                <div
                                  key={index}
                                  className="text-xs text-theme-secondary px-1"
                                  style={{ width: `${width}%` }}
                                >
                                  {formatPercentage(phase.rate)}
                                  {index === 0 && months > 0 && months < goal.horizonMonths && (
                                    <span> (0-{Math.round(months/12)}y)</span>
                                  )}
                                  {index === 1 && (
                                    <span> ({Math.round(goal.returnPhases[0].length/12)}-{Math.round((goal.returnPhases[0].length + months)/12)}y)</span>
                                  )}
                                  {index === 2 && (
                                    <span> ({Math.round((goal.returnPhases[0].length + goal.returnPhases[1].length)/12)}-end)</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="text-sm text-theme-secondary mt-2">
                          <p>
                            {goal.profile === 'Conservative'
                              ? 'Lower risk, stable returns. Suitable for short-term goals.'
                              : goal.profile === 'Balanced'
                              ? 'Moderate risk and returns. Good for medium-term goals.'
                              : 'Higher risk with potential for higher returns. Best for long-term goals.'}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="primary" onClick={onNext}>
          Continue to Budget Planning →
        </Button>
      </div>
      
      {/* AI Guidance for Risk & Returns */}
      {state.userProfile.name && (
        <AIGuidance 
          step="risk-&-returns" 
          context={{
            name: state.userProfile.name,
            nationality: state.userProfile.nationality,
            location: state.userProfile.location,
            monthlyIncome: state.userProfile.monthlyIncome,
            monthlyExpenses: state.monthlyExpenses,
            currency: currency.code,
            currentStep: 'risk-&-returns',
            goals: state.goals,
            emergencyFund: (() => {
              const emergencyFundGoal = state.goals.find(g => g.id === 'emergency-fund');
              if (emergencyFundGoal) {
                return {
                  targetAmount: emergencyFundGoal.amount,
                  currentAmount: 0,
                  bufferMonths: emergencyFundGoal.bufferMonths || 3,
                  monthlyExpenses: emergencyFundGoal.amount / (emergencyFundGoal.bufferMonths || 3),
                  targetDate: emergencyFundGoal.targetDate,
                  monthlyContribution: emergencyFundGoal.requiredPMT
                };
              }
              return {
                targetAmount: undefined,
                currentAmount: 0
              };
            })()
          }}
          componentId="risk-&-returns"
        />
      )}
    </div>
  );
};

export default RiskReturnsSection;