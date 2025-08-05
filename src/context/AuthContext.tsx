import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOTP: (email: string) => Promise<{ error: AuthError | null }>;
  verifySignInOTP: (email: string, token: string) => Promise<{ error: AuthError | null; user?: User | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  sendOTP: (email: string, userData?: any) => Promise<{ error: AuthError | null }>;
  verifyOTP: (email: string, token: string, userData?: any) => Promise<{ error: AuthError | null; user?: User | null }>;
  checkEmailExists: (email: string) => Promise<{ exists: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      
      // If no session, check for temporary user data from token workaround
      if (!session) {
        const tempUserData = sessionStorage.getItem('temp_user_data');
        if (tempUserData) {
          console.log('Found temporary user data, using workaround session...');
          try {
            const userData = JSON.parse(tempUserData);
            setUser(userData as User);
            setLoading(false);
            
            // Create profile for the user
            await createUserProfile(userData as User, userData.user_metadata || {});
            return;
          } catch (error) {
            console.error('Failed to parse temporary user data:', error);
            sessionStorage.removeItem('temp_user_data');
          }
        }
      }
      
      // If no session but tokens are in URL hash, try to establish session
      if (!session && window.location.hash) {
        console.log('No session found but hash detected, checking for tokens...');
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        
        if (access_token && refresh_token) {
          console.log('Found tokens in URL hash, attempting to set session...');
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            
            if (error) {
              console.error('Failed to set session from URL tokens:', error);
            } else if (data.session) {
              console.log('Successfully established session from URL tokens!', data.session.user.email);
              setSession(data.session);
              setUser(data.session.user);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Exception setting session from URL tokens:', error);
          }
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'User:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create profile when user signs in (including after email confirmation)
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, checking profile...');
        await createUserProfile(session.user, session.user.user_metadata || {});
      }

      // Also handle when email gets confirmed through token refresh
      if (event === 'TOKEN_REFRESHED' && session?.user && session.user.email_confirmed_at) {
        console.log('Token refreshed with confirmed email, ensuring profile exists...');
        await createUserProfile(session.user, session.user.user_metadata || {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User, userData: any = {}) => {
    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('Profile already exists for user:', user.id);
        return { error: null };
      }

      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: userData.fullName || user.user_metadata?.full_name || '',
          country: userData.country || user.user_metadata?.country || '',
          nationality: userData.nationality || user.user_metadata?.nationality || '',
          currency: 'USD', // Default currency for global users
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating user profile:', error);
        return { error };
      }
      
      console.log('Profile created successfully for user:', user.id);
      return { error: null };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, userData: any = {}) => {
    try {
      setLoading(true);
      
      // Set the correct redirect URL based on environment
      const isProduction = window.location.hostname !== 'localhost';
      const redirectUrl = isProduction 
        ? `${window.location.origin}/confirm`
        : `${window.location.origin}/confirm`;
      
      console.log('Signup redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.name || userData.fullName || '',
            country: userData.country || '',
            nationality: userData.nationality || '',
            plan_type: userData.plan_type || 'free',
            plan_value: userData.plan_value || 0,
            signup_source: userData.signup_source || ''
          },
        },
      });

      // Create profile after successful signup (will happen after email confirmation)
      if (!error && data.user && data.user.email_confirmed_at) {
        await createUserProfile(data.user, userData);
      }

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 AuthContext: Starting complete sign out...');
      
      // Clear ALL session storage immediately
      sessionStorage.removeItem('temp_user_data');
      localStorage.removeItem('last-save-timestamp');
      
      // CRITICAL: Clear planner data immediately on sign-out
      // This ensures cleanup happens even if user navigates away from PlannerProvider pages
      localStorage.removeItem('planner-state');
      console.log('🗑️ AuthContext: Cleared planner-state from localStorage');
      
      // Clear any other planner-related data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('planner') || key.includes('financial')) {
          localStorage.removeItem(key);
          console.log(`🗑️ AuthContext: Cleared ${key} from localStorage`);
        }
      });
      
      // Clear planner-related sessionStorage
      sessionStorage.removeItem('was-authenticated');
      sessionStorage.removeItem('last_data_load');
      
      // Clear any failure markers
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('load_failures_')) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ AuthContext: Cleared failure marker ${key}`);
        }
      });
      
      // Clear any Supabase-related localStorage/sessionStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('✅ AuthContext: Cleared all session storage data');
      
      // Show success message to user immediately
      alert('✅ Successfully Signed Out!\n\nYou have been logged out securely. All your data has been saved.\n\nRedirecting to home page...');
      
      // Force clear the auth state immediately (don't wait for Supabase client)
      console.log('🧹 Forcing local auth state clear...');
      setUser(null);
      setSession(null);
      
      // Force clear Supabase client session (non-blocking but more thorough)
      console.log('🔄 Forcing Supabase client session clear...');
      try {
        // Force clear the internal Supabase session storage
        await supabase.auth.signOut({ scope: 'global' });
      } catch (error: any) {
        console.warn('⚠️ Supabase global sign out failed (expected):', error?.message);
      }
      
      // Additional cleanup - clear any cookies that might exist
      try {
        // Clear auth-related cookies if any exist
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          }
        });
      } catch (cookieError) {
        console.warn('⚠️ Cookie cleanup failed:', cookieError);
      }
      
      // Direct navigation to landing page without page reload
      console.log('🏠 Navigating directly to landing page...');
      window.history.pushState(null, '', '/');
      
      // Dispatch a custom event to trigger re-render of the app
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      console.log('✅ AuthContext: Complete sign out process finished');
      return { error: null };
      
    } catch (error) {
      console.error('❌ AuthContext: Unexpected sign out error:', error);
      
      // Even if there's an error, force clear local state
      setUser(null);
      setSession(null);
      console.log('🧹 Forced local auth state clear due to error');
      
      // Show error message but still redirect
      alert('⚠️ Sign Out Complete\n\nYou have been logged out (with some minor issues).\n\nRedirecting to home page...');
      
      // Direct navigation as fallback
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      return { error: error as AuthError };
    } finally {
      setLoading(false);
      console.log('🏁 AuthContext: Sign out process completed');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Set the correct redirect URL based on environment
      const isProduction = window.location.hostname !== 'localhost';
      const redirectUrl = isProduction 
        ? `${window.location.origin}/reset-password`
        : `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const sendOTP = async (email: string, userData?: any) => {
    try {
      setLoading(true);
      
      // Prevent OTP signup if user is already authenticated
      if (user) {
        console.warn('⚠️ User already authenticated, cannot use OTP signup');
        return { error: { message: 'You are already signed in. Please sign out first if you want to create a new account.' } as AuthError };
      }
      
      // Send OTP email for NEW USER SIGNUP
      // Note: For new users, this uses "Confirm signup" template
      // For existing users, this uses "Magic Link" template  
      // Both templates need to be configured with {{ .Token }} for OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Allow new user creation for signup flow
          data: userData ? {
            full_name: userData.name || userData.fullName || '',
            country: userData.country || '',
            nationality: userData.nationality || '',
            plan_type: userData.plan_type || 'free',
            plan_value: userData.plan_value || 0,
            signup_source: userData.signup_source || ''
          } : undefined,
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email: string, token: string, userData?: any) => {
    try {
      setLoading(true);
      console.log('🔐 Starting OTP verification for:', email, 'with token length:', token.length);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OTP verification timed out after 30 seconds')), 30000);
      });
      
      // Verify the OTP token with timeout
      const verificationPromise = supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      
      const { data, error } = await Promise.race([verificationPromise, timeoutPromise]) as any;
      
      console.log('🔍 OTP verification response:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('❌ OTP verification failed:', error);
        return { error, user: null };
      }

      if (!data || !data.user) {
        console.error('❌ OTP verification succeeded but no user data returned');
        return { error: new Error('No user data returned after verification') as AuthError, user: null };
      }

      console.log('✅ OTP verification successful, creating user profile...');
      
      // Create profile for new users
      try {
        await createUserProfile(data.user, userData || data.user.user_metadata || {});
        console.log('✅ User profile created successfully');
      } catch (profileError) {
        console.warn('⚠️ Profile creation failed but continuing:', profileError);
      }
      
      return { error: null, user: data.user };

    } catch (error) {
      console.error('❌ Unexpected error during OTP verification:', error);
      return { error: error as AuthError, user: null };
    } finally {
      console.log('🏁 OTP verification completed, resetting loading state');
      setLoading(false);
    }
  };

  const signInWithOTP = async (email: string) => {
    try {
      setLoading(true);
      
      // Prevent OTP signin if user is already authenticated
      if (user) {
        console.warn('⚠️ User already authenticated, cannot use OTP signin');
        return { error: { message: 'You are already signed in. Please sign out first if you want to sign in with a different account.' } as AuthError };
      }
      
      // Send OTP email for EXISTING USER SIGN-IN
      // This uses "Magic Link" template - must be configured with {{ .Token }}
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Do NOT create new users - only authenticate existing ones
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const verifySignInOTP = async (email: string, token: string) => {
    try {
      setLoading(true);
      console.log('🔐 Starting sign-in OTP verification for:', email, 'with token length:', token.length);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign-in OTP verification timed out after 30 seconds')), 30000);
      });
      
      // Verify the OTP token with timeout
      const verificationPromise = supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      
      const { data, error } = await Promise.race([verificationPromise, timeoutPromise]) as any;
      
      console.log('🔍 Sign-in OTP verification response:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('❌ Sign-in OTP verification failed:', error);
        return { error, user: null };
      }

      if (!data || !data.user) {
        console.error('❌ Sign-in OTP verification succeeded but no user data returned');
        return { error: new Error('No user data returned after verification') as AuthError, user: null };
      }

      console.log('✅ Sign-in OTP verification successful, ensuring user profile exists...');
      
      // Create profile for new users (or ensure existing profile)
      try {
        await createUserProfile(data.user, data.user.user_metadata || {});
        console.log('✅ User profile ensured successfully');
      } catch (profileError) {
        console.warn('⚠️ Profile creation/update failed but continuing:', profileError);
      }
      
      return { error: null, user: data.user };

    } catch (error) {
      console.error('❌ Unexpected error during sign-in OTP verification:', error);
      return { error: error as AuthError, user: null };
    } finally {
      console.log('🏁 Sign-in OTP verification completed, resetting loading state');
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking email existence:', error);
        return { exists: false, error: error.message };
      }

      if (data) {
        console.log('Email exists in database');
        return { exists: true, error: null };
      } else {
        console.log('Email does not exist in database');
        return { exists: false, error: null };
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    sendOTP,
    verifyOTP,
    signInWithOTP,
    verifySignInOTP,
    checkEmailExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 