import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useThemeColors } from '../../lib/theme';

interface TextareaProps extends Omit<TextInputProps, 'multiline'> {
  rows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  rows = 3, 
  style, 
  ...props 
}) => {
  const theme = useThemeColors();
  
  return (
    <TextInput
      style={[
        styles.textarea, 
        { 
          height: rows * 20 + 24,
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          color: theme.textPrimary,
        }, 
        style
      ]}
      multiline
      textAlignVertical="top"
      placeholderTextColor={theme.textSecondary}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
});
