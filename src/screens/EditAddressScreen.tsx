import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MapPin, Home, Briefcase, Navigation, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../contexts/ModalContext';
import { getAddressById, updateAddress, geocodeFreeTextAddress } from '../services/addresses';
import type { Address } from '../types/address';

interface AddressForm {
  type: 'home' | 'work' | 'other';
  label: string; // used only when type==='other'
  address: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

const getAddressTypes = (t: (key: string) => string) => [
  { label: t('address_home'), value: 'home', icon: Home },
  { label: t('address_work'), value: 'work', icon: Briefcase },
  { label: t('address_other'), value: 'other', icon: MapPin },
] as const;

export default function EditAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { show } = useModal();

  const addressId: string = route?.params?.id;

  const [form, setForm] = useState<AddressForm>({
    type: 'home',
    label: '',
    address: '',
    city: '',
    postalCode: '',
    isDefault: false,
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const onChange = (key: keyof AddressForm, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const row = await getAddressById(addressId);
        if (row && mounted) {
          const isHome = row.title?.toLowerCase() === 'home';
          const isWork = row.title?.toLowerCase() === 'work';
          const type: AddressForm['type'] = isHome ? 'home' : isWork ? 'work' : 'other';
          const label = type === 'other' ? (row.title || '') : '';

          setForm({
            type,
            label,
            address: row.address_line_1 || '',
            city: row.city || '',
            postalCode: row.postal_code || '',
            isDefault: !!row.is_default,
            latitude: row.latitude ?? null,
            longitude: row.longitude ?? null,
          });
        }
      } catch (e: any) {
        show({ type: 'warning', title: t('error') || 'Error', message: e?.message || 'Failed to load address' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (addressId) load();
    return () => { mounted = false; };
  }, [addressId]);

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        show({
          type: 'warning',
          title: t('permission_required') || 'Permission Required',
          message: t('location_permission_message') || 'Location permission is required to use current location',
        });
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const reverse = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (reverse.length > 0) {
        const addr = reverse[0];
        const streetAddress = `${addr.streetNumber || ''} ${addr.street || ''}`.trim();
        setForm(prev => ({
          ...prev,
          address: streetAddress || `${addr.name || ''} ${addr.district || ''}`.trim(),
          city: addr.city || addr.subregion || 'Marrakech',
          postalCode: addr.postalCode || '',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        show({ type: 'success', title: t('location_found') || 'Location Found', message: t('location_auto_filled') || 'Auto-filled from your current location' });
      }
    } catch (e) {
      show({ type: 'warning', title: t('location_error') || 'Location Error', message: t('failed_to_get_location') || 'Failed to get location' });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    // Require label only for "other"
    if (form.type === 'other' && !form.label.trim()) {
      show({ type: 'warning', title: t('validation_error') || 'Validation Error', message: t('address_label_required') || 'Address label is required' });
      return;
    }
    if (!form.address.trim()) {
      show({ type: 'warning', title: t('validation_error') || 'Validation Error', message: t('address_required') || 'Address is required' });
      return;
    }

    setSaving(true);
    try {
      // Ensure coordinates
      let lat = form.latitude ?? null;
      let lng = form.longitude ?? null;
      if ((lat == null || lng == null) && form.address) {
        const geo = await geocodeFreeTextAddress(form.address, form.city);
        if (geo) { lat = geo.latitude; lng = geo.longitude; }
      }
      if (lat == null || lng == null) {
        show({ type: 'warning', title: t('location_required') || 'Location Required', message: t('please_select_address_or_use_map') || 'Please refine the address or use current location.' });
        setSaving(false);
        return;
      }

      // Determine title value as per spec
      const titleValue = form.type !== 'other' ? form.type : (form.label?.trim() || 'Other');

      await updateAddress(addressId, {
        title: titleValue,
        address_line_1: form.address,
        city: form.city || null,
        postal_code: form.postalCode || null,
        latitude: lat,
        longitude: lng,
        is_default: form.isDefault,
      });

      show({ type: 'success', title: t('address_saved') || 'Address Saved', message: t('address_saved_message') || 'Your address has been updated successfully' });
      setTimeout(() => navigation.goBack(), 1200);
    } catch (error: any) {
      const msg = error?.message || '';
      show({ type: 'warning', title: t('error') || 'Error', message: (t('failed_to_save_address') || 'Failed to save address.') + (msg ? `\n\nDetails: ${msg}` : '') });
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const addressTypes = getAddressTypes(t);
    const typeData = addressTypes.find(ti => ti.value === type);
    return typeData?.icon || MapPin;
  };

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textSecondary }}>{t('loading') || 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header title={t('edit_address')} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Type selection */}
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
                  <IconComponent size={20} color={isSelected ? theme.accent : theme.textSecondary} />
                  <Text style={[styles.typeText, { color: isSelected ? theme.accent : theme.textSecondary }]}>{type.label}</Text>
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

          {form.type === 'other' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('address_label')}</Text>
              <Input
                value={form.label}
                onChangeText={(v) => onChange('label', v)}
                placeholder={t('address_label_placeholder')}
                style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
              />
            </View>
          )}

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

        {/* Default toggle */}
        <Card style={styles.sectionCard}>
          <Pressable style={styles.defaultOption} onPress={() => onChange('isDefault', !form.isDefault)}>
            <View style={styles.defaultOptionLeft}>
              <View style={[styles.checkbox, { borderColor: theme.cardBorder }, form.isDefault && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                {form.isDefault && <Check size={14} color="#fff" />}
              </View>
              <View>
                <Text style={[styles.defaultTitle, { color: theme.textPrimary }]}>{t('set_as_default_address')}</Text>
                <Text style={[styles.defaultSubtitle, { color: theme.textSecondary }]}>{t('default_address_description')}</Text>
              </View>
            </View>
          </Pressable>
        </Card>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveButtonContainer, { backgroundColor: theme.bg }]}>
        <Button variant="ghost" onPress={handleSave} disabled={saving} style={[styles.saveButtonMain, { backgroundColor: theme.accent }]}>
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
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingTop: 20, paddingBottom: 32, gap: 20 },

  sectionCard: { padding: 20, marginBottom: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },

  typeSelector: { flexDirection: 'row', gap: 12 },
  typeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: 12, gap: 8 },
  typeText: { fontSize: 14, fontWeight: '500' },

  fieldGroup: { marginBottom: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  fieldInput: { fontSize: 16, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 48 },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },

  locationButton: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 16, minHeight: 56 },
  locationButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  locationButtonText: { fontSize: 16, fontWeight: '500' },

  defaultOption: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  defaultOptionLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  defaultTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  defaultSubtitle: { fontSize: 14, lineHeight: 20 },

  saveButtonContainer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  saveButtonMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 12 },
  saveButtonText: { fontSize: 16, fontWeight: '600' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
