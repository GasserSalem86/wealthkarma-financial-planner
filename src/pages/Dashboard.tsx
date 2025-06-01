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
          <p className="text-theme-secondary mb-6">Please log in to access your dashboard</p>
          <Button
            onClick={() => window.location.href = '/plan'}
            className="w-full"
          >
            Go to Planner
          </Button>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <div>
                  <h1 className="heading-h4-sm text-theme-light">WealthKarma</h1>
                  <p className="text-sm text-theme-secondary">Live Dashboard</p>
                </div>
              </div>
              {user && (
                <div className="text-sm text-theme-secondary">
                  Welcome back, {user.user_metadata?.name || user.email}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <CurrencySelector />
              <ThemeToggle showLabel={false} />
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBackToPlanning}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Planning
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
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