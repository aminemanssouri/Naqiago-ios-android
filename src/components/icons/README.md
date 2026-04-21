# Icon Assets Documentation

This directory contains all custom SVG icons used throughout the NQago car wash booking application.

## 📁 Directory Structure

```
src/components/icons/
├── VehicleIcons.tsx    # Vehicle type SVG icons
├── BrandLogos.tsx      # Car brand logo SVG components
└── README.md           # This file
```

## 🚗 Vehicle Icons

### Available Icons

The `VehicleIcons.tsx` file provides professional SVG icons for each vehicle type supported by the application:

| Icon Name | Vehicle Type | Key | Description |
|-----------|-------------|-----|-------------|
| `SedanIcon` | Berline | `Berline` | Standard 4-door sedan silhouette |
| `CompactIcon` | Citadine | `Citadine` | Smaller hatchback/compact car |
| `MediumSUVIcon` | Moyen SUV | `Moyen SUV` | Mid-size SUV silhouette |
| `LargeSUVIcon` | Grand SUV | `Grand SUV` | Full-size SUV/truck silhouette |
| `MotorcycleIcon` | Motorcycles | `Motorcycles` | Standard motorcycle side view |
| `ScooterIcon` | 49cc Motor | `Scooter` | Small scooter silhouette |

### Usage

#### Direct Import
```tsx
import { SedanIcon, MotorcycleIcon } from '../components/icons/VehicleIcons';

<SedanIcon size={32} color="#007AFF" />
<MotorcycleIcon size={24} color="#FF3B30" />
```

#### Using the Icon Map
```tsx
import { VehicleIcons } from '../components/icons/VehicleIcons';

const vehicleType = 'Berline';
const IconComponent = VehicleIcons[vehicleType];

<IconComponent size={28} color="#007AFF" />
```

#### Using the VehicleIcon Component (Recommended)
```tsx
import { VehicleIcon } from '../components/ui/VehicleIcon';

<VehicleIcon 
  vehicleType="Berline" 
  size={32} 
  color="#007AFF" 
/>
```

### Props

All vehicle icon components accept the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `24` | Icon size in pixels |
| `color` | `string` | `#000` | Icon stroke color (hex, rgb, or theme color) |

### Customization

- **Size**: Icons are designed with a 24x24 viewBox and scale well from 16px to 64px
- **Color**: All icons use stroke-based rendering and can be colored to match any theme
- **Style**: Icons feature a consistent outline style with 2px stroke width

## 🏢 Brand Logos

### Available Logos

The `BrandLogos.tsx` file contains SVG logos for the top 20+ car brands:

| Brand | Logo Available | Aliases |
|-------|---------------|---------|
| Toyota | ✅ | - |
| Honda | ✅ | - |
| Ford | ✅ | - |
| BMW | ✅ | - |
| Mercedes-Benz | ✅ | `Mercedes`, `Mercedes Benz` |
| Audi | ✅ | - |
| Nissan | ✅ | - |
| Hyundai | ✅ | - |
| Volkswagen | ✅ | `VW` |
| Mazda | ✅ | - |
| Subaru | ✅ | - |
| Kia | ✅ | - |
| Lexus | ✅ | - |
| Porsche | ✅ | - |
| Tesla | ✅ | - |
| Volvo | ✅ | - |
| Jaguar | ✅ | - |
| Land Rover | ✅ | `LandRover` |
| Fiat | ✅ | - |
| Chevrolet | ✅ | `Chevy` |
| Peugeot | ✅ | - |

### Usage

#### Check if Brand Has Local Logo
```tsx
import { hasLocalBrandLogo } from '../components/icons/BrandLogos';

if (hasLocalBrandLogo('Toyota')) {
  // Brand has a local SVG logo
}
```

#### Render Brand Logo
```tsx
import { BrandLogos } from '../components/icons/BrandLogos';

const brandName = 'Toyota';
const LogoComponent = BrandLogos[brandName];

{LogoComponent && <LogoComponent size={48} />}
```

#### With Fallback Pattern (Recommended)
```tsx
import { BrandLogos, hasLocalBrandLogo } from '../components/icons/BrandLogos';

{brand.logo ? (
  <Image source={{ uri: brand.logo }} style={styles.logo} />
) : hasLocalBrandLogo(brand.name) ? (
  React.createElement(BrandLogos[brand.name], { size: 48 })
) : (
  <Text style={styles.initial}>{brand.name.charAt(0)}</Text>
)}
```

### Props

All brand logo components accept the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `48` | Logo size in pixels (width & height) |
| `color` | `string` | varies | Some logos are monochrome, others use brand colors |

### Logo Design Guidelines

- **Square Aspect Ratio**: All logos use a 48x48 viewBox
- **Brand Colors**: Logos attempt to use accurate brand colors where possible
- **Monochrome Options**: Some logos are provided in monochrome for theme consistency
- **Recognizable**: Simplified but instantly recognizable brand marks

## 🎨 Theming

### Dark Mode Support

All vehicle icons are designed to work in both light and dark themes:

```tsx
import { useThemeColors } from '../lib/theme';

const colors = useThemeColors();

<VehicleIcon 
  vehicleType="Berline" 
  size={28} 
  color={colors.accent}  // Automatically adapts to theme
/>
```

### Color Recommendations

| Context | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Selected state | `#FFFFFF` | `#FFFFFF` |
| Unselected state | `colors.accent` | `colors.accent` |
| Disabled state | `colors.textSecondary` | `colors.textSecondary` |

## 🔧 Adding New Icons

### Adding a New Vehicle Icon

1. Create a new SVG component in `VehicleIcons.tsx`:
```tsx
export const NewVehicleIcon: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="..." stroke={color} strokeWidth={2} />
  </Svg>
);
```

2. Add it to the `VehicleIcons` export map:
```tsx
export const VehicleIcons = {
  // ...existing icons
  'New Vehicle': NewVehicleIcon,
};
```

3. Update the `VehicleIconKey` type if using TypeScript strict mode

### Adding a New Brand Logo

1. Create a new SVG component in `BrandLogos.tsx`:
```tsx
export const NewBrandLogo: React.FC<BrandLogoProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    {/* Logo paths */}
  </Svg>
);
```

2. Add it to the `BrandLogos` export map:
```tsx
export const BrandLogos: { [key: string]: React.FC<BrandLogoProps> } = {
  // ...existing logos
  'New Brand': NewBrandLogo,
};
```

3. The `hasLocalBrandLogo()` function will automatically detect the new logo

## 📊 Performance Considerations

### Optimization Tips

1. **Memoization**: SVG components are lightweight but can be memoized if used in large lists:
```tsx
const MemoizedIcon = React.memo(VehicleIcon);
```

2. **Lazy Loading**: Brand logos can be loaded on-demand if needed:
```tsx
const LogoComponent = React.lazy(() => 
  import('../components/icons/BrandLogos').then(mod => ({ 
    default: mod.BrandLogos['Toyota'] 
  }))
);
```

3. **Caching**: The `NaqiagoVehicleAPI` caches brand data including `hasLocalLogo` flags

## 🧪 Testing

### Visual Testing Checklist

- ✅ Icons render correctly at different sizes (16px, 24px, 32px, 48px)
- ✅ Icons adapt to theme colors in light and dark modes
- ✅ Icons scale properly on different device sizes
- ✅ Brand logos display correctly with fallback chain
- ✅ No console warnings about missing icons
- ✅ Smooth scrolling performance with multiple icons

## 📝 Migration Notes

### From Emoji to SVG Icons

The application was previously using emoji icons (🚗, 🚙, etc.) which had these limitations:
- Inconsistent appearance across platforms
- No color customization
- Poor scaling
- Limited accessibility

The new SVG icon system provides:
- ✅ Consistent cross-platform appearance
- ✅ Full color and size customization
- ✅ Perfect scaling at any size
- ✅ Better accessibility with proper labels
- ✅ Professional design aesthetic

### Backward Compatibility

The old emoji-based code has been fully replaced. If you need to reference vehicle types:
- Use the `iconName` property instead of `icon` in `VEHICLE_TYPES` arrays
- Import `VehicleIcon` component instead of rendering emoji strings
- Check `hasLocalLogo` field in `CarBrand` interface for brand logo availability

## 🔍 Troubleshooting

### Common Issues

**Issue**: Icon not displaying
- **Solution**: Check that the vehicle type key matches exactly (case-sensitive)
- **Fallback**: VehicleIcon component falls back to lucide-react-native `Car` icon

**Issue**: Brand logo not showing
- **Solution**: Verify brand name spelling and check if logo exists with `hasLocalBrandLogo()`
- **Fallback**: System falls back to remote API image → local SVG → first letter initial

**Issue**: Wrong color in dark mode
- **Solution**: Use theme colors (`colors.accent`, `colors.textPrimary`) instead of hardcoded values

## 📄 License

These SVG icons are custom-designed for the NQago application. Brand logos are simplified representations and should be reviewed for trademark compliance in production use.

## 🤝 Contributing

When contributing new icons:
1. Follow the existing design patterns
2. Use consistent stroke widths (2px for vehicle icons)
3. Test in both light and dark themes
4. Ensure accessibility with proper viewBox dimensions
5. Update this documentation

---

**Last Updated**: January 15, 2026  
**Maintainer**: NQago Development Team
