import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Goal, GoalCategory, PaymentFrequency, GOAL_CATEGORIES, PAYMENT_FREQUENCIES } from '../../types/plannerTypes';
import { calculateRequiredPMT, monthDiff, getRecommendedProfile } from '../../utils/calculations';
import { formatCurrency } from '../../utils/calculations';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Calendar, DollarSign, Edit, Trash2, GraduationCap, Plane, Gift, Home, Target, Plus, HelpCircle } from 'lucide-react';
import AIGuidance from '../AIGuidance';
import { UserContext, aiService } from '../../services/aiService';

interface GoalsSectionProps {
  onNext: () => void;
  onBack: () => void;
}

const getCategoryIcon = (category: GoalCategory) => {
  switch (category) {
    case 'Education':
      return <GraduationCap className="w-4 h-4" />;
    case 'Travel':
      return <Plane className="w-4 h-4" />;
    case 'Gift':
      return <Gift className="w-4 h-4" />;
    case 'Home':
      return <Home className="w-4 h-4" />;
    case 'Retirement':
      return <Target className="w-4 h-4" />;
    case 'Other':
      return <HelpCircle className="w-4 h-4" />;
  }
};

const GoalsSection: React.FC<GoalsSectionProps> = ({ onNext, onBack }) => {
  const { state, dispatch } = usePlanner();
  const { currency } = useCurrency();
  
  // Main flow state
  const [currentStep, setCurrentStep] = useState<'intro' | 'category' | 'when' | 'amount' | 'payment' | 'review'>('intro');
  const [showAddAnother, setShowAddAnother] = useState(false);
  
  // Goal creation state
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState<number>(0);
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('Education');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('Once');
  const [paymentPeriod, setPaymentPeriod] = useState<number>(4);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Chat state for AI assistant
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 41 }, (_, i) => currentYear + i);

  const displayGoals = state.goals.filter((goal) => goal.id !== 'emergency-fund' && goal.category !== 'Retirement');

  const shouldShowPaymentOptions = (category: GoalCategory) => {
    return category === 'Education' || category === 'Home';
  };

  // Reset form
  const resetForm = () => {
    setGoalName('');
    setGoalAmount(0);
    setGoalCategory('Education');
    setCustomCategoryName('');
    setPaymentFrequency('Once');
    setPaymentPeriod(4);
    setTargetMonth(new Date().getMonth() + 1);
    setTargetYear(new Date().getFullYear() + 1);
    setEditMode(false);
    setEditingGoalId(null);
    setCurrentStep('category');
  };

