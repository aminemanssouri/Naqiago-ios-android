import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Search, Car, Bike, Sparkles, User, Settings, X, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Casablanca, Maroc');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fullText = 'Naqiago';
  const typingSpeed = 150; // milliseconds per character

  const locations = [
    { id: 1, name: 'Casablanca, Maroc', displayName: 'Casablanca' },
    { id: 2, name: 'Rabat, Maroc', displayName: 'Rabat' },
    { id: 3, name: 'Tanger, Maroc', displayName: 'Tanger' },
  ];

  // Load saved location from AsyncStorage when component mounts
  useEffect(() => {
    loadSavedLocation();
  }, []);

  // Typing animation effect
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, []);

  // Load saved location from storage
  const loadSavedLocation = async () => {
    try {
      setIsLoading(true);
      const savedLocation = await AsyncStorage.getItem('selectedCity');
      if (savedLocation !== null) {
        setSelectedLocation(savedLocation);
        console.log('Loaded location from storage:', savedLocation);
      }
    } catch (error) {
      console.error('Error loading location from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save location to AsyncStorage
  const saveLocation = async (location: string) => {
    try {
      await AsyncStorage.setItem('selectedCity', location);
      console.log('Location saved to storage:', location);
      return true;
    } catch (error) {
      console.error('Error saving location to storage:', error);
      return false;
    }
  };

  const handleCenterPress = () => {
    (navigation as any).navigate('BookingDateTime');
  };
  const handleSettingsPress = () => (navigation as any).navigate('Settings');
  const handleProfilePress = () => (navigation as any).navigate('Profile');

  const handleLocationPress = () => {
    setModalVisible(true);
  };

  const handleLocationSelect = async (location: string) => {
    // Save to AsyncStorage first
    const saved = await saveLocation(location);
    
    if (saved) {
      // Update state only if save was successful
      setSelectedLocation(location);
      setModalVisible(false);
      
      // You can add additional logic here when location changes
      // For example: fetch services based on selected location
      console.log('Selected and saved location:', location);
      
      // Optional: Show a success message or trigger other actions
      // You could also refresh the services list based on the new city
    } else {
      console.error('Failed to save location');
      // Optionally show an error message to the user
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    hero: {
      paddingTop: insets.top + 20,
      paddingHorizontal: 24,
      paddingBottom: 150,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      maxWidth: '75%',
    },
    locationText: {
      color: '#ffffff',
      fontSize: 13,
      fontFamily: theme.fontPrimary,
      fontWeight: '600',
      flexShrink: 1,
    },
    heroActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    heroIconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: {
      fontSize: 32,
      fontFamily: theme.fontHeading,
      color: '#ffffff',
      letterSpacing: -0.4,
      lineHeight: 44,
      paddingBottom: 8,
      includeFontPadding: false,
    },
    heroSubtitle: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 21,
      color: 'rgba(255,255,255,0.85)',
      fontFamily: theme.fontPrimary,
    },
    searchWrap: {
      marginTop: -28,
      paddingHorizontal: 24,
      zIndex: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1.5,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      fontFamily: theme.fontPrimary,
    },
    section: {
      paddingHorizontal: 24,
      paddingTop: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: theme.fontHeading,
      color: theme.textPrimary,
    },
    viewAll: {
      fontSize: 14,
      fontFamily: theme.fontPrimary,
      fontWeight: '700',
      color: theme.primary,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      marginBottom: 16,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
      elevation: 4,
    },
    categoryName: {
      fontSize: 15,
      fontFamily: theme.fontPrimary,
      fontWeight: '700',
      color: theme.textPrimary,
      flex: 1,
    },
    serviceCard: {
      borderRadius: 20,
      padding: 18,
      borderWidth: 1.5,
      marginBottom: 14,
      overflow: 'hidden',
    },
    serviceBadge: {
      position: 'absolute',
      top: 14,
      right: 14,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: theme.secondary,
    },
    serviceBadgeText: {
      fontSize: 11,
      fontFamily: theme.fontPrimary,
      fontWeight: '800',
      color: theme.textPrimary,
    },
    serviceName: {
      fontSize: 18,
      fontFamily: theme.fontHeading,
      color: theme.textPrimary,
    },
    serviceDesc: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSecondary,
      fontFamily: theme.fontPrimary,
    },
    serviceFooter: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    price: {
      fontSize: 24,
      fontFamily: theme.fontPrimary,
      fontWeight: '800',
      color: theme.accent,
    },
    priceUnit: {
      fontSize: 14,
      fontFamily: theme.fontPrimary,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    bookPill: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    bookPillText: {
      color: '#ffffff',
      fontFamily: theme.fontPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
    searchPlaceholder: {
      fontSize: 15,
      fontWeight: '400',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '85%',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardBorder,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: theme.fontHeading,
      color: theme.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    locationOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: theme.surface,
    },
    locationOptionText: {
      fontSize: 16,
      fontFamily: theme.fontPrimary,
      color: theme.textPrimary,
    },
    selectedLocationText: {
      color: theme.primary,
      fontWeight: '600',
    },
    checkIcon: {
      width: 20,
      height: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bg,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.textSecondary,
      fontFamily: theme.fontPrimary,
    },
  });

  // Show loading indicator while loading saved location
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 110 }}
      >
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <Pressable onPress={handleLocationPress} style={styles.locationBadge}>
              <MapPin size={14} color={'#ffffff'} />
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {selectedLocation}
              </Text>
            </Pressable>

            <View style={styles.heroActions}>
              <Pressable style={styles.heroIconButton} onPress={handleSettingsPress}>
                <Settings size={18} color={'#ffffff'} />
              </Pressable>
              <Pressable style={styles.heroIconButton} onPress={handleProfilePress}>
                <User size={18} color={'#ffffff'} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {displayedText}
            <Text style={{ opacity: displayedText.length < fullText.length ? 1 : 0 }}>|</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Prêt pour un lavage éco-responsable ?
          </Text>
        </LinearGradient>

        <View style={styles.searchWrap}>
          <Pressable 
            onPress={() => (navigation as any).navigate('Search')}
            style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadow }]}
          >
            <Search size={20} color={theme.textSecondary} />
            <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>
              Rechercher un service...
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nos Services</Text>
          </View>

          <View style={styles.categoriesGrid}>
            <Pressable
              onPress={handleCenterPress}
              style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={{ width: 56, height: 56, backgroundColor: theme.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Image 
                  source={require('../../assets/images/A1 Citadine.webp')} 
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">Citadine</Text>
            </Pressable>
            <Pressable
              onPress={handleCenterPress}
              style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={{ width: 56, height: 56, backgroundColor: theme.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Image 
                  source={require('../../assets/images/A4 BERLINE.webp')} 
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">Berline</Text>
            </Pressable>
            <Pressable
              onPress={handleCenterPress}
              style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={{ width: 56, height: 56, backgroundColor: theme.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Image 
                  source={require('../../assets/images/Q5-MoyenSUV.webp')} 
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">SUV</Text>
            </Pressable>
            <Pressable
              onPress={handleCenterPress}
              style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={{ width: 56, height: 56, backgroundColor: theme.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Image 
                  source={require('../../assets/images/bike.webp')} 
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1} ellipsizeMode="tail">Moto</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Forfaits Populaires</Text>
          </View>

          <Pressable
            onPress={handleCenterPress}
            style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>Populaire</Text>
            </View>
            <Text style={styles.serviceName}>Lavage Complet</Text>
            <Text style={styles.serviceDesc}>Intérieur + Extérieur · Aspiration · Nettoyage vitres · Cirage pneus</Text>
            <View style={styles.serviceFooter}>
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bookPill}
              >
                <Text style={styles.bookPillText}>Réserver</Text>
              </LinearGradient>
            </View>
          </Pressable>

          <Pressable
            onPress={handleCenterPress}
            style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>Recommandé</Text>
            </View>
            <Text style={styles.serviceName}>Lavage Spécial</Text>
            <Text style={styles.serviceDesc}>Démoustication · Rénovation plastique · Décrassage jantes</Text>
            <View style={styles.serviceFooter}>
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bookPill}
              >
                <Text style={styles.bookPillText}>Réserver</Text>
              </LinearGradient>
            </View>
          </Pressable>

          <Pressable
            onPress={handleCenterPress}
            style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>Premium</Text>
            </View>
            <Text style={styles.serviceName}>Lavage Premium</Text>
            <Text style={styles.serviceDesc}>Traitement taches · Waxing carrosserie · Service complet</Text>
            <View style={styles.serviceFooter}>
              <LinearGradient
                colors={[theme.gradientStart, theme.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bookPill}
              >
                <Text style={styles.bookPillText}>Réserver</Text>
              </LinearGradient>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une ville</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={theme.textSecondary} />
              </Pressable>
            </View>
            
            {locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationOption}
                onPress={() => handleLocationSelect(location.name)}
              >
                <Text style={[
                  styles.locationOptionText,
                  selectedLocation === location.name && styles.selectedLocationText
                ]}>
                  {location.displayName}
                </Text>
                {selectedLocation === location.name && (
                  <Check size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}