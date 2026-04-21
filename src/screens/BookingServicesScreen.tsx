import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator, FlatList, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Wrench, ChevronRight, ChevronLeft, Check, Plus, Minus, Droplets, Sparkles, Brush, SprayCan, Car } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { servicesService } from '../services';
import type { ServiceItem } from '../services/services';
import type { RootStackParamList } from '../types/navigation';
import { useModal } from '../contexts/ModalContext';

export default function BookingServicesScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();
  const { show } = useModal();

  const [selectedServices, setSelectedServices] = useState<string[]>(bookingData.selectedServices || []);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const cardWidth = screenWidth * 0.62; // Card width to show 1 full card + half of next
  const cardMargin = 16;
  const sideCardPeek = 20; // Left padding to show peek

  // Load services from Supabase
  useEffect(() => {
    loadServices();
  }, []);

  // Reload services when vehicle type changes
  useEffect(() => {
    if (bookingData.vehicleType || bookingData.carType) {
      loadServices();
    }
  }, [bookingData.vehicleType, bookingData.carType]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get services filtered by vehicle type - vehicle type is required
      let servicesData: ServiceItem[];
      if (bookingData.vehicleType) {
        // Use the vehicle type directly (comes from API)
        servicesData = await servicesService.getServicesForVehicleType(bookingData.vehicleType);
      } else if (bookingData.carType) {
        // Fallback: Map legacy carType to vehicleType for backward compatibility
        const vehicleTypeMap: { [key: string]: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle' } = {
          'Sedan': 'sedan',
          'SUV': 'suv', 
          'Hatchback': 'hatchback',
          'Van': 'van',
          'Truck': 'truck',
          'Motorcycle': 'motorcycle',
          'car': 'sedan',
          'motor': 'motorcycle',
          'motor 49 CC': 'motorcycle',
          'motor plus 49 CC': 'motorcycle'
        };
        
        const vehicleType = vehicleTypeMap[bookingData.carType] || 'sedan';
        servicesData = await servicesService.getServicesWithVehiclePricing(vehicleType);
      } else {
        // No vehicle type selected - return empty array (services require vehicle type)
        console.warn('No vehicle type selected, cannot load services');
        servicesData = [];
      }
      
      setServices(servicesData);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setError(err.message || 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get icon component
  const iconForService = (service: ServiceItem) => {
    const key = (service.key || '').toLowerCase();
    const title = (service.title || '').toLowerCase();
    const desc = (service.desc || '').toLowerCase();
    const haystack = `${key} ${title} ${desc}`;

    if (
      haystack.includes('interior') ||
      haystack.includes('intérieur') ||
      haystack.includes('inside') ||
      haystack.includes('siège') ||
      haystack.includes('seat') ||
      haystack.includes('vacuum')
    ) {
      return Brush;
    }

    if (
      haystack.includes('exterior') ||
      haystack.includes('extérieur') ||
      haystack.includes('outside') ||
      haystack.includes('body') ||
      haystack.includes('carrosserie')
    ) {
      return SprayCan;
    }

    if (haystack.includes('wax') || haystack.includes('cire') || haystack.includes('polish') || haystack.includes('lustr')) {
      return Sparkles;
    }

    if (haystack.includes('engine') || haystack.includes('moteur') || haystack.includes('repair') || haystack.includes('maintenance')) {
      return Wrench;
    }

    if (haystack.includes('premium')) {
      return Sparkles;
    }

    if (haystack.includes('complet') || haystack.includes('complete')) {
      return Brush;
    }

    if (haystack.includes('extra') || haystack.includes('spécial') || haystack.includes('special')) {
      return SprayCan;
    }

    if (haystack.includes('lavage') || haystack.includes('wash') || haystack.includes('clean')) {
      return Droplets;
    }

    switch (service.category) {
      case 'basic':
        return Droplets;
      case 'deluxe':
        return Brush;
      case 'premium':
        return Sparkles;
      case 'specialty':
        return SprayCan;
      default:
        return Wrench;
    }
  };

  const handleServiceToggle = (serviceKey: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceKey)) {
        return prev.filter(key => key !== serviceKey);
      } else {
        return [...prev, serviceKey];
      }
    });
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceKey) => {
      const service = services.find(s => s.key === serviceKey);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      show({
        type: 'warning',
        title: t('no_services_selected'),
        message: t('please_select_at_least_one_service'),
      });
      return;
    }

    const servicesTotal = calculateTotal();
    
    // Get the first selected service for serviceId and serviceName
    const firstServiceKey = selectedServices[0];
    const firstService = services.find(s => s.key === firstServiceKey);
    
    if (!firstService) {
      setError(t('error'));
      setError(t('selected_service_not_found'));
      return;
    }
    
    updateBookingData({
      selectedServices,
      servicesTotal,
      finalPrice: servicesTotal,
      serviceId: firstService.id, // Set the primary service UUID (not key)
      serviceName: firstService.title, // Set the primary service name
      estimatedDuration: firstService.durationMinutes || 60, // Set estimated duration
    });

    setCurrentStep(4);
    navigation.navigate('BookingLocation' as any);
  };

  const handleBack = () => {
    setCurrentStep(2);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={[]}>
      <Header 
        title={t('select_services')} 
        onBack={handleBack}
        subtitle={t('step_3_of_5')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%', backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {t('step_3_of_5_select_services')}
          </Text>
        </View>

        {/* Vehicle Type Indicator */}
        {(bookingData.vehicleType || bookingData.carType) && (
          <Card style={[styles.vehicleIndicatorCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <View style={styles.vehicleIndicatorContent}>
              <View style={[styles.vehicleIndicatorIcon, { backgroundColor: colors.accent + '20' }]}>
                <Car size={16} color={colors.accent} />
              </View>
              <View style={styles.vehicleIndicatorText}>
                <Text style={[styles.vehicleIndicatorTitle, { color: colors.textPrimary }]}>
                  {t('services_for_vehicle_type')}
                </Text>
                <Text style={[styles.vehicleIndicatorSubtitle, { color: colors.accent }]}>
                  {bookingData.vehicleType || bookingData.carType}
                  {bookingData.carBrand && ` • ${bookingData.carBrand}`}
                  {bookingData.carModel && ` ${bookingData.carModel}`}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Services Selection */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Wrench size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('available_services')} *</Text>
            {(bookingData.vehicleType || bookingData.carType) && (
              <View style={[styles.filteredBadge, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.filteredBadgeText, { color: colors.accent }]}>
                  {t('filtered_for_vehicle')}
                </Text>
              </View>
            )}
          </View>
          
          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loading_services')}</Text>
            </View>
          )}

          {/* Load/Error State */}
          {error && !isLoading && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: '#FF5252' }]}>{error}</Text>
              <Pressable onPress={loadServices} style={[styles.retryButton, { backgroundColor: colors.accent }]}>
                <Text style={styles.retryButtonText}>{t('retry')}</Text>
              </Pressable>
            </View>
          )}

          {/* No Vehicle Type Selected State */}
          {!isLoading && !error && services.length === 0 && !bookingData.vehicleType && !bookingData.carType && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {t('please_select_vehicle_type_first')}
              </Text>
            </View>
          )}

          {/* No Services Available State */}
          {!isLoading && !error && services.length === 0 && (bookingData.vehicleType || bookingData.carType) && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {t('no_services_available_for_vehicle_type')}
              </Text>
            </View>
          )}

          {/* Services Carousel */}
          {!isLoading && !error && services.length > 0 && (
            <View style={styles.carouselContainer}>
              <FlatList
                ref={flatListRef}
                data={services}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                snapToInterval={280}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingVertical: 8,
                }}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / 280);
                  setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.key}
                renderItem={({ item: service, index }) => {
                  const isSelected = selectedServices.includes(service.key);
                  const IconComponent = iconForService(service);

                  return (
                    <Pressable
                      onPress={() => {
                        setError(null);
                        handleServiceToggle(service.key);
                      }}
                      style={{
                        width: 260,
                        marginRight: 20,
                        borderRadius: 24,
                        backgroundColor: colors.card,
                        padding: 24,
                        shadowColor: colors.isDark ? '#000' : colors.primary,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: colors.isDark ? 0.4 : 0.1,
                        shadowRadius: 16,
                        elevation: 4,
                        borderWidth: isSelected ? 3 : 1,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                        minHeight: 320,
                      }}
                    >
                      {/* Selection Badge */}
                      <View style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isSelected ? colors.accent : (colors.isDark ? 'rgba(255,255,255,0.15)' : colors.surface),
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        shadowColor: colors.isDark ? '#000' : colors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: colors.isDark ? 0.3 : 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}>
                        {isSelected ? (
                          <Check size={18} color='#ffffff' strokeWidth={3} />
                        ) : (
                          <Plus size={18} color={colors.textSecondary} />
                        )}
                      </View>

                      {/* Service Icon Container */}
                      <View style={{
                        width: '100%',
                        height: 80,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : colors.overlay,
                        borderRadius: 16,
                      }}>
                        <IconComponent 
                          size={40} 
                          color={colors.accent} 
                        />
                      </View>

                      {/* Service Info */}
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: colors.textPrimary,
                        marginBottom: 8,
                        lineHeight: 24,
                        textAlign: 'center',
                      }}>
                        {service.title}
                      </Text>
                      
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: colors.textSecondary,
                        marginBottom: 12,
                        lineHeight: 18,
                        textAlign: 'center',
                      }} numberOfLines={2}>
                        {service.desc}
                      </Text>

                      {/* Inclusions Preview */}
                      {service.inclusions && service.inclusions.length > 0 && (
                        <View style={{ marginBottom: 12 }}>
                          {service.inclusions.slice(0, 2).map((inclusion: any, idx: number) => (
                            <Text 
                              key={idx}
                              style={{
                                fontSize: 12,
                                color: colors.isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                                marginBottom: 4,
                              }}
                              numberOfLines={1}
                            >
                              ✓ {inclusion.text || inclusion}
                            </Text>
                          ))}
                          {service.inclusions.length > 2 && (
                            <Text style={{
                              fontSize: 11,
                              color: colors.accent,
                              marginTop: 4,
                              fontWeight: '600',
                            }}>
                              +{service.inclusions.length - 2} more inclusions
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Price & Duration */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.cardBorder,
                      }}>
                        <View>
                          <Text style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: colors.accent,
                          }}>
                            {service.price} MAD
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                            marginTop: 2,
                          }}>
                            ~{service.durationMinutes} min
                          </Text>
                        </View>
                        
                        {/* Action Indicator */}
                        <View style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: isSelected ? (colors.isDark ? 'rgba(255,198,41,0.2)' : colors.accent + '20') : (colors.isDark ? 'rgba(255,255,255,0.08)' : colors.surface),
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: isSelected ? colors.accent : colors.textSecondary,
                          }}>
                            {isSelected ? '✓ Added' : 'Tap to add'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
              />
              
              {/* Carousel Indicators */}
              {services.length > 1 && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 16,
                  gap: 8,
                }}>
                  {services.map((_, index) => {
                    const inputRange = [
                      (index - 1) * 280,
                      index * 280,
                      (index + 1) * 280,
                    ];

                    const dotWidth = scrollX.interpolate({
                      inputRange,
                      outputRange: [8, 24, 8],
                      extrapolate: 'clamp',
                    });

                    const dotOpacity = scrollX.interpolate({
                      inputRange,
                      outputRange: [0.4, 1, 0.4],
                      extrapolate: 'clamp',
                    });

                    return (
                      <Animated.View
                        key={index}
                        style={{
                          height: 8,
                          borderRadius: 4,
                          width: dotWidth,
                          opacity: dotOpacity,
                          backgroundColor: colors.accent,
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueText="Continue to Date & Time"
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
    marginBottom: 24,
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
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
  },
  selectionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  servicePriceContainer: {
    alignItems: 'flex-start',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectedServicesList: {
    marginBottom: 16,
  },
  selectedServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectedServiceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedServiceInfo: {
    flex: 1,
  },
  selectedServiceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedServiceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedServiceRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  selectedServicePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
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
    // Make footer feel elevated and pinned visually
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    flex: 1,
    height: 52,
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
  // Loading and error states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Vehicle indicator styles
  vehicleIndicatorCard: {
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  vehicleIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIndicatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIndicatorText: {
    flex: 1,
  },
  vehicleIndicatorTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  vehicleIndicatorSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  filteredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  filteredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Carousel styles
  carouselContainer: {
    marginVertical: 8,
  },
  carouselCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    minHeight: 360,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  carouselIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  carouselInfo: {
    marginBottom: 12,
  },
  carouselTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  carouselDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  inclusionsPreview: {
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  inclusionText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 3,
  },
  inclusionMore: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 3,
  },
  carouselPriceContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  carouselPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carouselDuration: {
    fontSize: 13,
  },
  tapHint: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});
