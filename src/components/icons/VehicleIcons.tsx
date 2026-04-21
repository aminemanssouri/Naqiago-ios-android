import React from 'react';
import Svg, { Path, G, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Sedan Icon (Berline)
export const SedanIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 17v2h2v-2H6zm10 0v2h2v-2h-2zM5 11l1.5-4.5h11L19 11m-1.5 5h-11c-.83 0-1.5-.67-1.5-1.5v-3c0-.83.67-1.5 1.5-1.5h11c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Compact Car Icon (Citadine)
export const CompactIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 17.5v1.75h1.75v-1.75H6.5zm8 0v1.75h1.75v-1.75h-1.75zM5 12l1.5-3.5h9L17 12m-1 4h-9c-.69 0-1.25-.56-1.25-1.25v-2.5c0-.69.56-1.25 1.25-1.25h9c.69 0 1.25.56 1.25 1.25v2.5c0 .69-.56 1.25-1.25 1.25z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Medium SUV Icon (Moyen SUV)
export const MediumSUVIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.5 17v2.5h2.25V17H5.5zm10.25 0v2.5H18V17h-2.25zM4 10.5l2-5h12l2 5m-1.5 6h-13c-.97 0-1.75-.78-1.75-1.75v-3.5c0-.97.78-1.75 1.75-1.75h13c.97 0 1.75.78 1.75 1.75v3.5c0 .97-.78 1.75-1.75 1.75z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 10.5V8h3v2.5M15 10.5V8h3v2.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Large SUV Icon (Grand SUV)
export const LargeSUVIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 17v3h2.5v-3H5zm11.5 0v3H19v-3h-2.5zM3 10l2.5-5.5h13L21 10m-1.75 6.5h-14.5C3.78 16.5 3 15.72 3 14.75v-4c0-.97.78-1.75 1.75-1.75h14.5c.97 0 1.75.78 1.75 1.75v4c0 .97-.78 1.75-1.75 1.75z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.5 9V6.5h4V9M14.5 9V6.5h4V9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Rect x="5" y="11" width="2" height="2" rx="0.5" fill={color} />
    <Rect x="17" y="11" width="2" height="2" rx="0.5" fill={color} />
  </Svg>
);

// Motorcycle Icon (Motorcycles)
export const MotorcycleIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="17" r="3" stroke={color} strokeWidth={2} />
    <Circle cx="18" cy="17" r="3" stroke={color} strokeWidth={2} />
    <Path
      d="M9 17l2-6m0 0h5l1.5 3M11 11h2m-2 0L9 8h3l1.5 2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 17l3.5-3M15 7v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Scooter Icon (49cc motor)
export const ScooterIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6.5" cy="17.5" r="2.5" stroke={color} strokeWidth={2} />
    <Circle cx="17.5" cy="17.5" r="2.5" stroke={color} strokeWidth={2} />
    <Path
      d="M9 17.5h6.5M9 17.5l1.5-5h3.5m0 0h2l1 2.5m-4-2.5l-1-3h2.5l.5 1.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 9.5V8h2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Export all icons as a map for easy lookup
export const VehicleIcons = {
  Berline: SedanIcon,
  Citadine: CompactIcon,
  'Moyen SUV': MediumSUVIcon,
  'Grand SUV': LargeSUVIcon,
  Motorcycles: MotorcycleIcon,
  Scooter: ScooterIcon,
  // Aliases for flexibility
  sedan: SedanIcon,
  compact: CompactIcon,
  suv: MediumSUVIcon,
  'large-suv': LargeSUVIcon,
  motorcycle: MotorcycleIcon,
  scooter: ScooterIcon,
} as const;

// Type for vehicle icon keys
export type VehicleIconKey = keyof typeof VehicleIcons;
