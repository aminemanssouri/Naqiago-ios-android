import React from 'react';
import { ViewStyle } from 'react-native';
import { VehicleIcons, VehicleIconKey } from '../icons/VehicleIcons';
import { Car } from 'lucide-react-native';

interface VehicleIconProps {
  vehicleType: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
  variant?: 'filled' | 'outline';
}

/**
 * VehicleIcon - Unified component for displaying vehicle type icons
 * 
 * @param vehicleType - The vehicle type key (e.g., 'Berline', 'Citadine', 'Moyen SUV')
 * @param size - Icon size in pixels (default: 24)
 * @param color - Icon color (default: theme accent color)
 * @param style - Additional view styles
 * @param variant - Icon style variant (currently only 'outline' is supported)
 * 
 * @example
 * <VehicleIcon vehicleType="Berline" size={32} color="#007AFF" />
 */
export const VehicleIcon: React.FC<VehicleIconProps> = ({
  vehicleType,
  size = 24,
  color = '#000',
  style,
  variant = 'outline',
}) => {
  // Normalize the vehicle type key
  const normalizedKey = vehicleType as VehicleIconKey;
  
  // Get the icon component from the map
  const IconComponent = VehicleIcons[normalizedKey];
  
  // Fallback to a generic car icon if vehicle type not found
  if (!IconComponent) {
    console.warn(`VehicleIcon: No icon found for vehicle type "${vehicleType}", using fallback`);
    return <Car size={size} color={color} style={style} />;
  }
  
  // Render the SVG icon component
  return <IconComponent size={size} color={color} />;
};

export default VehicleIcon;
