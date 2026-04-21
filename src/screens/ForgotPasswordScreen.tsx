import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Mail, Phone, CheckCircle, Key } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth';

interface ForgotPasswordFormData {
  email: string;
  phone: string;
}

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { show } = useModal();
  const [resetType, setResetType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedValue, setSubmittedValue] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Client-side cooldown timer (60 seconds)
  React.useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(cooldownRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
      phone: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      const value = (data.email || '').trim();
      setSubmittedValue(value);

      // Client-side cooldown check (60 seconds) - DISABLED FOR TESTING
      // Uncomment below for production to enable cooldown
      /*
      const now = Date.now();
      const timeSinceLastRequest = (now - lastRequestTime) / 1000;
      if (timeSinceLastRequest < 60) {
        const remaining = Math.ceil(60 - timeSinceLastRequest);
        setCooldownRemaining(remaining);
        show({
          type: 'warning',
          title: t('please_wait'),
          message: `Please wait ${remaining} seconds before requesting another reset link.`,
        });
        return;
      }
      */

      // Basic validation
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        show({
          type: 'warning',
          title: t('validation_error') || 'Validation Error',
          message: t('invalid_email') || 'Please enter a valid email address.',
        });
        return;
      }

      setLastRequestTime(Date.now());
      // setCooldownRemaining(60); // Disabled for testing

      await authService.resetPassword(value);

      show({
        type: 'success',
        title: t('reset_sent') || 'Reset Instructions Sent',
        message: `${t('reset_instructions_sent') || 'Password reset instructions have been sent to'} ${value}`,
      });

      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      // Handle rate limit errors specifically
      const errorMessage = error?.message || '';
      const isRateLimited = 
        errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests') ||
        errorMessage.includes('Email rate limit exceeded') ||
        error?.status === 429;

      if (isRateLimited) {
        show({
          type: 'warning',
          title: t('too_many_requests'),
          message: t('rate_limit_message'),
        });
      } else {
        show({
          type: 'warning',
          title: t('error') || 'Error',
          message: errorMessage || (t('reset_failed') || 'Failed to send reset instructions. Please try again.'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder, paddingTop: insets.top + 12 }]}>
        <Button 
          variant="ghost" 
          size="icon" 
          style={[styles.backButton, {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            borderRadius: 12,
            width: 40,
            height: 40,
            marginTop: 4,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={theme.textPrimary} strokeWidth={2.5} />
        </Button>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('reset_password')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
              <Key size={24} color={theme.accent} />
            </View>
            <Text style={[styles.headerTitleCard, { color: theme.textPrimary }]}>{t('forgot_password')}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {t('reset_instructions')}
            </Text>
          </View>
        </Card>

        {/* Reset Form */}
        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('reset_method')}</Text>
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('email_address')}</Text>
            <Input
              value={watch('email')}
              onChangeText={(value) => setValue('email', value)}
              placeholder={t('enter_email')}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: '#ef4444' }]}>{errors.email.message}</Text>
            )}
          </View>

          <Button 
            onPress={handleSubmit(onSubmit)} 
            style={styles.submitButton}
            disabled={isLoading}
          >
            <Text style={[styles.submitButtonText, { color: '#ffffff' }]}>
              {isLoading 
                ? t('sending') 
                : t('send_reset_instructions')}
            </Text>
          </Button>
        </Card>
        
        {/* Back to Login */}
        <Card style={styles.backCard}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backToLogin}>
            <Text style={[styles.backToLoginText, { color: theme.accent }]}>{t('back_to_sign_in')}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingTop: 20, paddingBottom: 32, gap: 20 },
  // Header Card
  headerCard: { padding: 20 },
  headerContent: { alignItems: 'center' },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitleCard: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Form Card
  formCard: { padding: 20 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  // Form Fields
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  fieldInput: { 
    fontSize: 16, 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    minHeight: 48,
  },
  errorText: { fontSize: 12, marginTop: 4 },
  submitButton: { height: 48, marginTop: 16 },
  submitButtonText: { fontSize: 16, fontWeight: '600' },
  
  // Back Card
  backCard: { padding: 20, alignItems: 'center' },
  backToLogin: { paddingVertical: 8 },
  backToLoginText: { fontSize: 14, fontWeight: '500' },
});
