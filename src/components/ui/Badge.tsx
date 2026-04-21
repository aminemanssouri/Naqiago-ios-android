import React from 'react';
import { Text, View, StyleSheet, TextStyle, ViewStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  style,
  textStyle 
}) => {
  const badgeStyles = [
    styles.badge,
    styles[variant],
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    textStyle
  ];

  return (
    <View style={badgeStyles}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Default variant
  default: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  defaultText: {
    color: '#ffffff',
  },
  // Secondary variant
  secondary: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  secondaryText: {
    color: '#475569',
  },
  // Destructive variant
  destructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  destructiveText: {
    color: '#ffffff',
  },
  // Outline variant
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#e5e7eb',
  },
  outlineText: {
    color: '#374151',
  },
});
