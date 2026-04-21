import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, authService } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string, role?: 'customer' | 'worker') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  /** Reload user + profile from Supabase (e.g. after updating phone). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser()
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(error => {
        // Don't log expected "no session" errors
        if (!error?.message?.includes('Auth session missing') && 
            !error?.message?.includes('Refresh Token')) {
          console.error('Error getting initial user:', error);
        }
        // If there's an error with the refresh token, clear the session
        if (error?.message?.includes('Refresh Token')) {
          console.log('🔄 Invalid refresh token detected, clearing session');
          authService.signOut().catch(e => console.error('Error clearing session:', e));
        }
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      // Check if password reset is in progress - if so, ignore auth changes
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const resetInProgress = await AsyncStorage.getItem('password_reset_in_progress');
        
        if (resetInProgress === 'true') {
          console.log('🚫 Password reset in progress - ignoring auth state change');
          return; // Don't update user state during password reset
        }
      } catch (e) {
        console.error('Error checking password reset flag:', e);
      }
      
      console.log('🔔 Auth state change:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const signInStartTime = Date.now();
    
    try {
      await authService.signIn({ email, password });
      // User state will be updated by the auth state change listener
      // Add a safety timeout in case the auth state change doesn't fire
      setTimeout(() => {
        const elapsed = Date.now() - signInStartTime;
        if (elapsed >= 10000) { // Only check after 10 seconds
          console.log('⚠️ Sign-in timeout - auth state change may not have fired');
          setLoading(false);
        }
      }, 10000);
    } catch (error) {
      // On error, immediately set loading to false and keep user as null
      setLoading(false);
      setUser(null);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, role?: 'customer' | 'worker') => {
    setLoading(true);
    try {
      await authService.signUp({ email, password, fullName, phone, role });
      // User state will be updated by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      // Avoid blank screen after signup (no session while awaiting email confirmation)
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Immediately clear user state for instant UI update
      console.log('🚪 Signing out...');
      setUser(null);
      
      // Then clean up the session in the background
      // Very short timeout to prevent UI hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SignOut timeout')), 2000);
      });
      
      await Promise.race([
        authService.signOut(),
        timeoutPromise
      ]);
      
      console.log('✅ Sign out complete');
    } catch (error) {
      console.log('SignOut error (user already cleared):', error);
      // User state already cleared, so UI is already updated
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const refreshSession = async () => {
    try {
      await authService.refreshSession();
      // The auth state change listener will handle updating the user
    } catch (error) {
      console.error('Refresh session error:', error);
      // Don't throw - just log the error
    }
  };

  const refreshUser = async () => {
    try {
      const u = await authService.getCurrentUser();
      setUser(u);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
