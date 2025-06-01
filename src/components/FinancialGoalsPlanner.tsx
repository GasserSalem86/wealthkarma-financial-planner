import React, { useRef, useEffect, useState } from 'react';
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
import { User, Shield, Target, TrendingUp, BarChart3, Calendar, CalendarDays, Download, CheckCircle, Circle, Sparkles, Brain, Menu, X } from 'lucide-react';

const FinancialGoalsPlanner: React.FC = () => {
  const { state, dispatch } = usePlanner();
  const sectionsRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Step icons mapping
  const stepIcons = {
    0: User,
    1: Shield,
    2: Target,
    3: Target,
    4: TrendingUp,
    5: BarChart3,
    6: CalendarDays,
    7: Calendar,
    8: Download
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
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Left Sidebar - Theme Aware & Mobile Responsive */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 nav-dark border-r border-theme shadow-theme-xl
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-theme-secondary hover:text-theme-success transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

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
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
          {STEPS.map((step, index) => {
            const Icon = stepIcons[index as keyof typeof stepIcons];
            const isActive = index === state.currentStep;
            const isCompleted = index < state.currentStep;
            const isAccessible = index <= state.currentStep;
            
            return (
            <button
              key={step.id}
                onClick={() => {
                  if (isAccessible) {
                    handleStepClick(index);
                    setIsSidebarOpen(false); // Close sidebar on mobile after selection
                  }
                }}
                disabled={!isAccessible}
                className={`group w-full text-left p-3 lg:p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
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
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center mr-3 lg:mr-4 transition-all duration-300 ${
                    isActive
                      ? 'bg-green-500 text-white shadow-lg scale-110'
                      : isCompleted
                      ? 'bg-green-500/80 text-white shadow-theme'
                      : isAccessible
                      ? 'bg-theme-tertiary text-theme-secondary group-hover:bg-green-500/50 group-hover:text-white'
                      : 'bg-theme-tertiary text-theme-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                    ) : isActive ? (
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    ) : (
                      <span className="text-xs lg:text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm lg:text-base transition-colors duration-300 truncate ${
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
                    <div className="w-1 h-6 lg:h-8 bg-green-500 rounded-full animate-pulse ml-2"></div>
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
          <div className="bg-theme-secondary rounded-xl p-3 lg:p-4 border border-theme shadow-theme-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs lg:text-sm font-medium text-theme-secondary">Progress</span>
              <span className="text-xs lg:text-sm font-bold text-theme-success">
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
      <div className="flex-1 lg:ml-0">
        {/* Enhanced Top Navigation - Theme Aware & Mobile Responsive */}
        <div className="nav-dark border-b border-theme p-3 lg:p-4 shadow-theme-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-theme-secondary hover:text-theme-success transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 lg:w-5 lg:h-5 text-theme-success" />
                <h2 className="text-sm lg:text-lg font-semibold text-theme-light truncate">
                  {STEPS[state.currentStep]?.label}
                </h2>
              </div>
              {state.currentStep > 0 && (
                <div className="hidden sm:block text-xs lg:text-sm text-theme-secondary bg-theme-secondary px-2 lg:px-3 py-1 rounded-full border border-theme">
                  AI-Powered Planning
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 lg:gap-2">
              {state.currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm text-theme-secondary hover:text-theme-success hover:bg-theme-tertiary rounded-lg transition-all duration-200 border border-theme hover:border-green-500"
                >
                  ← Back
                </button>
              )}
              {state.currentStep < STEPS.length - 1 && (
                <Button
                  onClick={handleNext}
                  variant="primary"
                  size="sm"
                  className="text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2"
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>

        <div ref={sectionsRef} className="h-full">
          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 0 ? 'block' : 'hidden'}`}>
            <WelcomeProfileSection onNext={handleNext} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 1 ? 'block' : 'hidden'}`}>
            <EmergencyFundSection onNext={handleNext} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 2 ? 'block' : 'hidden'}`}>
            <GoalsSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 3 ? 'block' : 'hidden'}`}>
            <RetirementSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 4 ? 'block' : 'hidden'}`}>
            <RiskReturnsSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 5 ? 'block' : 'hidden'}`}>
            <BudgetProjections onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 6 ? 'block' : 'hidden'}`}>
            <MonthlyPlanView onContinue={handleNext} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 7 ? 'block' : 'hidden'}`}>
            <MonthlyRoadmapSection onNext={handleNext} onBack={handleBack} />
          </section>

          <section className={`min-h-screen p-4 lg:p-8 ${state.currentStep === 8 ? 'block' : 'hidden'}`}>
            <GetStartedSection onBack={handleBack} />
          </section>
        </div>

        {/* AI Guidance Panel - Mobile Responsive */}
        <div className="fixed bottom-4 right-4 z-30">
          <AIGuidance context={aiContext} step={String(STEPS[state.currentStep]?.id || 'welcome')} />
        </div>

        {/* Debug Panel - Hidden on mobile for better UX */}
        {process.env.NODE_ENV === 'development' && (
          <div className="hidden lg:block">
            <DebugPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialGoalsPlanner;