import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedModal from '../components/ui/AnimatedModal';
import {
  User,
  Globe,
  MapPin,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors, useThemeMode } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { safeGoBack } from '../lib/navigation';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useThemeColors();
  const { mode, setMode } = useThemeMode();
  const { signOut, user } = useAuth();
  const { t, setLanguage, languageLabel } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'info' | 'warning'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleLanguagePress = () => {
    (navigation as any).navigate('Language');
  };

  const handleThemePress = async () => {
    const next = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';
    await setMode(next as any);
  };

  const currentThemeLabel = useMemo(() => {
    if (mode === 'system') return 'System';
    if (mode === 'light') return 'Light';
    return 'Dark';
  }, [mode]);

  interface SettingItem {
    icon: any;
    label: string;
    description: string;
    action?: () => void;
    showArrow?: boolean;
    component?: React.ReactElement;
    value?: string;
    iconColor?: string; // Optional custom color for icon bg
    darkIconColor?: string; // Optional custom color for icon bg in dark mode
  }

  const settingSections: { title: string; items: SettingItem[] }[] = [
    ...(user ? [{
      title: t('account'),
      items: [
        {
          icon: User,
          label: t('edit profile'),
          description: t('update_personal_info'),
          action: () => (navigation as any).navigate('EditProfile' as never),
          showArrow: true,
          iconColor: '#EEF2FF', // Light Indigo
          darkIconColor: 'rgba(99, 102, 241, 0.2)'
        },
        {
          icon: MapPin,
          label: t('manage_addresses'),
          description: t('add_edit_locations'),
          action: () => (navigation as any).navigate('Addresses' as never),
          showArrow: true,
          iconColor: '#ECFDF5', // Light Green
          darkIconColor: 'rgba(16, 185, 129, 0.2)'
        },
        {
          icon: CreditCard,
          label: t('payment_methods'),
          description: t('manage_payment_options'),
          action: () => {
            setModalType('info');
            setModalTitle(t('payment_methods'));
            setModalMessage(`${t('payment_methods')} ${t('is_coming_soon')}.`);
            setModalVisible(true);
          },
          showArrow: true,
          iconColor: '#FFFBEB', // Light Yellow
          darkIconColor: 'rgba(245, 158, 11, 0.2)'
        },
      ],
    }] : []),
    {
      title: t('preferences'),
      items: [
        {
          icon: Globe,
          label: t('language'),
          description: t('choose_language'),
          action: handleLanguagePress,
          value: languageLabel,
          showArrow: true,
          iconColor: '#F0F9FF', // Light Blue
          darkIconColor: 'rgba(56, 189, 248, 0.2)'
        },
        {
          icon: theme.isDark ? Moon : Sun,
          label: t('theme'),
          description: t('choose_app_appearance'),
          action: handleThemePress,
          value: currentThemeLabel,
          showArrow: true,
          iconColor: '#F5F3FF', // Light Violet
          darkIconColor: 'rgba(139, 92, 246, 0.2)'
        },
      ],
    },
    {
      title: t('support_legal'),
      items: [
        {
          icon: Shield,
          label: t('support_legal'),
          description: t('help_privacy_terms_about'),
          action: () => {
            (navigation as any).navigate('SupportLegal' as never);
          },
          showArrow: true,
          iconColor: '#FDF2F8', // Light Pink
          darkIconColor: 'rgba(236, 72, 153, 0.2)'
        },
      ],
    },
  ];

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };

  const confirmSignOut = async () => {
    setSignOutModalVisible(false);
    try {
      await signOut();
      navigation.navigate('Login' as never);
    } catch (e) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header
        title={t('settings')}
        onBack={() => safeGoBack(navigation)}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionBody, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      { backgroundColor: theme.card },
                      pressed && { backgroundColor: theme.isDark ? '#1f2937' : '#F3F4F6' } // Custom pressed state for dark mode
                    ]}
                    onPress={item.action}
                  >
                    {/* Icon Container */}
                    <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? (item.darkIconColor || '#374151') : (item.iconColor || '#F3F4F6') }]}>
                      <item.icon size={18} color={theme.textPrimary} />
                    </View>

                    {/* Label & Value */}
                    <View style={styles.rowContent}>
                      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                      {item.value && (
                        <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{item.value}</Text>
                      )}
                    </View>

                    {/* Chevron */}
                    <ChevronRight size={16} color={theme.isDark ? '#52525b' : '#C7C7CC'} />
                  </Pressable>

                  {/* Inset Separator */}
                  {itemIndex < section.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: theme.isDark ? '#374151' : '#E5E5EA' }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Section */}
        {user && (
          <View style={styles.sectionContainer}>
            <View style={[styles.sectionBody, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  styles.signOutRow,
                  { backgroundColor: theme.card },
                  pressed && { backgroundColor: theme.isDark ? '#1f2937' : '#F3F4F6' }
                ]}
                onPress={handleSignOut}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}>
                  <LogOut size={18} color="#EF4444" />
                </View>
                <Text style={[styles.rowLabel, { color: '#EF4444' }]}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Car Wash App v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <AnimatedModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      <Modal
        visible={signOutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSignOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modernModalContainer, { backgroundColor: theme.card, shadowColor: theme.isDark ? '#000' : '#000' }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' }]}>
                <AlertTriangle size={32} color="#ef4444" />
              </View>
              <Pressable style={[styles.closeButton, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setSignOutModalVisible(false)}>
                <X size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Sign Out</Text>
              <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
                Are you sure you want to sign out?
              </Text>
            </View>
            <View style={styles.modalActions}>
              <Button variant="outline" style={[styles.modalButton, styles.cancelButton, { borderColor: theme.cardBorder }]} onPress={() => setSignOutModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>Cancel</Text>
              </Button>
              <Button variant="ghost" style={[styles.modalButton, styles.signOutConfirmButton]} onPress={confirmSignOut}>
                <LogOut size={16} color="#ffffff" />
                <Text style={styles.signOutConfirmButtonText}>Sign Out</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '400',
  },
  rowValue: {
    fontSize: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60, // Align with text (16 padding + 32 icon + 12 margin)
  },
  signOutRow: {
    justifyContent: 'flex-start',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },

  // Modal Styles (Kept largely the same but cleaned up)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modernModalContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutConfirmButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  signOutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SettingsScreen;
