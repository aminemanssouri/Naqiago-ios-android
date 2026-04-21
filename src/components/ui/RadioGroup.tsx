import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  style?: any;
}

interface RadioGroupItemProps {
  value: string;
  id: string;
  style?: any;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ 
  value, 
  onValueChange, 
  children, 
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            isSelected: value === (child.props as any).value,
            onSelect: onValueChange,
          });
        }
        return child;
      })}
    </View>
  );
};

export const RadioGroupItem: React.FC<RadioGroupItemProps & { 
  isSelected?: boolean; 
  onSelect?: (value: string) => void;
}> = ({ 
  value, 
  id, 
  style, 
  isSelected, 
  onSelect 
}) => {
  return (
    <Pressable 
      style={[styles.radioButton, style]}
      onPress={() => onSelect?.(value)}
    >
      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  radioButton: {
    padding: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  radioOuterSelected: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
});
