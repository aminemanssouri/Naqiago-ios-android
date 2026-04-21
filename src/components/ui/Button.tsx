import React from 'react';
import { Pressable, Text, PressableProps, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../lib/theme';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const theme = useThemeColors();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      marginBottom: 8,
      overflow: 'hidden',
    };
    
    // Check if custom style has backgroundColor
    const customStyle = style ? (StyleSheet.flatten(style) as ViewStyle) : {};
    const hasCustomBackgroundColor = customStyle?.backgroundColor !== undefined;
    
    // Variant styles - only apply backgroundColor if not overridden by custom style
    switch (variant) {
      case 'default':
        if (!hasCustomBackgroundColor) {
          baseStyle.backgroundColor = 'transparent';
        }
        baseStyle.shadowColor = theme.shadow;
        baseStyle.shadowOffset = { width: 0, height: 8 };
        baseStyle.shadowOpacity = 0.25;
        baseStyle.shadowRadius = 24;
        baseStyle.elevation = 6;
        break;
      case 'destructive':
        if (!hasCustomBackgroundColor) {
          baseStyle.backgroundColor = '#ef4444';
        }
        break;
      case 'outline':
        if (!hasCustomBackgroundColor) {
          baseStyle.backgroundColor = theme.card;
        }
        baseStyle.borderWidth = 1.5;
        baseStyle.borderColor = theme.cardBorder as string;
        break;
      case 'secondary':
        if (!hasCustomBackgroundColor) {
          baseStyle.backgroundColor = theme.secondary;
        }
        baseStyle.shadowColor = theme.secondary;
        baseStyle.shadowOffset = { width: 0, height: 8 };
        baseStyle.shadowOpacity = 0.25;
        baseStyle.shadowRadius = 24;
        baseStyle.elevation = 6;
        break;
      case 'ghost':
        if (!hasCustomBackgroundColor) {
          baseStyle.backgroundColor = 'transparent';
        }
        break;
      case 'link':
        if (!hasCustomBackgroundColor) {
          baseStyle.backgroundColor = 'transparent';
        }
        break;
    }
    
    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.height = 40;
        baseStyle.paddingHorizontal = 0;
        baseStyle.paddingVertical = 0;
        break;
      case 'lg':
        baseStyle.height = 60;
        baseStyle.paddingHorizontal = 0;
        baseStyle.paddingVertical = 0;
        break;
      case 'icon':
        baseStyle.height = 48;
        baseStyle.width = 48;
        baseStyle.padding = 0;
        break;
      default:
        baseStyle.height = 48;
        baseStyle.paddingHorizontal = 0;
        baseStyle.paddingVertical = 0;
        break;
    }
    
    if (disabled) {
      baseStyle.opacity = 0.5;
    }
    
    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: size === 'lg' ? 17 : size === 'sm' ? 14 : 16,
      fontFamily: theme.fontPrimary,
      fontWeight: '700',
    };
    
    switch (variant) {
      case 'default':
      case 'destructive':
        baseTextStyle.color = 'white';
        break;
      case 'outline':
      case 'secondary':
      case 'ghost':
        baseTextStyle.color = theme.textPrimary;
        break;
      case 'link':
        baseTextStyle.color = theme.accent;
        baseTextStyle.textDecorationLine = 'underline';
        break;
    }
    
    return baseTextStyle;
  };

  const baseStyle = getButtonStyle();
  const combinedStyle = StyleSheet.flatten([baseStyle, style]) as ViewStyle;

  return (
    <Pressable
      style={({ pressed }) => [
        combinedStyle,
        pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null,
      ] as any}
      disabled={disabled}
      {...props}
    >
      {variant === 'default' ? (
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: size === 'default' ? 24 : size === 'lg' ? 32 : size === 'sm' ? 16 : 0,
            borderRadius: combinedStyle?.borderRadius,
            overflow: 'hidden',
          }}
        >
          {typeof children === 'string' ? (
            <Text style={getTextStyle()} numberOfLines={1} ellipsizeMode="tail">{children}</Text>
          ) : (
            children
          )}
        </LinearGradient>
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: size === 'default' ? 24 : size === 'lg' ? 32 : size === 'sm' ? 16 : 0,
            borderRadius: combinedStyle?.borderRadius,
            overflow: 'hidden',
          }}
        >
          {typeof children === 'string' ? (
            <Text style={getTextStyle()} numberOfLines={1} ellipsizeMode="tail">{children}</Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}
