import React, { useState } from 'react';
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
    <div className="bg-theme-tertiary p-4 rounded-lg shadow-lg border border-theme">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-theme-primary">Customize Return Rates</h3>
        <button onClick={onClose} className="text-theme-muted hover:text-theme-secondary transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
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
            className="input-dark block w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            className="input-dark block w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            className="input-dark block w-full px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
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
    <div className="container mx-auto max-w-3xl">
      <div className="text-center mb-8">
        <h2 className="heading-h1-sm text-theme-primary mb-4">Return Rates</h2>
        <p className="text-theme-secondary mb-6">
          Each goal has a recommended return rate profile based on its time horizon.
          You can adjust these if you prefer a different risk level.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {sortedGoals.map((goal) => {
          const years = Math.floor(goal.horizonMonths / 12);
          const months = goal.horizonMonths % 12;
          const timeframe = `${years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : ''} ${months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : ''}`.trim();

          const hasPaymentPeriod = goal.paymentFrequency && goal.paymentFrequency !== 'Once';

          return (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{goal.name} ({timeframe})</span>
                  {!goal.id.includes('emergency-fund') && (
                    <button
                      onClick={() => setEditingRates(goal.id)}
                      className="text-theme-muted hover:text-theme-secondary transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goal.id === 'emergency-fund' ? (
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
                        Conservative ({goal.selectedBank ? 
                          `${(goal.selectedBank.returnRate * 100).toFixed(1)}% p.a. - ${goal.selectedBank.bankName}` : 
                          '1% p.a.'
                        })
                      </span>
                      <span className="ml-2 text-sm text-theme-muted">
                        Emergency funds should always stay in safe, liquid investments
                      </span>
                    </div>
                    {goal.selectedBank && (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-3 shadow-theme-sm">
                        <div className="text-sm text-green-600">
                          <strong>Selected Bank:</strong> {goal.selectedBank.bankName} - {goal.selectedBank.accountType}
                          <br />
                          <strong>Interest Rate:</strong> {goal.selectedBank.interestRate}
                          <br />
                          <strong>Features:</strong> {goal.selectedBank.features}
                        </div>
                      </div>
                    )}
                    <div className="h-4 bg-white dark:bg-gray-800 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <div className="h-full bg-blue-600 rounded-full flex-shrink-0" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                ) : hasPaymentPeriod ? (
                  <div className="space-y-4">
                    <div className="flex items-center mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
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
                          <h4 className="font-medium mb-2 text-theme-primary">Return Phases</h4>
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