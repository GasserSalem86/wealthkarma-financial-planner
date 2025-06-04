import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/calculations';
import { saveUserDataOnSignup } from '../../services/autoDataService';
import { 
  Mail, 
  CheckCircle, 
  Star, 
  Zap, 
  BarChart3,
  Bell,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Heart,
  Target
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface GetStartedSectionProps {
  onNext?: () => void;
  onBack: () => void;
}

const GetStartedSection: React.FC<GetStartedSectionProps> = ({ onBack }) => {
  const { state } = usePlanner();
  const { currency } = useCurrency();
  const { sendOTP, verifyOTP, user, session } = useAuth();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [debugStatus, setDebugStatus] = useState('');

  // Use the name from the profile that was already collected
  const userName = state.userProfile.name || '';

  // Calculate plan value for display
  const totalPlanValue = state.allocations.reduce((sum, allocation) => 
    sum + allocation.goal.amount, 0
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions
    if (isSigningUp) {
      console.log('🚫 Operation already in progress, ignoring duplicate submission');
      return;
    }
    
    setIsSigningUp(true);
    
    try {
      if (!showOTPInput) {
        // Step 1: Send OTP to email
        setDebugStatus('Sending verification code...');
        
        // Track OTP send attempt
        if (window.gtag) {
          window.gtag('event', 'otp_send_attempt', {
            plan_type: 'free',
            plan_value: totalPlanValue,
            conversion_point: 'post_plan_generation'
          });
        }

        const userData = {
          name: userName,
          plan_type: 'free',
          plan_value: totalPlanValue,
          signup_source: 'post_plan_generation'
        };

        console.log('📧 Sending OTP to:', email);
        const result = await sendOTP(email, userData);
        
        if (result.error) {
          console.error('❌ Failed to send OTP:', result.error);
          
          // Handle rate limiting specifically
          if (result.error.message?.includes('request this after')) {
            setDebugStatus('Rate limit reached - please wait');
            alert(`Please wait before trying again. ${result.error.message}`);
          } else {
            setDebugStatus(`Failed to send code: ${result.error.message}`);
            alert(`Failed to send verification code: ${result.error.message}`);
          }
          return;
        }

        console.log('✅ OTP sent successfully');
        setDebugStatus('Verification code sent! Check your email.');
        setShowOTPInput(true);
        
        // Track successful OTP send
        if (window.gtag) {
          window.gtag('event', 'otp_sent_success', {
            plan_type: 'free',
            plan_value: totalPlanValue
          });
        }
        
      } else {
        // Step 2: Verify OTP code
        setDebugStatus('Verifying code...');
        
        if (!otpCode || otpCode.length !== 6) {
          alert('Please enter the 6-digit verification code');
          return;
        }

        console.log('🔐 Verifying OTP code...');
        const userData = {
          name: userName,
          plan_type: 'free',
          plan_value: totalPlanValue,
          signup_source: 'post_plan_generation'
        };

        const result = await verifyOTP(email, otpCode, userData);
        
        if (result.error) {
          console.error('❌ OTP verification failed:', result.error);
          setDebugStatus(`Invalid code: ${result.error.message}`);
          alert(`Invalid verification code: ${result.error.message}`);
          return;
        }

        console.log('✅ OTP verified successfully, user authenticated');
        setDebugStatus('Account created successfully!');

        // Track successful signup
        if (window.gtag) {
          window.gtag('event', 'signup_success', {
            plan_type: 'free',
            plan_value: totalPlanValue,
            method: 'otp'
          });
        }

        // OTP verification successful - user is now authenticated
        console.log('✅ User successfully authenticated via OTP');
        
        // Auto-save user financial planning data (using exact working manual save method)
        // Give AuthContext a moment to update session, then try multiple approaches
        if (result.user) {
          console.log('💾 Auto-saving financial planning data...');
          setDebugStatus('Saving your financial plan...');
          
          try {
            // Small delay to let AuthContext update the session
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let accessToken = session?.access_token;
            
            // If AuthContext session isn't ready, try getting session directly from Supabase
            if (!accessToken) {
              console.log('🔄 AuthContext session not ready, trying direct session fetch...');
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                accessToken = sessionData?.session?.access_token;
                console.log('📱 Direct session fetch result:', accessToken ? 'Got token' : 'No token');
              } catch (sessionError) {
                console.warn('⚠️ Direct session fetch failed:', sessionError);
              }
            } else {
              console.log('✅ Using access token from AuthContext');
            }
            
            if (!accessToken) {
              console.warn('⚠️ No access token available from any source');
              setDebugStatus('Account created successfully! (Manual save may be needed)');
            } else {
              console.log('✅ Got access token for auto-save');
              const saveResult = await saveUserDataOnSignup(result.user.id, state, accessToken);
              
              if (saveResult.success) {
                console.log('✅ Financial planning data auto-saved successfully!');
                setDebugStatus('Your financial plan has been saved securely!');
              } else {
                console.warn('⚠️ Financial planning data save failed:', saveResult.error);
                setDebugStatus('Account created, but data save failed. You can manually save later.');
              }
            }
          } catch (saveError) {
            console.error('❌ Error auto-saving financial data:', saveError);
            setDebugStatus('Account created, but data save failed. You can manually save later.');
          }
        } else {
          console.warn('⚠️ No user data available for auto-save');
          setDebugStatus('Account created successfully! (Manual save may be needed)');
        }
        
        setShowSuccess(true);
        
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          console.log('🚀 Redirecting to dashboard...');
          window.location.href = '/dashboard';
        }, 3000); // 3 second delay to let user see success and save status
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        setDebugStatus('Operation timed out');
        alert('Operation is taking longer than expected. Please check your internet connection and try again.');
      } else {
        setDebugStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const resendOTP = async () => {
    if (isSigningUp) return;
    
    setIsSigningUp(true);
    setDebugStatus('Resending verification code...');
    
    try {
      const userData = {
        name: userName,
        plan_type: 'free',
        plan_value: totalPlanValue,
        signup_source: 'post_plan_generation'
      };

      const result = await sendOTP(email, userData);
      
      if (result.error) {
        console.error('❌ Failed to resend OTP:', result.error);
        setDebugStatus(`Failed to resend: ${result.error.message}`);
        alert(`Failed to resend verification code: ${result.error.message}`);
      } else {
        console.log('✅ OTP resent successfully');
        setDebugStatus('New verification code sent!');
        setOtpCode(''); // Clear the input
      }
    } catch (error) {
      console.error('❌ Error resending OTP:', error);
      setDebugStatus('Error resending code');
      alert('Failed to resend code. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      
      {/* Hero Section */}
      <div className="text-center mb-16">
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
            <span>100% Free</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Loved by Expats</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
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

        {/* Right Column - Signup Form */}
        <div className="lg:sticky lg:top-8">
          <Card className="bg-theme-card border-2 border-theme shadow-2xl">
            <CardContent className="p-8">
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-theme-primary mb-3">
                  {userName ? `Ready, ${userName}?` : 'Get Started Today'}
                </h2>
                <p className="text-theme-secondary">
                  {userName ? 'Create your account to save your personalized plan' : 'Join thousands of successful GCC expats'}
                </p>
                <div className="mt-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">100% Free - No Password Required</span>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="mb-6 p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    {userName ? `Welcome ${userName}! Account Created!` : 'Welcome! Account Created!'}
                  </h3>
                  <p className="text-theme-secondary mb-4">
                    Your account has been successfully created and you're now logged in.
                  </p>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      <strong>You're all set!</strong> Your personalized financial plan has been saved and you can start tracking your progress.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Redirecting to your dashboard...</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-6">
                
                {!showSuccess && (
                  <>
                    {/* Features List */}
                    <div className="bg-theme-tertiary rounded-xl p-4 mb-6">
                      <h3 className="font-semibold text-theme-primary mb-3">What you get for free:</h3>
                      <div className="grid grid-cols-1 gap-2 text-sm text-theme-secondary">
                            <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Live progress tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>AI financial coaching</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Goal optimization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Personalized roadmap</span>
                      </div>
                      </div>
                    </div>

                    {/* Signup Form */}
                    <div className="space-y-4">
                      {/* Email Input - Always visible */}
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-theme bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                          disabled={showOTPInput || isSigningUp}
                        />
                        <Mail className="absolute top-3 right-3 w-5 h-5 text-theme-muted" />
                      </div>
                      
                      {/* OTP Input - Only show when OTP step is active */}
                      {showOTPInput && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter 6-digit verification code"
                            value={otpCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setOtpCode(value);
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-theme bg-theme-tertiary focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-lg tracking-widest"
                            maxLength={6}
                            required
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                          <div className="absolute top-3 right-3 w-5 h-5 text-theme-muted flex items-center justify-center">
                            <span className="text-xs font-mono">{otpCode.length}/6</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Help text for current step */}
                      {showOTPInput && (
                        <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-blue-600">
                            📧 We sent a 6-digit code to <strong>{email}</strong>
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            Check your email and enter the code above
                          </p>
                          <div className="mt-3 flex justify-center gap-4 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setShowOTPInput(false);
                                setOtpCode('');
                                setDebugStatus('');
                              }}
                              className="text-theme-muted hover:text-theme-primary transition-colors"
                              disabled={isSigningUp}
                            >
                              ← Change Email
                            </button>
                            <button
                              type="button"
                              onClick={resendOTP}
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                              disabled={isSigningUp}
                            >
                              Resend Code
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className={`w-full ${isSigningUp ? 'opacity-75 cursor-not-allowed' : ''}`}
                      disabled={isSigningUp || !email || (showOTPInput && (!otpCode || otpCode.length !== 6))}
                    >
                      {isSigningUp ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {debugStatus || (showOTPInput ? 'Verifying Code...' : 'Sending Code...')}
                        </div>
                      ) : (
                        showOTPInput ? 'Verify Code & Create Account' : 'Send Verification Code'
                      )}
                    </Button>

                    {/* Debug Status - Only show during signup */}
                    {isSigningUp && debugStatus && (
                      <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm text-blue-600">{debugStatus}</p>
                        {debugStatus.includes('Rate limit') && (
                          <p className="text-xs text-blue-500 mt-1">Please wait a moment before trying again</p>
                        )}
                      </div>
                    )}

                    {/* Terms */}
                    <p className="text-xs text-theme-muted text-center">
                      By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GetStartedSection; 