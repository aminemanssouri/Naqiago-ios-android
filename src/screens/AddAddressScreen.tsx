import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ArrowLeft, MapPin, Home, Briefcase, Navigation, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { createAddress, geocodeFreeTextAddress } from '../services/addresses';

interface AddressForm {
  label: string;
  address: string;
  city: string;
  postalCode: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

const getAddressTypes = (t: (key: string) => string) => [
  { label: t('address_home'), value: 'home', icon: Home },
  { label: t('address_work'), value: 'work', icon: Briefcase },
  { label: t('address_other'), value: 'other', icon: MapPin },
] as const;

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { show } = useModal();
  
  const [form, setForm] = useState<AddressForm>({
    label: '',
    address: '',
    city: '',
    postalCode: '',
    type: 'home',
    isDefault: false,
    latitude: null,
    longitude: null,
  });
  
  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const onChange = (key: keyof AddressForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Validation
    // Only require a custom label when type is 'other'
    if (form.type === 'other' && !form.label.trim()) {
      show({
        type: 'warning',
        title: t('validation_error') || 'Validation Error',
        message: t('address_label_required') || 'Address label is required',
      });
      return;
    }

    if (!form.address.trim()) {
      show({
        type: 'warning',
        title: t('validation_error') || 'Validation Error',
        message: t('address_required') || 'Address is required',
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure we have coordinates: try geocoding if missing
      let lat = form.latitude ?? null;
      let lng = form.longitude ?? null;
      if ((lat == null || lng == null) && form.address) {
        const geo = await geocodeFreeTextAddress(form.address, form.city);
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      }

      if (lat == null || lng == null) {
        show({
          type: 'warning',
          title: t('location_required') || 'Location Required',
          message:
            t('please_select_address_or_use_map') ||
            'Please choose an address suggestion, use current location, or provide a more specific address so we can locate it.',
        });
        setSaving(false);
        return;
      }

      // Determine title: if 'home'/'work' use that; if 'other' use custom label (fallback to 'Other')
      const titleValue = form.type !== 'other' ? form.type : (form.label?.trim() || 'Other');

      // Save to Supabase addresses table
      await createAddress({
        title: titleValue,
        address_line_1: form.address,
        city: form.city || null,
        postal_code: form.postalCode || null,
        latitude: lat,
        longitude: lng,
        is_default: form.isDefault,
      });
      
      show({
        type: 'success',
        title: t('address_saved') || 'Address Saved',
        message: t('address_saved_message') || 'Your address has been saved successfully',
      });
      
      // Navigate back after a short delay
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error: any) {
      const msg = (error?.message as string) || (typeof error === 'string' ? error : '') || '';
      show({
        type: 'warning',
        title: t('error') || 'Error',
        message:
          (t('failed_to_save_address') || 'Failed to save address. Please try again.') +
          (msg ? `\n\nDetails: ${msg}` : ''),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        show({
          type: 'warning',
          title: t('permission_required') || 'Permission Required',
          message: t('location_permission_message') || 'Location permission is required to use current location',
        });
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const streetAddress = `${address.streetNumber || ''} ${address.street || ''}`.trim();
        
        // Auto-fill form fields
        setForm(prev => ({
          ...prev,
          address: streetAddress || `${address.name || ''} ${address.district || ''}`.trim(),
          city: address.city || address.subregion || 'Marrakech',
          postalCode: address.postalCode || '',
          label: prev.label || 'Current Location',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));

        show({
          type: 'success',
          title: t('location_found') || 'Location Found',
          message: t('location_auto_filled') || 'Address fields have been auto-filled with your current location',
        });
      } else {
        show({
          type: 'warning',
          title: t('location_error') || 'Location Error',
          message: t('unable_to_get_address') || 'Unable to get address from current location',
        });
      }
    } catch (error) {
      show({
        type: 'warning',
        title: t('location_error') || 'Location Error',
        message: t('failed_to_get_location') || 'Failed to get current location. Please try again.',
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const addressTypes = getAddressTypes(t);
    const typeData = addressTypes.find(t => t.value === type);
    return typeData?.icon || MapPin;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('add_address')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Address Type Selection */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('address_type')}</Text>
          </View>
          
          <View style={styles.typeSelector}>
            {getAddressTypes(t).map((type) => {
              const IconComponent = type.icon;
              const isSelected = form.type === type.value;
              return (
                <Pressable
                  key={type.value}
                  style={[
                    styles.typeOption,
                    { borderColor: theme.cardBorder, backgroundColor: theme.bg },
                    isSelected && { borderColor: theme.accent, backgroundColor: theme.surface }
                  ]}
                  onPress={() => onChange('type', type.value)}
                >
                  <IconComponent 
                    size={20} 
                    color={isSelected ? theme.accent : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.typeText,
                    { color: isSelected ? theme.accent : theme.textSecondary }
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Address Details */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Home size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('full_address')}</Text>
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('address_label')}</Text>
            <Input
              value={form.label}
              onChangeText={(v) => onChange('label', v)}
              placeholder={t('address_label_placeholder')}
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('full_address')}</Text>
            <Input
              value={form.address}
              onChangeText={(v) => onChange('address', v)}
              placeholder={t('full_address_placeholder')}
              multiline
              numberOfLines={2}
              style={[styles.fieldInput, styles.multilineInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
          </View>

          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('city')}</Text>
              <Input
                value={form.city}
                onChangeText={(v) => onChange('city', v)}
                placeholder={t('city')}
                style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('postal_code')}</Text>
              <Input
                value={form.postalCode}
                onChangeText={(v) => onChange('postalCode', v)}
                placeholder="000000"
                keyboardType="numeric"
                style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
              />
            </View>
          </View>
        </Card>

        {/* Location Services */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Navigation size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('location_services')}</Text>
          </View>
          
          <Button 
            variant="outline" 
            onPress={handleUseCurrentLocation}
            disabled={loadingLocation}
            style={[styles.locationButton, { borderColor: theme.cardBorder }]}
          >
            <View style={styles.locationButtonContent}>
              <Navigation size={18} color={loadingLocation ? theme.textSecondary : theme.accent} />
              <Text style={[styles.locationButtonText, { color: loadingLocation ? theme.textSecondary : theme.textPrimary }]}>
                {loadingLocation ? t('getting_location') : t('use_current_location')}
              </Text>
            </View>
          </Button>
        </Card>

        {/* Default Address Option */}
        <Card style={styles.sectionCard}>
          <Pressable 
            style={styles.defaultOption}
            onPress={() => onChange('isDefault', !form.isDefault)}
          >
            <View style={styles.defaultOptionLeft}>
              <View style={[
                styles.checkbox,
                { borderColor: theme.cardBorder },
                form.isDefault && { backgroundColor: theme.accent, borderColor: theme.accent }
              ]}>
                {form.isDefault && <Check size={14} color="white" />}
              </View>
              <View style={styles.defaultTextContainer}>
                <Text style={[styles.defaultTitle, { color: theme.textPrimary }]}>
                  {t('set_as_default_address')}
                </Text>
                <Text style={[styles.defaultSubtitle, { color: theme.textSecondary }]}>
                  {t('default_address_description')}
                </Text>
              </View>
            </View>
          </Pressable>
        </Card>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveButtonContainer, { backgroundColor: theme.bg, paddingBottom: Math.max(insets.bottom + 20, 44) }]}>
        <Button
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButtonMain, { backgroundColor: theme.accent }]}
        >
          {saving ? (
            <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>{t('save')}...</Text>
          ) : (
            <>
              <Check size={16} color="#ffffff" />
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>{t('save')}</Text>
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  saveButton: { width: 40, height: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { 
    paddingTop: 20, 
    paddingBottom: 100, 
    gap: 20,
  },
  
  // Section Cards
  sectionCard: { padding: 20, marginBottom: 0 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  // Type Selector
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    gap: 8,
  },
  typeText: { fontSize: 14, fontWeight: '500' },
  
  // Form Fields
  fieldGroup: { marginBottom: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  fieldInput: { 
    fontSize: 16, 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    minHeight: 48,
  },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  
  // Location Button
  locationButton: { 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16,
    minHeight: 48,
  },
  locationButtonContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8,
    flexWrap: 'wrap',
  },
  locationButtonText: { 
    fontSize: 14, 
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  
  // Default Option
  defaultOption: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12, 
    paddingVertical: 8,
    minHeight: 60,
  },
  defaultOptionLeft: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12, 
    flex: 1,
  },
  defaultTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  defaultTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  defaultSubtitle: { 
    fontSize: 13, 
    lineHeight: 18,
    flexWrap: 'wrap',
    flex: 1,
  },
  
  // Save Button
  saveButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  saveButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
