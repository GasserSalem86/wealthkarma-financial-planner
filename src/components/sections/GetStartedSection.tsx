import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/calculations';
import { 
  User, 
  Mail, 
  CheckCircle, 
  Star, 
  Zap, 
  BarChart3,
  Bell,
  Shield,
  Crown,
  Gift,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Heart,
  Target,
  CreditCard,
  Lock
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

interface GetStartedSectionProps {
  onNext?: () => void;
  onBack: () => void;
}

const GetStartedSection: React.FC<GetStartedSectionProps> = ({ onBack }) => {
  const { state } = usePlanner();
  const { currency } = useCurrency();
  const { signUp, user } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'monthly' | 'annual'>('annual');
  const [showSuccess, setShowSuccess] = useState(false);
  const [debugStatus, setDebugStatus] = useState('');

  // Calculate plan value for display
  const totalPlanValue = state.allocations.reduce((sum, allocation) => 
    sum + allocation.goal.amount, 0
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    setDebugStatus('Starting signup...');
    
    // Track signup attempt
    if (window.gtag) {
      window.gtag('event', 'signup_attempt', {
        plan_type: selectedPlan,
        plan_value: totalPlanValue,
        conversion_point: 'post_plan_generation'
      });
    }

    // Add timeout mechanism to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Signup timed out after 30 seconds')), 30000);
    });

    try {
      console.log('🚀 Starting signup process...', { email, selectedPlan });
      setDebugStatus('Connecting to authentication service...');
      
      // Use Supabase Auth with timeout
      const userData = {
        name,
        plan_type: selectedPlan,
        plan_value: totalPlanValue,
        signup_source: 'post_plan_generation'
      };

      console.log('📝 Calling signUp with userData:', userData);
      setDebugStatus('Creating account...');
      
      // Race between signup and timeout
      const signupPromise = signUp(email, password, userData);
      const result = await Promise.race([signupPromise, timeoutPromise]) as { error: any };
      
      if (result.error) {
        console.error('❌ Signup failed:', result.error);
        setDebugStatus(`Signup failed: ${result.error.message}`);
        alert(`Signup failed: ${result.error.message}`);
        return;
      }

      console.log('✅ Signup successful, proceeding...');
      setDebugStatus('Account created! Saving your planning data...');

      // Save planning data (with shorter timeout and non-blocking)
      const saveDataWithTimeout = async () => {
        try {
          console.log('💾 Attempting to save planning data...');
          
          const savePromise = (async () => {
            const { plannerPersistence } = await import('../../services/plannerPersistence');
            const { supabase } = await import('../../lib/supabase');
            
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser) {
              console.log('👤 Found authenticated user:', currentUser.id);
              return await plannerPersistence.savePlanningData(currentUser.id, state);
            }
            return { success: false, error: 'No authenticated user found' };
          })();
          
          const saveTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Data save timed out')), 10000);
          });
          
          const saveResult = await Promise.race([savePromise, saveTimeout]) as any;
          
          if (saveResult.success) {
            console.log('✅ Planning data saved successfully!');
            setDebugStatus('Planning data saved successfully!');
          } else {
            console.warn('⚠️ Failed to save planning data:', saveResult.error);
            setDebugStatus('Data save failed, but continuing...');
          }
        } catch (error) {
          console.warn('⚠️ Non-critical error saving planning data:', error);
          setDebugStatus('Data save error (non-critical)');
          // Don't block the signup flow for data saving issues
        }
      };

      // Start data saving but don't wait for it
      saveDataWithTimeout();

      // Track successful signup
      if (window.gtag) {
        window.gtag('event', 'signup_success', {
          plan_type: selectedPlan,
          plan_value: totalPlanValue
        });
      }

      // Handle different plan types
      if (selectedPlan === 'trial') {
        console.log('✅ Free trial signup completed');
        setDebugStatus('Free trial setup complete!');
        alert('Account created successfully! Welcome to WealthKarma.');
        setShowSuccess(true);
        return;
      }

      // Handle paid plans with timeout
      try {
        console.log('💳 Processing payment for plan:', selectedPlan);
        setDebugStatus('Setting up payment...');
        
        const paymentPromise = (async () => {
          const { paymentService } = await import('../../services/paymentService');
          const productId = selectedPlan === 'monthly' ? 'monthly-subscription' : 'annual-subscription';
          
          return await paymentService.createCheckoutSession({
            productId,
            customerEmail: email,
            metadata: {
              userName: name,
              planValue: totalPlanValue.toString(),
              signupSource: 'post_plan_generation'
            }
          });
        })();
        
        const paymentTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Payment setup timed out')), 15000);
        });
        
        const result = await Promise.race([paymentPromise, paymentTimeout]) as any;

        if (result.error) {
          console.error('❌ Payment error:', result.error);
          setDebugStatus('Payment setup failed, account created');
          alert(`Payment setup failed: ${result.error}. Your account was created successfully, you can set up payment later.`);
          setShowSuccess(true);
          return;
        }

        if (result.url) {
          console.log('🔄 Redirecting to payment:', result.url);
          setDebugStatus('Redirecting to payment...');
          alert(`Account created! Redirecting to payment for ${selectedPlan} plan.`);
          // In production, redirect to Stripe
          window.location.href = result.url;
          return;
        }
      } catch (paymentError) {
        console.error('❌ Payment service error:', paymentError);
        setDebugStatus('Payment error, account created');
        alert('Payment setup failed, but your account was created successfully. You can set up payment later from your dashboard.');
        setShowSuccess(true);
        return;
      }

      // Fallback success
      console.log('✅ Signup process completed');
      setDebugStatus('Signup completed successfully!');
      setShowSuccess(true);

    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        setDebugStatus('Signup timed out');
        alert('Signup is taking longer than expected. Please check your internet connection and try again.');
      } else {
        setDebugStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        alert('Signup failed due to an unexpected error. Please try again.');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSkipToDashboard = async () => {
    // Track skip action
    if (window.gtag) {
      window.gtag('event', 'signup_skipped', {
        plan_value: totalPlanValue
      });
    }

    // If user is already authenticated, save their planning data before going to dashboard
    if (user) {
      try {
        console.log('Saving planning data for authenticated user:', user.id);
        const { plannerPersistence } = await import('../../services/plannerPersistence');
        const saveResult = await plannerPersistence.savePlanningData(user.id, state);
        
        if (saveResult.success) {
          console.log('Successfully saved planning data to Supabase!');
        } else {
          console.error('Failed to save planning data:', saveResult.error);
        }
      } catch (error) {
        console.error('Error saving planning data:', error);
      }
    }

    // Exit wizard and go to standalone dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      
      {/* Hero Section - Redesigned */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 via-orange-500/20 to-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 px-8 py-4 rounded-2xl mb-8 shadow-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-lg font-medium">Your Personalized Financial Roadmap is Ready</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
          <span className="bg-gradient-to-r from-green-500 via-orange-500 to-green-600 bg-clip-text text-transparent">
            Turn Your Plan
          </span>
          <br />
          <span className="text-theme-primary">Into Reality</span>
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl text-theme-secondary max-w-4xl mx-auto leading-relaxed mb-8">
          Your {formatCurrency(totalPlanValue, currency)} financial future starts today. 
          <br />
          <span className="text-theme-primary font-medium">Join thousands who've already made it happen.</span>
        </p>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-theme-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Bank-Level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Loved by Expats</span>
          </div>
        </div>
      </div>

      {/* Main Content - Completely Redesigned Layout */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* Left Column - Value Proposition */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-theme-primary mb-6">
              Why WealthKarma Works
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-theme-primary mb-1">Live Progress Tracking</h3>
                  <p className="text-sm text-theme-secondary">Watch your money grow in real-time with automated tracking.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-theme-primary mb-1">AI Financial Coach</h3>
                  <p className="text-sm text-theme-secondary">Get personalized advice that adapts to your life.</p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-orange-500/10 border border-green-500/20">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-theme-primary mb-1">Smart Notifications</h3>
                  <p className="text-sm text-theme-secondary">Never miss opportunities with intelligent alerts.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-gradient-to-r from-green-500/5 to-orange-500/5 rounded-2xl p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full border-2 border-white dark:border-gray-800"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full border-2 border-white dark:border-gray-800"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-orange-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-theme-primary">Trusted by GCC expats</p>
                <p className="text-xs text-theme-muted">Dubai • Abu Dhabi • Riyadh • Kuwait</p>
              </div>
            </div>
            <p className="text-sm text-theme-secondary italic">
              "Finally, a financial plan that actually works for expat life. The AI coaching feels like having a personal advisor."
            </p>
            <p className="text-xs text-theme-muted mt-2">— Sarah M., Dubai</p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-theme-card rounded-xl border border-theme">
              <div className="text-2xl font-bold text-green-600 mb-1">2,500+</div>
              <div className="text-xs text-theme-muted">Active Members</div>
            </div>
            <div className="text-center p-4 bg-theme-card rounded-xl border border-theme">
              <div className="text-2xl font-bold text-orange-600 mb-1">4.9/5</div>
              <div className="text-xs text-theme-muted">Rating</div>
            </div>
          </div>
        </div>

        {/* Right Column - Unified Package Selection & Signup */}
        <div className="lg:sticky lg:top-8">
          <Card className="bg-theme-card border-2 border-theme shadow-2xl">
            <CardContent className="p-8">
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-theme-primary mb-3">Get Started Today</h2>
                <p className="text-theme-secondary">Join thousands of successful GCC expats</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-6">
                
                {/* Package Selection - Integrated */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-theme-primary mb-3">Choose Your Plan</label>
                  
                  {/* Annual Plan */}
                  <div 
                    onClick={() => setSelectedPlan('annual')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan === 'annual'
                        ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-orange-500/10 ring-2 ring-green-500/30 transform scale-102'
                        : 'border-theme bg-theme-tertiary hover:border-green-500/50'
                    }`}
                  >
                    {selectedPlan === 'annual' && (
                      <div className="absolute -top-2 -right-2">
                        <span className="bg-gradient-to-r from-green-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Crown className="w-6 h-6 text-orange-500" />
                        <div>
                          <h3 className="font-bold text-theme-primary">Premium Annual</h3>
                          <p className="text-sm text-theme-muted">Best value • Save 17%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-500 line-through">$119.88</span>
                          <span className="text-2xl font-bold text-green-600">$99</span>
                        </div>
                        <p className="text-xs text-theme-muted">/year • $8.25/month</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-theme-secondary">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Live tracking</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>AI coaching</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Tax optimization</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Priority support</span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Plan */}
                  <div 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan === 'monthly'
                        ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-orange-500/10 ring-2 ring-green-500/30 transform scale-102'
                        : 'border-theme bg-theme-tertiary hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Crown className="w-6 h-6 text-orange-500" />
                        <div>
                          <h3 className="font-bold text-theme-primary">Premium Monthly</h3>
                          <p className="text-sm text-theme-muted">Flexible • No commitment</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-green-600">$10</span>
                        </div>
                        <p className="text-xs text-theme-muted">/month</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-theme-secondary">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Live tracking</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>AI coaching</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Tax optimization</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Priority support</span>
                      </div>
                    </div>
                  </div>

                  {/* Trial Plan */}
                  <div 
                    onClick={() => setSelectedPlan('trial')}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan === 'trial'
                        ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-orange-500/10 ring-2 ring-green-500/30 transform scale-102'
                        : 'border-theme bg-theme-tertiary hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Gift className="w-6 h-6 text-orange-500" />
                        <div>
                          <h3 className="font-bold text-theme-primary">Free Trial</h3>
                          <p className="text-sm text-theme-muted">No credit card required</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-green-600">$0</span>
                        </div>
                        <p className="text-xs text-theme-muted">/month</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-theme-secondary">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Live tracking</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>AI coaching</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Tax optimization</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Priority support</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signup Form */}
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-theme bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <Mail className="absolute top-3 right-3 w-5 h-5 text-theme-muted" />
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-theme bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <User className="absolute top-3 right-3 w-5 h-5 text-theme-muted" />
                  </div>
                  <div className="relative">
                    <input 
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-theme bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <Lock className="absolute top-3 right-3 w-5 h-5 text-theme-muted" />
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? 'Signing up...' : 'Sign Up'}
                </Button>

                {/* Debug Status - Only show during signup */}
                {isSigningUp && debugStatus && (
                  <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-600">{debugStatus}</p>
                  </div>
                )}

                {/* Skip Button */}
                <Button variant="outline" className="w-full" onClick={handleSkipToDashboard}>
                  Skip Signup
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GetStartedSection;
