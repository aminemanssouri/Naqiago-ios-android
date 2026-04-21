import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { Calendar, Clock, MapPin, Phone, User, Car, DollarSign, MessageCircle, Navigation, Star, CheckCircle, XCircle, Edit3, Save, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';

interface BookingDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  service: string;
  location: string;
  scheduledTime: string;
  price: number;
  carType: string;
  carModel: string;
  carColor: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  specialRequests?: string;
  estimatedDuration: number;
  paymentMethod: string;
  rating?: number;
  customerReview?: string;
}

export const ManageBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useThemeColors();
  
  // Mock booking data - in real app, this would come from route params or API
  const [booking, setBooking] = useState<BookingDetails>({
    id: '1',
    customerName: 'Ahmed Hassan',
    customerPhone: '+212 6XX XXX XXX',
    customerEmail: 'ahmed.hassan@email.com',
    service: 'Premium Wash & Wax',
    location: 'Gueliz, Marrakech - Rue de la Liberté, 123',
    scheduledTime: '2024-01-15T10:00:00Z',
    price: 150,
    carType: 'Sedan',
    carModel: 'Toyota Camry 2020',
    carColor: 'Silver',
    status: 'pending',
    notes: 'Customer prefers eco-friendly products',
    specialRequests: 'Please clean the interior thoroughly, there are pet hairs',
    estimatedDuration: 90,
    paymentMethod: 'Cash',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(booking.notes || '');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'in_progress': return '#10b981';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return theme.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleStatusChange = (newStatus: BookingDetails['status']) => {
    Alert.alert(
      'Update Status',
      `Change booking status to ${getStatusText(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => {
            setBooking(prev => ({ ...prev, status: newStatus }));
            Alert.alert('Success', `Booking status updated to ${getStatusText(newStatus)}`);
          }
        }
      ]
    );
  };

  const handleSaveNotes = () => {
    setBooking(prev => ({ ...prev, notes: editedNotes }));
    setIsEditing(false);
    Alert.alert('Success', 'Notes updated successfully');
  };

  const handleCallCustomer = () => {
    Alert.alert('Call Customer', `Calling ${booking.customerPhone}...`);
  };

  const handleMessageCustomer = () => {
    Alert.alert('Message Customer', 'Opening messaging app...');
  };

  const handleNavigateToLocation = () => {
    Alert.alert('Navigate', 'Opening maps application...');
  };

  const handleReschedule = () => {
    Alert.alert('Reschedule', 'Opening calendar to reschedule booking...');
  };

  const StatusButton = ({ status, label }: { status: BookingDetails['status']; label: string }) => (
    <Pressable
      style={[
        styles.statusButton,
        { 
          backgroundColor: booking.status === status ? getStatusColor(status) + '20' : theme.card,
          borderColor: booking.status === status ? getStatusColor(status) : theme.cardBorder 
        }
      ]}
      onPress={() => handleStatusChange(status)}
    >
      <Text style={[
        styles.statusButtonText,
        { color: booking.status === status ? getStatusColor(status) : theme.textSecondary }
      ]}>
        {label}
      </Text>
    </Pressable>
  );

  const { t } = useLanguage();
  const { date, time } = formatDateTime(booking.scheduledTime);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <Header 
        title={t('manage_booking')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <Card style={[styles.statusCard, { borderColor: getStatusColor(booking.status) }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(booking.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {getStatusText(booking.status)}
            </Text>
            <Text style={[styles.bookingId, { color: theme.textSecondary }]}>#{booking.id}</Text>
          </View>
          
          <View style={styles.statusActions}>
            <StatusButton status="accepted" label={t('accept')} />
            <StatusButton status="in_progress" label={t('start')} />
            <StatusButton status="completed" label={t('complete')} />
          </View>
        </Card>

        {/* Customer Information */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Customer Information</Text>
          </View>
          
          <View style={styles.customerSection}>
            <Avatar
              size={60}
              fallback={booking.customerName.split(' ').map(n => n[0]).join('')}
            />
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: theme.textPrimary }]}>{booking.customerName}</Text>
              <View style={styles.contactRow}>
                <Phone size={16} color={theme.textSecondary} />
                <Text style={[styles.contactText, { color: theme.textSecondary }]}>{booking.customerPhone}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={[styles.contactText, { color: theme.textSecondary }]}>{booking.customerEmail}</Text>
              </View>
            </View>
          </View>

          <View style={styles.contactActions}>
            <Button
              variant="outline"
              onPress={handleCallCustomer}
              style={[styles.contactButton, { borderColor: theme.cardBorder }]}
            >
              <Phone size={18} color={theme.accent} />
              <Text style={[styles.contactButtonText, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">Call</Text>
            </Button>
            <Button
              variant="outline"
              onPress={handleMessageCustomer}
              style={[styles.contactButton, { borderColor: theme.cardBorder }]}
            >
              <MessageCircle size={18} color={theme.accent} />
              <Text style={[styles.contactButtonText, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">Message</Text>
            </Button>
          </View>
        </Card>

        {/* Service Details */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Car size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Service Details</Text>
          </View>
          
          <View style={styles.serviceGrid}>
            <View style={styles.serviceItem}>
              <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>Service</Text>
              <Text style={[styles.serviceValue, { color: theme.textPrimary }]}>{booking.service}</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>Price</Text>
              <Text style={[styles.serviceValue, styles.priceText, { color: theme.accent }]}>{booking.price} MAD</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>Duration</Text>
              <Text style={[styles.serviceValue, { color: theme.textPrimary }]}>{booking.estimatedDuration} min</Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>Payment</Text>
              <Text style={[styles.serviceValue, { color: theme.textPrimary }]}>{booking.paymentMethod}</Text>
            </View>
          </View>
        </Card>

        {/* Vehicle Information */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Car size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Vehicle Information</Text>
          </View>
          
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleRow}>
              <Text style={[styles.vehicleLabel, { color: theme.textSecondary }]}>Type:</Text>
              <Text style={[styles.vehicleValue, { color: theme.textPrimary }]}>{booking.carType}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={[styles.vehicleLabel, { color: theme.textSecondary }]}>Model:</Text>
              <Text style={[styles.vehicleValue, { color: theme.textPrimary }]}>{booking.carModel}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={[styles.vehicleLabel, { color: theme.textSecondary }]}>Color:</Text>
              <Text style={[styles.vehicleValue, { color: theme.textPrimary }]}>{booking.carColor}</Text>
            </View>
          </View>
        </Card>

        {/* Schedule & Location */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Schedule & Location</Text>
          </View>
          
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleRow}>
              <Calendar size={16} color={theme.textSecondary} />
              <Text style={[styles.scheduleText, { color: theme.textPrimary }]}>{date}</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Clock size={16} color={theme.textSecondary} />
              <Text style={[styles.scheduleText, { color: theme.textPrimary }]}>{time}</Text>
            </View>
            <View style={styles.scheduleRow}>
              <MapPin size={16} color={theme.textSecondary} />
              <Text style={[styles.scheduleText, { color: theme.textPrimary }]}>{booking.location}</Text>
            </View>
          </View>

          <View style={styles.locationActions}>
            <Button
              variant="outline"
              onPress={handleNavigateToLocation}
              style={[styles.locationButton, { borderColor: theme.cardBorder }]}
            >
              <Navigation size={18} color={theme.accent} />
              <Text style={[styles.locationButtonText, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">Navigate</Text>
            </Button>
            <Button
              variant="outline"
              onPress={handleReschedule}
              style={[styles.locationButton, { borderColor: theme.cardBorder }]}
            >
              <Calendar size={18} color={theme.accent} />
              <Text style={[styles.locationButtonText, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">Reschedule</Text>
            </Button>
          </View>
        </Card>

        {/* Special Requests */}
        {booking.specialRequests && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MessageCircle size={20} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Special Requests</Text>
            </View>
            <Text style={[styles.specialRequestsText, { color: theme.textPrimary }]}>
              {booking.specialRequests}
            </Text>
          </Card>
        )}

        {/* Notes */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Edit3 size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notes</Text>
            <Pressable
              onPress={() => isEditing ? handleSaveNotes() : setIsEditing(true)}
              style={styles.editButton}
            >
              {isEditing ? (
                <Save size={16} color={theme.accent} />
              ) : (
                <Edit3 size={16} color={theme.accent} />
              )}
            </Pressable>
          </View>
          
          {isEditing ? (
            <View style={styles.notesEditContainer}>
              <TextInput
                style={[styles.notesInput, { 
                  color: theme.textPrimary, 
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.bg 
                }]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                placeholder="Add your notes here..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
              <View style={styles.notesActions}>
                <Button
                  variant="ghost"
                  onPress={() => {
                    setEditedNotes(booking.notes || '');
                    setIsEditing(false);
                  }}
                  style={styles.notesActionButton}
                >
                  <X size={16} color={theme.textSecondary} />
                  <Text style={[styles.notesActionText, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">Cancel</Text>
                </Button>
                <Button
                  onPress={handleSaveNotes}
                  style={[styles.notesActionButton, { backgroundColor: theme.accent }]}
                >
                  <Save size={16} color="#ffffff" />
                  <Text style={[styles.notesActionText, { color: '#ffffff' }]} numberOfLines={1} ellipsizeMode="tail">Save</Text>
                </Button>
              </View>
            </View>
          ) : (
            <Text style={[styles.notesText, { color: theme.textPrimary }]}>
              {booking.notes || 'No notes added yet'}
            </Text>
          )}
        </Card>

        {/* Rating (if completed) */}
        {booking.status === 'completed' && booking.rating && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Star size={20} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Customer Rating</Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={24}
                    color={i < booking.rating! ? '#fbbf24' : '#e5e7eb'}
                    fill={i < booking.rating! ? '#fbbf24' : 'transparent'}
                  />
                ))}
              </View>
              <Text style={[styles.ratingText, { color: theme.textPrimary }]}>
                {booking.rating}/5 stars
              </Text>
            </View>
            
            {booking.customerReview && (
              <Text style={[styles.reviewText, { color: theme.textSecondary }]}>
                "{booking.customerReview}"
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Status Card
  statusCard: {
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderRadius: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Section Cards
  sectionCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  
  // Customer Section
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Service Details
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceItem: {
    flex: 1,
    minWidth: '45%',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  serviceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 18,
  },
  
  // Vehicle Info
  vehicleInfo: {
    gap: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Schedule & Location
  scheduleInfo: {
    gap: 12,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleText: {
    fontSize: 14,
    flex: 1,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Special Requests
  specialRequestsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Notes
  notesEditContainer: {
    gap: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  notesActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notesActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  notesActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Rating
  ratingContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ManageBookingScreen;
