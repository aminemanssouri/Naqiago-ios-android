import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation';
import { ThemeProvider, useThemeColors } from './src/lib/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ModalProvider } from './src/contexts/ModalContext';
import { BookingProvider } from './src/contexts/BookingContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { NavigationProvider } from './src/contexts/NavigationContext';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import SplashAnimation from './src/components/SplashAnimation';
import { useFonts as useOutfitFonts, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useFonts as useSyneFonts, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const navigationRef = useRef<any>(null);
  
  // Handle password reset deep links
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (!url) return;
      
      console.log('🔗 Deep link received:', url);
      
      // Check if it's a password reset link
      if (url.includes('reset-password') || url.includes('type=recovery')) {
        // Extract tokens from URL fragment (after #)
        if (url.includes('#')) {
          const fragment = url.split('#')[1];
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          console.log('📋 Parsed tokens - type:', type, 'accessToken:', accessToken ? 'present' : 'missing');

          if (type === 'recovery' && accessToken && refreshToken) {
            // IMPORTANT: Clear any existing session first to prevent auto-login
            console.log('🧹 Clearing existing session before storing recovery tokens...');
            const { supabase } = await import('./src/lib/supabase');
            await supabase.auth.signOut();
            
            // Store tokens temporarily
            await AsyncStorage.setItem('recovery_access_token', accessToken);
            await AsyncStorage.setItem('recovery_refresh_token', refreshToken);
            
            console.log('✅ Tokens stored, navigating to ResetPassword');
            
            // Navigate to reset password screen
            setTimeout(() => {
              navigationRef?.current?.navigate('ResetPassword');
            }, 100);
          }
        }
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial link (if app was closed)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <NavigationProvider>
        <AuthProvider>
          {/* <NotificationProvider> */}
            <LanguageProvider>
              <ModalProvider>
                <BookingProvider>
                  <AppInner navigationRef={navigationRef} />
                </BookingProvider>
              </ModalProvider>
            </LanguageProvider>
          {/* </NotificationProvider> */}
        </AuthProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
}

function AppInner({ navigationRef }: { navigationRef: any }) {
  const theme = useThemeColors();
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  const [outfitLoaded] = useOutfitFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  const [syneLoaded] = useSyneFonts({
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
  });

  const fontsLoaded = outfitLoaded && syneLoaded;

  if (!fontsLoaded || !splashDone) {
    return <SplashAnimation onFinish={handleSplashFinish} />;
  }
  return (
    <>
      <Navigation navigationRef={navigationRef} />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}
