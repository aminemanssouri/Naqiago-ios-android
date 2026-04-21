import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Dimensions, useWindowDimensions, Alert, FlatList, ViewToken, Modal, Animated, Image, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { User, Bell, Search, Navigation as NavIcon, Menu, Home as HomeIcon, Wrench, Calendar, MessageCircle, Store, Settings, LogOut, AlertTriangle, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GoogleMap from '../components/GoogleMap';
import { Button } from '../components/ui/Button';
import { workersService, type Worker } from '../services/workers';

import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import SideMenu from '../components/ui/SideMenu';
import { useAuth } from '../contexts/AuthContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() || 56;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const { navigateWithAuth } = useAuthNavigation();
  const userRole = (user as any)?.profile?.role || 'customer';
  const [menuVisible, setMenuVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [centerOn, setCenterOn] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [selectedWorkerData, setSelectedWorkerData] = useState<Worker | null>(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current; // Start fully off-screen
  const [query, setQuery] = useState('');
  const isHidingCardRef = useRef(false);
  const [locating, setLocating] = useState(false);
  const searchWidth = width * 0.4;

  const overlayLeftWidth = 44;
  const overlayGap = 12;
  const overlayLeftInset = 16;
  const topBarLeft = overlayLeftInset + overlayLeftWidth + overlayGap;
  
  // Workers state
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  


  // Load workers on mount
  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const workersData = await workersService.getWorkers(false); // Force fresh fetch, bypass cache
      setWorkers(workersData);
    } catch (error) {
      console.error('Error loading workers:', error);
      // Keep empty array on error
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const filteredWorkers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w: Worker) => {
      const nameMatch = w.name.toLowerCase().includes(q);
      const serviceMatch = (w.services || []).some((s: string) => s.toLowerCase().includes(q));
      const businessMatch = w.businessName?.toLowerCase().includes(q);
      return nameMatch || serviceMatch || businessMatch;
    });
  }, [query, workers]);

  const goToBooking = (id: string) => {
    // Navigate directly to booking - user will select service in the booking flow
    navigation.navigate('Booking', {
      workerId: id,
      serviceKey: 'basic' // Default service, user can change in booking flow
    } as any);
  };

  // Auto-center map when search results change
  useEffect(() => {
    if (query.trim() && filteredWorkers.length > 0) {
      const firstWorker = filteredWorkers[0];
      setCenterOn({
        latitude: firstWorker.location.latitude,
        longitude: firstWorker.location.longitude,
        zoom: 14,
      });
      // Optionally select the first worker
      setSelectedWorker(firstWorker.id);
    }
  }, [filteredWorkers, query]);

  // Animation functions for sliding card
  const showWorkerCard = (worker: Worker) => {
    isHidingCardRef.current = false;
    setSelectedWorkerData(worker);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideWorkerCard = (after?: () => void) => {
    if (isHidingCardRef.current) return; // prevent double-dismiss
    isHidingCardRef.current = true;
    Animated.timing(slideAnim, {
      toValue: screenHeight, // move completely off-screen
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSelectedWorkerData(null);
      setSelectedWorker(null);
      isHidingCardRef.current = false;
      after?.();
    });
  };

  // Handle marker press to show sliding card
  const handleMarkerPress = (id: string) => {
    console.log('Marker pressed:', id);
    console.log('Available worker IDs:', workers.map(w => w.id));

    if (selectedWorker === id) {
      // If same worker is clicked, hide the card
      setSelectedWorker(null);
      hideWorkerCard();
      return;
    }

    const worker = workers.find(w => w.id === id);
    console.log('Found worker:', worker);

    if (worker) {
      // If another card is open, close first then open the new one to avoid overlap/half state
      if (selectedWorkerData) {
        hideWorkerCard(() => {
          setSelectedWorker(id);
          showWorkerCard(worker);
        });
      } else {
        setSelectedWorker(id);
        showWorkerCard(worker);
      }

      // Center map on selected worker
      setCenterOn(null);
      const coords = { latitude: worker.location.latitude, longitude: worker.location.longitude, zoom: 15 };
      setTimeout(() => setCenterOn(coords), 100);
    } else {
      console.error('Worker not found for ID:', id);
    }
  };

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    try {
      await signOut();
    } catch (e) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const renderWorkerMarker = (worker: Worker) => (
    <Pressable
      key={worker.id}
      style={[
        styles.workerMarker,
        {
          left: `${((worker.location.longitude + 8) * 100)}%`,
          top: `${((31.65 - worker.location.latitude) * 1000)}%`,
        },
        selectedWorker === worker.id && styles.selectedMarker,
      ]}
      onPress={() => setSelectedWorker(selectedWorker === worker.id ? null : worker.id)}
    >
      <View style={[styles.avatar, selectedWorker === worker.id && styles.selectedAvatar]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent, borderColor: theme.card }]}>
          <Text style={styles.avatarText}>{worker.name.charAt(0)}</Text>
        </View>
        <View style={[styles.onlineIndicator, { borderColor: theme.card }]} />
      </View>

      {selectedWorker === worker.id && (
        <View style={[styles.workerPopup, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.popupHeader}>
            <View style={[styles.avatarSmall, { backgroundColor: theme.accent, borderColor: theme.card }]}>
              <Text style={styles.avatarTextSmall}>{worker.name.charAt(0)}</Text>
            </View>
            <View style={styles.workerInfo}>
              <Text style={[styles.workerName, { color: theme.textPrimary }]} numberOfLines={1}>{worker.name}</Text>
              <Text style={[styles.workerSpecialty, { color: theme.textSecondary }]}>{worker.services[0]}</Text>
            </View>
          </View>
          
          <View style={styles.popupDetails}>
            <View style={styles.ratingContainer}>
              <Text style={styles.star}>★</Text>
              <Text style={[styles.rating, { color: theme.textSecondary }]}>{worker.rating} ({worker.reviewCount})</Text>
            </View>
            <Text style={[styles.distance, { color: theme.textSecondary }]}>0.5 {t('km_away')}</Text>
          </View>
          
          <View style={styles.popupFooter}>
            <Button 
              size="sm" 
              onPress={() => goToBooking(worker.id)}
            >
              {t('book_now')}
            </Button>
          </View>
          
          <View style={[styles.popupArrow, { borderTopColor: theme.card }]} />
        </View>
      )}
    </Pressable>
  );

  return (
    <>
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Interactive Map (Google Maps) */}
      <View style={styles.mapContainer}>
        <GoogleMap
          initialRegion={{ latitude: 31.6295, longitude: -7.9811, zoom: 13 }}
          markers={filteredWorkers.map((w) => {
            console.log('Mapping worker to marker:', w.id, w.name);
            return {
              id: w.id,
              latitude: w.location.latitude,
              longitude: w.location.longitude,
              title: w.name,
              subtitle: w.services.join(', '),
              avatar: w.avatar,
              services: w.services,
              rating: w.rating,
            };
          })}
          onMarkerPress={handleMarkerPress}
          onBookNow={(id: string) => goToBooking(id)}
          centerOn={centerOn}
          myLocation={myLocation}
          selectedId={selectedWorker}
          darkMode={theme.isDark}
        />
      </View>

      {/* Top Bar with Search */}
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.topBar,
          { top: insets.top + 12, left: topBarLeft, borderColor: 'rgba(255,255,255,0.18)' }
        ]}
      >
        <View style={styles.heroTextContainer}>
          <Text style={[styles.heroTitle, { fontFamily: theme.fontHeading }]}>Naqiago</Text>
          <Text style={[styles.heroSubtitle, { fontFamily: theme.fontPrimary }]}>Lavage écologique sans eau</Text>
        </View>
        {/* Search Bar */}
        <Pressable 
          onPress={() => navigation.navigate('Search' as never)}
          style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadow }]}
        >
          <Search color={theme.textSecondary} size={20} style={styles.searchIcon} />
          <Text style={[styles.searchPlaceholder, { color: theme.textSecondary, fontFamily: theme.fontPrimary }]}>
            Search workers, services, or areas...
          </Text>
        </Pressable>
      </LinearGradient>

      {/* Left side buttons - hamburger + 3 action buttons */}
      <View style={[styles.leftButtons, { top: insets.top + 12 }]}>
        {/* Hamburger Menu Button */}
        <Pressable style={[styles.hamburgerButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]} onPress={() => setMenuVisible(true)}>
          <Menu color={theme.textPrimary} size={22} />
        </Pressable>
        
        {/* Action Buttons */}
        <Pressable
          style={[styles.floatingButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          onPress={() => (navigation as any).navigate('Notifications')}
        >
          <Bell color={theme.textPrimary} size={20} />
        </Pressable>
        <Pressable 
          style={[styles.floatingButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          onPress={async () => {
            setLocating(true);
            try {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to show your location on the map.');
                return;
              }
              let location = await Location.getCurrentPositionAsync({});
              const newLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
              setMyLocation(newLocation);
              setCenterOn({ ...newLocation, zoom: 15 });
            } catch (error) {
              Alert.alert('Error', 'Could not get your location. Please try again.');
            } finally {
              setLocating(false);
            }
          }}
        >
          {locating ? (
            <View style={[styles.locationPulse, { backgroundColor: theme.accent }]} />
          ) : (
            <NavIcon color={theme.textPrimary} size={20} />
          )}
        </Pressable>
        <Pressable 
          style={[styles.floatingButton, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
          onPress={() => (navigation as any).navigate('Profile')}
        >
          <User color={theme.textPrimary} size={20} />
        </Pressable>
      </View>

      {/* Worker full-width horizontal pager */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
          renderItem={({ item: worker }) => (
            <View style={{ width: screenWidth }}>
              <Pressable
                style={[
                  styles.workerCardFull,
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  selectedWorker === worker.id && { borderColor: theme.accent },
                ]}
                onPress={() => navigation.navigate('WorkerDetail', { workerId: worker.id })}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardAvatarContainer}>
                    {worker.avatar ? (
                      <Image
                        source={{ uri: worker.avatar }}
                        style={[styles.cardAvatar, { borderColor: theme.card }]}
                        onError={() => console.log('Failed to load worker avatar:', worker.avatar)}
                      />
                    ) : (
                      <View style={[styles.cardAvatar, { backgroundColor: theme.accent, borderColor: theme.card }]}>
                        <Text style={styles.cardAvatarText}>{worker.name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardInfo}>
                    <Text style={[styles.slideCardName, { color: theme.textPrimary }]} numberOfLines={1}>{worker.name}</Text>
                    <Text style={[styles.workerSpecialty, { color: theme.textSecondary }]}>{worker.services[0]}</Text>
                    
                    <View style={styles.cardDetails}>
                      <View style={styles.cardRating}>
                        <Text style={styles.cardStar}>★</Text>
                        <Text style={[styles.cardRatingText, { color: theme.textSecondary }]}>
                          {worker.rating} ({worker.reviewCount})
                        </Text>
                      </View>
                      <Text style={[styles.cardDivider, { color: theme.cardBorder }]}>•</Text>
                      <Text style={[styles.cardDistance, { color: theme.textSecondary }]}>0.5 {t('km_away')}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardActions}>
                    <Button 
                      size="sm" 
                      onPress={() => goToBooking(worker.id)}
                    >
                      {t('book')}
                    </Button>
                  </View>
                </View>
              </Pressable>
            </View>
          )}
          onViewableItemsChanged={useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
            if (viewableItems && viewableItems.length > 0) {
              const first = viewableItems[0];
              const worker = first.item as Worker;
              if (worker?.id) {
                setSelectedWorker(worker.id);
                setCenterOn(null);
                const coords = { latitude: worker.location.latitude, longitude: worker.location.longitude, zoom: 15 };
                setTimeout(() => setCenterOn(coords), 0);
              }
            }
          }).current}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        />
      </View>
    </View>
    {/* Side Menu Overlay */}
    <SideMenu
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      theme={theme}
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accent }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary }}>{t('menu')}</Text>
        </View>
      }
      items={
        userRole === 'worker'
          ? [
              {
                key: 'dashboard',
                label: t('dashboard'),
                icon: <HomeIcon size={18} color={theme.textPrimary} />,
                onPress: () => (navigation as any).navigate('Dashboard'),
              },
            ]
          : [
              {
                key: 'home',
                label: t('home'),
                icon: <HomeIcon size={18} color={theme.textPrimary} />,
                onPress: () => (navigation as any).navigate('Home'),
              },
              {
                key: 'services',
                label: t('services_title'),
                icon: <Wrench size={18} color={theme.textPrimary} />,
                onPress: () => (navigation as any).navigate('Services'),
              },
              {
                key: 'bookings',
                label: t('my_bookings'),
                icon: <Calendar size={18} color={theme.textPrimary} />,
                onPress: () => (navigation as any).navigate('Bookings'),
              },
              {
                key: 'messaging',
                label: t('messaging'),
                icon: <MessageCircle size={18} color={theme.textPrimary} />,
                onPress: () => navigation.navigate('ComingSoon', { feature: 'Messaging' }),
              },
              {
                key: 'store',
                label: t('store'),
                icon: <Store size={18} color={theme.textPrimary} />,
                onPress: () => navigation.navigate('ComingSoon', { feature: 'Store' }),
              },
            ]
      }
      footerItems={[
        {
          key: 'settings',
          label: t('settings'),
          icon: <Settings size={18} color={theme.textPrimary} />,
          onPress: () => (navigation as any).navigate('Settings'),
        },
        ...(user ? [{
          key: 'logout',
          label: t('sign_out'),
          icon: <LogOut size={18} color={theme.textPrimary} />,
          onPress: handleSignOut,
        }] : []),
      ]}
    />
    
    {/* Sign Out Confirmation Modal */}
    <Modal
      visible={signOutModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setSignOutModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalIcon, { backgroundColor: '#fef2f2' }]}>
              <AlertTriangle size={24} color="#ef4444" />
            </View>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setSignOutModalVisible(false)}
            >
              <X size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('sign_out_confirm_title')}
            </Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              {t('sign_out_confirm_message')}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              variant="outline"
              style={[styles.modalButton, { borderColor: theme.cardBorder }]}
              onPress={() => setSignOutModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.textPrimary }]}>
                Cancel
              </Text>
            </Button>
            <Button
              variant="ghost"
              style={[styles.modalButton, styles.confirmButton]}
              onPress={confirmSignOut}
            >
              <LogOut size={16} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.confirmButtonText}>
                {t('sign_out')}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>

    {/* Sliding Worker Card */}
    {selectedWorkerData && (
      <>
        {/* Backdrop (tappable to dismiss) */}
        <Pressable onPress={() => hideWorkerCard()} style={StyleSheet.absoluteFill} pointerEvents="auto">
          <Animated.View
            style={[
              styles.cardBackdrop,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [0, screenHeight],
                  outputRange: [0.35, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        </Pressable>
        
        {/* Sliding Card */}
        <Animated.View
          style={[
            styles.slideWorkerCard,
            {
              backgroundColor: theme.card,
              // Force connection with navigation bar on all screens, especially small ones
              bottom: 0, // Position directly at bottom to eliminate any gaps
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
        <View style={styles.slideCardHandle}>
          <View style={[styles.slideCardHandleBar, { backgroundColor: theme.cardBorder }]} />
        </View>

        <View style={[styles.slideCardContent, { paddingBottom: insets.bottom + 12 }]}>
          {/* Header Section */}
          <View style={styles.slideCardHeader}>
            <View style={styles.slideCardAvatarContainer}>
              {selectedWorkerData.avatar ? (
                <Image
                  source={
                    typeof selectedWorkerData.avatar === 'string'
                      ? { uri: selectedWorkerData.avatar }
                      : selectedWorkerData.avatar
                  }
                  style={styles.slideCardAvatar}
                />
              ) : (
                <View style={[styles.slideCardAvatarFallback, { backgroundColor: theme.accent }]}>
                  <Text style={styles.slideCardAvatarText}>
                    {selectedWorkerData.name.charAt(0)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.slideCardInfo}>
              <Text style={[styles.slideCardName, { color: theme.textPrimary }]}>
                {selectedWorkerData.name}
              </Text>
              <View style={styles.slideCardRating}>
                <Text style={styles.slideCardRatingText}>⭐ {selectedWorkerData.rating}</Text>
                <Text style={[styles.slideCardReviews, { color: theme.textSecondary }]}>
                  ({selectedWorkerData.reviewCount} reviews)
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.slideCardCloseButton}
              onPress={() => hideWorkerCard()}
            >
              <X size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Services Section - Enhanced */}
          <View style={styles.slideCardServices}>
            <Text style={[styles.slideCardServicesLabel, { color: theme.textSecondary }]}>
              SERVICES OFFERED
            </Text>
            <View style={styles.servicesList}>
              {selectedWorkerData.services.map((service, index) => (
                <View key={index} style={[styles.serviceTag, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
                  <Text style={[styles.serviceTagText, { color: theme.accent }]}>{service}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Availability Section */}
          <View style={styles.availabilitySection}>
            <View style={[styles.availabilityBadge, { backgroundColor: selectedWorkerData.isAvailable ? '#10b981' : '#ef4444' }]}>
              <Text style={styles.availabilityText}>
                {selectedWorkerData.isAvailable ? 'Available Now' : 'Busy'}
              </Text>
            </View>
          </View>

          {/* Book Section (pricing shown only during booking) */}
          <View style={styles.slideCardFooter}>
            <Button
              style={[styles.slideCardBookButton, { backgroundColor: theme.accent, flex: 1 }]}
              onPress={() => {
                hideWorkerCard();
                goToBooking(selectedWorkerData.id);
              }}
            >
              <Text style={styles.slideCardBookButtonText}>Book Now</Text>
            </Button>
          </View>
        </View>
        </Animated.View>
      </>
    )}


    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'visible', // Prevent marker clipping
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  markerIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  workerPopupOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  workerMarker: {
    position: 'absolute',
    zIndex: 10,
  },
  selectedMarker: {
    zIndex: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    position: 'relative',
  },
  selectedAvatar: {
    transform: [{ scale: 1.1 }],
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  workerPopup: {
    position: 'absolute',
    bottom: 50,
    left: -88,
    width: 176,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  workerSpecialty: {
    fontSize: 10,
    color: '#6b7280',
  },
  popupDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#fbbf24',
    fontSize: 12,
    marginRight: 2,
  },
  rating: {
    fontSize: 10,
    color: '#374151',
  },
  distance: {
    fontSize: 10,
    color: '#6b7280',
  },
  popupFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  popupArrow: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    marginLeft: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  currentLocation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -8,
    marginLeft: -8,
    zIndex: 20,
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    opacity: 0.3,
  },
  // Top bar with search only
  topBar: {
    position: 'absolute',
    top: 50,
    left: 70, // Leave space for hamburger button
    right: 16,
    zIndex: 30,
    flexDirection: 'column',
    alignItems: 'stretch',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
  },
  heroTextContainer: {
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  heroTitle: {
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  searchBar: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  searchClearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  leftButtons: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'column',
    zIndex: 30,
    gap: 12,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  carouselContainer: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  carouselContent: {
    paddingHorizontal: 12,
  },
  workerCard: {
    width: 224,
    marginRight: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedCard: {
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'white',
    shadowOpacity: 0.15,
  },
  workerCardFull: {
    marginHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatarContainer: {
    marginRight: 10,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardSpecialty: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStar: {
    color: '#fbbf24',
    fontSize: 12,
    marginRight: 2,
  },
  cardRatingText: {
    fontSize: 10,
    color: '#6b7280',
  },
  cardDivider: {
    fontSize: 10,
    color: '#d1d5db',
    marginHorizontal: 4,
  },
  cardDistance: {
    fontSize: 10,
    color: '#6b7280',
  },
  cardActions: {
    alignItems: 'flex-end'
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 0,
  },
  
  // Sliding Worker Card styles
  slideWorkerCard: {
    position: 'absolute',
    bottom: 0, // base value; overridden at runtime with insets
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 1000,
  },
  slideCardHandle: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  slideCardHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  slideCardContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  slideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slideCardAvatarContainer: {
    marginRight: 12,
  },
  slideCardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  slideCardAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCardAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  slideCardInfo: {
    flex: 1,
  },
  slideCardName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  slideCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slideCardRatingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  slideCardReviews: {
    fontSize: 12,
  },
  slideCardCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCardServices: {
    marginBottom: 20,
  },
  slideCardServicesLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slideCardServicesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  slideCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  slideCardPrice: {
    flex: 1,
  },
  slideCardPriceLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  slideCardPriceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#059669',
  },
  slideCardBookButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 46,
    borderRadius: 12,
    marginLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCardBookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Modern card enhancements
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  availabilitySection: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availabilityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Card backdrop
  cardBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999,
  },

  // Service Selection Modal Styles
  serviceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  serviceModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  serviceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  serviceModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 14,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    fontSize: 15,
    fontWeight: '400',
  },
});
