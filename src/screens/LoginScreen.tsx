import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Eye, EyeOff, Mail } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormInput } from '../components/ui/FormInput';
import { Separator } from '../components/ui/Separator';
import { loginValidation } from '../utils/validationSchemas';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigationContext } from '../contexts/NavigationContext';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth';
import { Header } from '../components/ui/Header';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  // Single login method (email)
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttemptFailed, setLoginAttemptFailed] = useState(false);
  const theme = useThemeColors();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const { signIn, user, refreshSession } = useAuth();
  const modal = useModal();
  const { t } = useLanguage();
  const { clearPendingNavigation } = useNavigationContext();
  const userRef = useRef(user);
  const loginTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url?: string | null) => {
      if (!url) return;

      try {
        const u = new URL(url);
        
        // Check if this is a password recovery link - DON'T process it here
        if (u.hash) {
          const fragment = u.hash.substring(1);
          const params = new URLSearchParams(fragment);
          const type = params.get('type');
          
          if (type === 'recovery') {
            console.log('🔑 Password recovery link detected, ignoring in LoginScreen');
            return; // Let App.tsx and ResetPasswordScreen handle it
          }
        }
        
        // Check for OAuth code in query params (PKCE flow)
        const code = u.searchParams.get('code') || undefined;
        
        // Check for tokens in URL fragment (implicit flow - for OAuth only)
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        
        if (u.hash) {
          // Parse fragment parameters (tokens come after #)
          const fragment = u.hash.substring(1); // Remove the # character
          const params = new URLSearchParams(fragment);
          accessToken = params.get('access_token');
          refreshToken = params.get('refresh_token');
        }

        // Handle PKCE flow (code exchange)
        if (code) {
          console.log('🔑 OAuth code received, exchanging for session...');
          setIsLoading(true);
          setLoginAttemptFailed(false);
          
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error as any;
          
          console.log('✅ OAuth session established:', data?.session ? 'session present' : 'no session');
          console.log('✅ OAuth user:', data?.user?.email);
          
          // Continue with user fetch...
          await handleOAuthSuccess();
        }
        // Handle implicit flow (direct tokens - OAuth only, not recovery)
        else if (accessToken && refreshToken) {
          console.log('🔑 OAuth tokens received in fragment, setting session...');
          console.log('✅ Access token present:', !!accessToken);
          console.log('✅ Refresh token present:', !!refreshToken);
          
          setIsLoading(true);
          setLoginAttemptFailed(false);
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) throw error as any;
          
          console.log('✅ Session set with tokens:', data?.session ? 'session present' : 'no session');
          console.log('✅ User:', data?.user?.email);
          
          // Continue with user fetch...
          await handleOAuthSuccess();
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('❌ OAuth callback error:', err);
        setLoginAttemptFailed(true);
        setIsLoading(false);
        modal.show({
          type: 'warning',
          title: t('login_failed'),
          message: err?.message || (t('error') || 'Error'),
        });
      }
    };
    
    // Helper function to handle successful OAuth
    const handleOAuthSuccess = async () => {
      try {
        console.log('🔄 Forcing auth state refresh...');
        await refreshSession();
        console.log('✅ Session refreshed');
        
        // Wait a moment for the auth state listener to process
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if user was set by listener
        if (userRef.current) {
          console.log('✅ User set by auth listener, navigation will happen automatically');
        } else {
          console.log('⚠️ Auth listener did not set user, manually fetching current user...');
          
          // Manually get the current user to trigger navigation
          const currentUser = await authService.getCurrentUser();
          console.log('✅ Manually fetched user:', currentUser?.email);
          
          if (currentUser) {
            // Manually trigger navigation since listener didn't work
            const role = currentUser.profile?.role;
            console.log('🚀 Manually navigating to MainTabs, role:', role);
            
            setIsLoading(false);
            
            if (role === 'worker') {
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'WorkerBookings' } }],
              });
            } else {
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          } else {
            throw new Error('Failed to get user after OAuth');
          }
        }
      } catch (error) {
        console.error('❌ Failed to handle OAuth success:', error);
        throw error;
      }
    };

    // Handle OAuth callback URLs (cold + warm start)
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }: { url: string }) => handleUrl(url));

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [modal, t]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoginAttemptFailed(false);

      const redirectTo = 'naqiago://auth-callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        console.log('🔗 Opening Google OAuth URL...');
        await Linking.openURL(data.url);
        console.log('✅ OAuth URL opened, waiting for callback...');
        // Keep isLoading true - it will be cleared when auth completes or fails
      }
    } catch (err: any) {
      // Only clear loading on error
      console.error('❌ Google Sign-In error:', err);
      setLoginAttemptFailed(true);
      setIsLoading(false);
      clearPendingNavigation();
      modal.show({
        type: 'warning',
        title: t('login_failed'),
        message: err?.message || (t('error') || 'Error'),
      });
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      setLoginAttemptFailed(false);

      const redirectTo = 'naqiago://auth-callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        console.log('🔗 Opening Apple OAuth URL...');
        await Linking.openURL(data.url);
        console.log('✅ OAuth URL opened, waiting for callback...');
      }
    } catch (err: any) {
      console.error('❌ Apple Sign-In error:', err);
      setLoginAttemptFailed(true);
      setIsLoading(false);
      clearPendingNavigation();
      modal.show({
        type: 'warning',
        title: t('login_failed'),
        message: err?.message || (t('error') || 'Error'),
      });
    }
  };

  // Keep user ref updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // After auth state updates with a valid user, route to MainTabs with correct initial tab
  useEffect(() => {
    // Check if password reset is in progress before navigating
    const checkAndNavigate = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const resetInProgress = await AsyncStorage.getItem('password_reset_in_progress');
        
        if (resetInProgress === 'true') {
          console.log('🚫 Password reset in progress - blocking navigation');
          return; // Don't navigate during password reset
        }
      } catch (e) {
        console.error('Error checking password reset flag:', e);
      }
      
      console.log('👤 User effect triggered, user:', user ? 'present' : 'null', 'isLoading:', isLoading);

      if (user) {
        console.log('👤 User authenticated, preparing navigation...');

        // Clear any pending timeout since we're navigating now
        if (loginTimeoutRef.current) {
          clearTimeout(loginTimeoutRef.current);
          loginTimeoutRef.current = null;
        }

        // Clear loading state and login failure flag immediately
        setIsLoading(false);
        setLoginAttemptFailed(false); // Ensure navigation isn't blocked

        // Small delay to ensure auth state is fully propagated
        setTimeout(() => {
          const role = (user as any)?.profile?.role;
          console.log('🚀 Resetting navigation to MainTabs, user role:', role);
          
          if (role === 'worker') {
            console.log('👷 [LoginScreen] Auth user is worker -> reset to WorkerBookings tab');
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { screen: 'WorkerBookings' } }],
            });
          } else {
            console.log('🏠 [LoginScreen] Auth user (non-worker) -> reset to MainTabs');
            (navigation as any).reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
        }, 100);
      }
    };
    
    checkAndNavigate();
  }, [user, navigation]);

  // Block navigation after failed login attempt - AGGRESSIVE VERSION
  useEffect(() => {
    if (!isFocused) {
      console.log('❌ Screen not focused, skipping navigation listener');
      return;
    }

    console.log('✅ Setting up navigation listener, loginAttemptFailed:', loginAttemptFailed);

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      console.log('🔍 beforeRemove fired:', {
        loginAttemptFailed,
        hasUser: !!user,
        action: e.data.action.type,
        canPrevent: e.preventDefault
      });

      if (loginAttemptFailed && !user) {
        // Prevent navigation away from login screen after failed login
        console.log('🚫 BLOCKING NAVIGATION - login failed, staying on Login screen');
        e.preventDefault();

        // Don't clear the flag - keep blocking until user manually navigates
        console.log('🔒 Navigation blocked - user must try again or click Continue as Guest');
        return;
      } else {
        console.log('✅ Allowing navigation:', {
          reason: user ? 'user logged in' : 'no failed attempt'
        });
      }
    });

    console.log('👂 Navigation listener attached, isFocused:', isFocused);

    return () => {
      console.log('👋 Navigation listener cleanup');
      unsubscribe();
    };
  }, [navigation, loginAttemptFailed, user, isFocused]);

  // Clear any pending navigation when login screen mounts
  useEffect(() => {
    if (isFocused) {
      console.log('📱 Login screen focused');
    } else {
      console.log('📴 Login screen unfocused, loginAttemptFailed:', loginAttemptFailed);
      if (loginAttemptFailed) {
        console.log('⚠️ Screen unfocusing during error state!');
      } else {
        // Screen unfocused and no error = successful login navigation
        console.log('✅ Login successful - screen unfocused for navigation');
        // Don't clear loading here - let the user effect handle it
      }
    }
  }, [isFocused, loginAttemptFailed]);

  const onSubmit = async (data: LoginFormData) => {
    console.log('🔐 Login attempt starting...');
    setIsLoading(true);
    setLoginAttemptFailed(false);

    try {
      await signIn(data.email, data.password);
      // Login successful - keep loading state until navigation happens
      console.log('✅ Login successful, waiting for navigation...');
      setLoginAttemptFailed(false);

      // Safety timeout - if navigation doesn't happen within 5 seconds, clear loading and force navigation
      const timeoutId = setTimeout(async () => {
        console.log('⏰ Navigation timeout - checking auth state...');

        // Check if we have a user but navigation didn't happen
        const currentUser = userRef.current;
        if (currentUser) {
          console.log('👤 User exists, forcing navigation...');
          setIsLoading(false);
          const role = (currentUser as any)?.profile?.role;
          if (role === 'worker') {
            (navigation as any).navigate('MainTabs', { screen: 'WorkerBookings' });
          } else {
            (navigation as any).navigate('MainTabs');
          }
        } else {
          console.log('⚠️ No user after 5 seconds, trying to refresh session...');
          try {
            await refreshSession();
            // Give it another second to see if the refresh worked
            setTimeout(() => {
              const refreshedUser = userRef.current;
              if (refreshedUser) {
                console.log('👤 User found after refresh, navigating...');
                setIsLoading(false);
                const role = (refreshedUser as any)?.profile?.role;
                if (role === 'worker') {
                  (navigation as any).navigate('MainTabs', { screen: 'WorkerBookings' });
                } else {
                  (navigation as any).navigate('MainTabs');
                }
              } else {
                console.log('⚠️ Still no user after refresh, clearing loading...');
                setIsLoading(false);
              }
            }, 1000);
          } catch (refreshError) {
            console.log('⚠️ Session refresh failed, clearing loading...');
            setIsLoading(false);
          }
        }
      }, 5000);

      // Store timeout ID for potential cleanup
      loginTimeoutRef.current = timeoutId;

    } catch (error: any) {
      console.error('❌ Login failed:', error);

      // Mark that login failed
      console.log('🚨 Setting loginAttemptFailed = true');
      setLoginAttemptFailed(true);

      // Clear any pending navigation on error to prevent redirect
      clearPendingNavigation();
      console.log('🗑️ Cleared pending navigation');

      // Stay on login screen - prevent any navigation
      setIsLoading(false);

      const message = (error?.message as string) || t('check_credentials');

      console.log('📢 Showing error modal');
      // Show error modal on current screen
      modal.show({
        type: 'warning',
        title: t('login_failed'),
        message,
      });

      console.log('🛑 Login error handled, staying on screen');
      // Don't throw - we've handled the error
      return;
    }
  };

  // Removed tabs (email only)

  const googleLabel = (() => {
    if (isLoading) return t('signing_in') || 'Signing in...';
    const translated = t('continue_with_google');
    if (!translated || translated === 'continue_with_google') return 'Continue with Google';
    return translated;
  })();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <Header title={t('sign_in')} showBackButton={false} />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContent}>
          <View style={styles.welcomeSection}>
            <View style={[styles.logoContainer, { backgroundColor: theme.surface }]}>
              <Image 
                source={require('../../assets/icons/192x192 NAQIAGO.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.welcomeTitle, { color: theme.textPrimary }]}>{t('welcome_back')}</Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>{t('sign_in_to_book')}</Text>
          </View>

          <Card style={styles.formCard}>
            <View style={styles.form}>
              {/* Social Auth Buttons */}
              <View style={styles.socialAuthContainer}>
                <Text style={[styles.socialAuthTitle, { color: theme.textSecondary }]}>
                  {t('continue_with')}
                </Text>
                <View style={styles.socialButtonsRow}>
                  <Pressable
                    onPress={handleGoogleSignIn}
                    style={[styles.socialButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
                    disabled={isLoading}
                  >
                    <Svg width={24} height={24} viewBox="0 0 48 48">
                      <Path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.189 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.997 6.053 29.802 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"
                      />
                      <Path
                        fill="#FF3D00"
                        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.997 6.053 29.802 4 24 4c-7.682 0-14.354 4.33-17.694 10.691z"
                      />
                      <Path
                        fill="#4CAF50"
                        d="M24 44c5.077 0 9.999-1.938 13.565-5.078l-6.259-5.295C29.23 35.091 26.715 36 24 36c-5.167 0-9.617-3.318-11.283-7.946l-6.51 5.015C9.502 39.556 16.227 44 24 44z"
                      />
                      <Path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303c-.797 2.254-2.231 4.162-4.0 5.627l.003-.002 6.259 5.295C36.884 39.537 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
                      />
                    </Svg>
                  </Pressable>
                  
                  <Pressable
                    onPress={handleAppleSignIn}
                    style={[styles.socialButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
                    disabled={isLoading}
                  >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill={theme.textPrimary}>
                      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </Svg>
                  </Pressable>
                </View>
              </View>

              <View style={styles.divider}>
                <Separator style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('or')}</Text>
                <Separator style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
              </View>

              <View style={styles.emailContainer}>
                <FormInput
                  name="email"
                  control={control}
                  label={t('email')}
                  placeholder={t('enter_your_email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  rules={loginValidation.email}
                  error={errors.email}
                />
                <View style={styles.emailIcon}>
                  <Mail size={16} color={theme.textSecondary} />
                </View>
              </View>

              <View style={styles.passwordContainer}>
                <FormInput
                  name="password"
                  control={control}
                  label={t('password')}
                  placeholder={t('enter_your_password')}
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  rules={loginValidation.password}
                  error={errors.password}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.textSecondary} />
                  ) : (
                    <Eye size={20} color={theme.textSecondary} />
                  )}
                </Pressable>
              </View>

              {/* Forgot Password Link */}
              <View style={styles.forgotPasswordContainer}>
                <Pressable onPress={() => navigation.navigate('ForgotPassword' as never)}>
                  <Text style={[styles.forgotPasswordText, { color: theme.accent }]}>
                    {t('forgot_password') || 'Forgot Password?'}
                  </Text>
                </Pressable>
              </View>


              <Button
                onPress={handleSubmit(onSubmit)}
                style={styles.submitButton}
                disabled={isLoading}
              >
                <View style={styles.oauthButtonContent}>
                  <Text style={styles.submitButtonText}>
                    {isLoading ? t('signing_in') : t('sign_in')}
                  </Text>
                </View>
              </Button>

              <View style={styles.signupRow}>
                <Text style={[styles.signupText, { color: theme.textSecondary }]}>
                  {t('dont_have_account')}
                </Text>
                <Pressable onPress={() => navigation.navigate('Signup' as never)} style={styles.signupButtonLink}>
                  <Text style={[styles.signupLink, { color: theme.accent }]}>{t('sign_up')}</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  socialAuthContainer: {
    alignItems: 'center',
    gap: 12,
  },
  socialAuthTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emailContainer: {
    position: 'relative',
  },
  emailIcon: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#eff6ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  form: {
    gap: 12,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
    padding: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -6,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  submitButton: {
    height: 56,
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
    borderRadius: 999,
    paddingHorizontal: 18,
    marginBottom: 0,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  signupRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signupButtonLink: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signupLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
});