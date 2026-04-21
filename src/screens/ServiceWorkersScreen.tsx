import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../lib/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { servicesService } from '../services';
import { workersService } from '../services';
import type { Worker } from '../services/workers';
import type { ServiceItem } from '../services/services';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Star, Clock } from 'lucide-react-native';

export default function ServiceWorkersScreen() {
  const theme = useThemeColors();
  const route = useRoute<RouteProp<RootStackParamList, 'ServiceWorkers'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { serviceKey } = route.params || ({} as any);
  const { t } = useLanguage();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load service and workers data
  useEffect(() => {
    loadData();
  }, [serviceKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load service details
      const serviceData = await servicesService.getServiceByKey(serviceKey);
      console.log('🔍 ServiceWorkersScreen - Loaded service:', serviceData);
      console.log('🔍 ServiceWorkersScreen - Service ID:', serviceData?.id);
      setService(serviceData);
      
      if (!serviceData) {
        setError(t('service_not_found'));
        return;
      }
      
      // Load workers for this service
      const workersData = await workersService.getWorkersByService(serviceKey);
      setWorkers(workersData);
      
    } catch (err: any) {
      console.error('Error loading service workers:', err);
      setError(err.message || t('failed_to_load_workers'));
      Alert.alert(
        t('error_loading_workers'),
        err.message || t('failed_to_load_workers'),
        [
          { text: t('retry'), onPress: loadData },
          { text: t('go_back'), onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('providers')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 16 }}>{t('loading_workers')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
        <Header 
          title={t('providers')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Text style={{ fontSize: 16, color: theme.textPrimary, marginBottom: 12 }}>
            {error || t('service_not_found')}
          </Text>
          <Button onPress={loadData} style={{ marginBottom: 8 }}>{t('retry')}</Button>
          <Button variant="outline" onPress={() => navigation.goBack()}>{t('go_back')}</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header 
        title={`${t('providers')} - ${service.title}`} 
        onBack={() => navigation.goBack()} 
      />

      <FlatList
        data={workers}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 16 }}>
              {t('no_providers_found')}
            </Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
              {t('try_checking_back_later')}
            </Text>
            <Button onPress={loadData} style={{ marginTop: 16 }}>{t('refresh')}</Button>
          </View>
        }
        renderItem={({ item: worker }) => (
          <View style={{ backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row' }}>
              {/* Worker Avatar */}
              <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: theme.overlay, marginRight: 12 }}>
                {worker.avatar ? (
                  <Image source={{ uri: worker.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 20, fontWeight: '600' }}>
                      {worker.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={{ flex: 1 }}>
                {/* Worker Name and Business */}
                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 16 }}>{worker.name}</Text>
                {worker.businessName && (
                  <Text style={{ color: theme.textSecondary, marginTop: 2, fontSize: 14 }}>{worker.businessName}</Text>
                )}
                
                {/* Rating and Reviews */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Star size={14} color={theme.accent} fill={theme.accent} />
                  <Text style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 14 }}>
                    {worker.rating.toFixed(1)} ({worker.reviewCount} {t('reviews')})
                  </Text>
                </View>
                
                {/* Experience and Status */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {worker.experienceYears && (
                    <>
                      <Clock size={14} color={theme.textSecondary} />
                      <Text style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 12 }}>
                        {worker.experienceYears} {t('years_exp')}
                      </Text>
                    </>
                  )}
                  {worker.distanceKm !== undefined && (
                    <>
                      <Text style={{ color: theme.textSecondary, marginHorizontal: 8 }}>•</Text>
                      <MapPin size={14} color={theme.textSecondary} />
                      <Text style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 12 }}>
                        {worker.distanceKm.toFixed(1)} km
                      </Text>
                    </>
                  )}
                </View>
              </View>
              
              {/* Status Badge */}
              <View style={{ 
                backgroundColor: worker.isAvailable ? '#22C55E20' : '#EF444420', 
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 12,
                alignSelf: 'flex-start'
              }}>
                <Text style={{ 
                  color: worker.isAvailable ? '#22C55E' : '#EF4444', 
                  fontSize: 12, 
                  fontWeight: '600' 
                }}>
                  {worker.isAvailable ? t('available') : t('busy')}
                </Text>
              </View>
            </View>
            
            {/* Services */}
            {worker.services.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>{t('services_label')}</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 14 }}>{worker.services.join(' • ')}</Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <Button 
                size="sm" 
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('WorkerDetail', { workerId: worker.id })}
              >
                {t('view_details')}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => {
                  console.log('🔍 Navigating to Booking with:', { 
                    workerId: worker.id, 
                    serviceId: service?.id,
                    serviceKey: serviceKey,
                    serviceName: service?.title
                  });
                  
                  if (!service?.id) {
                    Alert.alert(t('error'), t('service_not_loaded_properly'));
                    return;
                  }
                  
                  navigation.navigate('Booking', { 
                    workerId: worker.id, 
                    serviceId: service.id,
                    serviceKey: serviceKey 
                  } as any);
                }}
                disabled={!worker.isAvailable}
              >
                <Text style={{ textAlign: 'center', color: theme.isDark ? '#ffffff' : theme.textPrimary }}>{t('book_now')}</Text>
              </Button>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
