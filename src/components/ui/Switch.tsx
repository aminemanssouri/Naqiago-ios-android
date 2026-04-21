import React from 'react';
import { Switch as RNSwitch, SwitchProps } from 'react-native';

interface CustomSwitchProps extends SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch: React.FC<CustomSwitchProps> = ({ 
  checked, 
  onCheckedChange, 
  value,
  onValueChange,
  ...props 
}) => {
  const isChecked = checked !== undefined ? checked : value;
  const handleChange = onCheckedChange || onValueChange;

  return (
    <RNSwitch
      value={isChecked}
      onValueChange={handleChange}
      trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
      thumbColor={isChecked ? '#ffffff' : '#ffffff'}
      ios_backgroundColor="#e5e7eb"
      {...props}
    />
  );
};
