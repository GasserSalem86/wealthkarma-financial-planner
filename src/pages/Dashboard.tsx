import React from 'react';
import { PlannerProvider } from '../context/PlannerContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LiveDashboard from '../components/LiveDashboard';
import ThemeToggle from '../components/ui/ThemeToggle';
import CurrencySelector from '../components/CurrencySelector';
import { Home, ArrowLeft, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-theme-card rounded-xl border border-theme shadow-theme-lg text-center">
          <h1 className="text-2xl font-bold text-theme-primary mb-4">Authentication Required</h1>
          <p className="text-theme-secondary mb-6">Please sign in to access your dashboard</p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              onClick={() => window.location.href = '/plan'}
              variant="outline"
              className="w-full"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBackToPlanning = () => {
    // Navigate back to the planning tool
    window.location.href = '/plan';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen app-background">
      {/* Header */}
      <header className="nav-dark border-b border-theme shadow-theme-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg lg:text-xl">W</span>
                </div>
                <div>
                  <h1 className="text-sm lg:text-lg font-bold text-theme-light">WealthKarma</h1>
                  <p className="text-xs lg:text-sm text-theme-secondary">Live Dashboard</p>
                </div>
              </div>
              {user && (
                <div className="hidden sm:block text-xs lg:text-sm text-theme-secondary">
                  Welcome back, {user.user_metadata?.name || user.email}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 lg:gap-4">
              <div className="hidden sm:block">
                <CurrencySelector />
              </div>
              <ThemeToggle showLabel={false} />
              
              <div className="flex items-center gap-1 lg:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToHome}
                  className="hidden sm:flex items-center gap-2 text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2"
                >
                  <Home className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden lg:block">Home</span>
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBackToPlanning}
                  className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2"
                >
                  <ArrowLeft className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:block">Back to Planning</span>
                  <span className="sm:hidden">Plan</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 lg:gap-2 text-red-600 hover:text-red-700 text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2"
                >
                  <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:block">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile User Info - Show under header on mobile */}
          {user && (
            <div className="sm:hidden mt-2 text-xs text-theme-secondary border-t border-theme pt-2">
              Welcome back, {user.user_metadata?.name || user.email}
            </div>
          )}

          {/* Mobile Currency Selector */}
          <div className="sm:hidden mt-2 border-t border-theme pt-2">
            <CurrencySelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-2 lg:p-0">
        <LiveDashboard 
          onOptimizePlan={() => {
            // Could trigger plan re-optimization
            console.log('Optimizing plan...');
          }}
          onUpdateProgress={() => {
            // Handle progress updates
            console.log('Updating progress...');
          }}
        />
      </main>
    </div>
  );
};

export default Dashboard; 