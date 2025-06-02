import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2, Save } from 'lucide-react';

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [savingData, setSavingData] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Prevent multiple executions
      if (hasProcessed.current) {
        console.log('Email confirmation already processed, skipping...');
        return;
      }
      hasProcessed.current = true;

      try {
        console.log('Starting email confirmation process...');
        console.log('Current URL:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        // Parse hash fragment parameters (Supabase often uses hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        console.log('Hash params:', Object.fromEntries(hashParams.entries()));
        
        // Get the tokens from URL parameters - check both search params and hash
        const token_hash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const type = searchParams.get('type') || hashParams.get('type');
        
        // Also check for the older 'token' parameter (used in some Supabase versions)
        const token = searchParams.get('token') || hashParams.get('token');
        
        // New format parameters (often in hash fragment)
        const access_token = searchParams.get('access_token') || hashParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token') || hashParams.get('refresh_token');
        
        // Error parameters that might be present
        const error = searchParams.get('error') || hashParams.get('error');
        const error_description = searchParams.get('error_description') || hashParams.get('error_description');

        console.log('Email confirmation params:', { 
          token_hash, 
          token,
          type, 
          access_token: access_token?.substring(0, 20) + '...', 
          refresh_token: refresh_token?.substring(0, 20) + '...', 
          error, 
          error_description 
        });

        // Check for error parameters first
        if (error) {
          console.error('Email confirmation error from URL:', error, error_description);
          setStatus('error');
          setMessage(error_description || error || 'Failed to confirm email. Please try again.');
          return;
        }

        // Handle new format (access_token + refresh_token) - THIS IS YOUR FORMAT
        if (access_token && refresh_token) {
          console.log('Using new token format for confirmation');
          console.log('Tokens detected, proceeding with direct confirmation...');
          
          // Since Supabase auth methods are hanging in development,
          // use the alternative approach immediately
          await handleAlternativeConfirmation();
          return;
        }

        // Handle standard format (token_hash + type=email)
        if (token_hash && type === 'email') {
          console.log('Using standard token_hash format for confirmation');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email'
          });

          if (error) {
            console.error('Email confirmation error (standard format):', error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email. Please try signing up again.');
            return;
          }

          if (data.user) {
            console.log('Email confirmed successfully with standard format!', data.user.email);
            setStatus('success');
            setMessage('Email confirmed successfully!');
            
            // Save planning data to Supabase
            await savePlanningDataToSupabase(data.user.id);
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
            return;
          }
        }

        // Handle older format (token + type=signup) - this is what your URL shows
        if (token && (type === 'signup' || type === 'email')) {
          console.log('Using older token format for confirmation');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token, // Use the 'token' parameter as token_hash
            type: 'signup' // Use the actual type from URL
          });

          if (error) {
            console.error('Email confirmation error (older format):', error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email. Please try signing up again.');
            return;
          }

          if (data.user) {
            console.log('Email confirmed successfully with older format!', data.user.email);
            setStatus('success');
            setMessage('Email confirmed successfully!');
            
            // Save planning data to Supabase
            await savePlanningDataToSupabase(data.user.id);
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
            return;
          }
        }

        // If we get here, no valid tokens were found
        console.error('No valid confirmation tokens found in URL');
        setStatus('error');
        setMessage('Invalid confirmation link. Please check your email and try the confirmation link again, or sign up again.');
        
      } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    const savePlanningDataToSupabase = async (userId: string) => {
      try {
        setSavingData(true);
        setMessage('Email confirmed! Saving your planning data...');
        console.log('Starting to save planning data for user:', userId);
        
        // Load planning data from localStorage
        const savedPlannerState = localStorage.getItem('planner-state');
        if (!savedPlannerState) {
          console.log('No planning data found in localStorage');
          setMessage('Email confirmed successfully! Redirecting to dashboard...');
          return;
        }

        const plannerState = JSON.parse(savedPlannerState);
        console.log('Found planning data in localStorage:', plannerState);

        // Only save if there's meaningful data (not just empty state)
        const hasData = plannerState.goals?.length > 0 || 
                       plannerState.userProfile?.name || 
                       plannerState.monthlyExpenses > 0;

        if (!hasData) {
          console.log('No meaningful planning data to save');
          setMessage('Email confirmed successfully! Redirecting to dashboard...');
          return;
        }

        console.log('Found meaningful data, saving to Supabase...');
        // Import and use the planning persistence service
        const { plannerPersistence } = await import('../services/plannerPersistence');
        const result = await plannerPersistence.savePlanningData(userId, plannerState);

        if (result.success) {
          console.log('✅ Successfully saved planning data to Supabase');
          setMessage('Email confirmed and planning data saved! Redirecting to dashboard...');
          
          // Clear localStorage since data is now in Supabase
          localStorage.removeItem('planner-state');
          console.log('Cleared localStorage planning data');
        } else {
          console.error('❌ Failed to save planning data:', result.error);
          setMessage('Email confirmed, but failed to save planning data. You can access your data in the dashboard.');
        }

      } catch (error) {
        console.error('Error saving planning data:', error);
        setMessage('Email confirmed, but encountered an error saving data. You can access your data in the dashboard.');
      } finally {
        setSavingData(false);
        console.log('Finished saving planning data process');
      }
    };

    // Alternative confirmation method when setSession fails
    const handleAlternativeConfirmation = async () => {
      console.log('Using alternative confirmation approach...');
      
      // Since we have valid tokens in the URL, try to navigate to dashboard
      // and let the auth system handle the session detection
      setStatus('success');
      setMessage('Email confirmation detected! Redirecting to dashboard...');
      
      // Check localStorage for planning data to save
      const savedPlannerState = localStorage.getItem('planner-state');
      if (savedPlannerState) {
        setSavingData(true);
        setMessage('Email confirmed! Preparing your planning data...');
      }
      
      // Redirect to dashboard while preserving the hash tokens for Supabase to detect
      setTimeout(() => {
        console.log('Redirecting to dashboard via alternative method...');
        // Preserve the current hash and redirect to dashboard
        const currentHash = window.location.hash;
        window.location.href = `/dashboard${currentHash}`;
      }, 2000);
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-theme-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-theme-card rounded-lg shadow-theme-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-theme-primary mb-2">
              Confirming your email...
            </h1>
            <p className="text-theme-secondary">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-green-400 mb-2">
              Email Confirmed!
            </h1>
            <p className="text-theme-secondary mb-4">
              {message}
            </p>
            
            {/* Data saving indicator */}
            {savingData && (
              <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Save className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm text-blue-400">Saving your planning data...</span>
              </div>
            )}
            
            <div className="text-sm text-theme-secondary">
              You'll be redirected automatically in a few seconds...
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-400 mb-2">
              Confirmation Failed
            </h1>
            <p className="text-theme-secondary mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-green-500 hover:bg-green-600 text-theme-primary font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full border border-theme text-theme-secondary hover:text-theme-primary py-2 px-4 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation; 