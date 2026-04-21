import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { ArrowLeft, Mail, User, Phone, Calendar as CalIcon, Globe, CreditCard, Camera, Edit3, Check, RefreshCw } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import AnimatedModal from '../components/ui/AnimatedModal';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const PAYMENT_VALUES = ['cash','card','mobile_money','wallet'] as const;
const GENDER_VALUES = ['male','female','other'] as const;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
    date_of_birth: '',
    gender: '',
    timezone: '',
    preferred_payment_method: '',
    language_preference: language,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'info' | 'warning'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Function to load fresh user data from database
  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        // Handle avatar URL - only use Supabase Storage URLs
        let avatarUrl = profile.avatar_url || '';
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          // If it's just a filename, construct the full public URL from Supabase
          const { data } = supabase.storage.from('profile-images').getPublicUrl(avatarUrl);
          avatarUrl = data.publicUrl;
        }
        // Only use the avatar if it's a valid Supabase URL
        if (avatarUrl && !avatarUrl.includes('supabase')) {
          avatarUrl = ''; // Clear local URIs - force cloud storage only
        }
        
        setForm({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          avatar_url: avatarUrl,
          date_of_birth: profile.date_of_birth || '',
          gender: profile.gender || '',
          timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          preferred_payment_method: profile.preferred_payment_method || '',
          language_preference: profile.language_preference || language,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [user?.id, language])
  );

  const onChange = (key: keyof typeof form, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      onChange('date_of_birth', isoDate);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleAvatarUpload = async () => {
    setImageModalVisible(true);
  };

  const openCamera = async () => {
    setImageModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange('avatar_url', result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    setImageModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange('avatar_url', result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // If avatar is a local file URI, MUST upload to Supabase Storage
      let avatarUrlToSave = form.avatar_url;
      if (avatarUrlToSave && avatarUrlToSave.startsWith('file://')) {
        const ext = avatarUrlToSave.split('.').pop() || 'jpg';
        const fileName = `${user.id}_${Date.now()}.${ext}`;
        
        // Delete old profile image if it exists
        if (user?.profile?.avatar_url && user.profile.avatar_url.includes('supabase')) {
          const oldFileName = user.profile.avatar_url.split('/').pop();
          if (oldFileName && oldFileName.includes(user.id)) {
            await supabase.storage.from('profile-images').remove([oldFileName]);
          }
        }
        
        // Convert image to ArrayBuffer for upload
        const response = await fetch(avatarUrlToSave);
        const arrayBuffer = await response.arrayBuffer();
        
        // Upload MUST succeed - throw error if it fails
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, arrayBuffer, {
            contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            upsert: true,
          });
          
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}. Please create the 'profile-images' bucket in Supabase Storage first.`);
        }
        
        // Get the public URL from Supabase
        const { data } = supabase.storage.from('profile-images').getPublicUrl(fileName);
        avatarUrlToSave = data.publicUrl;
        
        console.log('Image successfully uploaded to Supabase:', avatarUrlToSave);
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          avatar_url: avatarUrlToSave,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          // timezone is read-only and should not be updated by user
          preferred_payment_method: (form.preferred_payment_method || null) as any,
          language_preference: form.language_preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      setModalType('success');
      setModalTitle(t('profile_updated_title'));
      setModalMessage(t('profile_updated_message'));
      setModalVisible(true);
    } catch (e: any) {
      setModalType('warning');
      setModalTitle(t('error'));
      setModalMessage(e?.message || t('something_went_wrong'));
      setModalVisible(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }] }>
      <Header 
        title={t('edit_profile')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Loading Indicator */}
        {loading && (
          <Card style={styles.loadingCard}>
            <View style={styles.loadingContainer}>
              <RefreshCw size={24} color={theme.accent} style={styles.loadingIcon} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading profile...
              </Text>
            </View>
          </Card>
        )}

        {!loading && (
          <>
        
        {/* Profile Header Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Avatar src={form.avatar_url || undefined} size={88} fallback={(form.full_name || user?.email || 'U').slice(0, 2).toUpperCase()} />
              <Pressable style={[styles.avatarEditBtn, { backgroundColor: theme.accent }]} onPress={handleAvatarUpload}>
                <Camera size={18} color="white" />
              </Pressable>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.textPrimary }]}>{form.full_name || user?.email || t('your_profile')}</Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
              <Pressable onPress={handleAvatarUpload} style={styles.changePhotoBtn}>
                <Text style={[styles.changePhotoText, { color: theme.accent }]}>{t('tap_to_change_photo')}</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('personal_information')}</Text>
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('full_name')}</Text>
            <Input 
              value={form.full_name} 
              onChangeText={(v) => onChange('full_name', v)} 
              placeholder={t('full_name_placeholder')} 
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]} 
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('phone')}</Text>
            <Input 
              keyboardType="phone-pad" 
              value={form.phone || ''} 
              onChangeText={(v) => onChange('phone', v)} 
              placeholder={t('phone_placeholder')} 
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]} 
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('email')}</Text>
            <View style={[styles.readonlyField, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <Mail size={16} color={theme.textSecondary} />
              <Text style={[styles.readonlyText, { color: theme.textSecondary }]}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Additional Details */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('additional_details')}</Text>
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('date_of_birth')}</Text>
            <Pressable onPress={openDatePicker}>
              <View style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg, justifyContent: 'center' }]}>
                <Text style={[styles.dateText, { color: form.date_of_birth ? theme.textPrimary : theme.textSecondary }]}>
                  {form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString() : t('dob_placeholder')}
                </Text>
              </View>
            </Pressable>
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('gender')}</Text>
            <Select
              value={form.gender || ''}
              onValueChange={(v) => onChange('gender', v)}
              options={GENDER_VALUES.map(v => ({ label: v === 'male' ? t('gender_male') : v === 'female' ? t('gender_female') : t('gender_other'), value: v }))}
              placeholder={t('select_gender')}
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('preferred_payment_method')}</Text>
            <Select
              value={form.preferred_payment_method || ''}
              onValueChange={(v) => onChange('preferred_payment_method', v)}
              options={PAYMENT_VALUES.map(v => ({
                label: v === 'cash' ? t('payment_cash') : v === 'card' ? t('payment_card') : v === 'mobile_money' ? t('payment_mobile_money') : t('payment_wallet'),
                value: v,
              }))}
              placeholder={t('select_payment_method')}
              style={[styles.fieldInput, { borderColor: theme.cardBorder, backgroundColor: theme.bg }]}
            />
          </View>
          
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t('timezone')}</Text>
            <View style={[styles.readonlyField, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <Globe size={16} color={theme.textSecondary} />
              <Text style={[styles.readonlyText, { color: theme.textSecondary }]}>
                {form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
              </Text>
            </View>
          </View>
        </Card>
          </>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.saveButtonContainer, { backgroundColor: theme.bg, paddingBottom: Math.max(insets.bottom + 20, 44) }]}>
        <Button
          onPress={onSave}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: theme.accent }]}
        >
          {saving ? (
            <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>{t('save')}...</Text>
          ) : (
            <>
              <Check size={16} color="#ffffff" />
              <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>{t('save_changes')}</Text>
            </>
          )}
        </Button>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={form.date_of_birth ? new Date(form.date_of_birth) : new Date(1995, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      <AnimatedModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setModalVisible(false);
          if (modalType === 'success') {
            navigation.goBack();
          }
        }}
      />

      {/* Modern Image Selection Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={[styles.imageModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.imageModalHeader}>
              <View style={[styles.imageModalIcon, { backgroundColor: theme.accent + '20' }]}>
                <Camera size={24} color={theme.accent} />
              </View>
              <Pressable
                style={styles.imageModalCloseButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={[styles.imageModalCloseText, { color: theme.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.imageModalBody}>
              <Text style={[styles.imageModalTitle, { color: theme.textPrimary }]}>
                Select Profile Photo
              </Text>
              <Text style={[styles.imageModalMessage, { color: theme.textSecondary }]}>
                Choose how you want to select your profile photo
              </Text>
            </View>

            <View style={styles.imageModalActions}>
              <Button
                variant="outline"
                style={[styles.imageModalButton, { borderColor: theme.cardBorder }]}
                onPress={openCamera}
              >
                <Camera size={20} color={theme.accent} />
                <Text style={[styles.imageModalButtonText, { color: theme.accent }]}>Camera</Text>
              </Button>
              <Button
                style={[styles.imageModalButton, { backgroundColor: theme.accent }]}
                onPress={openGallery}
              >
                <User size={20} color="#ffffff" />
                <Text style={[styles.imageModalButtonText, { color: '#ffffff' }]}>Gallery</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  saveHeaderBtn: { width: 40, height: 40 },
  content: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 32, gap: 20 },
  
  // Profile Header
  profileHeaderCard: { padding: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatarEditBtn: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  profileEmail: { fontSize: 14, marginBottom: 8 },
  changePhotoBtn: { alignSelf: 'flex-start' },
  changePhotoText: { fontSize: 14, fontWeight: '500' },
  
  // Section Cards
  sectionCard: { padding: 20 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  // Form Fields
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { 
    fontSize: 16, 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    minHeight: 48,
  },
  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    gap: 12,
  },
  readonlyText: { fontSize: 16, flex: 1 },
  dateText: { fontSize: 16 },
  
  // Save Button
  saveButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  saveButton: {
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
  
  // Loading styles
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Image Modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageModalContent: {
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
  imageModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalCloseText: {
    fontSize: 18,
    fontWeight: '500',
  },
  imageModalBody: {
    marginBottom: 24,
  },
  imageModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageModalMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  imageModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageModalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
