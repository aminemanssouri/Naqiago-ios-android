import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { useThemeColors } from '../../lib/theme';

interface SeparatorProps {
  style?: StyleProp<ViewStyle>;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({ 
  style, 
  orientation = 'horizontal' 
}) => {
  const theme = useThemeColors();
  const separatorStyle = [
    styles.separator,
    { backgroundColor: theme.cardBorder },
    orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    style
  ];

  return <View style={separatorStyle} />;
};

const styles = StyleSheet.create({
  separator: {
    backgroundColor: '#e5e7eb',
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
