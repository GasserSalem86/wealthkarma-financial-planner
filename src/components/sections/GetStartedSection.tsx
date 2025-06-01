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

  // Calculate plan value for display
  const totalPlanValue = state.allocations.reduce((sum, allocation) => 
    sum + allocation.goal.amount, 0
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    
    // Track signup attempt
    if (window.gtag) {
      window.gtag('event', 'signup_attempt', {
        plan_type: selectedPlan,
        plan_value: totalPlanValue,
        conversion_point: 'post_plan_generation'
      });
    }

    try {
      // Use Supabase Auth
      const userData = {
        name,
        plan_type: selectedPlan,
        plan_value: totalPlanValue,
        signup_source: 'post_plan_generation'
      };

      const { error } = await signUp(email, password, userData);
      
      if (error) {
        console.error('Signup failed:', error);
        alert(`Signup failed: ${error.message}`);
        return;
      }

      // Track successful signup
      if (window.gtag) {
        window.gtag('event', 'signup_success', {
          plan_type: selectedPlan,
          plan_value: totalPlanValue
        });
      }

      if (selectedPlan !== 'trial') {
        // Handle paid plans with Stripe
        const { paymentService } = await import('../../services/paymentService');
        const productId = selectedPlan === 'monthly' ? 'monthly-subscription' : 'annual-subscription';
        
        const result = await paymentService.createCheckoutSession({
          productId,
          customerEmail: email,
          metadata: {
            userName: name,
            planValue: totalPlanValue.toString(),
            signupSource: 'post_plan_generation'
          }
        });

        if (result.error) {
          alert(`Payment error: ${result.error}`);
          return;
        } else if (result.url) {
          // In production, this would redirect to Stripe
          console.log('Would redirect to Stripe:', result.url);
          alert(`Account created! Redirecting to payment for ${selectedPlan} plan.`);
        }
      } else {
        // Handle free trial
        alert('Account created successfully! Welcome to WealthKarma.');
      }

      setShowSuccess(true);
      setTimeout(() => {
        // Exit wizard and go to standalone dashboard
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Signup failed:', error);
      alert('Signup failed. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSkipToDashboard = () => {
    // Track skip action
    if (window.gtag) {
      window.gtag('event', 'signup_skipped', {
        plan_value: totalPlanValue
      });
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
                        ? 'border-orange-500 bg-gradient-to-r from-orange-500/10 to-orange-500/10 ring-2 ring-orange-500/30 transform scale-102'
                        : 'border-theme bg-theme-tertiary hover:border-orange-500/50'
                    }`}
                  >
                    {selectedPlan === 'monthly' && (
                      <div className="absolute -top-2 -right-2">
                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          FLEXIBLE
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-orange-500" />
                        <div>
                          <h3 className="font-bold text-theme-primary">Premium Monthly</h3>
                          <p className="text-sm text-theme-muted">Flexible billing</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-orange-600">$10</span>
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
                        <span>Analytics</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Support</span>
                      </div>
                    </div>
                  </div>

                  {/* Free Trial */}
                  <div 
                    onClick={() => setSelectedPlan('trial')}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPlan === 'trial'
                        ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/30 transform scale-102'
                        : 'border-theme bg-theme-tertiary hover:border-green-500/50'
                    }`}
                  >
                    {selectedPlan === 'trial' && (
                      <div className="absolute -top-2 -right-2">
                        <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          RISK FREE
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-green-500" />
                        <div>
                          <h3 className="font-semibold text-theme-primary">Free 7-Day Trial</h3>
                          <p className="text-xs text-theme-muted">No credit card required</p>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-green-600">$0</span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-lg bg-theme-tertiary border-2 border-theme text-theme-primary placeholder-theme-muted focus:ring-0 focus:border-green-500 transition-all duration-300"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-lg bg-theme-tertiary border-2 border-theme text-theme-primary placeholder-theme-muted focus:ring-0 focus:border-green-500 transition-all duration-300"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted group-focus-within:text-green-500 transition-colors" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-lg bg-theme-tertiary border-2 border-theme text-theme-primary placeholder-theme-muted focus:ring-0 focus:border-green-500 transition-all duration-300"
                      placeholder="Password"
                      required
                    />
                  </div>
                </div>

                {/* Plan Summary */}
                <div className="bg-gradient-to-r from-green-500/10 to-orange-500/10 rounded-xl p-4 border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-theme-primary">
                      {selectedPlan === 'trial' ? 'Free Trial (7 days)' 
                       : selectedPlan === 'annual' ? 'Premium Annual' 
                       : 'Premium Monthly'}
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {selectedPlan === 'trial' ? '$0' 
                       : selectedPlan === 'annual' ? '$99/year' 
                       : '$10/month'}
                    </span>
                  </div>
                  {selectedPlan === 'annual' && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      🎉 You're saving $20 with the annual plan!
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSigningUp}
                  fullWidth
                  className="py-4 text-xl rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold"
                >
                  {isSigningUp ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating your account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      {selectedPlan === 'trial' 
                        ? '🚀 Start Free Trial' 
                        : selectedPlan === 'annual'
                        ? '💎 Get Annual Plan'
                        : '⚡ Get Monthly Plan'
                      }
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </Button>

                {/* Security & Trust */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-theme">
                  <div className="flex items-center gap-2 text-sm text-theme-muted">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-theme-muted">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>Cancel Anytime</span>
                  </div>
                </div>

                {/* Skip Option */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSkipToDashboard}
                    className="text-theme-muted hover:text-green-500 transition-colors text-sm underline font-medium"
                  >
                    Skip for now - Preview dashboard
                  </button>
                </div>

                {/* Terms */}
                <p className="text-xs text-theme-muted text-center leading-relaxed">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-green-500 hover:underline font-medium">Terms</a>{' '}
                  and{' '}
                  <a href="#" className="text-green-500 hover:underline font-medium">Privacy Policy</a>.
                </p>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-theme-card p-10 rounded-3xl max-w-md mx-4 text-center border border-theme shadow-2xl animate-slideUp">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-theme-primary mb-4">Welcome to WealthKarma!</h3>
            <p className="text-theme-secondary mb-8 leading-relaxed text-lg">
              🎉 Your dashboard is ready! Time to turn your {formatCurrency(totalPlanValue, currency)} plan into reality.
            </p>
            <div className="text-sm text-theme-muted">
              Taking you to your dashboard...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetStartedSection; 