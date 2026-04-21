import React from 'react';
import Svg, { Path, G, Circle, Ellipse, Rect, Polygon } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
  color?: string;
}

// Toyota Logo
export const ToyotaLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="12" ry="8" stroke="#000" strokeWidth="2" fill="none" />
    <Ellipse cx="24" cy="24" rx="8" ry="12" stroke="#000" strokeWidth="2" fill="none" />
    <Circle cx="24" cy="24" r="4" stroke="#000" strokeWidth="2" fill="none" />
  </Svg>
);

// Honda Logo
export const HondaLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="10" y="12" width="5" height="24" fill="#000" />
    <Rect x="33" y="12" width="5" height="24" fill="#000" />
    <Rect x="15" y="22" width="18" height="4" fill="#000" />
    <Path d="M10 12 L15 12 L15 22 L10 22 Z" fill="#000" />
    <Path d="M33 12 L38 12 L38 22 L33 22 Z" fill="#000" />
  </Svg>
);

// Ford Logo
export const FordLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="18" ry="11" fill="#1C3A6E" stroke="#1C3A6E" strokeWidth="1" />
    <Path
      d="M14 20h8v2h-6v3h5v2h-5v4h-2v-11zm12-1c3 0 5 2 5 6s-2 6-5 6-5-2-5-6 2-6 5-6zm0 2c-1.7 0-3 1.3-3 4s1.3 4 3 4 3-1.3 3-4-1.3-4-3-4z"
      fill="#FFF"
    />
  </Svg>
);

// BMW Logo
export const BMWLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="24" r="16" fill="#FFF" stroke="#000" strokeWidth="2" />
    <Path d="M24 8 L24 24 L40 24 A16 16 0 0 0 24 8 Z" fill="#0066B2" />
    <Path d="M24 24 L24 40 L8 24 A16 16 0 0 0 24 40 Z" fill="#0066B2" />
  </Svg>
);

// Mercedes-Benz Logo
export const MercedesBenzLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="24" r="16" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M24 10 L24 24" stroke="#000" strokeWidth="2" />
    <Path d="M24 24 L38 35" stroke="#000" strokeWidth="2" />
    <Path d="M24 24 L10 35" stroke="#000" strokeWidth="2" />
  </Svg>
);

// Audi Logo
export const AudiLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="12" cy="24" r="7" stroke="#000" strokeWidth="2" fill="none" />
    <Circle cx="21" cy="24" r="7" stroke="#000" strokeWidth="2" fill="none" />
    <Circle cx="30" cy="24" r="7" stroke="#000" strokeWidth="2" fill="none" />
    <Circle cx="39" cy="24" r="7" stroke="#000" strokeWidth="2" fill="none" />
  </Svg>
);

// Nissan Logo
export const NissanLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="24" r="16" stroke="#000" strokeWidth="2" fill="none" />
    <Rect x="21" y="12" width="6" height="24" fill="#000" />
    <Path d="M10 24 h28" stroke="#000" strokeWidth="3" />
  </Svg>
);

// Hyundai Logo
export const HyundaiLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="16" ry="12" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M16 16 L16 32 M32 16 L32 32 M16 24 L32 24" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// Volkswagen Logo
export const VolkswagenLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="24" r="16" fill="#001E50" stroke="#001E50" strokeWidth="1" />
    <Path d="M14 18 L18 30 L24 22 L30 30 L34 18 M10 24 h28" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Mazda Logo
export const MazdaLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="16" ry="12" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M24 12 Q24 24 16 30 M24 12 Q24 24 32 30" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M24 12 v18" stroke="#000" strokeWidth="2" />
  </Svg>
);

// Subaru Logo
export const SubaruLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="18" ry="14" fill="#003D7A" />
    <Circle cx="24" cy="16" r="2.5" fill="#FFF" />
    <Circle cx="15" cy="22" r="2" fill="#FFF" />
    <Circle cx="21" cy="22" r="2" fill="#FFF" />
    <Circle cx="27" cy="22" r="2" fill="#FFF" />
    <Circle cx="33" cy="22" r="2" fill="#FFF" />
    <Circle cx="18" cy="28" r="2" fill="#FFF" />
    <Circle cx="30" cy="28" r="2" fill="#FFF" />
  </Svg>
);

// Kia Logo
export const KiaLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="18" ry="12" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M15 16 v16 M15 24 L21 16 M15 24 L21 32" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M25 32 v-16 M33 32 v-16" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// Lexus Logo
export const LexusLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="16" ry="12" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M16 16 v16 h8 M28 16 v12 q0 4 4 4" stroke="#000" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Porsche Logo
export const PorscheLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="16" width="32" height="16" fill="#000" stroke="#D4AF37" strokeWidth="2" />
    <Path d="M12 20 h8 M12 24 h8 M12 28 h5" stroke="#D4AF37" strokeWidth="1.5" />
    <Circle cx="32" cy="24" r="5" fill="#D4AF37" />
  </Svg>
);

// Tesla Logo
export const TeslaLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M24 12 v24" stroke="#E82127" strokeWidth="3" strokeLinecap="round" />
    <Path d="M12 16 Q24 10 24 12 M36 16 Q24 10 24 12" stroke="#E82127" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Rect x="22" y="34" width="4" height="4" fill="#E82127" />
  </Svg>
);

// Volvo Logo
export const VolvoLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Circle cx="24" cy="24" r="14" stroke="#000" strokeWidth="2" fill="none" />
    <Path d="M10 24 h28 M24 10 v28" stroke="#000" strokeWidth="3" />
  </Svg>
);

// Jaguar Logo
export const JaguarLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M12 24 Q18 10 24 12 Q30 10 36 24 Q30 32 24 28 Q18 32 12 24 Z"
      fill="#000"
      stroke="#000"
      strokeWidth="1"
    />
    <Circle cx="20" cy="20" r="1.5" fill="#FFF" />
  </Svg>
);

// Land Rover Logo
export const LandRoverLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Ellipse cx="24" cy="24" rx="18" ry="10" fill="#005A2B" stroke="#005A2B" />
    <Path d="M12 20 v8 M18 20 v8 M24 20 v8 M30 20 v8 M36 20 v8" stroke="#FFF" strokeWidth="1.5" />
  </Svg>
);

// Fiat Logo
export const FiatLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="18" width="32" height="12" fill="#8D1B2C" />
    <Path d="M14 22 v4 M18 22 v4 h4 M26 22 h4 M32 22 v4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Chevrolet Logo
export const ChevroletLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M24 12 L34 24 L24 28 L14 24 Z" fill="#F0B323" stroke="#000" strokeWidth="1.5" />
    <Path d="M24 28 L34 24 L24 36 L14 24 Z" fill="#000" />
  </Svg>
);

// Peugeot Logo
export const PeugeotLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M18 14 L24 10 L30 14 L30 22 L24 26 L18 22 Z"
      fill="none"
      stroke="#000"
      strokeWidth="2"
    />
    <Path d="M20 22 L24 18 L28 22" stroke="#000" strokeWidth="2" fill="none" />
  </Svg>
);

// Export all brand logos as a map
export const BrandLogos: { [key: string]: React.FC<BrandLogoProps> } = {
  Toyota: ToyotaLogo,
  Honda: HondaLogo,
  Ford: FordLogo,
  BMW: BMWLogo,
  'Mercedes-Benz': MercedesBenzLogo,
  'Mercedes Benz': MercedesBenzLogo,
  Mercedes: MercedesBenzLogo,
  Audi: AudiLogo,
  Nissan: NissanLogo,
  Hyundai: HyundaiLogo,
  Volkswagen: VolkswagenLogo,
  VW: VolkswagenLogo,
  Mazda: MazdaLogo,
  Subaru: SubaruLogo,
  Kia: KiaLogo,
  Lexus: LexusLogo,
  Porsche: PorscheLogo,
  Tesla: TeslaLogo,
  Volvo: VolvoLogo,
  Jaguar: JaguarLogo,
  'Land Rover': LandRoverLogo,
  LandRover: LandRoverLogo,
  Fiat: FiatLogo,
  Chevrolet: ChevroletLogo,
  Chevy: ChevroletLogo,
  Peugeot: PeugeotLogo,
};

// Type for brand logo keys
export type BrandLogoKey = keyof typeof BrandLogos;

// Helper function to check if a brand has a local logo
export const hasLocalBrandLogo = (brandName: string): boolean => {
  return brandName in BrandLogos;
};
