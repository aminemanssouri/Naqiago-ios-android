import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Phone, MessageCircle, Star, Sparkles } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { bookingsService, BookingWithDetails } from '../services/bookings';
import { reviewsService } from '../services/reviews';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthNavigation } from '../hooks/useAuthNavigation';

// Note: Worker phone numbers are now fetched from the database via BookingWithDetails.workerPhone

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('all');
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { navigateWithAuth } = useAuthNavigation();

  // State for bookings data
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's bookings
  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    // Always clear any prior error first
    setError(null);
    if (!user?.id) {
      // Not authenticated: redirect to login
      setLoading(false);
      navigation.navigate('Login' as never);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userBookings = await bookingsService.getUserBookings(user.id, 'customer');
      setBookings(userBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: BookingWithDetails['status']) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.15)' : '#fef3c7', color: theme.isDark ? '#fde68a' : '#92400e', borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.25)' : '#fde68a' };
      case 'confirmed':
        return { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe', color: theme.isDark ? '#93c5fd' : '#1e40af', borderColor: theme.isDark ? 'rgba(59,130,246,0.35)' : '#93c5fd' };
      case 'in_progress':
        return { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.18)' : '#d1fae5', color: theme.isDark ? '#6ee7b7' : '#065f46', borderColor: theme.isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0' };
      case 'completed':
        return { backgroundColor: theme.isDark ? 'rgba(148,163,184,0.12)' : '#f3f4f6', color: theme.textPrimary, borderColor: theme.isDark ? 'rgba(148,163,184,0.25)' : '#d1d5db' };
      case 'cancelled':
        return { backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', color: theme.isDark ? '#fca5a5' : '#991b1b', borderColor: theme.isDark ? 'rgba(239,68,68,0.35)' : '#fca5a5' };
      default:
        return { backgroundColor: theme.isDark ? 'rgba(148,163,184,0.12)' : '#f3f4f6', color: theme.textPrimary, borderColor: theme.isDark ? 'rgba(148,163,184,0.25)' : '#d1d5db' };
    }
  };

  const getStatusText = (status: BookingWithDetails['status']) => {
    switch (status) {
      case 'pending':
        return t('status_pending');
      case 'confirmed':
        return t('status_confirmed');
      case 'in_progress':
        return t('status_in_progress');
      case 'completed':
        return t('status_completed');
      case 'cancelled':
        return t('status_cancelled');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filterBookings = (bookings: BookingWithDetails[], filter: string) => {
    switch (filter) {
      case 'upcoming':
        return bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
      case 'active':
        return bookings.filter((b) => b.status === 'in_progress');
      case 'completed':
        return bookings.filter((b) => b.status === 'completed');
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings(bookings, activeTab);

  // Coming Soon modal for Rate Service (fixed light theme, no dark mode)
  const [showRateComingSoon, setShowRateComingSoon] = useState(false);
  // Coming Soon modal for Call/Chat
  const [showContactComingSoon, setShowContactComingSoon] = useState<null | 'call' | 'chat'>(null);

  const handleBookingAction = async (action: string, bookingId: string, booking?: BookingWithDetails) => {
    switch (action) {
      case 'cancel':
        Alert.alert('Cancel Booking', `Cancel booking ${bookingId}?`);
        break;
      case 'reschedule':
        Alert.alert('Reschedule', `Reschedule booking ${bookingId}`);
        break;
      case 'rate':
        if (booking && user?.id) {
          // Check if user can review this booking
          try {
            const canReview = await reviewsService.canReviewBooking(bookingId, user.id);
            if (canReview) {
              (navigation as any).navigate('Review', {
                bookingId: booking.id,
                workerId: booking.worker_id,
                workerName: booking.workerName,
                workerAvatar: booking.workerAvatar,
                workerRating: booking.workerRating,
                bookingNumber: booking.booking_number,
              });
            } else {
              Alert.alert(
                'Cannot Review',
                'You can only review completed bookings within 30 days of completion.'
              );
            }
          } catch (error) {
            console.error('Error checking review permission:', error);
            Alert.alert('Error', 'Unable to open review screen. Please try again.');
          }
        }
        break;
      case 'call':
        if (booking) {
          const phoneNumber = booking.workerPhone;
          if (phoneNumber) {
            const cleanPhoneNumber = phoneNumber.replace(/\s+/g, '');
            const phoneUrl = `tel:${cleanPhoneNumber}`;

            try {
              await Linking.openURL(phoneUrl);
            } catch (error) {
              console.error('Error making phone call:', error);
              try {
                const alternativeUrl = Platform.OS === 'ios'
                  ? `telprompt:${cleanPhoneNumber}`
                  : `tel:${cleanPhoneNumber}`;
                await Linking.openURL(alternativeUrl);
              } catch (secondError) {
                console.error('Alternative phone call failed:', secondError);
                Alert.alert(
                  t('error') || 'Error',
                  `${t('call_failed') || 'Failed to make phone call'}. ${t('copy_number') || 'Please copy the number manually'}: ${phoneNumber}`
                );
              }
            }
          } else {
            Alert.alert(t('error') || 'Error', t('phone_not_available') || 'Phone number not available');
          }
        }
        break;
      case 'chat':
        setShowContactComingSoon('chat');
        break;
    }
  };

  const TabButton = ({ label, value, isActive }: { label: string; value: string; isActive: boolean }) => (
    <Pressable
      style={[styles.tabButton, isActive && styles.activeTab]}
      onPress={() => setActiveTab(value)}
    >
      <Text
        style={[styles.tabText, isActive && styles.activeTabText]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header
        title={t('my_bookings')}
        onBack={() => navigation.goBack()}
      />

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            {t('loading_bookings')}
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textPrimary }]}>
            {error}
          </Text>
          <Button
            onPress={loadBookings}
            variant="secondary"
          >
            <Text>{t('retry')}</Text>
          </Button>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
            <View style={[styles.tabsList, { backgroundColor: theme.isDark ? '#000000' : '#f3f4f6' }]}>
              <TabButton label={t('tab_all')} value="all" isActive={activeTab === 'all'} />
              <TabButton label={t('tab_upcoming')} value="upcoming" isActive={activeTab === 'upcoming'} />
              <TabButton label={t('tab_active')} value="active" isActive={activeTab === 'active'} />
              <TabButton label={t('tab_completed')} value="completed" isActive={activeTab === 'completed'} />
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredBookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color={theme.textSecondary} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('no_bookings_found')}</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  {activeTab === 'all' ? t('no_bookings_yet') : t('no_status_bookings').replace('{status}', t(`tab_${activeTab}` as any))}
                </Text>
                <Button onPress={() => navigation.navigate('Home' as never)} style={styles.bookButton}>
                  <Text style={styles.bookButtonText}>{t('book_a_service')}</Text>
                </Button>
              </View>
            ) : (
              <View style={styles.bookingsList}>
                {filteredBookings.map((booking) => {
                  const statusStyle = getStatusColor(booking.status);
                  return (
                    <Card key={booking.id} style={styles.bookingCard}>
                      {/* Booking Header */}
                      <View style={styles.bookingHeader}>
                        <View style={styles.bookingInfo}>
                          <View style={styles.bookingIdRow}>
                            <Text style={[styles.bookingId, { color: theme.textPrimary }]}>#{booking.booking_number}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor }]}>
                              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                {getStatusText(booking.status)}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.bookingDate, { color: theme.textSecondary }]}>{t('booked_on')} {formatDate(booking.created_at || '')}</Text>
                        </View>
                      </View>

                      {/* Worker Info */}
                      <View style={styles.workerInfo}>
                        <Avatar
                          src={booking.workerAvatar}
                          size={48}
                          fallback={booking.workerName.split(' ').map((n: string) => n[0]).join('')}
                        />
                        <View style={styles.workerDetails}>
                          <Text style={[styles.workerName, { color: theme.textPrimary }]}>{booking.workerName}</Text>
                          <View style={styles.ratingRow}>
                            <Star size={12} color={theme.isDark ? '#fbbf24' : '#fbbf24'} fill={theme.isDark ? '#fbbf24' : '#fbbf24'} />
                            <Text style={[styles.rating, { color: theme.textSecondary }]}>{booking.workerRating}</Text>
                          </View>
                        </View>
                        <View style={styles.priceInfo}>
                          <Text style={[styles.price, { color: theme.accent }]}>{booking.total_price} MAD</Text>
                          <Text style={[styles.carType, { color: theme.textSecondary }]}>{booking.vehicle_type}</Text>
                        </View>
                      </View>

                      <Separator style={styles.separator} />

                      {/* Booking Details */}
                      <View style={styles.bookingDetails}>
                        <View style={styles.detailRow}>
                          <Calendar size={16} color={theme.textSecondary} />
                          <Text style={[styles.detailText, { color: theme.textPrimary }]}>
                            {formatDate(booking.scheduled_date)} at {formatTime(booking.scheduled_time)}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <MapPin size={16} color={theme.textSecondary} />
                          <Text style={[styles.detailText, { color: theme.textPrimary }]}>{booking.service_address_text}</Text>
                        </View>

                        {booking.special_instructions && (
                          <View
                            style={[
                              styles.notesContainer,
                              {
                                backgroundColor: theme.isDark ? 'rgba(148,163,184,0.08)' : '#f9fafb',
                                borderWidth: 1,
                                borderColor: theme.cardBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.notesText, { color: theme.textPrimary }]}>
                              <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>{t('notes')}: </Text>
                              {booking.special_instructions}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Action Buttons */}
                      {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                        <View style={styles.actionButtons}>
                          <Button
                            variant="outline"
                            style={[
                              styles.actionButton,
                              {
                                borderColor: theme.isDark ? theme.cardBorder : '#d1d5db',
                                backgroundColor: theme.isDark ? theme.card : '#ffffff',
                                borderWidth: 1.2,
                              },
                            ]}
                            onPress={() => handleBookingAction('call', booking.id, booking)}
                          >
                            <Phone size={16} color={theme.textPrimary} />
                            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('call')}</Text>
                          </Button>
                          <Button
                            variant="outline"
                            style={[
                              styles.actionButton,
                              {
                                borderColor: theme.isDark ? theme.cardBorder : '#d1d5db',
                                backgroundColor: theme.isDark ? theme.card : '#ffffff',
                                borderWidth: 1.2,
                              },
                            ]}
                            onPress={() => handleBookingAction('chat', booking.id)}
                          >
                            <MessageCircle size={16} color={theme.textPrimary} />
                            <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('chat')}</Text>
                          </Button>
                        </View>
                      )}

                      {booking.status === 'completed' && booking.can_rate && (
                        <Button
                          style={styles.rateButton}
                          onPress={() => handleBookingAction('rate', booking.id, booking)}
                        >
                          <Star size={16} color="#ffffff" />
                          <Text style={styles.rateButtonText}>{t('rate_service')}</Text>
                        </Button>
                      )}

                      {booking.status === 'completed' && !booking.can_rate && (
                        <View style={[styles.reviewedIndicator, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7', borderColor: theme.isDark ? 'rgba(34, 197, 94, 0.35)' : '#22c55e' }]}>
                          <Star size={14} color={theme.isDark ? '#4ade80' : '#16a34a'} fill={theme.isDark ? '#4ade80' : '#16a34a'} />
                          <Text style={[styles.reviewedText, { color: theme.isDark ? '#4ade80' : '#16a34a' }]}>
                            {t('reviewed') || 'Reviewed'}
                          </Text>
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Coming Soon Modal - Light theme only */}
          <Modal visible={showRateComingSoon} transparent animationType="fade" onRequestClose={() => setShowRateComingSoon(false)}>
            <Pressable style={styles.csBackdrop} onPress={() => setShowRateComingSoon(false)}>
              <Pressable style={styles.csCard} onPress={() => { }}>
                <View style={styles.csIconWrap}>
                  <Sparkles size={28} color="#2563eb" />
                </View>
                <Text style={styles.csTitle}>Coming Soon</Text>
                <Text style={styles.csSubtitle}>Ratings and reviews will be available in a future update.</Text>
                <Button style={{ marginTop: 12 }} onPress={() => setShowRateComingSoon(false)}>
                  <Text style={styles.csButtonText}>OK</Text>
                </Button>
              </Pressable>
            </Pressable>
          </Modal>

          {/* Coming Soon Modal for Call/Chat - Light theme only */}
          <Modal visible={!!showContactComingSoon} transparent animationType="fade" onRequestClose={() => setShowContactComingSoon(null)}>
            <Pressable style={styles.csBackdrop} onPress={() => setShowContactComingSoon(null)}>
              <Pressable style={styles.csCard} onPress={() => { }}>
                <View style={styles.csIconWrap}>
                  <Sparkles size={28} color="#2563eb" />
                </View>
                <Text style={styles.csTitle}>Coming Soon</Text>
                <Text style={styles.csSubtitle}>
                  {showContactComingSoon === 'call' ? 'Calling the worker will be available soon.' : 'In-app chat will be available soon.'}
                </Text>
                <Button style={{ marginTop: 12 }} onPress={() => setShowContactComingSoon(null)}>
                  <Text style={styles.csButtonText}>OK</Text>
                </Button>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 0, // Full width for underline tabs
    paddingVertical: 0,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: '#ffffff', // Clean white background
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16, // Taller touch target
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent', // Default transparent
  },
  activeTab: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#800080', // the purple line
    shadowColor: 'transparent',
    elevation: 0,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#800080', // Purple text
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  bookButton: {
    paddingHorizontal: 24,
    height: 48, // Standard height
    minWidth: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  bookingsList: {
    padding: 16,
    gap: 16,
  },
  bookingCard: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookingDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 2,
  },
  carType: {
    fontSize: 14,
    color: '#6b7280',
  },
  separator: {
    marginBottom: 16,
  },
  bookingDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  notesContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  notesLabel: {
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
    textAlign: 'center',
    includeFontPadding: false,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
  },
  rateButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
    includeFontPadding: false,
  },
  csBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  csCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  csIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  csTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  csSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  csButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  reviewedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BookingsScreen;
