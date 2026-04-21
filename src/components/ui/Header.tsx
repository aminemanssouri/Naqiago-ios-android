import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { useThemeColors } from '../../lib/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  onRightAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle,
  onBack, 
  showBackButton = true,
  rightAction,
  onRightAction
}) => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
      }}
    >
      <View style={{
        height: 64,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
      }}>
        {showBackButton ? (
          <Pressable 
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }} 
            onPress={onBack}
          >
            <ArrowLeft size={24} color={'#ffffff'} strokeWidth={2.5} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ fontSize: 18, fontFamily: theme.fontHeading, color: '#ffffff' }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontFamily: theme.fontPrimary }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        
        {rightAction ? (
          <Pressable 
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }} 
            onPress={onRightAction}
          >
            {rightAction}
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
    </LinearGradient>
  );
};
