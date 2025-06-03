import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  sendOTP: (email: string, userData?: any) => Promise<{ error: AuthError | null }>;
  verifyOTP: (email: string, token: string, userData?: any) => Promise<{ error: AuthError | null; user?: User | null }>;
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
          currency: 'AED', // Default currency for GCC expats
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
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    } finally {
      setLoading(false);
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
      
      // Send OTP email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Allow new user creation
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
      
      // Verify the OTP token
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (!error && data.user) {
        // Create profile for new users
        await createUserProfile(data.user, userData || data.user.user_metadata || {});
        return { error: null, user: data.user };
      }

      return { error, user: null };
    } catch (error) {
      return { error: error as AuthError, user: null };
    } finally {
      setLoading(false);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 