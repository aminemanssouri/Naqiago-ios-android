import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { MapPin, Navigation, Plus, X, Home, Building } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';
import { Textarea } from '../components/ui/Textarea';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import type { RootStackParamList } from '../types/navigation';
import { listAddresses, reverseGeocodeDetailed } from '../services/addresses';
import type { Address } from '../types/address';
import * as Location from 'expo-location';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import { useModal } from '../contexts/ModalContext';

type QuickItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  address: string;
};


export default function BookingLocationScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { bookingData, updateBookingData, setCurrentStep } = useBooking();
  const { show } = useModal();
  const scrollRef = useRef<ScrollView | null>(null);

  const [address, setAddress] = useState(bookingData.address || '');
  const [selectedQuickAddress, setSelectedQuickAddress] = useState<string | null>(null);
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: bookingData.coordinates?.latitude ?? 33.5731,
    longitude: bookingData.coordinates?.longitude ?? -7.5898,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [mapPin, setMapPin] = useState<{ latitude: number; longitude: number } | null>(
    bookingData.coordinates ? { latitude: bookingData.coordinates.latitude!, longitude: bookingData.coordinates.longitude! } : null
  );
  const [resolvingAddr, setResolvingAddr] = useState(false);
  const [mapResolvedAddress, setMapResolvedAddress] = useState('');

  const resolveAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      setResolvingAddr(true);
      // Try Expo reverse geocode first
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      let detailed = '';
      if (results && results.length > 0) {
        const r = results[0] as any;
        const parts = [
          r.street || r.name,
          r.streetNumber,
          r.district || r.subregion || r.neighborhood,
          r.city || r.subregion,
          r.region,
          r.postalCode,
          r.country,
        ]
          .filter((p: string | undefined) => !!p)
          .map((p: string) => String(p));
        detailed = parts.join(', ');
      }

      // Prefer OSM/Nominatim detailed line if available
      const osmDetailed = await reverseGeocodeDetailed(latitude, longitude);
      if (osmDetailed && osmDetailed.length > 0) {
        detailed = osmDetailed;
      }

      setMapResolvedAddress(detailed);
    } catch (e) {
      // keep previous text if any
    } finally {
      setResolvingAddr(false);
    }
  };

  const handleQuickAddressSelect = async (quickAddr: QuickItem) => {
    setSelectedQuickAddress(quickAddr.id);
    // If user chose Current Location, resolve a detailed street-level address
    if (quickAddr.id === 'current') {
      try {
        setLoadingQuick(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Permission denied: keep placeholder text
          setAddress(quickAddr.address);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        const results = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        // Try Expo first
        if (results && results.length > 0) {
          const r = results[0] as any;
          // Build a more specific address string
          const parts = [
            r.street || r.name,
            r.streetNumber,
            r.district || r.subregion || r.neighborhood,
            r.city || r.subregion,
            r.region,
            r.postalCode,
            r.country,
          ]
            .filter((p: string | undefined) => !!p)
            .map((p: string) => String(p));
          let detailed = parts.join(', ');

          // Fetch even more detailed street info from Nominatim and prefer it
          const osmDetailed = await reverseGeocodeDetailed(pos.coords.latitude, pos.coords.longitude);
          if (osmDetailed && osmDetailed.length > 0) {
            detailed = osmDetailed;
          }

          setAddress(detailed || quickAddr.address);
          // Persist precise coordinates in booking data
          updateBookingData({
            coordinates: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            },
          });
        } else {
          setAddress(quickAddr.address);
        }
      } catch (e) {
        setAddress(quickAddr.address);
      } finally {
        setLoadingQuick(false);
      }
    } else {
      setAddress(quickAddr.address);
    }
  };

  // Load user's saved addresses (if authenticated)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingQuick(true);
      try {
        const addrs = await listAddresses(true);
        if (mounted) setUserAddresses(addrs);
      } catch (e) {
        // Not authenticated or RLS error: ignore and keep only Current Location
      } finally {
        if (mounted) setLoadingQuick(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Build Quick Select items: Current Location + user's saved addresses
  const quickItems = useMemo<QuickItem[]>(() => {
    const current: QuickItem = {
      id: 'current',
      title: t('current_location_title'),
      subtitle: t('use_my_current_location'),
      icon: Navigation,
      // Placeholder; will be replaced with street-level address upon selection
      address: t('current_location_title'),
    };

    const mapped: QuickItem[] = (userAddresses || []).map((a) => {
      const title = a.title || t('saved_address_title');
      const isHome = title.toLowerCase().includes('home');
      const isWork = title.toLowerCase().includes('work');
      const icon = isHome ? Home : isWork ? Building : MapPin;
      const full = [a.address_line_1, a.address_line2, a.city, a.region, a.postal_code]
        .filter(Boolean)
        .join(', ');
      return {
        id: a.id,
        title,
        subtitle: full || t('saved_address_title'),
        icon,
        address: full || title,
      };
    });

    return [current, ...mapped];
  }, [userAddresses]);


  const handleContinue = () => {
    if (!address.trim()) {
      show({
        type: 'warning',
        title: t('missing_fields_location'),
        message: t('please_enter_service_address'),
      });
      return;
    }

    updateBookingData({
      address: address.trim(),
    });

    setCurrentStep(5);
    navigation.navigate('BookingPayment' as any);
  };

  const handleBack = () => {
    setCurrentStep(3);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header 
        title={t('service_location_title')} 
        onBack={handleBack}
        subtitle={t('step_4_of_5')}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 80}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.contentNoScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '80%', backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {t('step_4_of_5_service_location')}
            </Text>
          </View>

          {/* Quick Address Selection */}
          <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('quick_select_label')}</Text>
              </View>
              {quickItems.length > 1 && (
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                  Swipe →
                </Text>
              )}
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingRight: 20,
                paddingVertical: 8,
              }}
              snapToInterval={260}
              decelerationRate="fast"
              style={{ marginLeft: -16, marginRight: -16, paddingLeft: 16 }}
            >
              {quickItems.map((quickAddr: QuickItem, index) => {
                const isSelected = selectedQuickAddress === quickAddr.id;
                const IconComponent = quickAddr.icon;
                return (
                  <Pressable
                    key={quickAddr.id}
                    onPress={() => handleQuickAddressSelect(quickAddr)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: colors.cardBorder,
                      gap: 14,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.15 : 0.05,
                      shadowRadius: isSelected ? 8 : 4,
                      elevation: isSelected ? 4 : 1,
                      width: 240,
                      marginLeft: index === 0 ? 16 : 0,
                      marginRight: 16,
                    }}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : colors.accent + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconComponent size={22} color={isSelected ? '#ffffff' : colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: isSelected ? '#ffffff' : colors.textPrimary,
                        marginBottom: 4,
                      }}>
                        {quickAddr.title}
                      </Text>
                      <Text style={{
                        fontSize: 13,
                        color: isSelected ? 'rgba(255, 255, 255, 0.85)' : colors.textSecondary,
                        lineHeight: 18,
                      }} numberOfLines={2}>
                        {quickAddr.subtitle}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 14, color: colors.accent }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

          <Pressable
            onPress={async () => {
              try {
                setMapVisible(true);
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  const pos = await Location.getCurrentPositionAsync({});
                  const reg = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  };
                  setMapRegion(reg);
                  setMapPin({ latitude: reg.latitude, longitude: reg.longitude });
                  await resolveAddressFromCoords(reg.latitude, reg.longitude);
                } else if (!mapPin) {
                  await resolveAddressFromCoords(mapRegion.latitude, mapRegion.longitude);
                }
              } catch {}
            }}
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.accent,
              backgroundColor: colors.surface,
            }}
          >
            <Navigation size={18} color={colors.accent} />
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.accent,
            }} numberOfLines={1} ellipsizeMode="tail">Choose from Map</Text>
          </Pressable>
        </Card>

        {/* Manual Address Input */}
        <Card style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('service_address_label')} *</Text>
          <View style={[styles.modernAddressContainer, { borderColor: colors.cardBorder, backgroundColor: colors.surface, shadowColor: colors.textPrimary }]}>
            <MapPin size={18} color={colors.textSecondary} />
            <TextInput
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setSelectedQuickAddress(null);
              }}
              onFocus={() => {
                // Ensure the address field is scrolled into view above the keyboard
                scrollRef.current?.scrollToEnd({ animated: true });
              }}
              placeholder={t('enter_your_full_address')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.modernAddressInput, { color: colors.textPrimary }]}
              multiline
              numberOfLines={2}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {t('include_building_number')}
          </Text>
        </Card>
        {/* Removed extra bottom spacer to keep everything fit */}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={mapVisible} transparent animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalSheet,
            { backgroundColor: colors.card, borderColor: colors.cardBorder, paddingBottom: Math.max(insets.bottom, 12) + 72 }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Location</Text>
              <Pressable onPress={() => setMapVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.mapView}
                initialRegion={mapRegion}
                onRegionChangeComplete={(r) => setMapRegion(r)}
                onPress={(e: MapPressEvent) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setMapPin({ latitude, longitude });
                  resolveAddressFromCoords(latitude, longitude);
                }}
              >
                {mapPin && (
                  <Marker
                    coordinate={mapPin}
                    draggable
                    onDragEnd={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setMapPin({ latitude, longitude });
                      resolveAddressFromCoords(latitude, longitude);
                    }}
                  />
                )}
              </MapView>
            </View>
            <View style={styles.addressPreview}>
              {resolvingAddr ? (
                <View style={styles.addressPreviewRow}>
                  <ActivityIndicator size="small" />
                  <Text style={[styles.addressPreviewText, { color: colors.textSecondary }]}>Resolving address…</Text>
                </View>
              ) : (
                <Text style={[styles.addressPreviewText, { color: colors.textPrimary }]} numberOfLines={2}>
                  {mapResolvedAddress || address}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.modalActions,
                {
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  bottom: Math.max(insets.bottom, 12),
                  zIndex: 10,
                  elevation: 10,
                  backgroundColor: colors.card,
                  paddingTop: 12,
                },
              ]}
            >
              <Button variant="ghost" onPress={() => setMapVisible(false)}>
                {t('cancel')}
              </Button>
              <Button
                onPress={() => {
                  if (mapPin) {
                    const resolved = mapResolvedAddress?.trim();
                    const current = address?.trim();
                    const fallbackCoords = `${mapPin.latitude.toFixed(5)}, ${mapPin.longitude.toFixed(5)}`;
                    const nextAddress = resolved || current || fallbackCoords;

                    updateBookingData({
                      coordinates: { latitude: mapPin.latitude, longitude: mapPin.longitude },
                      address: nextAddress,
                    });
                    setAddress(nextAddress);
                  }
                  setSelectedQuickAddress(null);
                  setMapVisible(false);
                }}
                disabled={!mapPin || resolvingAddr}
              >
                Use this location
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <BookingFooter
        onBack={handleBack}
        onContinue={handleContinue}
        continueText="Continue to Vehicle"
      />
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
    marginBottom: 12,
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
  quickAddressGrid: {
    gap: 12,
  },
  quickAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  quickListContainer: {
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 140,
    overflow: 'hidden',
    marginBottom: 8,
  },
  quickListScroll: {
    paddingVertical: 4,
  },
  chooseMapButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  chooseMapText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickAddressInfo: {
    flex: 1,
  },
  quickAddressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickAddressSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addressInput: {
    marginTop: 16,
    marginBottom: 8,
    minHeight: 60,
  },
  modernAddressContainer: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 52,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modernAddressInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    margin: 0,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomSpacer: {
    height: 8,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    height: '85%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    minHeight: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mapView: {
    flex: 1,
  },
  addressPreview: {
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  addressPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressPreviewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    gap: 8,
    paddingBottom: 8,
  },
});
