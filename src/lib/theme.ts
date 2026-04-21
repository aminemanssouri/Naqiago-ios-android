import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeColors = {
  isDark: boolean;
  bg: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  primary: string;
  secondary: string;
  gradientStart: string;
  gradientEnd: string;
  shadow: string;
  fontPrimary: string;
  fontHeading: string;
  surface: string;
  overlay: string;
};

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode, persist?: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');

  const setMode = async (newMode: ThemeMode, persist: boolean = true) => {
    setModeState(newMode);
    
    if (persist) {
      try {
        // Import authService here to avoid circular dependency
        const { authService } = await import('../services/auth');
        const user = await authService.getCurrentUser();
        
        if (user?.id) {
          await authService.updateProfile(user.id, { 
            preferred_theme: newMode 
          });
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  // Initialize theme from user profile when available
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const { authService } = await import('../services/auth');
        const user = await authService.getCurrentUser();
        
        if (user?.profile?.preferred_theme) {
          setModeState(user.profile.preferred_theme as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    initializeTheme();
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return React.createElement(ThemeContext.Provider, { value }, children as any);
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}

export function useThemeColors(): ThemeColors {
  const system = useColorScheme();
  const { mode } = useThemeMode();
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  if (isDark) {
    return {
      isDark,
      bg: '#0a0a0a',
      card: '#171717',
      cardBorder: 'rgba(255,255,255,0.08)',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.65)',
      accent: '#FFC629',
      primary: '#3a1c3f',
      secondary: '#FFC629',
      gradientStart: '#3a1c3f',
      gradientEnd: '#4a2c4f',
      shadow: 'rgba(0, 0, 0, 0.5)',
      fontPrimary: 'Outfit_400Regular',
      fontHeading: 'Syne_700Bold',
      surface: 'rgba(23,23,23,0.95)',
      overlay: 'rgba(58,28,63,0.08)'
    };
  }
  return {
    isDark: false,
    bg: '#F8F6FA',
    card: '#FFFFFF',
    cardBorder: '#E8E0ED',
    textPrimary: '#2D1B3D',
    textSecondary: '#8B7A96',
    accent: '#7B2D8E',
    primary: '#7B2D8E',
    secondary: '#FFC629',
    gradientStart: '#7B2D8E',
    gradientEnd: '#9B4BAC',
    shadow: 'rgba(123, 45, 142, 0.12)',
    fontPrimary: 'Outfit_400Regular',
    fontHeading: 'Syne_700Bold',
    surface: 'rgba(255,255,255,0.96)',
    overlay: 'rgba(123,45,142,0.06)'
  };
}
