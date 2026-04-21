import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';
import { useLanguage } from '../../contexts/LanguageContext';

export type PhoneNumberModalProps = {
  visible: boolean;
  onSave: (phoneNumber: string) => Promise<void>;
};

export const PhoneNumberModal: React.FC<PhoneNumberModalProps> = ({
  visible,
  onSave,
}) => {
  const colors = useThemeColors();
  const { t } = useLanguage();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhoneNumber('');
      setError('');
      setSaving(false);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible]);

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return cleaned.length >= 8 && /^\+?[0-9]{8,15}$/.test(cleaned);
  };

  const handleSave = async () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      setError(t('invalid_phone_number_message'));
      return;
    }
    if (!validatePhone(trimmed)) {
      setError(t('invalid_phone_number_message'));
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch (e: any) {
      setError(e?.message || t('phone_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const iconTint = colors.isDark ? colors.secondary : colors.accent;
  const iconBg = colors.isDark ? 'rgba(58, 28, 63, 0.55)' : 'rgba(123, 45, 142, 0.12)';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => {}}>
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: colors.isDark ? 'rgba(0,0,0,0.65)' : 'rgba(45, 27, 61, 0.45)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
            opacity,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            width: '88%',
            maxWidth: 420,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            shadowColor: colors.shadow,
            shadowOpacity: colors.isDark ? 0.4 : 0.18,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
              <Phone size={24} color={iconTint} />
            </View>
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('phone_number_required')}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{t('phone_number_required_message')}</Text>

          {/* Phone Input */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('phone_number')}</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.surface, borderColor: error ? '#ef4444' : colors.cardBorder },
              ]}
            >
              <Phone size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder={t('enter_phone_number_placeholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (error) setError('');
                }}
                autoFocus
                editable={!saving}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Actions — brand gradient (matches app primary CTAs) */}
          <Pressable onPress={handleSave} disabled={saving} style={{ width: '100%', opacity: saving ? 0.75 : 1 }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtnGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>{t('save_phone_number')}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  saveBtnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default PhoneNumberModal;
