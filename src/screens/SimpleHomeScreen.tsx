import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { Droplets, Sparkles, Clock, ChevronRight } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function SimpleHomeScreen() {
  const theme = useThemeColors();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  // Basic car wash service
  const basicService = {
    id: 'basic-wash',
    title: t('service_basic_title') || 'Basic Wash',
    description: t('service_basic_desc') || 'Exterior wash and dry',
    duration: '30 min',
    icon: Droplets,
  };

  const handleBookService = () => {
    if (!user) {
      navigation.navigate('Login' as never);
      return;
    }
    // Navigate to services screen to select vehicle type and continue booking
    navigation.navigate('Services' as never);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: theme.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder,
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.textPrimary,
          marginBottom: 4,
        }}>
          {t('welcome_back')}
        </Text>
        <Text style={{
          fontSize: 16,
          color: theme.textSecondary,
        }}>
          {user?.profile?.full_name || user?.email || ''}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Card style={{
          padding: 24,
          marginBottom: 24,
          backgroundColor: theme.accent,
          borderColor: theme.accent,
        }}>
          <View style={{ alignItems: 'center' }}>
            <Sparkles size={48} color="#ffffff" />
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#ffffff',
              marginTop: 16,
              textAlign: 'center',
            }}>
              Professional Car Wash
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#ffffff',
              opacity: 0.9,
              marginTop: 8,
              textAlign: 'center',
            }}>
              We bring the car wash to you
            </Text>
          </View>
        </Card>

        {/* Basic Service Card */}
        <Card style={{
          padding: 0,
          marginBottom: 24,
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          overflow: 'hidden',
        }}>
          {/* Service Header */}
          <View style={{
            padding: 20,
            backgroundColor: theme.surface,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.accent + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <basicService.icon size={24} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: theme.textPrimary,
                }}>
                  {basicService.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  marginTop: 2,
                }}>
                  {basicService.description}
                </Text>
              </View>
            </View>
          </View>

          {/* Service Details */}
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock size={20} color={theme.accent} />
                  <Text style={{
                    fontSize: 14,
                    color: theme.textSecondary,
                    marginLeft: 8,
                  }}>
                    Duration
                  </Text>
                </View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: theme.textPrimary,
                  marginTop: 4,
                }}>
                  {basicService.duration}
                </Text>
              </View>
            </View>

            {/* What's Included */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.textPrimary,
                marginBottom: 12,
              }}>
                {t('whats_included')}
              </Text>
              {[
                t('include_line_1') || '• High-pressure rinse',
                t('include_line_2') || '• pH-neutral shampoo',
                t('include_line_3') || '• Soft microfiber hand wash and dry',
                t('include_line_4') || '• Windows and mirrors cleaning',
                t('include_line_5') || '• Tyre shine and exterior finishing',
              ].map((item, index) => (
                <Text key={index} style={{
                  fontSize: 14,
                  color: theme.textSecondary,
                  marginBottom: 8,
                  lineHeight: 20,
                }}>
                  {item}
                </Text>
              ))}
            </View>

            {/* Book Button */}
            <Button
              onPress={handleBookService}
              style={{
                backgroundColor: theme.accent,
                height: 56,
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                {t('book_now')}
              </Text>
              <ChevronRight size={20} color="#ffffff" />
            </Button>
          </View>
        </Card>

        {/* Browse All Services */}
        <Pressable
          onPress={() => navigation.navigate('Services' as never)}
          style={{
            padding: 20,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.textPrimary,
              marginBottom: 4,
            }}>
              {t('services_title')}
            </Text>
            <Text style={{
              fontSize: 14,
              color: theme.textSecondary,
            }}>
              Explore all our services
            </Text>
          </View>
          <ChevronRight size={24} color={theme.textSecondary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
