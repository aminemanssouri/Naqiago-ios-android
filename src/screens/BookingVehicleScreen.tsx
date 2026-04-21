import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, TextInput, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { ChevronDown, Search, Check, ChevronLeft, Car, Bike } from 'lucide-react-native'; // Added generic icons if images fail
import { BookingFooter } from '../components/ui/BookingFooter';
import { Header } from '../components/ui/Header';
import { ComboBox, ComboBoxOption } from '../components/ui/ComboBox';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useBooking } from '../contexts/BookingContext';
import { NaqiagoVehicleAPI, CarBrand, CarModel } from '../services/NaqiagoVehicleAPI';
import type { RootStackParamList } from '../types/navigation';
import { useModal } from '../contexts/ModalContext';
import { BrandLogos, hasLocalBrandLogo } from '../components/icons/BrandLogos';

export default function BookingVehicleScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { t } = useLanguage();
  const { updateBookingData, setCurrentStep } = useBooking();
  const { show } = useModal();

  // --- State ---
  const [selectedVehicleType, setSelectedVehicleType] = useState<'car' | 'motor' | null>(null);
  const [selectedMotorType, setSelectedMotorType] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedBrandType, setSelectedBrandType] = useState<string | null>(null);

  // Steps: vehicle -> brand -> model -> year (or vehicle -> type for motor)
  const [uiStep, setUiStep] = useState<'vehicle' | 'brand' | 'model' | 'type' | 'year'>('vehicle');

  const [brandSearch, setBrandSearch] = useState('');
  const [clickedBrandId, setClickedBrandId] = useState<number | null>(null);
  const [modelModalVisible, setModelModalVisible] = useState(false);

  // API Data
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);

  // --- Constants ---
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;

  const vehicleTypes = [
    { id: "car", name: t('car_label'), image: require('../../assets/images/A4 BERLINE.webp') },
    { id: "motor", name: t('motor_label'), image: require('../../assets/images/bike.webp') },
  ] as const;

  const motorTypes = [
    { id: "motor_49cc", name: "49cc " + t('motor_label'), image: require('../../assets/images/bike.webp') },
    { id: "motor_plus49cc", name: "+49cc " + t('motor_label'), image: require('../../assets/images/bike.webp') },
  ];

  // --- Effects ---
  useEffect(() => { loadBrands(); }, []);

  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setModels([]);
      setSelectedModel(null);
    }
  }, [selectedBrand]);

  // Automatically open modal if we are in model step and have a brand but no model
  useEffect(() => {
    if (selectedVehicleType === 'car' && uiStep === 'model' && selectedBrand && !selectedModel) {
      setModelModalVisible(true);
    }
  }, [uiStep, selectedVehicleType, selectedBrand]);

  // --- Logic ---
  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const brandsData = await NaqiagoVehicleAPI.getAllBrands();
      setBrands(brandsData);
    } catch (error) {
      setBrands(NaqiagoVehicleAPI.getPopularBrands());
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandId: number) => {
    try {
      setLoadingModels(true);
      const modelsData = await NaqiagoVehicleAPI.getModelsForBrand(brandId);
      setModels(modelsData);
    } catch (error) {
      setModels(NaqiagoVehicleAPI.getPopularModels());
    } finally {
      setLoadingModels(false);
    }
  };

  const applyVehicleTypeSelection = (typeId: 'car' | 'motor') => {
    setSelectedVehicleType(typeId);
    if (typeId === 'motor') {
      setSelectedBrand(null);
      setSelectedModel(null);
      setSelectedYear(null);
      setUiStep('type');
    } else {
      setSelectedMotorType(null);
      setUiStep('brand');
    }
  };

  const handleBrandSelect = (brandId: number) => {
    setClickedBrandId(brandId);
    setSelectedBrand(brandId);
    setSelectedModel(null);
    setSelectedYear(null);

    // Quick visual feedback before switching screens
    setTimeout(() => {
      setClickedBrandId(null);
      setUiStep('model');
    }, 150);
  };

  // Map internal motor IDs to desired human-readable labels
  const motorIdToLabel = (id: string | null): string => {
    switch (id) {
      case 'motor_plus49cc':
        return 'motor plus 49 CC';
      case 'motor_49cc':
        return 'motor 49 CC';
      default:
        return 'motor';
    }
  };



  // Map vehicle selections to the vehicle type using the API's type field directly
  const mapToDbVehicleType = (vehicleType: 'car' | 'motor', motorType?: string | null, modelData?: CarModel | null): string => {
    if (vehicleType === 'motor') {
      return 'Motorcycles';
    }

    // Use the type field directly from the API response
    if (modelData?.type) {
      // Capitalize each word to match DB convention (e.g. "berline" -> "Berline", "moyen suv" -> "Moyen SUV")
      const apiType = modelData.type.trim();
      return apiType
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        // Special case: SUV should stay uppercase
        .replace(/\bSuv\b/g, 'SUV');
    }

    // Fallback if no type from API (shouldn't happen with proper API data)
    console.warn('⚠️ No type from API for model:', modelData?.name, '- defaulting to Berline');
    return 'Berline';
  };

  const handleContinue = () => {
    // Validation Logic
    if (!selectedVehicleType) return showWarning(t('please_select_vehicle_type'));
    if (selectedVehicleType === 'motor' && !selectedMotorType) return showWarning(t('motor_type_label'));
    if (selectedVehicleType === 'car') {
      if (!selectedBrand) return showWarning(t('car_brand_label'));
      if (!selectedModel) return showWarning(t('car_model_label'));
      if (!selectedYear) return showWarning(t('year_label'));
    }

    // Data Mapping
    const selectedModelData = models.find(m => m.id === selectedModel);
    const selectedBrandData = brands.find(b => b.id === selectedBrand);

    // Store a human-readable vehicle type for motor variants
    const finalVehicleType = selectedVehicleType === 'motor'
      ? motorIdToLabel(selectedMotorType)
      : 'car';

    // Map to database vehicle type using API model data
    const dbVehicleType = mapToDbVehicleType(
      selectedVehicleType,
      selectedMotorType,
      selectedModelData
    );

    // Debug logging
    if (selectedVehicleType === 'car' && selectedModelData) {
      console.log('🚗 Vehicle Type Detection:', {
        brand: selectedBrandData?.name,
        model: selectedModelData.name,
        apiType: selectedModelData.type || 'NOT PROVIDED',
        detectedType: dbVehicleType,
        detectionMethod: selectedModelData.type ? 'API' : 'Name-based'
      });
    }

    updateBookingData({
      carType: finalVehicleType,
      vehicleType: dbVehicleType,
      carBrand: selectedVehicleType === 'car' ? (selectedBrandData?.name || '') : '',
      carModel: selectedVehicleType === 'car' ? (selectedModelData?.name || '') : '',
      carYear: selectedVehicleType === 'car' ? (selectedYear?.toString() || '') : '',
    });

    setCurrentStep(3);
    navigation.navigate('BookingServices' as any);
  };

  const showWarning = (msg: string) => {
    show({ type: 'warning', title: t('missing_fields_alert'), message: msg });
  };

  // --- Derived Data ---
  const filteredBrands = NaqiagoVehicleAPI.searchBrands(brands, brandSearch);
  const selectedBrandData = brands.find(brand => brand.id === selectedBrand);
  const selectedModelData = models.find(model => model.id === selectedModel);
  const yearOptions = NaqiagoVehicleAPI.getYearOptions().map(y => ({ id: y, label: y.toString(), value: y }));

  // --- Render Helpers ---
  const renderSelectionCard = (
    title: string,
    isSelected: boolean,
    onPress: () => void,
    imageSource: any,
    compact = false
  ) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectionCard,
        {
          backgroundColor: isSelected ? '#F3E5F5' : colors.card, // Light purple bg if selected
          borderColor: isSelected ? colors.accent : colors.cardBorder,
          width: compact ? '48%' : '100%',
        }
      ]}
    >
      <View style={styles.selectionCardContent}>
        {/* Image Container */}
        <View style={[styles.selectionImageContainer, { backgroundColor: colors.surface }]}>
          <Image source={imageSource} style={styles.selectionImage} resizeMode="contain" />
        </View>

        {/* Text Info */}
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.selectionTitle,
            { color: isSelected ? colors.accent : colors.textPrimary }
          ]}>
            {title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {isSelected ? "✓ Selected" : t('tap_to_select')}
          </Text>
        </View>

        {/* Check Icon */}
        <View style={[
          styles.radioButton,
          isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }
        ]}>
          {isSelected && <Check size={12} color="#fff" />}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <Header
        title={t('vehicle_details_title')}
        onBack={() => navigation.goBack()}
        subtitle={t('step_3_of_5')}
      />

      <View style={styles.content}>
        {/* Progress Bar - Simplified */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: '60%', backgroundColor: colors.accent }]} />
        </View>

        {/* Step 1: Vehicle Type (Improved Grid Layout) */}

        {/* Step 1: Vehicle Type (Vertical, No Radio Button) */}
        {/* Step 1: Vehicle Type (Two Big Squares Side-by-Side) */}
        {uiStep === 'vehicle' && (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('vehicle_type_label')} *
            </Text>

            <View style={styles.gridContainer}>
              {vehicleTypes.map((type) => {
                const isSelected = selectedVehicleType === type.id;

                return (
                  <Pressable
                    key={type.id}
                    onPress={() => applyVehicleTypeSelection(type.id as 'car' | 'motor')}
                    style={[
                      styles.squareCard,
                      {
                        backgroundColor: isSelected ? (colors.isDark ? 'rgba(123,45,142,0.2)' : '#FAF5FB') : colors.card,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                      isSelected && styles.squareCardSelected
                    ]}
                  >
                    {/* Top: Image */}
                    <View style={[styles.squareIconContainer, { backgroundColor: colors.surface }]}>
                      <Image
                        source={type.image}
                        style={styles.squareImage}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Bottom: Text */}
                    <Text style={[
                      styles.squareTitle,
                      { color: isSelected ? colors.accent : colors.textPrimary }
                    ]}>
                      {type.name}
                    </Text>

                    {/* Optional: "Selected" text if you want it */}
                    {isSelected && (
                      <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '500', marginTop: 4 }}>
                        ✓ Selected
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        {/* Step 2: Motor Type */}
        {selectedVehicleType === 'motor' && uiStep === 'type' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('motor_type_label')} *</Text>
              <Pressable onPress={() => setUiStep('vehicle')}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('change')}</Text>
              </Pressable>
            </View>

            <View style={styles.gridContainer}>
              {motorTypes.map((type) => {
                const isSelected = selectedMotorType === type.id;
                return (
                  <Pressable
                    key={type.id}
                    onPress={() => setSelectedMotorType(type.id)}
                    style={[
                      styles.squareCard,
                      {
                        backgroundColor: isSelected ? (colors.isDark ? 'rgba(123,45,142,0.2)' : '#FAF5FB') : colors.card,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                      isSelected && styles.squareCardSelected
                    ]}
                  >
                    <View style={[styles.squareIconContainer, { backgroundColor: colors.surface }]}>
                      <Image
                        source={type.image}
                        style={styles.squareImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={[
                      styles.squareTitle,
                      { color: isSelected ? colors.accent : colors.textPrimary }
                    ]}>
                      {type.name}
                    </Text>
                    {isSelected && (
                      <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '500', marginTop: 4 }}>
                        ✓ Selected
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 2: Car Brand */}
        {selectedVehicleType === 'car' && uiStep === 'brand' && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('car_brand_label')} *</Text>
              <Pressable onPress={() => setUiStep('vehicle')}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('back')}</Text>
              </Pressable>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                placeholder={t('search_brands')}
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={brandSearch}
                onChangeText={setBrandSearch}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 100 }}
            >
              {filteredBrands.map(brand => {
                const isSelected = selectedBrand === brand.id;
                return (
                  <Pressable
                    key={brand.id}
                    onPress={() => handleBrandSelect(brand.id)}
                    style={[
                      styles.brandItem,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.card,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      }
                    ]}
                  >
                    <View style={[
                      styles.brandLogoCircle, 
                      { 
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.95)' : '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    ]}>
                      {brand.logo ? (
                        <Image source={{ uri: brand.logo }} style={{ width: 60, height: 60 }} resizeMode="contain" />
                      ) : (
                        <Text style={{ fontWeight: 'bold', fontSize: 24, color: colors.textPrimary }}>{brand.name[0]}</Text>
                      )}
                    </View>
                    <Text style={[
                      styles.brandName,
                      isSelected ? { color: '#FFF' } : { color: colors.textPrimary }
                    ]}>
                      {brand.name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Step 3: Model & Year (Combined Card) */}
        {selectedVehicleType === 'car' && (uiStep === 'model' || uiStep === 'year') && selectedBrandData && (
          <View style={styles.stepContainer}>
            {/* Brand Summary */}
            <View style={styles.brandSummaryRow}>
              <View style={styles.brandSummaryInfo}>
                <Image source={{ uri: selectedBrandData.logo }} style={{ width: 24, height: 24, marginRight: 8 }} resizeMode="contain" />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{selectedBrandData.name}</Text>
              </View>
              <Pressable onPress={() => setUiStep('brand')}>
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit</Text>
              </Pressable>
            </View>

            {/* Model Input - Looks like a Dropdown now */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('car_model_label')} *</Text>
            <Pressable
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
              onPress={() => setModelModalVisible(true)}
            >
              <Text style={{
                fontSize: 16,
                color: selectedModel ? colors.textPrimary : colors.textSecondary,
                fontWeight: selectedModel ? '600' : '400'
              }}>
                {selectedModelData ? selectedModelData.name : t('select_model')}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Year Input - Only shows if model is selected */}
            {selectedModel && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('year_label')} *</Text>
                <ComboBox
                  options={yearOptions}
                  value={selectedYear}
                  onSelect={(opt) => setSelectedYear(opt.value as number)}
                  placeholder={t('select_year')}
                  searchable
                />
              </View>
            )}
          </View>
        )}
      </View>

      <BookingFooter 
        onBack={() => navigation.goBack()} 
        onContinue={handleContinue}
        continueText="Continue to Services"
      />

      {/* --- Model Modal --- */}
      <Modal visible={modelModalVisible} transparent animationType="fade" onRequestClose={() => setModelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('select_model')}</Text>
              <Pressable onPress={() => setModelModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
              </Pressable>
            </View>

            {loadingModels ? (
              <ActivityIndicator color={colors.accent} style={{ margin: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {models.map(m => (
                  <Pressable
                    key={m.id}
                    style={[
                      styles.modalItem,
                      selectedModel === m.id && { backgroundColor: colors.accent + '10' } // 10% opacity hex
                    ]}
                    onPress={() => {
                      setSelectedModel(m.id);
                      setModelModalVisible(false);
                      setUiStep('year');
                    }}
                  >
                    <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: selectedModel === m.id ? '700' : '400' }}>
                      {m.name}
                    </Text>
                    {selectedModel === m.id && <Check size={18} color={colors.accent} />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },

  // Progress Bar
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 24,
    width: '100%',
  },
  progressBarFill: { height: '100%', borderRadius: 2 },

  // Section Headers
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  stepContainer: { marginBottom: 24 },

  // Grid Layout for Types
  // Vertical Stack Container
  verticalStack: {
    gap: 16,
  },

  // The Big Card itself
  bigOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5, // Standard border
    borderColor: '#E0E0E0',
    padding: 20,
    minHeight: 100,

    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Stronger visual cue for selection since radio is gone
  bigOptionCardSelected: {
    borderColor: '#800080', // colors.accent
    backgroundColor: '#FAF5FB', // Light purple background
    borderWidth: 2.5, // Thicker border to make it obvious
  },

  // The Icon/Image Box
  bigCardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20, // Increased spacing slightly
  },

  bigCardImage: {
    width: 50,
    height: 50,
  },

  // Text Area
  bigCardTextContainer: {
    flex: 1,
    justifyContent: 'center',
    // You can align items: 'center' here if you want text centered in the card
  },

  bigCardTitle: {
    fontSize: 22, // Slightly bigger
    fontWeight: '700',
  },


  gridRow: { flexDirection: 'row', gap: 12 },

  // Container for the two squares
  gridContainer: {
    flexDirection: 'column', // Stack vertically
    gap: 16,
    marginTop: 10,
  },

  // The Big Square Card (Now Wide Card)
  squareCard: {
    width: '100%',
    // aspectRatio: 1, // Removed for list view
    minHeight: 100,
    borderRadius: 24,
    borderWidth: 1.5,

    // Column layout for centered look
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,

    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Active State
  squareCardSelected: {
    borderWidth: 2.5,
  },

  // Icon Circle - Removed circular styling, just a layout container now
  squareIconContainer: {
    width: 160,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderRadius: 16,
  },

  squareImage: {
    width: 140,
    height: 100,
  },

  // Text
  squareTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Selection Card (Detailed)
  selectionCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  selectionCardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectionImageContainer: {
    width: 48, height: 48, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center'
  },
  selectionImage: { width: 40, height: 40 },
  selectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  radioButton: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#CCC', alignItems: 'center', justifyContent: 'center'
  },

  // Brand Styling
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48,
    marginBottom: 16
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  brandItem: {
    width: '48%', // 2 in a row
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 12,
    marginBottom: 0
  },
  brandLogoCircle: {
    width: 90, // Big circle
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  brandName: { fontSize: 16, fontWeight: '700', textAlign: 'center' },

  // Forms & Inputs
  brandSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brandSummaryInfo: { flexDirection: 'row', alignItems: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  selectInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, height: 52
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
  },
});