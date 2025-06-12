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
import ThemeToggle from './ui/ThemeToggle';
import Button from './ui/Button';

import { User, Shield, Target, TrendingUp, BarChart3, Calendar, X, CheckCircle, Circle, Sparkles, Brain, Menu, Save } from 'lucide-react';

interface EditPlanWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditPlanWizard: React.FC<EditPlanWizardProps> = ({ isOpen, onClose, onSave }) => {
  const { state, dispatch } = usePlanner();
  const sectionsRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Edit wizard steps (excluding the signup step)
  const EDIT_STEPS = STEPS.slice(0, 7); // Remove the last step (Get Started/Signup)
  
  // Bounded current step for edit wizard (ensure it's within edit range)
  const editCurrentStep = Math.min(state.currentStep, EDIT_STEPS.length - 1);

  // Step icons mapping
  const stepIcons = {
    0: User,
    1: Shield, 
    2: Target,
    3: Target,
    4: TrendingUp,
    5: BarChart3,
    6: Calendar
  };

  useEffect(() => {
    // Scroll to top of the new section when step changes in edit mode
    const scrollToSectionTop = () => {
      if (sectionsRef.current && editCurrentStep < EDIT_STEPS.length) {
        const sections = sectionsRef.current.children;
        if (sections[editCurrentStep]) {
          // For edit wizard, scroll within the modal container
          const modalContainer = sectionsRef.current;
          if (modalContainer) {
            modalContainer.scrollTop = 0;
          }
          
          // Also ensure the section is positioned correctly
          sections[editCurrentStep].scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToSectionTop, 100);
    
    return () => clearTimeout(timeoutId);
  }, [editCurrentStep]);

  const handleStepClick = (index: number) => {
    if (index < EDIT_STEPS.length) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: index });
    }
  };

  const handleNext = () => {
    if (editCurrentStep < EDIT_STEPS.length - 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: editCurrentStep + 1 });
    }
  };

  const handleBack = () => {
    if (editCurrentStep > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: editCurrentStep - 1 });
    }
  };

  const handleSave = () => {
    // Save changes and close wizard
    onSave();
    onClose();
  };

  const handleCancel = () => {
    // Reset to step 0 and close
    dispatch({ type: 'SET_CURRENT_STEP', payload: 0 });
    onClose();
  };

  // Reset to last valid step if currently on signup step
  useEffect(() => {
    if (isOpen && state.currentStep >= EDIT_STEPS.length) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: EDIT_STEPS.length - 1 });
    }
  }, [isOpen, state.currentStep, EDIT_STEPS.length, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen app-background">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Enhanced Left Sidebar - Same as original planner */}
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
                  Edit Plan
                </h1>
                <p className="text-sm text-theme-secondary">Modify your financial strategy</p>
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

          {/* Enhanced Navigation - Same structure as original */}
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
            {EDIT_STEPS.map((step, index) => {
              const Icon = stepIcons[index as keyof typeof stepIcons];
              const isActive = index === editCurrentStep;
              const isCompleted = index < editCurrentStep;
              const isAccessible = index <= editCurrentStep;
              
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

          {/* Enhanced Progress Bar & Action Buttons */}
          <div className="p-4 mt-auto space-y-4">
            <div className="bg-theme-secondary rounded-xl p-3 lg:p-4 border border-theme shadow-theme-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs lg:text-sm font-medium text-theme-secondary">Progress</span>
                <span className="text-xs lg:text-sm font-bold text-theme-success">
                  {Math.round(((editCurrentStep + 1) / EDIT_STEPS.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-theme-tertiary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${((editCurrentStep + 1) / EDIT_STEPS.length) * 100}%` }}
                />
              </div>
              <div className="text-xs text-theme-muted mt-2">
                Step {editCurrentStep + 1} of {EDIT_STEPS.length}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleSave}
                variant="primary"
                fullWidth
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                onClick={handleCancel}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Same structure as original planner */}
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
                    {EDIT_STEPS[editCurrentStep]?.label}
                  </h2>
                </div>
                {editCurrentStep > 0 && (
                  <div className="hidden sm:block text-xs lg:text-sm text-theme-secondary bg-theme-secondary px-2 lg:px-3 py-1 rounded-full border border-theme">
                    AI-Powered Planning
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 lg:gap-2">
                {editCurrentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm text-theme-secondary hover:text-theme-success hover:bg-theme-tertiary rounded-lg transition-all duration-200 border border-theme hover:border-green-500"
                  >
                    ← Back
                  </button>
                )}
                {editCurrentStep < EDIT_STEPS.length - 1 && (
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    size="sm"
                    className="text-xs lg:text-sm px-2 lg:px-4 py-1 lg:py-2"
                  >
                    Next →
                  </Button>
                )}
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div ref={sectionsRef} className="h-[calc(100vh-80px)] overflow-y-auto">
            {editCurrentStep === 0 && (
              <section className="p-4 lg:p-8">
                <WelcomeProfileSection onNext={handleNext} />
              </section>
            )}

            {editCurrentStep === 1 && (
              <section className="p-4 lg:p-8">
                <EmergencyFundSection onNext={handleNext} />
              </section>
            )}

            {editCurrentStep === 2 && (
              <section className="p-4 lg:p-8">
                <GoalsSection onNext={handleNext} onBack={handleBack} />
              </section>
            )}

            {editCurrentStep === 3 && (
              <section className="p-4 lg:p-8">
                <RetirementSection onNext={handleNext} onBack={handleBack} />
              </section>
            )}

            {editCurrentStep === 4 && (
              <section className="p-4 lg:p-8">
                <RiskReturnsSection onNext={handleNext} onBack={handleBack} />
              </section>
            )}

            {editCurrentStep === 5 && (
              <section className="p-4 lg:p-8">
                <BudgetProjections onNext={handleNext} onBack={handleBack} />
              </section>
            )}

            {editCurrentStep === 6 && (
              <section className="p-4 lg:p-8">
                <MonthlyPlanView 
                  onContinue={handleSave}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPlanWizard; 