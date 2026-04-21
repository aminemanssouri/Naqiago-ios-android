import { useNavigation } from '@react-navigation/native';
import { useNavigationContext } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef } from 'react';

export const useAuthNavigation = () => {
  const navigation = useNavigation();
  const { setPendingNavigation, pendingNavigation, clearPendingNavigation } = useNavigationContext();
  const { user, loading } = useAuth();
  const previousUserRef = useRef<any>(null);

  // Handle pending navigation after authentication
  useEffect(() => {
    // Only proceed if we have both user and pending navigation
    if (!user || !pendingNavigation || loading) {
      return;
    }

    // Check if this is a new login (user changed from null to not-null)
    const wasLoggedOut = previousUserRef.current === null;
    const isNowLoggedIn = user !== null;

    if (wasLoggedOut && isNowLoggedIn) {
      // User just authenticated and we have a pending navigation
      const { screen, params } = pendingNavigation;
      clearPendingNavigation();
      
      console.log('🔄 Navigating after successful login to:', screen);
      
      // Navigate to the intended screen
      setTimeout(() => {
        (navigation as any).navigate(screen, params);
      }, 100); // Small delay to ensure navigation is ready
    }

    // Update the ref for next render
    previousUserRef.current = user;
  }, [user, loading, pendingNavigation, navigation, clearPendingNavigation]);

  const navigateWithAuth = (screen: string, params?: any) => {
    if (!user) {
      // Store the intended navigation
      console.log('🔒 User not authenticated, storing pending navigation:', screen);
      setPendingNavigation({ screen, params });
      // Redirect to login
      (navigation as any).navigate('Login');
      return;
    }
    
    // User is authenticated, navigate directly
    console.log('✅ User authenticated, navigating directly to:', screen);
    (navigation as any).navigate(screen, params);
  };

  return { navigateWithAuth };
};
