import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../lib/theme';

interface BookingFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  continueText?: string;
  continueDisabled?: boolean;
  showBackButton?: boolean;
  style?: ViewStyle;
  continueIcon?: React.ReactNode;
}

export function BookingFooter({
  onBack,
  onContinue,
  continueText = 'Continue',
  continueDisabled = false,
  showBackButton = true,
  style,
  continueIcon,
}: BookingFooterProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[
      styles.footer,
      {
        backgroundColor: colors.card,
        paddingBottom: Math.max(insets.bottom, 16),
        borderTopColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(123,45,142,0.08)',
      },
      style,
    ]}>
      <View style={styles.footerButtons}>
        {showBackButton && onBack && (
          <Pressable 
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(123,45,142,0.08)',
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              }
            ]}
          >
            <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2.5} />
          </Pressable>
        )}
        
        {onContinue && (
          <Animated.View 
            style={[
              showBackButton ? styles.continueButtonContainer : styles.continueButtonFullWidth,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Pressable
              onPress={continueDisabled ? undefined : onContinue}
              onPressIn={continueDisabled ? undefined : handlePressIn}
              onPressOut={continueDisabled ? undefined : handlePressOut}
              disabled={continueDisabled}
              style={[
                styles.continueButtonPressable,
                !continueDisabled && {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }
              ]}
            >
              <LinearGradient
                colors={
                  continueDisabled 
                    ? ['rgba(123,45,142,0.4)', 'rgba(155,75,172,0.4)']
                    : [colors.gradientStart, colors.gradientEnd]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueGradient}
              >
                <View style={styles.continueContent}>
                  <Text style={styles.continueText}>{continueText}</Text>
                  {continueIcon || <ArrowRight size={22} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  continueButtonContainer: {
    flex: 1,
  },
  continueButtonFullWidth: {
    flex: 1,
  },
  continueButtonPressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
