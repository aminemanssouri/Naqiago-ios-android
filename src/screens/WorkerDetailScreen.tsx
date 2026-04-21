import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Pressable, 
  Platform, 
  Linking, 
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { Calendar, Clock, MapPin, Star, Phone, MessageCircle, ChevronLeft, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/ui/Header';
import { BookingFooter } from '../components/ui/BookingFooter';

import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { workersService, Worker, Review } from '../services/workers';


export default function WorkerDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WorkerDetail'>>();
  const { workerId } = route.params;
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  


  useEffect(() => {
    // Only load worker data if user is authenticated
    if (user) {
      loadWorkerData();
    } else {
      // Set loading to false for non-authenticated users
      setLoading(false);
    }
  }, [workerId, user]);

  const loadWorkerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const workerData = await workersService.getWorkerById(workerId);
      if (workerData) {
        console.log('WorkerDetail: Loaded worker data:', {
          name: workerData.name,
          avatar: workerData.avatar,
          avatarType: typeof workerData.avatar
        });
        setWorker(workerData);
        
        // Load reviews separately
        setLoadingReviews(true);
        try {
          const reviewsData = await workersService.getWorkerReviews(workerId);
          setReviews(reviewsData);
        } catch (reviewError) {
          console.warn('Error loading reviews:', reviewError);
        } finally {
          setLoadingReviews(false);
        }
      } else {
        setError(t('worker_not_found'));
      }
    } catch (err) {
      console.error('Error loading worker:', err);
      setError(t('error_loading_worker') || 'Failed to load worker details');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  // Show sign-in prompt for non-authenticated users FIRST
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Header 
          title={t('worker_profile')} 
          onBack={() => navigation.goBack()} 
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Sign In Prompt Card */}
          <Card style={[styles.signInCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
            <View style={styles.signInContent}>
              <Text style={[styles.signInTitle, { color: theme.textPrimary }]}>
                {t('sign in') || 'Sign in to view full profile'}
              </Text>
              <Text style={[styles.signInMessage, { color: theme.textSecondary }]}>
                {t('sign in profile message') || 'Please sign in to view worker details, contact information, and book services.'}
              </Text>
              <Button 
                onPress={handleSignIn}
                style={styles.signInButton}
              >
                <Text style={styles.signInButtonText}>{t('sign_in') || 'Sign In'}</Text>
              </Button>
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Header 
          title={t('worker_profile')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t('loading')}...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !worker) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Header 
          title={t('worker_profile')} 
          onBack={() => navigation.goBack()} 
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
            {error || t('worker_not_found')}
          </Text>
          <Button onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>{t('go_back')}</Text>
          </Button>
        </View>
      </View>
    );
  }

  const handleBookNow = () => {
    // Navigate directly to booking - user will select service in the booking flow
    navigation.navigate('Booking', {
      workerId: workerId,
      serviceKey: 'basic' // Default service, user can change in booking flow
    } as any);
  };


  const handleCall = async () => {
    if (!worker.phone) {
      Alert.alert(
        t('no_phone') || 'No Phone Number',
        t('phone_not_available') || 'Phone number is not available for this worker.'
      );
      return;
    }

    const phoneNumber = worker.phone.replace(/\s+/g, ''); // Remove spaces
    const phoneUrl = `tel:${phoneNumber}`;
    
    try {
      // Try to open the phone dialer directly
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Error making phone call:', error);
      // If tel: doesn't work, try alternative approaches
      try {
        // Try with different phone URL formats
        const alternativeUrl = Platform.OS === 'ios' 
          ? `telprompt:${phoneNumber}` 
          : `tel:${phoneNumber}`;
        await Linking.openURL(alternativeUrl);
      } catch (secondError) {
        console.error('Alternative phone call failed:', secondError);
        Alert.alert(
          t('error') || 'Error', 
          `${t('call_failed') || 'Failed to make phone call'}. ${t('copy_number') || 'Please copy the number manually'}: ${worker.phone}`
        );
      }
    }
  };

  const handleChat = () => {
    navigation.navigate('ComingSoon', { feature: 'Messaging' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('worker_profile')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Worker Info Card */}
        <Card style={[styles.workerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.workerHeader}>
            {/* Avatar with Distance */}
            <View style={styles.avatarSection}>
              <Avatar 
                src={worker.avatar || undefined} 
                name={worker.name} 
                size={80} 
              />
              <View style={styles.distanceContainer}>
                <MapPin size={14} color={theme.accent} />
                <Text style={[styles.distanceText, { color: theme.textPrimary }]}>
                  {worker.distanceKm ? `${worker.distanceKm.toFixed(1)} km` : 'Nearby'}
                </Text>
              </View>
            </View>
            
            {/* Worker Info with Time */}
            <View style={styles.workerInfo}>
              <View style={styles.workerNameRow}>
                <View style={styles.workerNameContainer}>
                  <Text style={[styles.workerName, { color: theme.textPrimary }]}>{worker.name}</Text>
                  {worker.businessName && (
                    <Text style={[styles.businessName, { color: theme.textSecondary }]}>{worker.businessName}</Text>
                  )}
                  <View style={styles.ratingRow}>
                    <View style={styles.ratingContainer}>
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text style={[styles.rating, { color: theme.textPrimary }]}>{worker.rating}</Text>
                      <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>({worker.reviewCount} {language === 'fr' ? 'avis' : 'reviews'})</Text>
                    </View>
                  </View>
                </View>
                <Badge variant={worker.status === 'available' ? "default" : "secondary"}>
                  {worker.status === 'available' ? (language === 'fr' ? 'Disponible' : 'Available') : (language === 'fr' ? 'Occupé' : 'Busy')}
                </Badge>
              </View>

              {/* Modern Time Display */}
              <View style={styles.modernTimeContainer}>
                <View style={styles.timeChip}>
                  <Clock size={14} color={theme.accent} />
                  <Text style={[styles.timeChipText, { color: theme.textPrimary }]}>
                    {worker.startTime}
                  </Text>
                  <View style={[styles.timeChipSeparator, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.timeChipText, { color: theme.textPrimary }]}>
                    {worker.endTime}
                  </Text>
                </View>
                <Text style={[styles.modernTimeLabel, { color: theme.textSecondary }]}>
                  Available Today
                </Text>
              </View>
            </View>
          </View>

          <Separator style={styles.separator} />

          <View style={styles.statsGrid}>
            <View style={styles.statColumn}>
              <Text 
                style={[styles.statNumber, { color: theme.accent }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {worker.totalJobsCompleted}
              </Text>
              <Text 
                style={[styles.statLabel, { color: theme.textSecondary }]} 
                numberOfLines={2} 
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('jobs_done')}
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text 
                style={[styles.statNumber, { color: theme.accent }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {worker.experienceYears || 0}
              </Text>
              <Text 
                style={[styles.statLabel, { color: theme.textSecondary }]} 
                numberOfLines={2} 
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('experience')}
              </Text>
            </View>
            <View style={styles.statColumn}>
              <Text 
                style={[styles.statNumber, { color: theme.accent }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {worker.hourlyRate != null && worker.hourlyRate > 0
                  ? `${worker.hourlyRate} MAD/h`
                  : '—'}
              </Text>
              <Text 
                style={[styles.statLabel, { color: theme.textSecondary }]} 
                numberOfLines={2} 
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('starting_price')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Description */}
        {worker.bio && (
          <Card style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('about_worker').replace(' {name}', '')}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{worker.bio}</Text>
          </Card>
        )}

        {/* Services Offered */}
        {((worker as any).detailedServices && (worker as any).detailedServices.length > 0) ? (
          <Card style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('services_offered') || 'Services Offered'}</Text>
            <View style={styles.servicesContainer}>
              {(worker as any).detailedServices.map((service: any, index: number) => (
                <View key={service.id || index} style={[styles.serviceItem, { borderColor: theme.cardBorder }]}>
                  <View style={styles.serviceHeader}>
                    <Text style={[styles.serviceTitle, { color: theme.textPrimary }]}>{service.title}</Text>
                    <View style={styles.servicePricing}>
                      <Text style={[styles.servicePrice, { color: theme.accent }]}>
                        {service.customPrice ? `${service.customPrice} MAD` : `${service.basePrice} MAD`}
                      </Text>
                      {service.duration && (
                        <Text style={[styles.serviceDuration, { color: theme.textSecondary }]}>
                          {service.duration}min
                        </Text>
                      )}
                    </View>
                  </View>
                  {service.description && (
                    <Text style={[styles.serviceDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </Card>
        ) : worker.specialties && worker.specialties.length > 0 ? (
          <Card style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('specialties') || 'Specialties'}</Text>
            <View style={styles.specialtiesContainer}>
              {worker.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" style={styles.specialtyBadge}>
                  {specialty}
                </Badge>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Reviews */}
        <Card style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('reviews_and_ratings')}</Text>
          <View style={styles.reviewsContainer}>
            {loadingReviews ? (
              <View style={styles.reviewsPlaceholder}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.reviewsPlaceholderText, { color: theme.textSecondary, marginTop: 8 }]}>
                  {t('loading_reviews') || 'Loading reviews...'}
                </Text>
              </View>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.cardBorder }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Text style={[styles.reviewerName, { color: theme.textPrimary }]}>{review.customerName}</Text>
                      <View style={styles.reviewRating}>
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />
                        ))}
                      </View>
                      {review.isVerified && (
                        <View style={styles.verifiedBadge}>
                          <Check size={10} color="#10b981" />
                          <Text style={[styles.verifiedText, { color: '#10b981' }]}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.reviewDate, { color: theme.textSecondary }]}>{review.date}</Text>
                  </View>
                  {review.comment && (
                    <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>{review.comment}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.reviewsPlaceholder}>
                <Text style={[styles.reviewsPlaceholderText, { color: theme.textSecondary }]}>
                  {t('no_reviews_yet') || 'No reviews yet.'}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Contact Actions */}
        <View style={styles.contactSection}>
          <View style={styles.contactButtons}>
            <Button 
              variant="outline" 
              style={[styles.contactButton, { borderColor: theme.cardBorder }]}
              onPress={handleChat}
            >
              <MessageCircle size={18} color={theme.textPrimary} />
              <Text style={[styles.contactButtonText, { color: theme.textPrimary }]}>{t('chat')}</Text>
            </Button>
            
            <Button 
              variant="outline" 
              style={[styles.contactButton, { borderColor: theme.cardBorder }]}
              onPress={handleCall}
            >
              <Phone size={18} color={theme.textPrimary} />
              <Text style={[styles.contactButtonText, { color: theme.textPrimary }]}>{t('call')}</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        onContinue={handleBookNow}
        continueText={t('book_now')} 
        continueDisabled={!worker.isAvailable}
        showBackButton={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workerCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  workerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workerNameContainer: {
    flex: 1,
  },
  workerName: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  businessName: {
    fontSize: 14,
    marginTop: 2,
  },
  ratingRow: {
    marginTop: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6b7280',
    flexShrink: 1,
  },
  workerStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: 6,
  },
  timeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    marginLeft: 16,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  timeSeparator: {
    width: 12,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  modernTimeContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    gap: 6,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  timeChipSeparator: {
    width: 8,
    height: 2,
    borderRadius: 1,
    opacity: 0.7,
  },
  modernTimeLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    marginLeft: 2,
  },
  separator: {
    marginVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 12,
    minHeight: 85,
    justifyContent: 'center',
    maxWidth: '33%',
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  contactSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  servicesContainer: {
    gap: 12,
  },
  serviceItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  servicePricing: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 12,
    fontWeight: '500',
    flexWrap: 'wrap',
    width: '100%',
  },
  descriptionCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    marginBottom: 8,
  },
  reviewsCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  bookButton: {
    height: 48,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  reviewsContainer: {
    padding: 16,
  },
  reviewsPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  reviewsPlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  signInCard: {
    margin: 16,
    marginTop: 24,
  },
  signInContent: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  signInMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInButton: {
    marginTop: 8,
    width: '100%',
    height: 48,
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },

});