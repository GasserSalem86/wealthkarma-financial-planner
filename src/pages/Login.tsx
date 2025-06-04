import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Mail, ArrowRight, Sparkles, Home, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithOTP, verifySignInOTP, user } = useAuth();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugStatus, setDebugStatus] = useState('');

  // Redirect if already logged in
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions
    if (isSigningIn) {
      console.log('🚫 Operation already in progress, ignoring duplicate submission');
      return;
    }
    
    setIsSigningIn(true);
    setError(null);

    try {
      if (!showOTPInput) {
        // Step 1: Send OTP to email
        setDebugStatus('Sending verification code...');
        
        console.log('📧 Sending sign-in OTP to:', email);
        const result = await signInWithOTP(email);
        
        if (result.error) {
          console.error('❌ Failed to send sign-in OTP:', result.error);
          
          if (result.error.message?.includes('request this after')) {
            setError('Rate limit reached. Please wait before trying again.');
            setDebugStatus('Rate limit reached - please wait');
          } else {
            setError(`Failed to send verification code: ${result.error.message}`);
            setDebugStatus(`Failed to send code: ${result.error.message}`);
          }
          return;
        }

        console.log('✅ Sign-in OTP sent successfully');
        setDebugStatus('Verification code sent! Check your email.');
        setShowOTPInput(true);
        
      } else {
        // Step 2: Verify OTP code
        setDebugStatus('Verifying code...');
      
        if (!otpCode || otpCode.length !== 6) {
          setError('Please enter the 6-digit verification code');
          return;
        }

        console.log('🔐 Verifying sign-in OTP code...');
        const result = await verifySignInOTP(email, otpCode);
        
        if (result.error) {
          console.error('❌ Sign-in OTP verification failed:', result.error);
          setError(`Invalid verification code: ${result.error.message}`);
          setDebugStatus(`Invalid code: ${result.error.message}`);
        return;
      }

        console.log('✅ Sign-in OTP verified successfully, user authenticated');
        setDebugStatus('Welcome back! Redirecting to dashboard...');

      // Success - redirect to dashboard
        setTimeout(() => {
      window.location.href = '/dashboard';
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Unexpected sign-in error:', error);
      setError('An unexpected error occurred. Please try again.');
      setDebugStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const resendOTP = async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    setError(null);
    setDebugStatus('Resending verification code...');
    
    try {
      const result = await signInWithOTP(email);
      
      if (result.error) {
        console.error('❌ Failed to resend sign-in OTP:', result.error);
        setError(`Failed to resend verification code: ${result.error.message}`);
        setDebugStatus(`Failed to resend: ${result.error.message}`);
      } else {
        console.log('✅ Sign-in OTP resent successfully');
        setDebugStatus('New verification code sent!');
        setOtpCode(''); // Clear the input
        setError(null);
      }
    } catch (error) {
      console.error('❌ Error resending sign-in OTP:', error);
      setError('Failed to resend code. Please try again.');
      setDebugStatus('Error resending code');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen app-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 lg:mb-8">
          <div className="flex items-center justify-center gap-2 lg:gap-3 mb-4 lg:mb-6">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-theme-primary">WealthKarma</h1>
              <p className="text-xs lg:text-sm text-theme-secondary">AI Financial Planner</p>
            </div>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-theme-primary mb-2">Welcome Back</h2>
          <p className="text-theme-secondary">Sign in to your financial dashboard - no password required</p>
        </div>

        {/* Login Form */}
        <div className="bg-theme-card rounded-xl border border-theme shadow-theme-lg p-6 lg:p-8">
          <form onSubmit={handleSignIn} className="space-y-5 lg:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 lg:p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="relative group">
              <Mail className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-theme-muted group-focus-within:text-green-500 transition-colors" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 rounded-xl text-base lg:text-lg bg-theme-tertiary border-2 border-theme text-theme-primary placeholder-theme-muted focus:ring-0 focus:border-green-500 transition-all duration-300"
                placeholder="your.email@example.com"
                required
                disabled={showOTPInput || isSigningIn}
              />
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
                  className="w-full px-4 py-3 lg:py-4 rounded-xl text-base lg:text-lg bg-theme-tertiary border-2 border-theme text-theme-primary placeholder-theme-muted focus:ring-0 focus:border-green-500 transition-all duration-300 text-center tracking-widest"
                  maxLength={6}
                required
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
              />
                <div className="absolute top-3 lg:top-4 right-3 lg:right-4 text-theme-muted flex items-center justify-center">
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
                      setError(null);
                      setDebugStatus('');
                    }}
                    className="text-theme-muted hover:text-theme-primary transition-colors"
                    disabled={isSigningIn}
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    onClick={resendOTP}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    disabled={isSigningIn}
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isSigningIn || !email || (showOTPInput && (!otpCode || otpCode.length !== 6))}
              fullWidth
              className="py-3 lg:py-4 text-lg lg:text-xl rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold"
            >
              {isSigningIn ? (
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {debugStatus || (showOTPInput ? 'Verifying Code...' : 'Sending Code...')}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  {showOTPInput ? 'Verify Code & Sign In' : 'Send Verification Code'}
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
              )}
            </Button>

            {/* Debug Status - Only show during operation */}
            {isSigningIn && debugStatus && (
              <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-600">{debugStatus}</p>
                {debugStatus.includes('Rate limit') && (
                  <p className="text-xs text-blue-500 mt-1">Please wait a moment before trying again</p>
                )}
              </div>
            )}
          </form>

          {/* Footer Links */}
          <div className="mt-6 lg:mt-8 space-y-3 lg:space-y-4">
            <div className="text-center">
              <p className="text-theme-muted text-sm lg:text-base">
                Don't have an account?{' '}
                <Link to="/plan" className="text-green-500 hover:text-green-600 font-medium hover:underline">
                  Create one here
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center gap-1 lg:gap-2 text-theme-muted hover:text-theme-secondary transition-colors text-sm lg:text-base"
              >
                <Home className="w-3 h-3 lg:w-4 lg:h-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 