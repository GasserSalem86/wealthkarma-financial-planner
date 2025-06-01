import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Mail, Lock, ArrowRight, Sparkles, Home } from 'lucide-react';

const Login: React.FC = () => {
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }

      // Success - redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Sign in failed:', error);
      setError('Sign in failed. Please try again.');
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
          <p className="text-theme-secondary">Sign in to your financial dashboard</p>
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
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <Lock className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-theme-muted group-focus-within:text-green-500 transition-colors" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 rounded-xl text-base lg:text-lg bg-theme-tertiary border-2 border-theme text-theme-primary placeholder-theme-muted focus:ring-0 focus:border-green-500 transition-all duration-300"
                placeholder="Password"
                required
              />
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isSigningIn}
              fullWidth
              className="py-3 lg:py-4 text-lg lg:text-xl rounded-xl bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 font-bold"
            >
              {isSigningIn ? (
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 lg:gap-3">
                  Sign In
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
              )}
            </Button>
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