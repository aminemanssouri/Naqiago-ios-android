import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { handleSupabaseError, retryOperation } from './utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
type BookingDetails = Database['public']['Views']['booking_details']['Row'];

export interface CreateBookingData {
  workerId?: string; // Made optional since we'll auto-assign
  serviceId: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceAddressText: string;
  vehicleType: string; // Dynamic - comes from API type field (e.g. 'Berline', 'Citadine', 'Motorcycles', etc.)
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  licensePlate?: string;
  basePrice: number;
  totalPrice: number;
  specialInstructions?: string;
  estimatedDuration: number;
  serviceLocation?: { latitude: number; longitude: number };
  change?: number;
}

export interface BookingWithDetails extends Booking {
  customerName: string;
  customerPhone?: string;
  workerName: string;
  workerPhone?: string;
  serviceName: string;
  workerRating: number;
  workerAvatar?: string;
  change?: number;
}

type DbVehicleType = 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle';

function toDbVehicleType(displayType: string): DbVehicleType {
  const t = displayType.toLowerCase().trim();
  if (t === 'berline' || t === 'sedan') return 'sedan';
  if (t === 'citadine' || t === 'compact' || t.includes('hatch')) return 'hatchback';
  if (t.includes('moyen') && t.includes('suv')) return 'suv';
  if ((t.includes('grand') || t.includes('large') || t.includes('4x4')) && t.includes('suv')) return 'van';
  if (t === 'van') return 'van';
  if (t === 'truck') return 'truck';
  if (t.includes('motor') || t.includes('moto')) return 'motorcycle';
  if (t === 'suv') return 'suv';
  console.warn('Unknown vehicle type for DB enum, defaulting to sedan:', displayType);
  return 'sedan';
}

class BookingsService {
  // Find a worker for the booking (preferring available ones, but assigning randomly if all busy)
  async findAvailableWorker(scheduledDate: string, scheduledTime: string, serviceId: string): Promise<string | null> {
    try {
      // Get all active workers who provide this service
      const { data: workerServices, error: wsError } = await supabase
        .from('worker_services')
        .select(`
          worker_id,
          worker:worker_profiles!inner(
            id,
            status,
            user:profiles!worker_profiles_user_id_fkey(
              id,
              status
            )
          )
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true);

      if (wsError) throw wsError;
      if (!workerServices || workerServices.length === 0) {
        return await this.getRandomWorker();
      }

      // Get all worker IDs who provide this service
      const serviceWorkerIds = workerServices.map((ws: any) => ws.worker_id);

      if (serviceWorkerIds.length === 0) {
        return await this.getRandomWorker();
      }

      // Check which workers are already booked at this time
      const { data: existingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('worker_id')
        .eq('scheduled_date', scheduledDate)
        .eq('scheduled_time', scheduledTime)
        .in('status', ['pending', 'confirmed', 'in_progress', 'at_point'])
        .in('worker_id', serviceWorkerIds);

      if (bookingError) throw bookingError;

      const bookedWorkerIds = new Set((existingBookings || []).map(b => b.worker_id));
      const freeWorkerIds = serviceWorkerIds.filter(id => !bookedWorkerIds.has(id));

      // Prefer free workers, but assign busy ones if needed
      const workersToChooseFrom = freeWorkerIds.length > 0 ? freeWorkerIds : serviceWorkerIds;
      const randomIndex = Math.floor(Math.random() * workersToChooseFrom.length);
      
      return workersToChooseFrom[randomIndex];

    } catch (error) {
      console.error('Error finding available worker:', error);
      return await this.getRandomWorker();
    }
  }

  // Fallback: Get any random worker from the system
  async getRandomWorker(): Promise<string | null> {
    try {
      // Try to get active workers first
      let { data: workers, error } = await supabase
        .from('worker_profiles')
        .select('id')
        .in('status', ['available', 'busy', 'on_break'])
        .limit(50);

      if (error) throw error;
      
      // If no active workers found, get any worker
      if (!workers || workers.length === 0) {
        const result = await supabase
          .from('worker_profiles')
          .select('id')
          .limit(50);
        
        if (result.error) throw result.error;
        workers = result.data;
      }

      if (!workers || workers.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * workers.length);
      return workers[randomIndex].id;
    } catch (error) {
      console.error('Error getting random worker:', error);
      return null;
    }
  }

  // Create new booking
  async createBooking(customerId: string, bookingData: CreateBookingData): Promise<Booking> {
    try {
      // Auto-assign worker if not provided
      let workerId = bookingData.workerId;
      if (!workerId) {
        const availableWorker = await this.findAvailableWorker(
          bookingData.scheduledDate,
          bookingData.scheduledTime,
          bookingData.serviceId
        );

        if (!availableWorker) {
          throw new Error('Unable to assign a worker. Please try again.');
        }
        
        workerId = availableWorker;
      }

      const insertData: BookingInsert = {
        customer_id: customerId,
        worker_id: workerId,
        service_id: bookingData.serviceId,
        scheduled_date: bookingData.scheduledDate,
        scheduled_time: bookingData.scheduledTime,
        estimated_duration: bookingData.estimatedDuration,
        service_address_text: bookingData.serviceAddressText,
        vehicle_type: toDbVehicleType(bookingData.vehicleType),
        vehicle_make: bookingData.vehicleMake,
        vehicle_model: bookingData.vehicleModel,
        vehicle_year: bookingData.vehicleYear,
        vehicle_color: bookingData.vehicleColor,
        license_plate: bookingData.licensePlate,
        base_price: bookingData.basePrice,
        total_price: bookingData.totalPrice,
        special_instructions: bookingData.specialInstructions,
        service_location: bookingData.serviceLocation 
          ? `POINT(${bookingData.serviceLocation.longitude} ${bookingData.serviceLocation.latitude})`
          : null,
      };

      // Append optional 'change' field if supported by schema
      const insertWithExtras: any = { ...insertData };
      if (typeof bookingData.change === 'number') {
        insertWithExtras.change = bookingData.change;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertWithExtras)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  // Get user's bookings with detailed information
  async getUserBookings(userId: string, role: 'customer' | 'worker' = 'customer'): Promise<BookingWithDetails[]> {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(full_name, phone, avatar_url),
          worker:worker_profiles!worker_id(
            id,
            business_name,
            user:profiles!worker_profiles_user_id_fkey(full_name, phone, avatar_url)
          ),
          service:services!service_id(title, key, price)
        `);

      if (role === 'customer') {
        query = query.eq('customer_id', userId);
      } else {
        // For workers, get bookings for their worker profile
        const { data: workerProfile } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (workerProfile) {
          query = query.eq('worker_id', workerProfile.id);
        } else {
          return []; // No worker profile found
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match BookingWithDetails interface
      console.log('🔍 Raw booking data from database:', JSON.stringify(data?.[0], null, 2));
      
      const transformedData = (data || []).map(booking => {
        const workerName = booking.worker?.business_name || booking.worker?.user?.full_name || 'Unknown Worker';
        console.log('🔍 Transforming booking:', {
          bookingId: booking.id,
          rawWorker: booking.worker,
          calculatedWorkerName: workerName
        });
        
        return {
          ...booking,
          customerName: booking.customer?.full_name || 'Unknown Customer',
          customerPhone: booking.customer?.phone || undefined,
          workerName: workerName,
          workerPhone: booking.worker?.user?.phone || undefined,
          serviceName: booking.service?.title || 'Unknown Service',
          workerRating: 4.5, // Default rating - you might want to calculate this from reviews
          workerAvatar: booking.worker?.user?.avatar_url || undefined,
        };
      });
      
      console.log('🔍 Final transformed booking data:', JSON.stringify(transformedData?.[0], null, 2));
      return transformedData;
    } catch (error) {
      console.error('Get user bookings error:', error);
      throw error;
    }
  }

  // Get booking by ID with detailed information
  async getBookingById(bookingId: string): Promise<BookingWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!customer_id(full_name, phone, avatar_url),
          worker:worker_profiles!worker_id(
            id,
            business_name,
            user:profiles!worker_profiles_user_id_fkey(full_name, phone, avatar_url)
          ),
          service:services!service_id(title, key, price)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Transform the data to match BookingWithDetails interface
      return {
        ...data,
        customerName: data.customer?.full_name || 'Unknown Customer',
        customerPhone: data.customer?.phone || undefined,
        workerName: data.worker?.business_name || data.worker?.user?.full_name || 'Unknown Worker',
        workerPhone: data.worker?.user?.phone || undefined,
        serviceName: data.service?.title || 'Unknown Service',
        workerRating: 4.5, // Default rating - you might want to calculate this from reviews
        workerAvatar: data.worker?.user?.avatar_url || undefined,
      };
    } catch (error) {
      console.error('Get booking by ID error:', error);
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(
    bookingId: string, 
    status: 'pending' | 'confirmed' | 'in_progress' | 'at_point' | 'completed' | 'cancelled' | 'refunded',
    userId?: string
  ): Promise<Booking> {
    try {
      const updateData: BookingUpdate = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set timestamps based on status
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.can_rate = true;
        updateData.can_cancel = false;
        updateData.can_reschedule = false;
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = userId;
        updateData.can_cancel = false;
        updateData.can_reschedule = false;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<Booking> {
    try {
      const updateData: BookingUpdate = {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        cancellation_reason: reason,
        can_cancel: false,
        can_reschedule: false,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  }

  // Reschedule booking
  async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newTime: string
  ): Promise<Booking> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          scheduled_date: newDate,
          scheduled_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Reschedule booking error:', error);
      throw error;
    }
  }

  // Add notes to booking
  async addBookingNotes(
    bookingId: string,
    notes: string,
    noteType: 'customer' | 'worker'
  ): Promise<Booking> {
    try {
      const updateField = noteType === 'customer' ? 'customer_notes' : 'worker_notes';
      
      const { data, error } = await supabase
        .from('bookings')
        .update({
          [updateField]: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Add booking notes error:', error);
      throw error;
    }
  }

  // Get bookings by status
  async getBookingsByStatus(
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    userId?: string,
    role: 'customer' | 'worker' = 'customer'
  ): Promise<BookingDetails[]> {
    try {
      let query = supabase
        .from('booking_details')
        .select('*')
        .eq('status', status);

      if (userId) {
        if (role === 'customer') {
          query = query.eq('customer_id', userId);
        } else {
          // For workers, get worker profile first
          const { data: workerProfile } = await supabase
            .from('worker_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (workerProfile) {
            query = query.eq('worker_id', workerProfile.id);
          } else {
            return [];
          }
        }
      }

      const { data, error } = await query.order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get bookings by status error:', error);
      throw error;
    }
  }

  // Get upcoming bookings
  async getUpcomingBookings(userId: string, role: 'customer' | 'worker' = 'customer'): Promise<BookingDetails[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('booking_details')
        .select('*')
        .gte('scheduled_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (role === 'customer') {
        query = query.eq('customer_id', userId);
      } else {
        // For workers, get worker profile first
        const { data: workerProfile } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (workerProfile) {
          query = query.eq('worker_id', workerProfile.id);
        } else {
          return [];
        }
      }

      const { data, error } = await query
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get upcoming bookings error:', error);
      throw error;
    }
  }

  // Get booking history
  async getBookingHistory(userId: string, role: 'customer' | 'worker' = 'customer'): Promise<BookingDetails[]> {
    try {
      let query = supabase
        .from('booking_details')
        .select('*')
        .in('status', ['completed', 'cancelled']);

      if (role === 'customer') {
        query = query.eq('customer_id', userId);
      } else {
        // For workers, get worker profile first
        const { data: workerProfile } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (workerProfile) {
          query = query.eq('worker_id', workerProfile.id);
        } else {
          return [];
        }
      }

      const { data, error } = await query.order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get booking history error:', error);
      throw handleSupabaseError(error);
    }
  }

  // Real-time subscription for booking updates
  subscribeToBookingUpdates(
    bookingId: string, 
    callback: (booking: Booking) => void
  ): RealtimeChannel {
    return supabase
      .channel(`booking:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => callback(payload.new as Booking)
      )
      .subscribe();
  }

  // Real-time subscription for user's bookings
  subscribeToUserBookings(
    userId: string,
    role: 'customer' | 'worker',
    callback: (booking: Booking) => void
  ): RealtimeChannel {
    const column = role === 'customer' ? 'customer_id' : 'worker_id';
    
    return supabase
      .channel(`user_bookings:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `${column}=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as Booking);
          }
        }
      )
      .subscribe();
  }



  // Get booking statistics for dashboard
  async getBookingStats(userId: string, role: 'customer' | 'worker'): Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalEarnings?: number;
  }> {
    try {
      let query = supabase.from('bookings').select('status, total_price');
      
      if (role === 'customer') {
        query = query.eq('customer_id', userId);
      } else {
        // For workers, need to get worker profile first
        const { data: workerProfile } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (!workerProfile) {
          return { total: 0, pending: 0, completed: 0, cancelled: 0 };
        }
        
        query = query.eq('worker_id', workerProfile.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = (data || []).reduce(
        (acc, booking) => {
          acc.total++;
          
          switch (booking.status) {
            case 'pending':
            case 'confirmed':
              acc.pending++;
              break;
            case 'completed':
              acc.completed++;
              if (role === 'worker') {
                acc.totalEarnings = (acc.totalEarnings || 0) + booking.total_price;
              }
              break;
            case 'cancelled':
              acc.cancelled++;
              break;
          }
          
          return acc;
        },
        { total: 0, pending: 0, completed: 0, cancelled: 0, totalEarnings: 0 }
      );

      return stats;
    } catch (error) {
      console.error('Get booking stats error:', error);
      throw handleSupabaseError(error);
    }
  }
}

export const bookingsService = new BookingsService();
