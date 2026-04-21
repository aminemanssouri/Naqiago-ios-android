import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { handleSupabaseError, retryOperation, getCachedData, setCachedData, CACHE_KEYS } from './utils';

type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export interface ServiceInclusion {
  title: string;
  description: string;
  icon: string;
  highlight?: boolean;
}

export interface ServiceItem {
  id: string;
  key: string;
  title: string;
  desc: string;
  price: number;
  icon: string;
  category: 'basic' | 'deluxe' | 'premium' | 'specialty';
  durationMinutes: number;
  isActive: boolean;
  // Additional fields
  notes?: string;
  inclusions?: string[] | ServiceInclusion[]; // Can be either string array or object array
  imageUrl?: string;
  // Vehicle-specific multipliers
  sedanMultiplier?: number;
  suvMultiplier?: number;
  vanMultiplier?: number;
  truckMultiplier?: number;
}

class ServicesService {
  // Get all active services with caching
  async getServices(useCache: boolean = true): Promise<ServiceItem[]> {
    try {
      // Try to get from cache first
      if (useCache) {
        const cachedServices = await getCachedData<ServiceItem[]>(CACHE_KEYS.SERVICES);
        if (cachedServices) {
          return cachedServices;
        }
      }

      const services = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            inclusions
          `)
          .eq('is_active', true)
          .not('cartype', 'is', null) // Exclude services with NULL cartype
          .order('category', { ascending: true })
          .order('base_price', { ascending: true });

        if (error) throw error;
        return (data || []).map(service => this.transformServiceData(service));
      });

      // Cache the results
      await setCachedData(CACHE_KEYS.SERVICES, services, 6); // Cache for 6 hours
      return services;
    } catch (error) {
      console.error('Get services error:', error);
      
      // Try to return cached data as fallback
      const fallbackData = await getCachedData<ServiceItem[]>(CACHE_KEYS.SERVICES);
      if (fallbackData) {
        console.log('Returning cached services as fallback');
        return fallbackData;
      }
      
      // If database connection fails, return empty array for now
      console.warn('Database connection failed, returning empty services array');
      return [];
    }
  }

  // Get service by ID
  async getServiceById(serviceId: string): Promise<ServiceItem | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          inclusions
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.transformServiceData(data);
    } catch (error) {
      console.error('Get service by ID error:', error);
      throw error;
    }
  }

  // Get service by key
  async getServiceByKey(serviceKey: string): Promise<ServiceItem | null> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          inclusions
        `)
        .eq('key', serviceKey)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.transformServiceData(data);
    } catch (error) {
      console.error('Get service by key error:', error);
      throw error;
    }
  }

  // Get services by category
  async getServicesByCategory(category: 'basic' | 'deluxe' | 'premium' | 'specialty'): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          inclusions
        `)
        .eq('category', category)
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (error) throw error;

      return (data || []).map(service => this.transformServiceData(service));
    } catch (error) {
      console.error('Get services by category error:', error);
      throw error;
    }
  }

    // Get services filtered by vehicle type with vehicle-specific pricing
  async getServicesForVehicleType(
    vehicleType: string
  ): Promise<ServiceItem[]> {
    try {
      const services = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            inclusions
          `)
          .eq('is_active', true)
          .not('cartype', 'is', null) // Exclude services with NULL cartype
          .order('category', { ascending: true });

        if (error) throw error;

        // Filter services that support the vehicle type and apply pricing
        return (data || [])
          .filter(service => this.isServiceAvailableForVehicle(service, vehicleType))
          .map(service => {
            const transformed = this.transformServiceData(service);
            
            // Update price based on vehicle type
            transformed.price = this.calculateServicePrice(transformed, vehicleType);
            
            return transformed;
          });
      });
      
      return services;
    } catch (error: any) {
      console.error('Get services for vehicle type error:', error);
      
      // Check if error is an abort/timeout error
      if (error?.message?.includes('aborted') || error?.message?.includes('timeout')) {
        console.warn('Request aborted or timed out, trying to return cached data');
      }
      
      // Try to get all services from cache and filter by vehicle type
      try {
        const cachedServices = await getCachedData<ServiceItem[]>(CACHE_KEYS.SERVICES);
        if (cachedServices && cachedServices.length > 0) {
          console.log('Returning filtered cached services as fallback');
          return cachedServices
            .filter(service => {
              // Simple check if service supports the vehicle type
              return service.key?.toLowerCase().includes(vehicleType.toLowerCase()) || 
                     service.category !== undefined; // Return all if we can't determine
            })
            .map(service => ({
              ...service,
              price: this.calculateServicePrice(service, vehicleType),
            }));
        }
      } catch (cacheError) {
        console.error('Failed to get cached data:', cacheError);
      }
      
      // If all else fails, return empty array instead of throwing
      console.warn('Returning empty services array due to error');
      return [];
    }
  }

  // Get all services with vehicle-specific pricing (legacy method)
  async getServicesWithVehiclePricing(
    vehicleType: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle'
  ): Promise<ServiceItem[]> {
    // Map legacy vehicle types to database types
    const dbVehicleType = this.mapLegacyVehicleType(vehicleType);
    return this.getServicesForVehicleType(dbVehicleType);
  }

  // Calculate price based on vehicle type multiplier
  calculateServicePrice(
    service: ServiceItem, 
    vehicleType: string
  ): number {
    let multiplier = 1.0;

    // Normalize type for comparison (API returns lowercase, e.g. "berline")
    const normalizedType = vehicleType.toLowerCase().trim();

    if (['berline', 'sedan'].includes(normalizedType)) {
      multiplier = service.sedanMultiplier ?? 1.0;
    } else if (['citadine', 'hatchback', 'compact'].includes(normalizedType)) {
      multiplier = service.sedanMultiplier ?? 1.0;
    } else if (['suv', 'moyen suv', 'crossover'].includes(normalizedType)) {
      multiplier = service.suvMultiplier ?? 1.2;
    } else if (['grand suv', 'large suv', 'full-size suv', '4x4', 'van', 'truck'].includes(normalizedType)) {
      multiplier = service.vanMultiplier ?? 1.4;
    } else if (['motorcycles', 'motorcycle', 'moto'].includes(normalizedType)) {
      multiplier = 1.0; // Motorcycles use base price
    } else {
      // Unknown type from API - default to base price
      console.warn('Unknown vehicle type for pricing:', vehicleType);
      multiplier = 1.0;
    }

    return Math.round(service.price * multiplier);
  }

  // Check if service is available for specific vehicle type
  private isServiceAvailableForVehicle(
    service: any, 
    vehicleType: string
  ): boolean {
    // If service has cartype field, check if it matches the vehicle type (case-insensitive)
    if (service.cartype) {
      // cartype can be a single type or comma-separated list
      const supportedTypes = service.cartype.split(',').map((type: string) => type.trim().toLowerCase());
      const normalizedVehicleType = vehicleType.toLowerCase().trim();
      return supportedTypes.includes(normalizedVehicleType) || supportedTypes.includes('all');
    }
    
    // If no cartype specified (NULL), don't show this service
    return false;
  }

  // Map legacy vehicle types to database vehicle types
  private mapLegacyVehicleType(
    legacyType: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle'
  ): string {
    switch (legacyType) {
      case 'sedan':
        return 'Berline';
      case 'hatchback':
        return 'Citadine';
      case 'suv':
        return 'Moyen SUV';
      case 'motorcycle':
        return 'Motorcycles';
      case 'van':
      case 'truck':
      default:
        return 'Grand SUV'; // Map larger vehicles to Grand SUV
    }
  }

  // Create new service (admin only)
  async createService(serviceData: Omit<ServiceInsert, 'id'>): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create service error:', error);
      throw error;
    }
  }

  // Update service (admin only)
  async updateService(serviceId: string, updates: ServiceUpdate): Promise<Service> {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update service error:', error);
      throw error;
    }
  }

  // Deactivate service (admin only)
  async deactivateService(serviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Deactivate service error:', error);
      throw error;
    }
  }

  // Get popular services (most booked)
  async getPopularServices(limit: number = 5): Promise<ServiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          bookings!inner(service_id)
        `)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;

      // Sort by booking count and transform
      const servicesWithBookingCount = (data || [])
        .map((service: any) => ({
          ...service,
          booking_count: service.bookings?.length || 0
        }))
        .sort((a: any, b: any) => b.booking_count - a.booking_count);

      return servicesWithBookingCount.map((service: any) => this.transformServiceData(service));
    } catch (error) {
      console.error('Get popular services error:', error);
      // Fallback to regular services if booking count query fails
      return this.getServices();
    }
  }

  // Transform database service to app format
  private transformServiceData(service: Service): ServiceItem {
    return {
      id: service.id,
      key: service.key,
      title: service.title,
      desc: service.description || '',
      price: service.base_price,
      icon: service.icon_name || 'Wrench',
      category: service.category,
      durationMinutes: service.duration_minutes,
      isActive: service.is_active,
      notes: service.notes || undefined,
      inclusions: service.inclusions as ServiceInclusion[] || undefined,
      imageUrl: service.image_url || undefined,
      sedanMultiplier: service.sedan_multiplier || 1.00,
      suvMultiplier: service.suv_multiplier || 1.20,
      vanMultiplier: service.van_multiplier || 1.40,
      truckMultiplier: service.truck_multiplier || 1.60,
    };
  }

  // Check service availability for a specific date and time
  async checkServiceAvailability(
    serviceId: string, 
    date: string, 
    time: string
  ): Promise<{ available: boolean; conflictingBookings?: number }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, scheduled_date, scheduled_time, estimated_duration')
        .eq('service_id', serviceId)
        .eq('scheduled_date', date)
        .in('status', ['pending', 'confirmed', 'in_progress']);

      if (error) throw error;

      // Check for time conflicts (simplified logic)
      const conflictingBookings = (data || []).filter(booking => {
        const bookingTime = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
        const requestedTime = new Date(`${date}T${time}`);
        const timeDiff = Math.abs(bookingTime.getTime() - requestedTime.getTime());
        
        // Consider conflict if within 2 hours (could be made more sophisticated)
        return timeDiff < 2 * 60 * 60 * 1000;
      });

      return {
        available: conflictingBookings.length === 0,
        conflictingBookings: conflictingBookings.length
      };
    } catch (error) {
      console.error('Check service availability error:', error);
      throw handleSupabaseError(error);
    }
  }
}

export const servicesService = new ServicesService();
