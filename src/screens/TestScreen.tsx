import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Map, Droplets, Sparkles, Wrench, SprayCan, Zap, Shield, User } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ServiceBubble {
  id: string;
  title: string;
  icon: any;
  color: string;
  angle: number;
  onPress?: () => void;
}

// Darken a hex color by amount (0..1)
function darken(hex: string, amount = 0.18) {
  const h = hex.replace('#', '');
  const [r, g, b] = h.length === 3
    ? h.split('').map(x => parseInt(x + x, 16))
    : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map(x => parseInt(x, 16));
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(clamp(Math.round(r * (1 - amount))))}${toHex(
    clamp(Math.round(g * (1 - amount)))
  )}${toHex(clamp(Math.round(b * (1 - amount))))}`;
}

export default function TestScreen() {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [animations] = useState(() =>
    Array.from({ length: 7 }, () => new Animated.Value(0))
  );
  
  const [floatingAnimations] = useState(() =>
    Array.from({ length: 7 }, () => new Animated.Value(0))
  );
  
  const [pulseAnimations] = useState(() =>
    Array.from({ length: 7 }, () => new Animated.Value(1))
  );

  useEffect(() => {
    const stagger = 120;
    
    // Initial entrance animation
    animations.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        delay: i * stagger,
        useNativeDriver: true,
      }).start();
    });

    // Start smooth floating animation
    const startFloatingAnimation = () => {
      floatingAnimations.forEach((anim, i) => {
        const animateFloat = () => {
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000 + (i * 400), // 3-5.6 seconds
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 3000 + (i * 400),
              useNativeDriver: true,
            }),
          ]).start(() => animateFloat());
        };
        
        setTimeout(() => animateFloat(), i * 600);
      });
    };

    // Start gentle pulse animation
    const startPulseAnimation = () => {
      pulseAnimations.forEach((anim, i) => {
        const animatePulse = () => {
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.05,
              duration: 2000 + (i * 300), // 2-4.8 seconds
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000 + (i * 300),
              useNativeDriver: true,
            }),
          ]).start(() => animatePulse());
        };
        
        setTimeout(() => animatePulse(), i * 800);
      });
    };

    // Start animations after entrance completes
    setTimeout(() => {
      startFloatingAnimation();
      startPulseAnimation();
    }, stagger * 7 + 1000);
  }, []);

  const screenSize = Math.min(width, height);
  const centerBubbleSize = screenSize * 0.30;
  const outerBubbleSize = screenSize * 0.25;
  const radius = screenSize * 0.32;

  const services: ServiceBubble[] = [
    { id: 'basic', title: t('entry_basic_title') || 'Basic Wash', icon: Droplets, color: '#3B82F6', angle: 0 },
    { id: 'deluxe', title: t('entry_deluxe_title') || 'Deluxe Wash', icon: Sparkles, color: '#8B5CF6', angle: 60 },
    { id: 'deep', title: t('entry_deep_title') || 'Deep Clean', icon: Wrench, color: '#10B981', angle: 120 },
    { id: 'pro', title: t('entry_pro_title') || 'Pro Package', icon: SprayCan, color: '#EF4444', angle: 180 },
    // The following two bubble IDs may not exist in DB. We'll map them safely below.
    { id: 'express', title: t('entry_express_title') || 'Express Service', icon: Zap, color: '#06B6D4', angle: 240 },
    { id: 'protection', title: t('entry_protection_title') || 'Paint Protection', icon: Shield, color: '#84CC16', angle: 300 },
  ];

  // Map UI bubble IDs to backend service keys that exist in Supabase
  const SERVICE_KEY_MAP: Record<string, string> = {
    basic: 'basic',
    deluxe: 'deluxe',
    deep: 'deep',
    pro: 'pro',
    // Fallback mappings if these variants don't exist server-side
    express: 'basic',
    protection: 'pro',
  };

  const handleCenterPress = () => {
    const basicServiceKey = 'basic';
    (navigation as any).navigate('ServiceWorkers', { serviceKey: basicServiceKey });
  };
  const handleServicePress = (s: ServiceBubble) => {
    const serviceKey = SERVICE_KEY_MAP[s.id];
    if (serviceKey) {
      (navigation as any).navigate('ServiceWorkers', { serviceKey });
    } else {
      console.warn('Unknown service bubble id, routing to Services list instead:', s.id);
      (navigation as any).navigate('MainTabs', { screen: 'Services' });
    }
  };
  const handleMapPress = () => (navigation as any).navigate('MainTabs', { screen: 'Home' });
  const handleProfilePress = () => (navigation as any).navigate('Profile');

  const getScreenCenter = () => ({ x: width / 2, y: height / 2.7 });

  const getBubblePosition = (angle: number, bubbleSize: number) => {
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const c = getScreenCenter();
    return { left: c.x + x - bubbleSize / 2, top: c.y + y - bubbleSize / 2 };
  };

  const getBlobStyle = (index: number, size: number) => {
    const v = [
      { tl: 0.55, tr: 0.45, bl: 0.42, br: 0.58 },
      { tl: 0.48, tr: 0.52, bl: 0.56, br: 0.44 },
      { tl: 0.60, tr: 0.40, bl: 0.47, br: 0.53 },
      { tl: 0.46, tr: 0.54, bl: 0.59, br: 0.41 },
      { tl: 0.57, tr: 0.43, bl: 0.44, br: 0.56 },
      { tl: 0.49, tr: 0.51, bl: 0.54, br: 0.46 },
      { tl: 0.52, tr: 0.48, bl: 0.45, br: 0.55 },
    ][index % 7];
    return {
      borderTopLeftRadius: size * v.tl,
      borderTopRightRadius: size * v.tr,
      borderBottomLeftRadius: size * v.bl,
      borderBottomRightRadius: size * v.br,
    };
  };

  const shadowTone = darken(theme.accent, 0.22); // darker than background

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.accent },
    content: { flex: 1, position: 'relative' },

    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appNameContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 12,
    },
    appName: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 1.2,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    appSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 0.8,
      marginTop: 2,
      textTransform: 'uppercase',
    },

    headerButton: {
      width: 50, 
      height: 50, 
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },


    bubbleBase: {
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      borderWidth: 0.35,
      borderColor: 'rgba(0,0,0,0.05)',
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 2,
          }
        : { elevation: 10 }),
    },

    // pressed shadow underlay (crisp edge vibe)
    shadowPlate: {
      position: 'absolute',
      transform: [{ translateX: 6 }, { translateY: 10 }],
      backgroundColor: shadowTone,
      opacity: 0.35,
      zIndex: -1,
    },

    centerTitle: {
      fontSize: 10, fontWeight: '700', color: theme.accent,
      marginTop: 4, textAlign: 'center', letterSpacing: 0.3,
    },

    bubbleTitle: {
      fontSize: 9, fontWeight: '600', color: '#374151',
      textAlign: 'center', marginTop: 4, lineHeight: 12, letterSpacing: 0.1,
    },
  });

  // helpers to create sized styles
  const sized = {
    centerBubble(size: number, index = 0) {
      return { width: size, height: size, ...styles.bubbleBase, ...getBlobStyle(index, size) } as const;
    },
    outerBubble(size: number, index: number) {
      return { width: size, height: size, ...styles.bubbleBase, ...getBlobStyle(index, size) } as const;
    },
    plate(size: number, index: number) {
      return { width: size, height: size, ...styles.shadowPlate, ...getBlobStyle(index, size) } as const;
    },
  };

  // gradient sheen renderer: soft top-left -> transparent blend
  const Sheen = ({ size, index }: { size: number; index: number }) => (
    <LinearGradient
      pointerEvents="none"
      colors={[
        'rgba(255,255,255,0.96)', // almost white
        'rgba(255,255,255,0.0)',  // smoothly to transparent
      ]}
      locations={[0, 1]}
      start={{ x: 0, y: 0 }}    // top-left
      end={{ x: 1, y: 1 }}      // to bottom-right
      style={[
        {
          position: 'absolute',
          // inset slightly so edges stay clean
          top: 2, left: 2, right: 2, bottom: 2,
        },
        getBlobStyle(index, size - 4),
      ]}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.accent} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleMapPress}
          activeOpacity={0.7}
        >
          <Map size={24} color={theme.accent} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>Naqiago</Text>
          <Text style={styles.appSubtitle}>Car Wash Services</Text>
        </View>

        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <User size={24} color={theme.accent} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Bubbles */}
      <View style={styles.content}>
        {/* Center bubble */}
        <Animated.View
          style={[
            sized.centerBubble(centerBubbleSize, 0),
            {
              left: getScreenCenter().x - centerBubbleSize / 2,
              top: getScreenCenter().y - centerBubbleSize / 2,
              transform: [
                {
                  scale: Animated.multiply(
                    animations[0].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                    pulseAnimations[0]
                  )
                },
                {
                  translateY: floatingAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8]
                  })
                },
                {
                  rotate: floatingAnimations[0].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['0deg', '1deg', '0deg']
                  })
                }
              ]
            },
          ]}
        >
          {/* shadow plate */}
          <View style={sized.plate(centerBubbleSize, 0)} pointerEvents="none" />
          {/* smooth gradient sheen */}
          <Sheen size={centerBubbleSize} index={0} />

          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onPress={handleCenterPress}
            activeOpacity={0.85}
          >
            {/* icon for basic wash */}
            <Droplets size={28} color={theme.accent} />
            <Text
              style={styles.centerTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              allowFontScaling
            >
              {t('service_basic_title') || 'Basic Wash'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Outer bubbles */}
        {services.map((service, index) => {
          const pos = getBubblePosition(service.angle, outerBubbleSize);
          const Icon = service.icon;
          const anim = animations[index + 1];

          return (
            <Animated.View
              key={service.id}
              style={[
                sized.outerBubble(outerBubbleSize, index + 1),
                pos,
                {
                  transform: [
                    {
                      scale: anim
                        ? Animated.multiply(
                            anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                            pulseAnimations[index + 1]
                          )
                        : pulseAnimations[index + 1],
                    },
                    {
                      translateY: floatingAnimations[index + 1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6]
                      })
                    },
                    {
                      rotate: floatingAnimations[index + 1].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: ['0deg', '0.5deg', '0deg']
                      })
                    }
                  ],
                },
              ]}
            >
              {/* shadow plate */}
              <View style={sized.plate(outerBubbleSize, index + 1)} pointerEvents="none" />
              {/* smooth gradient sheen */}
              <Sheen size={outerBubbleSize} index={index + 1} />

              <TouchableOpacity
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.85}
              >
                {/* icon only */}
                <Icon size={22} color={service.color} />
                <Text
                  style={styles.bubbleTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  allowFontScaling
                >
                  {service.title}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
