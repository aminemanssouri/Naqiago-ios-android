import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Calendar, Clock, MapPin, Car, CreditCard, User, Check, Wrench } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { BookingFooter } from '../components/ui/BookingFooter';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { SERVICES, iconFor } from '../data/services';
import type { RootStackParamList } from '../types/navigation';

// Mock worker data - should match the data from BookingScreen
const mockWorkers = {
  "1": { 
    name: "Ahmed Benali", 
    price: 80, 
    avatar: require('../../assets/images/professional-car-washer-ahmed.png') 
  },
  "2": { 
    name: "Omar Hassan", 
    price: 120, 
    avatar: require('../../assets/images/professional-car-washer-omar.png') 
  },
  "3": { 
    name: "Hassan Berrada", 
    price: 150, 
    avatar: require('../../assets/images/professional-car-washer-hassan.png') 
  },
  "4": { 
    name: "Youssef Alami", 
    price: 60, 
    avatar: require('../../assets/images/professional-car-washer-youssef.png') 
  },
};

export default function BookingReviewScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, resetBookingData } = useBooking();

  const worker = mockWorkers[bookingData.workerId as keyof typeof mockWorkers];

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleConfirmBooking = () => {
    // Generate booking ID
    const bookingId = `CW${Date.now().toString().slice(-6)}`;

    // Navigate to confirmation with all booking data
    const confirmationData = {
      ...bookingData,
      bookingId,
      workerName: worker?.name || bookingData.workerName,
      location: bookingData.address,
      price: bookingData.finalPrice.toString(),
    };

    resetBookingData();
    navigation.navigate('BookingConfirmation', confirmationData as any);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = (step: number) => {
    switch (step) {
      case 1:
        navigation.navigate('BookingDateTime' as any);
        break;
      case 2:
        navigation.navigate('BookingVehicle' as any);
        break;
      case 3:
        navigation.navigate('BookingServices' as any);
        break;
      case 4:
        navigation.navigate('BookingLocation' as any);
        break;
      case 5:
        navigation.navigate('BookingPayment' as any);
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title={t('review_booking')} 
        onBack={handleBack}
        subtitle="Step 6 of 6"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            Step 6 of 6: Review Booking
          </Text>
        </View>

        {/* Worker Info */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Car Washer</Text>
          </View>
          
          <View style={styles.workerInfo}>
            <Avatar 
              source={worker?.avatar} 
              name={worker?.name || bookingData.workerName} 
              size={48}
            />
            <View style={styles.workerDetails}>
              <Text style={[styles.workerName, { color: colors.textPrimary }]}>
                {worker?.name || bookingData.workerName}
              </Text>
              <Text style={[styles.workerRole, { color: colors.textSecondary }]}>
                Professional Car Washer
              </Text>
            </View>
            <Badge variant="default">Confirmed</Badge>
          </View>
        </Card>

        {/* Date & Time */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderWithEdit}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Date & Time</Text>
            </View>
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => handleEdit(1)}
              style={styles.editButton}
            >
              <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
            </Button>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatDate(bookingData.date)} at {bookingData.time}
            </Text>
          </View>
        </Card>

        {/* Vehicle Details */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderWithEdit}>
            <View style={styles.sectionHeader}>
              <Car size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Vehicle Details</Text>
            </View>
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => handleEdit(2)}
              style={styles.editButton}
            >
              <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
            </Button>
          </View>
          
          <View style={styles.vehicleDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Type:</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {bookingData.vehicleType || bookingData.carType}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Brand:</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {bookingData.carBrand}
              </Text>
            </View>
            
            {bookingData.carModel && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Model:</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {bookingData.carModel}
                </Text>
              </View>
            )}
            
            {bookingData.carYear && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Year:</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {bookingData.carYear}
                </Text>
              </View>
            )}
            
            {bookingData.carColor && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textPrimary }]}>Color:</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                  {bookingData.carColor}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Selected Services */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderWithEdit}>
            <View style={styles.sectionHeader}>
              <Wrench size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Selected Services</Text>
            </View>
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => handleEdit(3)}
              style={styles.editButton}
            >
              <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
            </Button>
          </View>
          
          <View style={styles.servicesContainer}>
            {bookingData.selectedServices && bookingData.selectedServices.length > 0 ? (
              bookingData.selectedServices.map((serviceKey) => {
                const service = SERVICES.find(s => s.key === serviceKey);
                if (!service) return null;
                
                const IconComponent = iconFor(service.icon);
                
                return (
                  <View key={serviceKey} style={[styles.serviceItem, { borderBottomColor: colors.cardBorder }]}>
                    <View style={styles.serviceLeft}>
                      <View style={[styles.serviceIcon, { backgroundColor: colors.accent + '20' }]}>
                        <IconComponent size={16} color={colors.accent} />
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={[styles.serviceName, { color: colors.textPrimary }]}>
                          {service.title}
                        </Text>
                        <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>
                          {service.desc}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.servicePrice, { color: colors.accent }]}>
                      {service.price} MAD
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={[styles.noServicesText, { color: colors.textSecondary }]}>
                No services selected
              </Text>
            )}
          </View>
        </Card>

        {/* Location */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderWithEdit}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Location</Text>
            </View>
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => handleEdit(4)}
              style={styles.editButton}
            >
              <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
            </Button>
          </View>
          
          <Text style={[styles.addressText, { color: colors.textSecondary }]}>
            {bookingData.address}
          </Text>
          
          {bookingData.notes && (
            <>
              <Separator style={styles.separator} />
              <View>
                <Text style={[styles.notesLabel, { color: colors.textPrimary }]}>Additional Notes:</Text>
                <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                  {bookingData.notes}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Payment Method */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderWithEdit}>
            <View style={styles.sectionHeader}>
              <CreditCard size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment Method</Text>
            </View>
            <Button 
              variant="outline" 
              size="sm" 
              onPress={() => handleEdit(5)}
              style={styles.editButton}
            >
              <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit</Text>
            </Button>
          </View>
          
          <View style={styles.paymentInfo}>
            <Text style={[styles.paymentMethod, { color: colors.textPrimary }]}>
              {bookingData.paymentMethod === 'cash' ? 'Cash on Delivery' : bookingData.paymentMethod}
            </Text>
            <Text style={[styles.paymentNote, { color: colors.textSecondary }]}>
              To be paid upon completion
            </Text>
          </View>
        </Card>

        {/* Price Summary */}
        <Card style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.priceTitle, { color: colors.textPrimary }]}>Booking Summary</Text>
          
          <View style={styles.priceBreakdown}>
            {bookingData.selectedServices && bookingData.selectedServices.length > 0 ? (
              <>
                {bookingData.selectedServices.map((serviceKey) => {
                  const service = SERVICES.find(s => s.key === serviceKey);
                  if (!service) return null;
                  
                  return (
                    <View key={serviceKey} style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{service.title}:</Text>
                      <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{service.price} MAD</Text>
                    </View>
                  );
                })}
                
                <View style={[styles.priceDivider, { backgroundColor: colors.cardBorder }]} />
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount:</Text>
                  <Text style={[styles.totalValue, { color: colors.accent }]}>{bookingData.servicesTotal || bookingData.finalPrice} MAD</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Service Fee:</Text>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{bookingData.basePrice || 0} MAD</Text>
                </View>
                
                <View style={[styles.priceDivider, { backgroundColor: colors.cardBorder }]} />
                
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Amount:</Text>
                  <Text style={[styles.totalValue, { color: colors.accent }]}>{bookingData.finalPrice || bookingData.basePrice || 0} MAD</Text>
                </View>
              </>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleConfirmBooking}
        continueText="Confirm Booking"
        continueIcon={<Check size={16} color="#ffffff" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  progressContainer: {
    marginBottom: 24,
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
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderWithEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 32,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  workerRole: {
    fontSize: 12,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textTransform: 'capitalize',
  },
  vehicleDetails: {
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    marginVertical: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 18,
  },
  paymentInfo: {
    gap: 4,
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentNote: {
    fontSize: 12,
  },
  priceCard: {
    padding: 16,
    marginBottom: 24,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  priceBreakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
  },
  priceDivider: {
    height: 1,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
  confirmButton: {
    flex: 2,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Services section styles
  servicesContainer: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  noServicesText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
