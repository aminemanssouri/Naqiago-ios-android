import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Calendar, MapPin, Clock, User, Phone, Car, CreditCard, Check, ArrowLeft } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';
import { useBooking } from '../contexts/BookingContext';
import { safeGoBack } from '../lib/navigation';
import { workersService, type Worker } from '../services/workers';
import { servicesService } from '../services/services';
import { bookingsService } from '../services/bookings';
import type { RootStackParamList } from '../types/navigation';

const carTypes = [
  { id: "sedan", name: "Sedan", multiplier: 1 },
  { id: "suv", name: "SUV", multiplier: 1.3 },
  { id: "hatchback", name: "Hatchback", multiplier: 0.9 },
  { id: "truck", name: "Truck", multiplier: 1.5 },
  { id: "van", name: "Van", multiplier: 1.4 },
];

const timeSlots = [
  { label: "09:00", value: "09:00" },
  { label: "09:30", value: "09:30" },
  { label: "10:00", value: "10:00" },
  { label: "10:30", value: "10:30" },
  { label: "11:00", value: "11:00" },
  { label: "11:30", value: "11:30" },
  { label: "12:00", value: "12:00" },
  { label: "12:30", value: "12:30" },
  { label: "13:00", value: "13:00" },
  { label: "13:30", value: "13:30" },
  { label: "14:00", value: "14:00" },
  { label: "14:30", value: "14:30" },
  { label: "15:00", value: "15:00" },
  { label: "15:30", value: "15:30" },
  { label: "16:00", value: "16:00" },
  { label: "16:30", value: "16:30" },
  { label: "17:00", value: "17:00" },
  { label: "17:30", value: "17:30" },
];

export default function BookingScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  
  const [worker, setWorker] = useState<Worker | null>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { navigateWithAuth } = useAuthNavigation();
  const { updateBookingData, setCurrentStep } = useBooking();
  const { workerId = "1", serviceId, serviceKey } = (route.params as { 
    workerId?: string; 
    serviceId?: string; 
    serviceKey?: string; 
  }) || {};

  console.log('🔍 BookingScreen - Route params:', route.params);
  console.log('🔍 BookingScreen - Extracted serviceId:', serviceId);

  // Get today's date for min date input
  const today = new Date().toISOString().split("T")[0];

  // Helper: get nearest upcoming time slot from timeSlots
  const getNearestTimeSlot = () => {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    // timeSlots like '09:30'
    const mins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const next = timeSlots
      .map(s => s.value)
      .find(v => mins(v) >= current);
    return next || timeSlots[0].value;
  };

  // Load worker and service data on mount
  useEffect(() => {
    if (workerId) {
      loadData();
    }
  }, [workerId, serviceId, serviceKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load worker data
      const workerData = await workersService.getWorkerById(workerId);
      if (!workerData) {
        setError(t('worker_not_found_alert'));
        return;
      }
      setWorker(workerData);
      
      // Load service data
      let serviceData = null;
      if (serviceId) {
        serviceData = await servicesService.getServiceById(serviceId);
      } else if (serviceKey) {
        serviceData = await servicesService.getServiceByKey(serviceKey);
      }
      
      if (serviceData) {
        console.log('🔍 BookingScreen - Setting service data in context:', {
          serviceId: serviceData.id,
          serviceName: serviceData.title,
          estimatedDuration: serviceData.durationMinutes || 60
        });
        
        setService(serviceData);
        // Initialize booking context with service data
        updateBookingData({
          serviceId: serviceData.id,
          serviceName: serviceData.title,
          estimatedDuration: serviceData.durationMinutes || 60,
        });
        
        console.log('🔍 BookingScreen - Service data set in context');
      } else {
        console.log('❌ BookingScreen - No service data received');
      }
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || t('failed_to_load_services'));
    } finally {
      setLoading(false);
    }
  };

  const basePrice = worker?.price || 80;

  const handleStartBooking = () => {
    // Ensure worker exists
    if (!worker) {
      Alert.alert(t('worker_not_found_alert'), t('please_select_worker_again'));
      return;
    }

    // Initialize booking data with worker info
    updateBookingData({
      workerId: worker.id,
      workerName: worker.name,
      basePrice,
      finalPrice: basePrice,
    });

    // Start the multi-step booking flow
    setCurrentStep(1);
    navigation.navigate('BookingDateTime');
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
        <Header 
          title={t('book_service_title')} 
          onBack={() => safeGoBack(navigation)} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>{t('loading_worker_details')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !worker) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
        <Header 
          title={t('book_service_title')} 
          onBack={() => safeGoBack(navigation)} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 8 }}>{t('worker_not_available_title')}</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            {error || t('worker_no_longer_available')}
          </Text>
          <Button onPress={() => navigation.goBack()}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t('go_back')}</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
        <Header 
          title={t('confirm_booking')} 
          onBack={() => safeGoBack(navigation)} 
        />
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <Card style={{ padding: 20, width: '100%', maxWidth: 520, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 }}>{t('welcome_guest_title')}</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 }}>{t('please_sign_in_to_continue')}</Text>
            <Button onPress={() => navigateWithAuth('Booking', route.params)}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{t('sign_in_button')}</Text>
            </Button>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <Header 
        title={t('book_service_title')} 
        onBack={() => safeGoBack(navigation)} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Worker */}
        <Card style={[styles.workerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.workerInfo}>
            <Avatar 
              src={worker?.avatar || undefined} 
              name={worker?.name || ''} 
              size={64}
            />
            <View style={styles.workerDetails}>
              <Text style={[styles.workerName, { color: theme.textPrimary }]}>{worker?.name}</Text>
              <Text style={[styles.workerRole, { color: theme.textSecondary }]}>{t('professional_car_washer_role')}</Text>
              <View style={styles.workerPriceRow}>
                <Text style={[styles.workerPrice, { color: theme.accent }]}>{basePrice} MAD</Text>
                <Text style={[styles.workerPriceLabel, { color: theme.textSecondary }]}>{t('starting_price_label')}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Service Info */}
        <Card style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>{t('what_to_expect_title')}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: theme.accent }]} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('professional_mobile_car_wash')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: theme.accent }]} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('we_bring_all_equipment')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: theme.accent }]} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('eco_friendly_products')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoBullet, { backgroundColor: theme.accent }]} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('satisfaction_guaranteed')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Booking Steps Preview */}
        <Card style={[styles.stepsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.stepsTitle, { color: theme.textPrimary }]}>{t('booking_process_title')}</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={[styles.stepNumberText, { color: '#ffffff' }]}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{t('select_date_and_time')}</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={[styles.stepNumberText, { color: '#ffffff' }]}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{t('choose_vehicle_details')}</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={[styles.stepNumberText, { color: '#ffffff' }]}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{t('select_services_you_want')}</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={[styles.stepNumberText, { color: '#ffffff' }]}>4</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{t('provide_service_location')}</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.accent }]}>
                <Text style={[styles.stepNumberText, { color: '#ffffff' }]}>5</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{t('select_payment_and_confirm')}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onContinue={handleStartBooking}
        continueText={t('start_booking_process')}
        showBackButton={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  workerCard: {
    padding: 16,
    marginBottom: 24,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  workerRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  workerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  workerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  workerPriceLabel: {
    fontSize: 12,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stepsCard: {
    padding: 16,
    marginBottom: 24,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  priceBadge: {
    marginLeft: 'auto',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  input: {
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeItem: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  select: {
    marginTop: 6,
  },
  dateField: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginTop: 6,
  },
  dateFieldText: {
    fontSize: 14,
    color: '#111827',
  },
  dateChips: {
    marginTop: 6,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  dateChipWeekday: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateChipDate: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  radioGroup: {
    gap: 8,
  },
  carTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  carTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carTypeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  carTypePrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  textarea: {
    marginTop: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  paymentIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  paymentDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  priceCard: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#374151',
  },
  priceValue: {
    fontSize: 14,
    color: '#374151',
  },
  priceAdjustment: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  submitButton: {
    height: 48,
    marginBottom: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modalList: {
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemDate: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  // Unified modal styles (light theme only)
  uBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  uCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  uTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  uList: {
    marginBottom: 12,
  },
  uItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  uItemTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  uItemSub: {
    fontSize: 12,
    color: '#6b7280',
  },
});
