import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the tokens from URL parameters - handle both old and new formats
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        // New format parameters
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');

        console.log('Email confirmation params:', { token_hash, type, access_token, refresh_token });

        // Handle new format (access_token + refresh_token)
        if (access_token && refresh_token) {
          console.log('Using new token format for confirmation');
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error('Email confirmation error (new format):', error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email. Please try again.');
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to dashboard...');
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          }
        }

        // Handle old format (token_hash + type)
        if (token_hash && type === 'email') {
          console.log('Using old token format for confirmation');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email'
          });

          if (error) {
            console.error('Email confirmation error (old format):', error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email. Please try again.');
            return;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to dashboard...');
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          }
        }

        // If we get here, no valid tokens were found
        setStatus('error');
        setMessage('Invalid confirmation link. Please try signing up again.');
        
      } catch (error) {
        console.error('Unexpected error during email confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
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