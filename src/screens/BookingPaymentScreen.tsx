import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { CreditCard, Banknote, Smartphone, Wallet, Phone } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { Input } from '../components/ui/Input';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, paymentsService } from '../services';
import type { RootStackParamList } from '../types/navigation';

// Payment methods will be translated dynamically in the component

export default function BookingPaymentScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { bookingData, updateBookingData, setCurrentStep, resetBookingData } = useBooking();

  const [selectedPayment, setSelectedPayment] = useState(bookingData.paymentMethod || 'cash');
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (user?.profile?.phone) {
      setPhoneNumber(user.profile.phone);
    }
  }, [user]);

  // Payment methods with translations
  const paymentMethods = [
    {
      id: 'cash',
      title: t('cash_on_delivery_title'),
      subtitle: t('pay_with_cash_when_completed'),
      icon: Banknote,
      recommended: true,
      available: true,
    },
    {
      id: 'card',
      title: t('credit_debit_card_title'),
      subtitle: t('pay_securely_with_card'),
      icon: CreditCard,
      recommended: false,
      available: false, // Not implemented yet
    },
    {
      id: 'mobile',
      title: t('mobile_payment_title'),
      subtitle: t('pay_with_mobile_wallet'),
      icon: Smartphone,
      recommended: false,
      available: false, // Not implemented yet
    },
    {
      id: 'wallet',
      title: t('digital_wallet_title'),
      subtitle: t('pay_with_digital_wallet'),
      icon: Wallet,
      recommended: false,
      available: false, // Not implemented yet
    },
  ];


  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return cleaned.length >= 8 && /^\+?[0-9]{8,15}$/.test(cleaned);
  };

  const handlePhoneChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9+]/g, '');
    setPhoneNumber(numbersOnly);
    if (phoneError) setPhoneError('');
  };

  const handleContinue = async () => {
    if (!selectedPayment) {
      Alert.alert(t('missing_fields_alert'), t('select_payment_method_label'));
      return;
    }

    if (!user) {
      Alert.alert(t('authentication_required_alert'), t('please_sign_in_to_create_booking'));
      return;
    }

    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      setPhoneError(t('phone_number_required') || 'Phone number is required');
      Alert.alert(t('missing_fields_alert'), t('phone_number_required') || 'Phone number is required');
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      setPhoneError(t('invalid_phone_number_message') || 'Invalid phone number');
      Alert.alert(t('invalid_phone_number_message') || 'Invalid phone number', t('enter_valid_phone_number') || 'Please enter a valid phone number');
      return;
    }

    // Validate required booking data
    // Note: workerId is optional - will be auto-assigned if not provided
    const missingFields = [];
    if (!bookingData.serviceId) missingFields.push('serviceId');
    if (!bookingData.date) missingFields.push('date');
    if (!bookingData.time) missingFields.push('time');
    if (!bookingData.address) missingFields.push('address');

    if (missingFields.length > 0) {
      Alert.alert(t('missing_information_alert'), `${t('please_complete_all_steps')} ${missingFields.join(', ')}`);
      return;
    }

    proceedWithBooking();
  };

  const proceedWithBooking = async () => {
    if (!user) return;

    try {
      setIsCreatingBooking(true);
      
      // Save phone number to user profile if it's different or missing
      const trimmedPhone = phoneNumber.trim();
      if (trimmedPhone && trimmedPhone !== user.profile?.phone) {
        try {
          const { authService } = await import('../services/auth');
          await authService.updateProfile(user.id, { phone: trimmedPhone });
        } catch (phoneUpdateError) {
          console.error('Failed to update phone number:', phoneUpdateError);
        }
      }
      
      // Update booking data with selected payment
      updateBookingData({
        paymentMethod: selectedPayment,
      });

      // Prepare booking data for database
      const createBookingData = {
        ...(bookingData.workerId && { workerId: bookingData.workerId }),
        serviceId: bookingData.serviceId,
        scheduledDate: bookingData.date,
        scheduledTime: bookingData.time,
        serviceAddressText: bookingData.address,
        vehicleType: bookingData.vehicleType || 'Berline',
        vehicleMake: bookingData.vehicleMake || bookingData.carBrand,
        vehicleModel: bookingData.vehicleModel || bookingData.carModel,
        vehicleYear: bookingData.vehicleYear || (bookingData.carYear ? parseInt(bookingData.carYear) : undefined),
        vehicleColor: bookingData.vehicleColor,
        licensePlate: bookingData.licensePlate,
        basePrice: bookingData.basePrice,
        totalPrice: bookingData.finalPrice,
        specialInstructions: bookingData.notes,
        estimatedDuration: bookingData.estimatedDuration || 60,
        serviceLocation: bookingData.coordinates,
        change: typeof bookingData.change === 'number' ? bookingData.change : undefined,
      };

      // Create booking in database
      const newBooking = await bookingsService.createBooking(user.id, createBookingData);

      // Create payment record for the booking
      try {
        await paymentsService.createPayment({
          bookingId: newBooking.id,
          customerId: user.id,
          workerId: newBooking.worker_id,
          amount: bookingData.finalPrice,
          paymentMethod: selectedPayment as 'cash' | 'card' | 'mobile' | 'wallet',
        });
      } catch (paymentError: any) {
        console.error('Payment record creation failed:', paymentError);
      }
      
      // Reset booking data and navigate to confirmation
      resetBookingData();
      navigation.navigate('BookingConfirmation', { 
        bookingId: newBooking.booking_number || newBooking.id,
        booking: newBooking 
      } as any);
      
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert(
        t('booking_failed_alert'), 
        error.message || t('failed_to_create_booking'),
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(4);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title={t('payment_method_title')} 
        onBack={handleBack}
        subtitle={t('step_5_of_5')}
      />
      <View style={styles.contentNoScroll}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_5_of_5_payment_method')}
          </Text>
        </View>

        {/* Phone Number Field */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('phone_number')} *</Text>
          </View>
          <Input
            placeholder={t('enter_phone_number_placeholder') || 'Enter phone number'}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            style={phoneError ? { borderColor: '#ef4444', borderWidth: 1 } : {}}
          />
          {phoneError ? (
            <Text style={[styles.errorText, { color: '#ef4444', fontSize: 12, marginTop: 4 }]}>
              {phoneError}
            </Text>
          ) : null}
          <Text style={[styles.fieldHint, { color: colors.textSecondary, fontSize: 11, marginTop: 4 }]}>
            {t('phone_number_required_for_booking') || 'Required to contact you about your booking'}
          </Text>
        </Card>

        {/* Payment Methods */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('select_payment_method_label')} *</Text>
          </View>
          
          <View style={[styles.methodsListContainer, { borderColor: colors.cardBorder, backgroundColor: colors.surface }]}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator style={styles.methodsListScroll}>
              <View style={styles.paymentMethodsList}>
                {paymentMethods.filter(m => m.available).map((method) => {
                  const isSelected = selectedPayment === method.id;
                  const IconComponent = method.icon;
                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => method.available && setSelectedPayment(method.id)}
                      disabled={!method.available}
                      style={[
                        styles.paymentMethodCard,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.card,
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                          opacity: method.available ? 1 : 0.5,
                        }
                      ]}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <View style={[
                          styles.paymentMethodIcon,
                          { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.surface }
                        ]}>
                          <IconComponent size={20} color={isSelected ? '#ffffff' : colors.accent} />
                        </View>
                        <View style={styles.paymentMethodInfo}>
                          <View style={styles.paymentMethodTitleRow}>
                            <Text style={[styles.paymentMethodTitle, { color: isSelected ? '#ffffff' : colors.textPrimary }]} numberOfLines={1}>
                              {method.title}
                            </Text>
                            {method.recommended && (
                              <View style={[styles.recommendedBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.accent }]}>
                                <Text style={[styles.recommendedText, { color: '#ffffff' }]}>
                                  {t('recommended_badge')}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.paymentMethodSubtitle, { color: isSelected ? '#ffffff' : colors.textSecondary }]} numberOfLines={1}>
                            {method.subtitle}
                          </Text>
                          {!method.available && (
                            <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                              {t('coming_soon_text')}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <View style={[styles.selectedIndicator, { backgroundColor: '#ffffff' }]}>
                          <View style={[styles.selectedDot, { backgroundColor: colors.accent }]} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Card>

        {/* Payment Details */}
        {selectedPayment === 'cash' && (
          <Card style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>{t('cash_on_delivery_title')}</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary, marginBottom: 8 }]}>
              {t('payment_due_after_completion')} • {t('exact_change_appreciated')}
            </Text>
            <Input
              placeholder={t('enter change placeholder') || 'Change amount (MAD)'}
              keyboardType="numeric"
              value={
                typeof bookingData.change === 'number' && !isNaN(bookingData.change)
                  ? String(bookingData.change)
                  : ''
              }
              onChangeText={(text) => {
                const digits = text.replace(/[^0-9]/g, '');
                const value = digits.length ? parseInt(digits, 10) : undefined;
                updateBookingData({ change: value });
              }}
            />
          </Card>
        )}
        {selectedPayment === 'card' && (
          <Card style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentTitle, { color: colors.textSecondary }]}>{t('credit_debit_card_title')}</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('payment_due_after_completion')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('exact_change_appreciated')}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.accent }]} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('receipt_will_be_provided')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Price Summary */}
        <Card style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}> 
          <Text style={[styles.paymentTitle, { color: colors.textPrimary }]}>{t('payment_summary_title')}</Text>
          
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={[styles.paymentDescription, { color: colors.textSecondary }]}>{t('pay_after_service_completion')}</Text>
              <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{bookingData.basePrice} MAD</Text>
            </View>
            
            {bookingData.carType && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                  {t('vehicle_type_label')} ({bookingData.carType}):
                </Text>
                <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                  {bookingData.finalPrice - bookingData.basePrice >= 0 ? '+' : ''}
                  {bookingData.finalPrice - bookingData.basePrice} MAD
                </Text>
              </View>
            )}
            
            <View style={[styles.priceDivider, { backgroundColor: colors.cardBorder }]} />
            
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('total_amount_label')}</Text>
              <Text style={[styles.totalValue, { color: colors.accent }]}>{bookingData.finalPrice} MAD</Text>
            </View>
          </View>
          
          {/* Removed extra bottom note to reduce clutter */}
        </Card>

      </View>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedPayment}
      />

      {/* Phone Number Required Modal */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentNoScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  methodsListContainer: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 156,
    overflow: 'hidden',
  },
  methodsListScroll: {
    paddingVertical: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // removed duplicate sectionCard/sectionHeader/sectionTitle definitions
  paymentMethodsList: {
    gap: 10,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  paymentMethodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 11,
  },
  paymentMethodSubtitle: {
    fontSize: 11,
    marginBottom: 0,
  },
  comingSoonText: {
    fontSize: 9,
    fontStyle: 'italic',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailsCard: {
    padding: 14,
    marginBottom: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  priceCard: {
    padding: 14,
    marginBottom: 0,
  },
  priceTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  priceBreakdown: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    minHeight: 20,
  },
  priceLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 60,
  },
  priceDivider: {
    height: 1,
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 22,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
    minWidth: 80,
  },
  paymentNote: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  paymentNoteText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    flexWrap: 'wrap',
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  backButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    marginRight: 8,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 11,
    marginTop: 4,
  },
});
