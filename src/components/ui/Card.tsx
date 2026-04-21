import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { useThemeColors } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  const theme = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, shadowColor: theme.shadow }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
});
