import React, { useEffect, useState } from 'react';
import { PlannerProvider, usePlanner } from '../context/PlannerContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { plannerPersistence } from '../services/plannerPersistence';
import LiveDashboard from '../components/LiveDashboard';
import EditPlanWizard from '../components/EditPlanWizard';
import ThemeToggle from '../components/ui/ThemeToggle';
import CurrencySelector from '../components/CurrencySelector';
import { Home, ArrowLeft, LogOut, Loader2, Edit3 } from 'lucide-react';
import Button from '../components/ui/Button';

const DashboardContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { state } = usePlanner();
  const [isEditWizardOpen, setIsEditWizardOpen] = useState(false);

  // Handle URL hash tokens for email confirmation
  useEffect(() => {
    const handleUrlTokens = async () => {
      // Only process if we have hash tokens but no user session
      if (!user && window.location.hash) {
        console.log('Dashboard: No user but hash detected, checking for tokens...');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        
        if (access_token && refresh_token) {
          console.log('Dashboard: Found tokens in URL hash, attempting to set session...');
          
          try {
            // Add timeout to prevent hanging
            const setSessionPromise = supabase.auth.setSession({
              access_token,
              refresh_token
            });
            
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('setSession timeout after 3 seconds')), 3000);
            });

            console.log('Dashboard: Waiting for setSession to complete...');
            const { data, error } = await Promise.race([setSessionPromise, timeoutPromise]) as any;
            
            if (error) {
              console.error('Dashboard: Failed to set session from URL tokens:', error);
            } else if (data.session) {
              console.log('Dashboard: Successfully established session!', data.session.user.email);
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);
            }
          } catch (error) {
            console.error('Dashboard: Exception/timeout setting session from URL tokens:', error);
            
            // Workaround: Decode the JWT token and create a temporary session
            console.log('Dashboard: Using workaround - decoding JWT token...');
            try {
              // Decode the JWT payload (base64 decode the middle part)
              const tokenParts = access_token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('Dashboard: Decoded user from token:', payload.email);
                
                // Store token information for this session
                sessionStorage.setItem('temp_user_data', JSON.stringify({
                  id: payload.sub,
                  email: payload.email,
                  user_metadata: payload.user_metadata,
                  email_confirmed_at: new Date().toISOString(),
                  confirmed_at: new Date().toISOString()
                }));
                
                // Clear the hash and reload to pick up the stored session
                window.history.replaceState(null, '', window.location.pathname);
                window.location.reload();
              }
            } catch (decodeError) {
              console.error('Dashboard: Failed to decode token:', decodeError);
              // Fallback: just reload the page
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          }
        }
      }
    };

    handleUrlTokens();
  }, [user]);

  // Show loading while data is being loaded
  if (state.isLoading) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-theme-primary mb-2">Loading Your Financial Plan</h2>
          <p className="text-theme-secondary">Retrieving your planning data...</p>
        </div>
      </div>
    );
  }

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
    try {
      console.log('🚪 Dashboard: Starting sign out process...');
      
      // Clear temporary session data first
      sessionStorage.removeItem('temp_user_data');
      console.log('✅ Dashboard: Cleared temporary session data');
      
      // Call the auth signOut function - it handles everything including redirect
      await signOut();
      
      // AuthContext signOut handles the redirect, so we don't need to do anything else
      console.log('✅ Dashboard: Sign out completed');
      
    } catch (error) {
      console.error('❌ Dashboard: Sign out error:', error);
      // AuthContext signOut handles error cases and redirects, so just log
    }
  };

  const handleEditPlan = () => {
    setIsEditWizardOpen(true);
  };

  const handleSaveEditedPlan = async () => {
    try {
      console.log('💾 Saving edited plan...');
      
      if (!user) {
        console.error('❌ No user found for saving');
        return;
      }

      // Save the updated planner state to Supabase
      const result = await plannerPersistence.savePlanningData(user.id, state);
      
      if (result.success) {
        console.log('✅ Plan saved successfully');
        // You could show a success toast notification here
      } else {
        console.error('❌ Failed to save plan:', result.error);
        // You could show an error toast notification here
      }
    } catch (error) {
      console.error('❌ Error saving edited plan:', error);
    }
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
                  variant="primary"
                  size="sm"
                  onClick={handleEditPlan}
                  className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2 bg-green-600 hover:bg-green-700"
                >
                  <Edit3 className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="hidden sm:block">Edit Plan</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBackToPlanning}
                  className="hidden lg:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2"
                >
                  <ArrowLeft className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>Back to Planning</span>
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

      {/* Edit Plan Wizard Modal */}
      <EditPlanWizard
        isOpen={isEditWizardOpen}
        onClose={() => setIsEditWizardOpen(false)}
        onSave={handleSaveEditedPlan}
      />
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <PlannerProvider>
          <DashboardContent />
        </PlannerProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
};

export default Dashboard; 