import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Calendar, DollarSign, Star, Clock, MapPin, TrendingUp, Eye, ChevronRight, BarChart3, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { bookingsService, BookingWithDetails } from '../services/bookings';

export const WorkerDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useThemeColors();
  const { user } = useAuth();
  const { t } = useLanguage();


  // State for real data
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    rating: 4.8, // Default rating
    completedJobs: 0,
    pendingBookings: 0,
    activeBookings: 0,
    totalCustomers: 0,
    avgJobTime: 45, // Default
  });

  // Load worker's bookings and calculate stats
  useEffect(() => {
    loadWorkerData();
  }, [user]);

  const loadWorkerData = async () => {
    if (!user?.id) {
      setError(t('user_not_authenticated'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get worker's bookings
      const workerBookings = await bookingsService.getUserBookings(user.id, 'worker');
      setBookings(workerBookings);
      
      // Calculate stats from bookings
      calculateStats(workerBookings);
      
    } catch (error) {
      console.error('Error loading worker data:', error);
      setError(t('failed_load_worker_data'));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookings: BookingWithDetails[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completed = bookings.filter(b => b.status === 'completed');
    const pending = bookings.filter(b => b.status === 'pending');
    const active = bookings.filter(b => b.status === 'in_progress' || b.status === 'confirmed');

    // Calculate earnings
    const todayEarnings = completed
      .filter(b => b.completed_at && new Date(b.completed_at) >= today)
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    
    const weeklyEarnings = completed
      .filter(b => b.completed_at && new Date(b.completed_at) >= weekStart)
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    
    const monthlyEarnings = completed
      .filter(b => b.completed_at && new Date(b.completed_at) >= monthStart)
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const uniqueCustomers = new Set(bookings.map(b => b.customer_id)).size;

    setStats({
      todayEarnings,
      weeklyEarnings,
      monthlyEarnings,
      rating: 4.8, // TODO: Calculate from reviews
      completedJobs: completed.length,
      pendingBookings: pending.length,
      activeBookings: active.length,
      totalCustomers: uniqueCustomers,
      avgJobTime: 45, // TODO: Calculate from booking durations
    });
  };



  const handleAcceptBooking = async (bookingId: string) => {
    Alert.alert(
      t('accept_booking'),
      t('accept_booking_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('accept'), 
          onPress: async () => {
            try {
              await bookingsService.updateBookingStatus(bookingId, 'confirmed', user?.id);
              Alert.alert(t('success'), t('booking_accepted'));
              loadWorkerData(); // Refresh data
            } catch (error) {
              console.error('Error accepting booking:', error);
              Alert.alert(t('error'), t('failed_accept_booking'));
            }
          }
        }
      ]
    );
  };

  const handleRejectBooking = async (bookingId: string) => {
    Alert.alert(
      t('reject_booking'),
      t('reject_booking_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('reject'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await bookingsService.updateBookingStatus(bookingId, 'cancelled', user?.id);
              Alert.alert(t('rejected'), t('booking_rejected'));
              loadWorkerData(); // Refresh data
            } catch (error) {
              console.error('Error rejecting booking:', error);
              Alert.alert(t('error'), t('failed_reject_booking'));
            }
          }
        }
      ]
    );
  };

  const handleCompleteBooking = async (bookingId: string) => {
    Alert.alert(
      t('complete_booking'),
      t('complete_booking_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('complete'), 
          onPress: async () => {
            try {
              await bookingsService.updateBookingStatus(bookingId, 'completed', user?.id);
              Alert.alert(t('success'), t('booking_completed'));
              loadWorkerData(); // Refresh data
            } catch (error) {
              console.error('Error completing booking:', error);
              Alert.alert(t('error'), t('failed_complete_booking'));
            }
          }
        }
      ]
    );
  };

  const handleStartBooking = async (bookingId: string) => {
    Alert.alert(
      t('start_booking'),
      t('start_booking_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('start'), 
          onPress: async () => {
            try {
              await bookingsService.updateBookingStatus(bookingId, 'in_progress', user?.id);
              Alert.alert(t('success'), t('booking_started'));
              loadWorkerData(); // Refresh data
            } catch (error) {
              console.error('Error starting booking:', error);
              Alert.alert(t('error'), t('failed_start_booking'));
            }
          }
        }
      ]
    );
  };

  const handleAtPointBooking = async (bookingId: string) => {
    Alert.alert(
      t('arrived_at_location'),
      t('confirm_arrival'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: async () => {
            try {
              await bookingsService.updateBookingStatus(bookingId, 'at_point', user?.id);
              Alert.alert(t('success'), t('arrival_confirmed'));
              loadWorkerData(); // Refresh data
            } catch (error) {
              console.error('Error marking at point:', error);
              Alert.alert(t('error'), t('failed_mark_arrival'));
            }
          }
        }
      ]
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };



  const BookingCard = ({ 
    booking, 
    type, 
    theme, 
    onAccept, 
    onReject, 
    onComplete, 
    onStart,
    onAtPoint
  }: { 
    booking: BookingWithDetails; 
    type: 'pending' | 'active' | 'completed'; 
    theme: any;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onComplete: (id: string) => void;
    onStart: (id: string) => void;
    onAtPoint: (id: string) => void;
  }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.customerInfo}>
          <Avatar
            size={40}
            fallback={booking.customerName.split(' ').map((n: string) => n[0]).join('')}
          />
          <View style={styles.customerDetails}>
            <Text style={[styles.customerName, { color: theme.textPrimary }]}>{booking.customerName}</Text>
            <Text style={[styles.serviceType, { color: theme.textSecondary }]}>{booking.serviceName}</Text>
          </View>
        </View>
        <Text style={[styles.price, { color: theme.accent }]}>{booking.total_price} MAD</Text>
      </View>

      <Separator style={styles.bookingSeparator} />

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <MapPin size={16} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{booking.service_address_text}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Clock size={16} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {type === 'completed' 
              ? `${t('completed')} ${formatDate(booking.completed_at || '')} ${t('at')} ${formatTime(booking.completed_at || '')}`
              : `${formatDate(booking.scheduled_date)} ${t('at')} ${formatTime(booking.scheduled_time)}`
            }
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Phone size={16} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{t('customer_contact_info')}</Text>
        </View>

        {type === 'completed' && booking.workerRating && (
          <View style={styles.detailRow}>
            <Star size={16} color={theme.accent} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {t('rating')}: {booking.workerRating}/5 {t('rating_stars')}
            </Text>
          </View>
        )}
      </View>

      {type === 'pending' && (
        <View style={styles.bookingActions}>
          <Button
            variant="secondary"
            onPress={() => handleAcceptBooking(booking.id)}
            style={[styles.actionButton, styles.acceptButton]}
          >
            <CheckCircle size={16} color="#ffffff" />
            <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>{t('accept')}</Text>
          </Button>
        </View>
      )}

      {type === 'active' && (
        <View style={styles.bookingActions}>
          {booking.status === 'confirmed' && (
            <Button
              onPress={() => onStart(booking.id)}
              style={[styles.actionButton, styles.acceptButton]}
            >
              <CheckCircle size={16} color="#ffffff" />
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>{t('start')}</Text>
            </Button>
          )}
          {booking.status === 'in_progress' && (
            <Button
              onPress={() => onAtPoint(booking.id)}
              style={[styles.actionButton, styles.acceptButton]}
            >
              <MapPin size={16} color="#ffffff" />
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>{t('at_point')}</Text>
            </Button>
          )}
          {booking.status === 'at_point' && (
            <Button
              onPress={() => onComplete(booking.id)}
              style={[styles.actionButton, styles.completeButton]}
            >
              <CheckCircle size={16} color="#ffffff" />
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>{t('mark_complete')}</Text>
            </Button>
          )}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <Header
        title={t('worker_dashboard')}
        onBack={() => navigation.navigate('WorkerBookings' as never)}
        showBackButton
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Text style={[styles.welcomeText, { color: theme.textPrimary }]}>
            {t('welcome_back_worker')}, {user?.profile?.full_name || t('worker_dashboard')}!
          </Text>
          <Text style={[styles.welcomeSubtext, { color: theme.textSecondary }]}>
            {t('dashboard_overview')}
          </Text>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <DollarSign size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.todayEarnings} MAD</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('todays_earnings')}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Calendar size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.weeklyEarnings} MAD</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('this_week')}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Star size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.rating}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('rating')}</Text>
          </Card>

          <Card style={styles.statCard}>
            <CheckCircle size={24} color={theme.accent} />
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stats.completedJobs}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('jobs_done')}</Text>
          </Card>
        </View>

        {/* Loading State */}
        {loading && (
          <Card style={styles.bookingsCard}>
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.emptyStateText, { color: theme.textPrimary }]}>{t('loading_bookings')}</Text>
            </View>
          </Card>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card style={styles.bookingsCard}>
            <View style={styles.emptyState}>
              <AlertCircle size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.textPrimary }]}>{error}</Text>
              <Button onPress={loadWorkerData} variant="secondary">
                <Text>{t('retry')}</Text>
              </Button>
            </View>
          </Card>
        )}

        {/* Bookings Management - Navigation Card */}
        <Pressable 
          style={({ pressed }) => [
            styles.bookingsNavigationCard,
            { 
              backgroundColor: theme.card, 
              borderColor: theme.cardBorder,
              opacity: pressed ? 0.7 : 1 
            }
          ]}
          onPress={() => navigation.navigate('WorkerBookings' as never)}
        >
          <View style={styles.bookingsNavContent}>
            <View style={styles.bookingsNavLeft}>
              <View style={[styles.bookingsNavIcon, { backgroundColor: `${theme.accent}15` }]}>
                <Calendar size={24} color={theme.accent} />
              </View>
              <View style={styles.bookingsNavTextContainer}>
                <Text style={[styles.bookingsNavTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                  {t('manage_bookings')}
                </Text>
                <Text style={[styles.bookingsNavSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {t('view_manage_all_bookings')}
                </Text>
              </View>
            </View>
            <View style={styles.bookingsNavArrow}>
              <ChevronRight size={20} color={theme.textSecondary} />
            </View>
          </View>
        </Pressable>

        {/* Recent Activity */}
        <Card style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('recent_activity')}</Text>
            <Pressable onPress={() => navigation.navigate('WorkerBookings' as never)}>
              <Text style={[styles.viewAllText, { color: theme.accent }]}>{t('view_all')}</Text>
            </Pressable>
          </View>
          
          <View style={styles.recentList}>
            {bookings.filter(b => b.status === 'completed').slice(0, 2).map((booking) => (
              <View key={booking.id} style={styles.recentItem}>
                <Avatar
                  size={36}
                  fallback={booking.customerName.split(' ').map((n: string) => n[0]).join('')}
                />
                <View style={styles.recentContent}>
                  <Text style={[styles.recentName, { color: theme.textPrimary }]}>{booking.customerName}</Text>
                  <Text style={[styles.recentService, { color: theme.textSecondary }]}>{booking.serviceName}</Text>
                </View>
                <View style={styles.recentRight}>
                  <Text style={[styles.recentPrice, { color: theme.accent }]}>{booking.total_price} MAD</Text>
                  <View style={styles.recentRating}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={[styles.recentRatingText, { color: theme.textSecondary }]}>{booking.workerRating || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: '48%',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  bookingsCard: {
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  tabButtonContainer: {
    flex: 1,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    height: 44,
    minWidth: 80,
  },
  notificationBubble: {
    position: 'absolute',
    top: -6,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  bubbleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  bookingsList: {
    gap: 16,
  },
  bookingCard: {
    padding: 16,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 14,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookingSeparator: {
    marginVertical: 12,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    borderColor: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Quick Actions
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 24,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  
  // Recent Activity
  recentCard: {
    padding: 20,
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentList: {
    gap: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentService: {
    fontSize: 13,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recentPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentRatingText: {
    fontSize: 12,
  },
  // Bookings Navigation Card Styles
  bookingsNavigationCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bookingsNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingsNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingsNavTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  bookingsNavIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingsNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookingsNavSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },

  bookingsNavArrow: {
    marginLeft: 8,
  },
});

export default WorkerDashboardScreen;
