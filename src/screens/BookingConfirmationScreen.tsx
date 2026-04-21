import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { CheckCircle, Home, Calendar } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';

export default function BookingConfirmationScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  
  // Get booking ID from route params
  const { bookingId } = (route.params as any) || { bookingId: `CW${Date.now().toString().slice(-6)}` };

  // Disable hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  const handleViewBookings = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Bookings' } }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7' }]}>
            <CheckCircle size={64} color="#16a34a" />
          </View>
          
          {/* Success Text */}
          <Text style={[styles.successTitle, { color: colors.isDark ? '#22c55e' : '#16a34a' }]}>
            {t('booking_confirmed_title')}
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            {t('car_wash_service_booked')}
          </Text>
          
          {/* Booking ID */}
          <View style={[styles.bookingIdContainer, { backgroundColor: colors.isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', borderColor: colors.isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe' }]}>
            <Text style={[styles.bookingIdLabel, { color: colors.textSecondary }]}>{t('booking_id_label')}</Text>
            <Text style={[styles.bookingIdValue, { color: colors.isDark ? '#60a5fa' : '#3b82f6' }]}>{bookingId}</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={[styles.actionButtons, { paddingBottom: Math.max(insets.bottom + 20, 44) }]}>
          <Button style={styles.primaryButton} onPress={handleViewBookings}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Calendar size={24} color="#ffffff" strokeWidth={2} />
              <Text style={styles.primaryButtonText}>{t('my_bookings_button')}</Text>
            </View>
          </Button>
          
          <Button variant="outline" style={styles.secondaryButton} onPress={handleGoHome}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Home size={24} color={colors.accent} strokeWidth={2} />
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>{t('go_home_button')}</Text>
            </View>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bookingIdContainer: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 200,
  },
  bookingIdLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  bookingIdValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    width: '100%',
    gap: 16,
    paddingBottom: 20,
  },
  primaryButton: {
    minHeight: 64,
    paddingVertical: 18,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    minHeight: 64,
    paddingVertical: 18,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
