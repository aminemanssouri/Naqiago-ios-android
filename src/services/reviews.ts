import { supabase } from '../lib/supabase';

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  overall_rating: number;
  service_quality_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  review_text?: string;
  photos?: string[];
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewData {
  booking_id: string;
  customer_id: string;
  worker_id: string;
  overall_rating: number;
  service_quality_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  review_text?: string;
  photos?: string[];
}

export interface ReviewWithDetails extends Review {
  customer_name: string;
  customer_avatar?: string;
  worker_name: string;
  service_name: string;
}

class ReviewsService {
  // Create a new review
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    try {
      // First, verify the user is authenticated and owns the booking
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Verify the booking belongs to the authenticated user
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('customer_id, worker_id, status, can_rate')
        .eq('id', reviewData.booking_id)
        .single();

      if (bookingError) {
        throw new Error('Booking not found');
      }

      if (booking.customer_id !== user.id) {
        throw new Error('You can only review your own bookings');
      }

      if (booking.status !== 'completed') {
        throw new Error('You can only review completed bookings');
      }

      if (!booking.can_rate) {
        throw new Error('This booking has already been reviewed');
      }

      // Create the review with proper user context
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: reviewData.booking_id,
          customer_id: user.id, // Use authenticated user ID
          worker_id: booking.worker_id, // Use worker ID from booking
          overall_rating: reviewData.overall_rating,
          service_quality_rating: reviewData.service_quality_rating,
          punctuality_rating: reviewData.punctuality_rating,
          communication_rating: reviewData.communication_rating,
          review_text: reviewData.review_text,
          photos: reviewData.photos || [],
          is_verified: false,
          is_featured: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Review insert error:', error);
        throw error;
      }

      // Update booking to prevent duplicate reviews
      await supabase
        .from('bookings')
        .update({ can_rate: false })
        .eq('id', reviewData.booking_id);

      // Update worker's average rating
      await this.updateWorkerRating(booking.worker_id);

      return data;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  }

  // Get reviews for a worker
  async getWorkerReviews(workerId: string, limit = 10): Promise<ReviewWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles!reviews_customer_id_fkey(full_name, avatar_url),
          worker:worker_profiles!reviews_worker_id_fkey(business_name, user:profiles(full_name)),
          booking:bookings(service:services(title))
        `)
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(review => ({
        ...review,
        customer_name: review.customer?.full_name || 'Anonymous',
        customer_avatar: review.customer?.avatar_url,
        worker_name: review.worker?.business_name || review.worker?.user?.full_name || 'Unknown Worker',
        service_name: review.booking?.service?.title || 'Car Wash Service',
      }));
    } catch (error) {
      console.error('Get worker reviews error:', error);
      throw error;
    }
  }

  // Get review by booking ID
  async getReviewByBookingId(bookingId: string): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Get review by booking ID error:', error);
      throw error;
    }
  }

  // Update worker's average rating
  private async updateWorkerRating(workerId: string): Promise<void> {
    try {
      // Calculate average rating for this worker
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('overall_rating')
        .eq('worker_id', workerId);

      if (reviewsError) throw reviewsError;

      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.overall_rating, 0);
        const averageRating = totalRating / reviews.length;
        const reviewCount = reviews.length;

        // Update worker profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            worker_rating: Number(averageRating.toFixed(2)),
            worker_review_count: reviewCount,
          })
          .eq('id', workerId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Update worker rating error:', error);
      // Don't throw here as this is a background operation
    }
  }

  // Check if user can review a booking
  async canReviewBooking(bookingId: string, userId: string): Promise<boolean> {
    try {
      // Verify user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.id !== userId) {
        return false;
      }

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('status, customer_id, can_rate, completed_at')
        .eq('id', bookingId)
        .eq('customer_id', userId) // Add RLS-friendly filter
        .single();

      if (bookingError) return false;

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('customer_id', userId)
        .single();

      if (existingReview) return false; // Already reviewed

      // Check if booking is completed, user is the customer, and can_rate is true
      const isCompleted = booking.status === 'completed';
      const isCustomer = booking.customer_id === userId;
      const canRate = booking.can_rate;
      const hasCompletedRecently = booking.completed_at && 
        new Date(booking.completed_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

      return isCompleted && isCustomer && canRate && hasCompletedRecently;
    } catch (error) {
      console.error('Can review booking error:', error);
      return false;
    }
  }

  // Get customer's reviews (reviews they've written)
  async getCustomerReviews(customerId: string): Promise<ReviewWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          worker:worker_profiles!reviews_worker_id_fkey(business_name, user:profiles(full_name, avatar_url)),
          booking:bookings(service:services(title))
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(review => ({
        ...review,
        customer_name: 'You',
        worker_name: review.worker?.business_name || review.worker?.user?.full_name || 'Unknown Worker',
        service_name: review.booking?.service?.title || 'Car Wash Service',
      }));
    } catch (error) {
      console.error('Get customer reviews error:', error);
      throw error;
    }
  }
}

export const reviewsService = new ReviewsService();
