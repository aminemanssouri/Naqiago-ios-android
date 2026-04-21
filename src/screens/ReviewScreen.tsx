import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { Star, ThumbsUp, ThumbsDown, Sparkles, MessageSquare, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { reviewsService } from '../services/reviews';
import type { RootStackParamList } from '../types/navigation';

type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'Review'>;

// Quick review tag IDs (labels will be translated)
const POSITIVE_TAG_IDS = ['professional', 'on-time', 'thorough', 'friendly', 'quality', 'value'];
const NEGATIVE_TAG_IDS = ['late', 'rushed', 'incomplete', 'unprofessional', 'expensive', 'damage'];

export default function ReviewScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ReviewScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t } = useLanguage();

  // Get booking data from route params
  const { bookingId, workerId, workerName, workerAvatar, workerRating, bookingNumber } = route.params || {};

  const { user } = useAuth();

  // Review state
  const [rating, setRating] = useState(0);
  const [serviceQualityRating, setServiceQualityRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user can review this booking
  useEffect(() => {
    const checkReviewPermission = async () => {
      if (!bookingId || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        const canReviewBooking = await reviewsService.canReviewBooking(bookingId, user.id);
        setCanReview(canReviewBooking);
      } catch (error) {
        console.error('Error checking review permission:', error);
        setCanReview(false);
      } finally {
        setLoading(false);
      }
    };

    checkReviewPermission();
  }, [bookingId, user?.id]);

  const handleStarPress = (value: number) => {
    setRating(value);
    // Clear tags when rating changes
    setSelectedTags([]);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert(t('error') || 'Error', 'Please select a rating before submitting.');
      return;
    }

    if (!bookingId || !workerId || !user?.id) {
      Alert.alert(t('error') || 'Error', 'Missing required information.');
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewsService.createReview({
        booking_id: bookingId,
        customer_id: user.id,
        worker_id: workerId,
        overall_rating: rating,
        service_quality_rating: serviceQualityRating || rating,
        punctuality_rating: punctualityRating || rating,
        communication_rating: communicationRating || rating,
        review_text: reviewText.trim() || undefined,
        photos: [], // TODO: Add photo upload functionality
      });

      Alert.alert(
        t('review_submitted') || 'Review Submitted',
        t('thank_you_feedback') || 'Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the main tabs and specifically to Bookings tab
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'MainTabs',
                    state: {
                      routes: [
                        { name: 'Home' },
                        { name: 'Services' },
                        { name: 'Bookings' },
                        { name: 'Settings' },
                      ],
                      index: 2, // Bookings tab index
                    },
                  },
                ],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Submit review error:', error);
      const errorMessage = error?.message || 'Failed to submit review. Please try again.';
      Alert.alert(
        t('error') || 'Error',
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;
  const currentTagIds = rating >= 4 ? POSITIVE_TAG_IDS : NEGATIVE_TAG_IDS;
  
  // Get translated tag labels
  const getTagLabel = (tagId: string) => {
    return t(`tag_${tagId}`) || tagId;
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
        <Header 
          title={t('rate_service') || 'Rate Service'} 
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if user cannot review
  if (!canReview) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
        <Header 
          title={t('rate_service') || 'Rate Service'} 
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Cannot Review</Text>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            You can only review completed bookings within 30 days of completion.
          </Text>
          <Button onPress={() => navigation.goBack()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <Header 
        title={t('rate_service') || 'Rate Service'} 
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Worker Info Card */}
        <Card style={[styles.workerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.workerInfo}>
            <Avatar 
              source={workerAvatar} 
              name={workerName} 
              size={64}
            />
            <View style={styles.workerDetails}>
              <Text style={[styles.workerName, { color: theme.textPrimary }]}>
                {workerName || 'Worker'}
              </Text>
              <View style={styles.workerRatingRow}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={[styles.workerRatingText, { color: theme.textSecondary }]}>
                  {workerRating || '4.8'} • {t('professional_car_washer') || 'Professional Car Washer'}
                </Text>
              </View>
              <Text style={[styles.bookingIdText, { color: theme.textSecondary }]}>
                {t('booking')} #{bookingNumber || 'CW123456'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Rating Section */}
        <Card style={[styles.ratingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.ratingHeader}>
            <Sparkles size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {t('how_was_service') || 'How was your service?'}
            </Text>
          </View>

          <Text style={[styles.ratingSubtitle, { color: theme.textSecondary }]}>
            {t('tap_stars_to_rate') || 'Tap the stars to rate your experience'}
          </Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                onPress={() => handleStarPress(value)}
                style={styles.starButton}
              >
                <Star
                  size={48}
                  color={value <= displayRating ? '#fbbf24' : theme.cardBorder}
                  fill={value <= displayRating ? '#fbbf24' : 'transparent'}
                  strokeWidth={2}
                />
              </Pressable>
            ))}
          </View>

          {/* Rating Label */}
          {rating > 0 && (
            <View style={[styles.ratingLabelContainer, { backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.15)' : '#fef3c7' }]}>
              <Text style={[styles.ratingLabel, { color: theme.isDark ? '#fde68a' : '#92400e' }]}>
                {rating === 5 && (t('excellent') || 'Excellent!')}
                {rating === 4 && (t('very_good') || 'Very Good!')}
                {rating === 3 && (t('good') || 'Good')}
                {rating === 2 && (t('fair') || 'Fair')}
                {rating === 1 && (t('poor') || 'Poor')}
              </Text>
            </View>
          )}
        </Card>

        {/* Quick Tags */}
        {rating > 0 && (
          <Card style={[styles.tagsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.tagsHeader}>
              {rating >= 4 ? (
                <ThumbsUp size={20} color={theme.accent} />
              ) : (
                <ThumbsDown size={20} color={theme.accent} />
              )}
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {rating >= 4 
                  ? (t('what_went_well') || 'What went well?')
                  : (t('what_went_wrong') || 'What went wrong?')
                }
              </Text>
            </View>

            <Text style={[styles.tagsSubtitle, { color: theme.textSecondary }]}>
              {t('select_all_apply') || 'Select all that apply (optional)'}
            </Text>

            <View style={styles.tagsContainer}>
              {currentTagIds.map((tagId) => {
                const isSelected = selectedTags.includes(tagId);
                return (
                  <Pressable
                    key={tagId}
                    onPress={() => toggleTag(tagId)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: isSelected 
                          ? (theme.isDark ? theme.accent + '30' : theme.accent + '20')
                          : (theme.isDark ? 'rgba(148,163,184,0.12)' : '#f3f4f6'),
                        borderColor: isSelected ? theme.accent : theme.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: isSelected ? theme.accent : theme.textSecondary,
                          fontWeight: isSelected ? '600' : '500',
                        },
                      ]}
                    >
                      {getTagLabel(tagId)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        {/* Written Review */}
        {rating > 0 && (
          <Card style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.reviewHeader}>
              <MessageSquare size={20} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('write_review') || 'Write a Review'}
              </Text>
            </View>

            <Text style={[styles.reviewSubtitle, { color: theme.textSecondary }]}>
              {t('share_experience') || 'Share more about your experience (optional)'}
            </Text>

            <TextInput
              style={[
                styles.reviewInput,
                {
                  backgroundColor: theme.isDark ? 'rgba(148,163,184,0.08)' : '#f9fafb',
                  borderColor: theme.cardBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder={t('review_placeholder') || 'Tell us about your experience...'}
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={reviewText}
              onChangeText={setReviewText}
              maxLength={500}
            />

            <Text style={[styles.characterCount, { color: theme.textSecondary }]}>
              {reviewText.length}/500 {t('characters') || 'characters'}
            </Text>
          </Card>
        )}

        {/* Tips Section */}
        {rating > 0 && (
          <View style={[styles.tipsContainer, { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe', borderColor: theme.isDark ? 'rgba(59,130,246,0.35)' : '#93c5fd' }]}>
            <View style={styles.tipsHeader}>
              <Sparkles size={16} color={theme.isDark ? '#93c5fd' : '#1e40af'} />
              <Text style={[styles.tipsTitle, { color: theme.isDark ? '#93c5fd' : '#1e40af' }]}>
                {t('review_tips') || 'Review Tips'}
              </Text>
            </View>
            <Text style={[styles.tipsText, { color: theme.isDark ? '#93c5fd' : '#1e40af' }]}>
              • {t('tip_specific') || 'Be specific about what you liked or disliked'}{'\n'}
              • {t('tip_constructive') || 'Keep feedback constructive and respectful'}{'\n'}
              • {t('tip_helpful') || 'Your review helps others make informed decisions'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {rating > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            style={styles.submitButton}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>{t('submitting') || 'Submitting...'}</Text>
            ) : (
              <>
                <Check size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>{t('submit_review') || 'Submit Review'}</Text>
              </>
            )}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  workerCard: {
    padding: 16,
    marginBottom: 16,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  workerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  workerRatingText: {
    fontSize: 14,
  },
  bookingIdText: {
    fontSize: 12,
  },
  ratingCard: {
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabelContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  tagsCard: {
    padding: 16,
    marginBottom: 16,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tagsSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tagText: {
    fontSize: 14,
  },
  reviewCard: {
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reviewSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
  },
  errorButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
