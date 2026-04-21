import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useThemeColors } from '../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { servicesService } from '../services';
import type { ServiceItem } from '../services/services';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { Droplets, Sparkles, Wrench, Brush, SprayCan, CheckCircle, Clock, Star } from 'lucide-react-native';

// Enhanced service interface (ServiceItem already includes inclusions)
interface EnhancedServiceItem extends ServiceItem {
  // ServiceItem already has inclusions, notes, and imageUrl
}

export default function ServiceDetailScreen() {
  const theme = useThemeColors();
  const route = useRoute<RouteProp<RootStackParamList, 'ServiceDetail'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { serviceKey } = route.params || ({} as any);
  const { t } = useLanguage();

  const [service, setService] = useState<EnhancedServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getServiceIconComponent = (s: ServiceItem) => {
    const key = (s.key || '').toLowerCase();
    const title = (s.title || '').toLowerCase();
    const desc = (s.desc || '').toLowerCase();
    const haystack = `${key} ${title} ${desc}`;

    if (
      haystack.includes('interior') ||
      haystack.includes('intérieur') ||
      haystack.includes('inside') ||
      haystack.includes('siège') ||
      haystack.includes('seat') ||
      haystack.includes('vacuum')
    ) {
      return Brush;
    }

    if (
      haystack.includes('exterior') ||
      haystack.includes('extérieur') ||
      haystack.includes('outside') ||
      haystack.includes('body') ||
      haystack.includes('carrosserie')
    ) {
      return SprayCan;
    }

    if (haystack.includes('wax') || haystack.includes('cire') || haystack.includes('polish') || haystack.includes('lustr')) {
      return Sparkles;
    }

    if (haystack.includes('engine') || haystack.includes('moteur') || haystack.includes('repair') || haystack.includes('maintenance')) {
      return Wrench;
    }

    if (haystack.includes('premium')) {
      return Sparkles;
    }

    if (haystack.includes('complet') || haystack.includes('complete')) {
      return Brush;
    }

    if (haystack.includes('extra') || haystack.includes('spécial') || haystack.includes('special')) {
      return SprayCan;
    }

    if (haystack.includes('lavage') || haystack.includes('wash') || haystack.includes('clean')) {
      return Droplets;
    }

    switch (s.category) {
      case 'basic':
        return Droplets;
      case 'deluxe':
        return Brush;
      case 'premium':
        return Sparkles;
      case 'specialty':
        return SprayCan;
      default:
        return Wrench;
    }
  };

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'droplets': return Droplets;
      case 'sparkles': return Sparkles;
      case 'wrench': return Wrench;
      case 'brush': return Brush;
      case 'spraycan': return SprayCan;
      case 'check-all': case 'checkcircle': return CheckCircle;
      case 'clock': return Clock;
      case 'star': return Star;
      default: return Wrench;
    }
  };

  // Load service details from Supabase
  useEffect(() => {
    loadServiceDetails();
  }, [serviceKey]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const serviceData = await servicesService.getServiceByKey(serviceKey);
      
      if (!serviceData) {
        setError('Service not found');
        return;
      }
      
      // Debug logging to see what inclusions data we received
      console.log('ServiceDetailScreen: Loaded service data:', {
        title: serviceData.title,
        inclusions: serviceData.inclusions,
        inclusionsLength: serviceData.inclusions?.length || 0,
        inclusionsType: typeof serviceData.inclusions,
        notes: serviceData.notes
      });
      
      setService(serviceData as EnhancedServiceItem);
    } catch (err: any) {
      console.error('Error loading service details:', err);
      setError(err.message || 'Failed to load service details');
      Alert.alert(
        t('error_loading_service'),
        err.message || 'Failed to load service details. Please try again.',
        [
          { text: t('retry'), onPress: loadServiceDetails },
          { text: t('go_back'), onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const Icon = service ? getServiceIconComponent(service) : Wrench;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('service_details')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state or service not found
  if (error || !service) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('service_details')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state or service not found
  if (error || !service) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('service details')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ fontSize: 16, color: theme.textPrimary, marginBottom: 12 }}>
            {error || t('service_not_found')}
          </Text>
          <Button onPress={loadServiceDetails} style={{ marginBottom: 8 }}>{t('retry')}</Button>
          <Button variant="outline" onPress={() => navigation.goBack()}>{t('go_back')}</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header 
        title={t('service details')} 
        onBack={() => navigation.goBack()} 
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Service Image */}
        {service.imageUrl && (
          <Image 
            source={{ uri: service.imageUrl }} 
            style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }}
            resizeMode="cover"
          />
        )}

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Icon size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.textPrimary }}>{service.title}</Text>
            <Text style={{ marginTop: 4, color: theme.textSecondary }}>{service.desc}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Clock size={14} color={theme.textSecondary} />
              <Text style={{ marginLeft: 4, color: theme.textSecondary, fontSize: 12 }}>
                {service.durationMinutes} minutes
              </Text>
            </View>
          </View>
        </View>

        {/* What's Included */}
        <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: 12 }}>{t('whats_included')}</Text>
          
          {service.inclusions && service.inclusions.length > 0 ? (
            service.inclusions.map((item: any, index: number) => {
              // Handle both string array format and object format
              const inclusionText = typeof item === 'string' ? item : item.title;
              const isObject = typeof item === 'object' && item !== null;
              const ItemIcon = isObject ? getIconComponent(item.icon) : CheckCircle;
              
              return (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingVertical: 4 }}>
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: theme.accent + '15', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 12 
                  }}>
                    <ItemIcon size={16} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary, lineHeight: 20 }}>
                      {inclusionText}
                    </Text>
                    {isObject && item.description && (
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, lineHeight: 16 }}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
                {t('no_inclusions_available')}
              </Text>
            </View>
          )}
        </View>

        {/* Service Notes */}
        {service.notes && (
          <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 8 }}>{t('notes')}</Text>
            <Text style={{ color: theme.textSecondary, lineHeight: 20 }}>
              {service.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
<View style={[styles.actionsContainer, { marginTop: 16, gap: 12 }]}>
  <Button 
    style={styles.actionButton} 
    onPress={() => navigation.navigate('BookingDateTime')}
  >
    <Text style={styles.actionButtonText}>{t('book_this_service')}</Text>
  </Button>

  <Button 
    variant="outline"
    style={styles.actionButton} 
    onPress={() => navigation.goBack()}
  >
    <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('go_back')}</Text>
  </Button>

</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
