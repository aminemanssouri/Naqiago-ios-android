import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wrench, Sparkles, Droplets, Brush, SprayCan, Car } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { servicesService } from '../services';
import type { ServiceItem } from '../services/services';
import { useBooking } from '../contexts/BookingContext';

// Vehicle type options for filtering with translation keys
const VEHICLE_TYPES = [
  { key: 'Berline', titleKey: 'vehicle_type_sedan', image: require('../../assets/images/A4 BERLINE.webp') },
  { key: 'Citadine', titleKey: 'vehicle_type_compact', image: require('../../assets/images/A1 Citadine.webp') },
  { key: 'Moyen SUV', titleKey: 'vehicle_type_medium_suv', image: require('../../assets/images/Q5-MoyenSUV.webp') },
  { key: 'Grand SUV', titleKey: 'vehicle_type_large_suv', image: require('../../assets/images/Q8-GrandSUV.webp') },
  { key: 'Motorcycles', titleKey: 'vehicle_type_motorcycle', image: require('../../assets/images/bike.webp') },
];

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { bookingData } = useBooking();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>('Berline');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showInclusionsModal, setShowInclusionsModal] = useState(false);

  // Load services when component mounts or vehicle type changes
  useEffect(() => {
    loadServices();
  }, [selectedVehicleType]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let servicesData: ServiceItem[];
      if (selectedVehicleType) {
        // Get services filtered by vehicle type (type comes from API directly)
        servicesData = await servicesService.getServicesForVehicleType(selectedVehicleType);
      } else {
        // No vehicle type selected - return empty array
        servicesData = [];
      }
      
      // Debug logging to see what services and inclusions we received
      console.log('ServicesScreen: Loaded services:', servicesData.map(s => ({
        title: s.title,
        inclusions: s.inclusions,
        inclusionsLength: s.inclusions?.length || 0
      })));
      
      setServices(servicesData);
      
      // If no services returned, set a user-friendly message
      if (servicesData.length === 0) {
        setError(t('no_services_available') || 'No services available for this vehicle type');
      }
    } catch (err: any) {
      console.error('Error loading services:', err);
      const errorMessage = err.message || 'Failed to load services';
      setError(errorMessage);
      
      // Only show alert for unexpected errors
      if (!errorMessage.includes('aborted') && !errorMessage.includes('No data found')) {
        Alert.alert(
          t('error') || 'Error',
          errorMessage,
          [
            { text: t('retry') || 'Retry', onPress: loadServices },
            { text: t('cancel') || 'Cancel', style: 'cancel' }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIconComponent = (service: ServiceItem) => {
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

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header 
        title={t('services_title')} 
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: Math.max(16, insets.bottom + 12) 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Type Selector - Carousel Card Design */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: theme.textPrimary,
            marginBottom: 20,
            paddingHorizontal: 4,
          }}>
            {t('select_vehicle_type')}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={280}
            decelerationRate="fast"
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
            style={{ marginHorizontal: -16 }}
          >
            {VEHICLE_TYPES.map((vehicleType, index) => {
              const isSelected = selectedVehicleType === vehicleType.key;
              return (
                <Pressable
                  key={vehicleType.key}
                  onPress={() => setSelectedVehicleType(vehicleType.key)}
                  style={{
                    width: 260,
                    marginRight: 20,
                    borderRadius: 24,
                    backgroundColor: theme.card,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isSelected ? 0.15 : 0.08,
                    shadowRadius: 16,
                    elevation: isSelected ? 8 : 4,
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: theme.accent,
                    minHeight: 100,
                  }}
                >
                  {/* Vehicle Image Container */}
                  <View style={{
                    width: 70,
                    height: 70,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                  }}>
                    <Image 
                      source={vehicleType.image} 
                      style={{ 
                        width: 56, 
                        height: 56,
                      }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Text Container */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: theme.textPrimary,
                      marginBottom: 6,
                    }}>
                      {t(vehicleType.titleKey)}
                    </Text>

                    {/* Subtitle */}
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '400',
                      color: theme.textSecondary,
                      lineHeight: 18,
                    }}>
                      {isSelected ? '✓ Selected' : 'Tap to select'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
            gap: 8,
          }}>
            {VEHICLE_TYPES.map((vehicleType, index) => {
              const isSelected = selectedVehicleType === vehicleType.key;
              return (
                <View
                  key={vehicleType.key}
                  style={{
                    width: isSelected ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isSelected ? theme.accent : theme.cardBorder,
                    opacity: isSelected ? 1 : 0.4,
                  }}
                />
              );
            })}
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 40,
          }}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{
              marginTop: 12,
              fontSize: 14,
              color: theme.textSecondary,
            }}>
              {t('loading_services')}
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={{
            alignItems: 'center',
            paddingVertical: 32,
            paddingHorizontal: 16,
          }}>
            <Text style={{
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 16,
              color: '#FF5252',
            }}>
              {error}
            </Text>
            <Pressable
              onPress={loadServices}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: theme.accent,
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {t('retry')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* No Vehicle Type Selected */}
        {!isLoading && !error && !selectedVehicleType && (
          <View style={{
            alignItems: 'center',
            paddingVertical: 40,
          }}>
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary,
              textAlign: 'center',
            }}>
              {t('please_select_vehicle_type_to_see_services')}
            </Text>
          </View>
        )}

        {/* No Services Available */}
        {!isLoading && !error && selectedVehicleType && services.length === 0 && (
          <View style={{
            alignItems: 'center',
            paddingVertical: 40,
          }}>
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary,
              textAlign: 'center',
            }}>
              {t('no_services_available_for_vehicle_type')}
            </Text>
          </View>
        )}

        {/* Services Grid */}
        {!isLoading && !error && services.length > 0 && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
            {services.map((service) => {
              const IconComponent = getServiceIconComponent(service);
              
              return (
                <Pressable
                  key={service.key}
                  style={{
                    width: '48%',
                    backgroundColor: theme.card,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    shadowColor: '#000',
                    shadowOpacity: theme.isDark ? 0.3 : 0.08,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 160,
                  }}
                  onPress={() => {
                    // Navigate to service details screen
                    navigation.navigate('ServiceDetail', { serviceKey: service.key });
                  }}
                >
                  {/* Icon container */}
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: theme.isDark ? `${theme.accent}20` : `${theme.accent}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <IconComponent color={theme.accent} size={28} />
                  </View>
                  
                  {/* Service info */}
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: theme.textPrimary,
                    textAlign: 'center',
                    marginBottom: 6,
                  }}>
                    {service.title}
                  </Text>
                  
                  <Text style={{ 
                    fontSize: 12, 
                    color: theme.textSecondary,
                    textAlign: 'center',
                    marginBottom: 12,
                    lineHeight: 16,
                  }}>
                    {service.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>


    </SafeAreaView>
  );
}
