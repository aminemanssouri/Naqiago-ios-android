import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Custom fetch with timeout
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
    fetch: customFetch,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Database types based on our schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          role: 'customer' | 'worker' | 'admin';
          status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
          date_of_birth: string | null;
          gender: string | null;
          language_preference: string;
          preferred_language: string;
          preferred_theme: string;
          timezone: string;
          created_at: string;
          updated_at: string;
          last_seen_at: string;
          preferred_payment_method: 'cash' | 'card' | 'mobile_money' | 'wallet' | null;
          loyalty_points: number;
          worker_license: string | null;
          worker_rating: number;
          worker_review_count: number;
          is_verified: boolean;
          background_check_status: string | null;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          full_name: string;
          avatar_url?: string | null;
          role?: 'customer' | 'worker' | 'admin';
          status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
          date_of_birth?: string | null;
          gender?: string | null;
          language_preference?: string;
          preferred_language?: string;
          preferred_theme?: string;
          timezone?: string;
          preferred_payment_method?: 'cash' | 'card' | 'mobile_money' | 'wallet' | null;
          loyalty_points?: number;
          worker_license?: string | null;
          worker_rating?: number;
          worker_review_count?: number;
          is_verified?: boolean;
          background_check_status?: string | null;
        };
        Update: {
          email?: string;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'customer' | 'worker' | 'admin';
          status?: 'active' | 'inactive' | 'suspended' | 'pending_verification';
          date_of_birth?: string | null;
          gender?: string | null;
          language_preference?: string;
          preferred_language?: string;
          preferred_theme?: string;
          timezone?: string;
          updated_at?: string;
          last_seen_at?: string;
          preferred_payment_method?: 'cash' | 'card' | 'mobile_money' | 'wallet' | null;
          loyalty_points?: number;
          worker_license?: string | null;
          worker_rating?: number;
          worker_review_count?: number;
          is_verified?: boolean;
          background_check_status?: string | null;
        };
      };
      worker_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string | null;
          bio: string | null;
          experience_years: number | null;
          specialties: string[] | null;
          service_radius_km: number;
          base_location: any; // PostGIS geography type
          current_location: any | null;
          status: 'available' | 'busy' | 'offline' | 'on_break';
          hourly_rate: number | null;
          commission_rate: number;
          works_weekends: boolean;
          start_time: string;
          end_time: string;
          total_jobs_completed: number;
          total_earnings: number;
          average_completion_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          business_name?: string | null;
          bio?: string | null;
          experience_years?: number | null;
          specialties?: string[] | null;
          service_radius_km?: number;
          base_location: any;
          current_location?: any | null;
          status?: 'available' | 'busy' | 'offline' | 'on_break';
          hourly_rate?: number | null;
          commission_rate?: number;
          works_weekends?: boolean;
          start_time?: string;
          end_time?: string;
          total_jobs_completed?: number;
          total_earnings?: number;
          average_completion_time?: number | null;
        };
        Update: {
          business_name?: string | null;
          bio?: string | null;
          experience_years?: number | null;
          specialties?: string[] | null;
          service_radius_km?: number;
          base_location?: any;
          current_location?: any | null;
          status?: 'available' | 'busy' | 'offline' | 'on_break';
          hourly_rate?: number | null;
          commission_rate?: number;
          works_weekends?: boolean;
          start_time?: string;
          end_time?: string;
          total_jobs_completed?: number;
          total_earnings?: number;
          average_completion_time?: number | null;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          key: string;
          title: string;
          description: string | null;
          category: 'basic' | 'deluxe' | 'premium' | 'specialty';
          base_price: number;
          duration_minutes: number;
          icon_name: string | null;
          image_url: string | null;
          is_active: boolean;
          notes: string | null;
          inclusions: any | null; // JSONB type
          created_at: string;
          updated_at: string;
          sedan_multiplier: number;
          suv_multiplier: number;
          van_multiplier: number;
          truck_multiplier: number;
        };
        Insert: {
          key: string;
          title: string;
          description?: string | null;
          category: 'basic' | 'deluxe' | 'premium' | 'specialty';
          base_price: number;
          duration_minutes: number;
          icon_name?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          notes?: string | null;
          inclusions?: any | null; // JSONB type
          sedan_multiplier?: number;
          suv_multiplier?: number;
          van_multiplier?: number;
          truck_multiplier?: number;
        };
        Update: {
          key?: string;
          title?: string;
          description?: string | null;
          category?: 'basic' | 'deluxe' | 'premium' | 'specialty';
          base_price?: number;
          duration_minutes?: number;
          icon_name?: string | null;
          image_url?: string | null;
          notes?: string | null;
          inclusions?: any | null; // JSONB type
          is_active?: boolean;
          sedan_multiplier?: number;
          suv_multiplier?: number;
          van_multiplier?: number;
          truck_multiplier?: number;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          customer_id: string;
          worker_id: string;
          service_id: string;
          status: 'pending' | 'confirmed' | 'in_progress' | 'at_point' | 'completed' | 'cancelled' | 'refunded';
          scheduled_date: string;
          scheduled_time: string;
          estimated_duration: number;
          service_address_id: string | null;
          service_location: any | null;
          service_address_text: string;
          vehicle_type: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle';
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
          vehicle_color: string | null;
          license_plate: string | null;
          base_price: number;
          additional_charges: number;
          discount_amount: number;
          total_price: number;
          special_instructions: string | null;
          customer_notes: string | null;
          worker_notes: string | null;
          created_at: string;
          updated_at: string;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          can_cancel: boolean;
          can_reschedule: boolean;
          can_rate: boolean;
        };
        Insert: {
          booking_number?: string;
          customer_id: string;
          worker_id: string;
          service_id: string;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'at_point' | 'completed' | 'cancelled' | 'refunded';
          scheduled_date: string;
          scheduled_time: string;
          estimated_duration: number;
          service_address_id?: string | null;
          service_location?: any | null;
          service_address_text: string;
          vehicle_type: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle';
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
          vehicle_color?: string | null;
          license_plate?: string | null;
          base_price: number;
          additional_charges?: number;
          discount_amount?: number;
          total_price: number;
          special_instructions?: string | null;
          customer_notes?: string | null;
          worker_notes?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          can_cancel?: boolean;
          can_reschedule?: boolean;
          can_rate?: boolean;
        };
        Update: {
          status?: 'pending' | 'confirmed' | 'in_progress' | 'at_point' | 'completed' | 'cancelled' | 'refunded';
          scheduled_date?: string;
          scheduled_time?: string;
          estimated_duration?: number;
          service_address_id?: string | null;
          service_location?: any | null;
          service_address_text?: string;
          vehicle_type?: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle';
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_year?: number | null;
          vehicle_color?: string | null;
          license_plate?: string | null;
          base_price?: number;
          additional_charges?: number;
          discount_amount?: number;
          total_price?: number;
          special_instructions?: string | null;
          customer_notes?: string | null;
          worker_notes?: string | null;
          updated_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          can_cancel?: boolean;
          can_reschedule?: boolean;
          can_rate?: boolean;
        };
      };
    };
    Views: {
      worker_listings: {
        Row: {
          worker_id: string;
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          worker_rating: number;
          worker_review_count: number;
          business_name: string | null;
          bio: string | null;
          experience_years: number | null;
          status: 'available' | 'busy' | 'offline' | 'on_break';
          base_location: any;
          service_radius_km: number;
          hourly_rate: number | null;
          services: string[] | null;
          avg_price: number | null;
        };
      };
      booking_details: {
        Row: {
          id: string;
          booking_number: string;
          customer_id: string;
          worker_id: string;
          service_id: string;
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
          scheduled_date: string;
          scheduled_time: string;
          service_address_text: string;
          vehicle_type: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'motorcycle';
          total_price: number;
          customer_name: string;
          customer_phone: string | null;
          customer_avatar: string | null;
          worker_name: string;
          worker_phone: string | null;
          worker_avatar: string | null;
          worker_rating: number;
          service_title: string;
          service_description: string | null;
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | null;
          payment_method: 'cash' | 'card' | 'mobile_money' | 'wallet' | null;
        };
      };
    };
    Functions: {
      find_nearby_workers: {
        Args: {
          customer_lat: number;
          customer_lon: number;
          radius_km?: number;
          service_uuid?: string;
        };
        Returns: {
          worker_id: string;
          user_id: string;
          full_name: string;
          worker_rating: number;
          distance_km: number;
          base_price: number;
        }[];
      };
      calculate_distance: {
        Args: {
          lat1: number;
          lon1: number;
          lat2: number;
          lon2: number;
        };
        Returns: number;
      };
    };
  };
};
