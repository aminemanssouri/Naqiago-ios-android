import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, InteractionManager, Image, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Eye, EyeOff, User, Mail, Phone } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FormInput } from '../components/ui/FormInput';
import { Separator } from '../components/ui/Separator';
import { Switch } from '../components/ui/Switch';
import { Header } from '../components/ui/Header';
import { signupValidation } from '../utils/validationSchemas';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useLanguage } from '../contexts/LanguageContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function SignupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Client-only signup; email only
  const [isLoading, setIsLoading] = useState(false);
  const theme = useThemeColors();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    }
  });

  const { signUp } = useAuth();
  const modal = useModal();
  const { t } = useLanguage();

  const password = watch('password');

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

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
        await Linking.openURL(data.url);
      }
    } catch (err: any) {
      console.error('❌ Google Sign-In error:', err);
      setIsLoading(false);
      modal.show({
        type: 'warning',
        title: t('signup_failed'),
        message: err?.message || (t('error') || 'Error'),
      });
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);

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
        await Linking.openURL(data.url);
      }
    } catch (err: any) {
      console.error('❌ Apple Sign-In error:', err);
      setIsLoading(false);
      modal.show({
        type: 'warning',
        title: t('signup_failed'),
        message: err?.message || (t('error') || 'Error'),
      });
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    // Email-only signup
    if (data.password !== data.confirmPassword) {
      modal.show({
        type: 'warning',
        title: t('passwords_dont_match'),
        message: t('passwords_must_match'),
      });
      return;
    }

    if (!data.agreeToTerms) {
      modal.show({
        type: 'warning',
        title: t('terms_not_accepted'),
        message: t('agree_to_terms'),
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const email = data.email;
      await signUp(email, data.password, data.name, data.phone, 'customer');
      // Show modern modal prompting email verification
      modal.show({
        type: 'email',
        title: t('verify_your_email'),
        message: t('verification_email_sent').replace('{email}', email),
        primaryActionText: t('ok'),
        onPrimaryAction: () => {
          // Close modal first, then navigate after animations to avoid white screen
          modal.hide?.();
          InteractionManager.runAfterInteractions(() => {
            (navigation as any).dispatch?.(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              })
            );
          });
        },
      });
    } catch (error: any) {
      const raw = String(error?.message || '');
      const code = String(error?.code || '');
      const status = Number(error?.status || 0);
      const lower = raw.toLowerCase();

      let friendly = 'Please try again.';
      const isDuplicateEmail =
        lower.includes('already registered') ||
        lower.includes('already exists') ||
        lower.includes('duplicate key') ||
        code === 'user_already_exists' ||
        status === 409;

      if (isDuplicateEmail) {
        friendly = t('email_already_registered');
      } else if (lower.includes('invalid email')) {
        friendly = t('invalid_email');
      } else if (lower.includes('weak password') || lower.includes('password')) {
        friendly = t('weak_password');
      } else if (raw) {
        friendly = raw;
      }

      modal.show({
        type: 'warning',
        title: t('signup_failed'),
        message: friendly,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigation.goBack();
  };


  // Removed tabs and role selection (client-only, email signup)

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('create_account')} 
        onBack={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 16 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={[styles.logoContainer, { backgroundColor: theme.surface }]}>
            <Image 
              source={require('../../assets/icons/192x192 NAQIAGO.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
           <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>{t('join_us_to_book')}</Text>
        </View>

        {/* Signup Form */}
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

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t('or')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.cardBorder }]} />
            </View>

            {/* Full Name */}
            <View style={styles.nameContainer}>
              <FormInput
                name="name"
                control={control}
                label={t('full_name')}
                placeholder={t('enter_full_name')}
                autoCapitalize="words"
                rules={signupValidation.name}
                error={errors.name}
              />
              <View style={styles.nameIcon}>
                <User size={16} color={theme.textSecondary} />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.emailContainer}>
              <FormInput
                name="email"
                control={control}
                label={t('email')}
                placeholder={t('enter_email')}
                keyboardType="email-address"
                autoCapitalize="none"
                rules={signupValidation.email}
                error={errors.email}
              />
              <View style={styles.emailIcon}>
                <Mail size={16} color={theme.textSecondary} />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.phoneContainer}>
              <FormInput
                name="phone"
                control={control}
                label={t('phone_number')}
                placeholder={t('enter_phone_number')}
                keyboardType="phone-pad"
                autoCapitalize="none"
                rules={signupValidation.phone}
                error={errors.phone}
              />
              <View style={styles.phoneIcon}>
                <Phone size={16} color={theme.textSecondary} />
              </View>
            </View>

            {/* Client-only: role selection removed */}

            {/* Password Field */}
            <View style={styles.passwordContainer}>
              <FormInput
                name="password"
                control={control}
                label={t('password')}
                placeholder={t('create_password')}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                rules={signupValidation.password}
                error={errors.password}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff size={20} color={theme.textSecondary} /> : 
                  <Eye size={20} color={theme.textSecondary} />
                }
              </Pressable>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.passwordContainer}>
              <FormInput
                name="confirmPassword"
                control={control}
                label={t('confirm_password')}
                placeholder={t('confirm_your_password')}
                secureTextEntry={!showConfirmPassword}
                style={styles.passwordInput}
                rules={{
                  required: t('please_confirm_password'),
                  validate: (value: string) => value === password || t('passwords_dont_match')
                }}
                error={errors.confirmPassword}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 
                  <EyeOff size={20} color={theme.textSecondary} /> : 
                  <Eye size={20} color={theme.textSecondary} />
                }
              </Pressable>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Controller
                name="agreeToTerms"
                control={control}
                rules={{ required: 'You must agree to the terms' }}
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value}
                    onCheckedChange={onChange}
                  />
                )}
              />
              <View style={styles.termsRow}>
                <Text style={[styles.termsText, { color: theme.textPrimary }]}>{t('i_agree_to')}</Text>
                <Pressable onPress={() => (navigation as any).navigate('LegalDocument', { type: 'terms' })} style={styles.termsLinkButton}>
                  <Text style={[styles.termsLink, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">{t('terms_of_service')}</Text>
                </Pressable>
                <Text style={[styles.termsText, { color: theme.textPrimary }]}>{t('and')}</Text>
                <Pressable onPress={() => (navigation as any).navigate('LegalDocument', { type: 'privacy' })} style={styles.termsLinkButton}>
                  <Text style={[styles.termsLink, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">{t('privacy_policy')}</Text>
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <Button 
              onPress={handleSubmit(onSubmit)} 
              style={styles.submitButton}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? t('creating_account') : t('create_account')}
              </Text>
            </Button>

            {/* Divider */}
           

            {/* Sign In Link */}
            <View style={styles.signinRow}>
              <Text style={[styles.signinText, { color: theme.textSecondary }] }>
                {t('already_have_account')}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login' as never)} style={styles.signinButtonLink}>
                <Text style={[styles.signinLink, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">{t('sign_in')}</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#eff6ff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  form: {
    gap: 16,
  },
  nameContainer: {
    position: 'relative',
  },
  nameInput: {
    paddingRight: 50,
  },
  nameIcon: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 8,
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
  phoneContainer: {
    position: 'relative',
  },
  phoneIcon: {
    position: 'absolute',
    right: 12,
    top: 38,
    padding: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -14,
    padding: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  termsLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  submitButton: {
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
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
  guestButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  signinContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  signinRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  signinText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signinLink: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  signinButtonLink: {
    paddingHorizontal: 4,
    paddingVertical: 4,
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
});
