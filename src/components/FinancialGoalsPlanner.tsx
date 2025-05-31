import React, { useRef, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { STEPS } from '../types/plannerTypes';
import CurrencySelector from './CurrencySelector';
import WelcomeProfileSection from './sections/WelcomeProfileSection';
import EmergencyFundSection from './sections/EmergencyFundSection';
import GoalsSection from './sections/GoalsSection';
import RetirementSection from './sections/RetirementSection';
import RiskReturnsSection from './sections/RiskReturnsSection';
import BudgetProjections from './BudgetProjections';
import MonthlyPlanView from './MonthlyPlanView';
import MonthlyRoadmapSection from './sections/MonthlyRoadmapSection';
import GetStartedSection from './sections/GetStartedSection';
import AIGuidance from './AIGuidance';
import DebugPanel from './DebugPanel';
import ThemeToggle from './ui/ThemeToggle';
import Button from './ui/Button';

import { UserContext } from '../services/aiService';
import { User, Shield, Target, TrendingUp, BarChart3, Calendar, Download, CheckCircle, Circle, Sparkles, Brain } from 'lucide-react';

const FinancialGoalsPlanner: React.FC = () => {
  const { state, dispatch } = usePlanner();
  const sectionsRef = useRef<HTMLDivElement>(null);

  // Step icons mapping
  const stepIcons = {
    0: User,
    1: Shield,
    2: Target,
    3: Target,
    4: TrendingUp,
    5: BarChart3,
    6: Calendar,
    7: Download
  };

  useEffect(() => {
    if (sectionsRef.current) {
      const sections = sectionsRef.current.children;
      if (sections[state.currentStep]) {
        sections[state.currentStep].scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }
  }, [state.currentStep]);

  const handleStepClick = (index: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: index });
  };

  const handleNext = () => {
    if (state.currentStep < STEPS.length - 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  };

  // Build AI context from current state
  const aiContext: UserContext = {
    name: state.userProfile.name,
    nationality: state.userProfile.nationality,
    location: state.userProfile.location,
    monthlyIncome: state.userProfile.monthlyIncome,
    monthlyExpenses: state.monthlyExpenses,
    currency: state.userProfile.currency,
    currentStep: STEPS[state.currentStep]?.label.toLowerCase().replace(/\s+/g, '-'),
    goals: state.goals,
    emergencyFund: (() => {
      const emergencyFundGoal = state.goals.find(g => g.id === 'emergency-fund');
      if (emergencyFundGoal) {
        return {
          targetAmount: emergencyFundGoal.amount,
          currentAmount: 0, // This would come from actual account data in the future
          bufferMonths: emergencyFundGoal.bufferMonths || state.bufferMonths,
          monthlyExpenses: emergencyFundGoal.amount / (emergencyFundGoal.bufferMonths || state.bufferMonths),
          targetDate: emergencyFundGoal.targetDate,
          monthlyContribution: emergencyFundGoal.requiredPMT
        };
      }
      return {
        targetAmount: undefined,
        currentAmount: 0
      };
    })()
  };

  return (
    <div className="flex min-h-screen">
      {/* Enhanced Left Sidebar - Theme Aware */}
      <div className="w-64 nav-dark border-r border-theme fixed h-full shadow-theme-xl">
        {/* Header */}
        <div className="p-6 border-b border-theme nav-dark-header">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 dark:bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="heading-h4-sm text-theme-light">
                WealthKarma
              </h1>
              <p className="text-sm text-theme-secondary">AI Financial Planner</p>
            </div>
          </div>
          {state.currentStep > 0 && (
            <div className="bg-theme-secondary rounded-xl p-3 border border-theme shadow-theme-sm">
              <CurrencySelector />
            </div>
          )}
          
          {/* Theme Toggle */}
          <div className="mt-4 flex justify-center">
            <ThemeToggle showLabel={false} />
          </div>
        </div>

        {/* Enhanced Navigation */}
        <nav className="p-4 space-y-2">
          {STEPS.map((step, index) => {
            const Icon = stepIcons[index as keyof typeof stepIcons];
            const isActive = index === state.currentStep;
            const isCompleted = index < state.currentStep;
            const isAccessible = index <= state.currentStep;
            
            return (
            <button
              key={step.id}
                onClick={() => isAccessible && handleStepClick(index)}
                disabled={!isAccessible}
                className={`group w-full text-left p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-green-500/20 border-2 border-green-500/50 shadow-theme-lg transform scale-105'
                    : isCompleted
                    ? 'bg-green-500/10 border border-green-500/30 hover:shadow-theme hover:scale-102'
                    : isAccessible
                    ? 'hover:bg-theme-tertiary hover:shadow-theme hover:scale-102 border border-transparent'
                    : 'opacity-50 cursor-not-allowed border border-transparent'
                }`}
              >
                {/* Background gradient for active state */}
                {isActive && (
                  <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                )}
                
                <div className="flex items-center relative z-10">
                  {/* Enhanced Step Indicator */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 ${
                    isActive
                      ? 'bg-green-500 text-white shadow-lg scale-110'
                      : isCompleted
                      ? 'bg-green-500/80 text-white shadow-theme'
                      : isAccessible
                      ? 'bg-theme-tertiary text-theme-secondary group-hover:bg-green-500/50 group-hover:text-white'
                      : 'bg-theme-tertiary text-theme-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isActive ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="flex-1">
                    <div className={`font-semibold transition-colors duration-300 ${
                      isActive
                        ? 'text-theme-success'
                        : isCompleted
                        ? 'text-theme-success-muted'
                        : isAccessible
                        ? 'text-theme-secondary group-hover:text-theme-success-light'
                        : 'text-theme-muted'
                    }`}>
                      {step.label}
                    </div>
                    {isActive && (
                      <div className="text-xs text-theme-success flex items-center gap-1 mt-1">
                        <Circle className="w-2 h-2 fill-current animate-pulse" />
                        You're here
                      </div>
                    )}
                    {isCompleted && (
                      <div className="text-xs text-theme-success flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Done ✓
                      </div>
                    )}
                  </div>
                  
                  {/* Progress indicator */}
                  {isActive && (
                    <div className="w-1 h-8 bg-green-500 rounded-full animate-pulse ml-2"></div>
                  )}
                </div>
                
                {/* Hover effect overlay */}
                {isAccessible && !isActive && (
                  <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/5 transition-all duration-300 rounded-xl"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Enhanced Progress Bar */}
        <div className="p-4 mt-auto">
          <div className="bg-theme-secondary rounded-xl p-4 border border-theme shadow-theme-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-secondary">Progress</span>
              <span className="text-sm font-bold text-theme-success">
                {Math.round(((state.currentStep + 1) / STEPS.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-theme-tertiary rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${((state.currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <div className="text-xs text-theme-muted mt-2">
              Step {state.currentStep + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Enhanced Top Navigation - Theme Aware */}
        <div className="nav-dark border-b border-theme p-4 shadow-theme-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-theme-success" />
                <h2 className="text-lg font-semibold text-theme-light">
                  {STEPS[state.currentStep]?.label}
                </h2>
              </div>
              {state.currentStep > 0 && (
                <div className="text-sm text-theme-secondary bg-theme-secondary px-3 py-1 rounded-full border border-theme">
                  AI-Powered Planning
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {state.currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-theme-secondary hover:text-theme-success hover:bg-theme-tertiary rounded-lg transition-all duration-200 border border-theme hover:border-green-500"
                >
                  ← Back
                </button>
              )}
              {state.currentStep < STEPS.length - 1 && (
                <Button
                  onClick={handleNext}
                  variant="primary"
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>

        <div ref={sectionsRef} className="h-full">
          <section className={`min-h-screen p-8 ${state.currentStep === 0 ? 'block' : 'hidden'}`}>
            <WelcomeProfileSection onNext={handleNext} />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 1 ? 'block' : 'hidden'}`}>
            <EmergencyFundSection onNext={handleNext} />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 2 ? 'block' : 'hidden'}`}>
            <GoalsSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 3 ? 'block' : 'hidden'}`}>
            <RetirementSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 4 ? 'block' : 'hidden'}`}>
            <RiskReturnsSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 5 ? 'block' : 'hidden'}`}>
            <BudgetProjections onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 6 ? 'block' : 'hidden'}`}>
            <MonthlyPlanView 
              onContinue={handleNext}
            />
          </section>

          <section className={`min-h-screen p-8 ${state.currentStep === 7 ? 'block' : 'hidden'}`}>
            <GetStartedSection onBack={handleBack} />
          </section>
        </div>
      </div>

      {/* AI Guidance Component - Only show after user starts filling profile */}
      {/* Removed global AIGuidance to prevent conflicts with section-specific AIGuidance components */}
      {/* Each section now handles its own AIGuidance with proper callbacks */}

      {/* Debug Panel (development only) */}
      <DebugPanel />
    </div>
  );
};

export default FinancialGoalsPlanner;