import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';

// Connection and error handling utilities
export interface ConnectionStatus {
  status: 'connected' | 'error';
  latency: number;
  error?: string;
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const start = Date.now();
  try {
    // Simple query to check connection
    const { data, error } = await supabase.from('services').select('count').limit(1);
    
    const latency = Date.now() - start;
    
    if (error) throw error;
    return { status: 'connected', latency };
  } catch (error: any) {
    console.error('Supabase connection check failed:', error);
    return { 
      status: 'error', 
      latency: Date.now() - start,
      error: error.message || 'Connection failed'
    };
  }
}

export function handleSupabaseError(error: any): Error {
  // Custom error handling for different types of Supabase errors
  if (error?.code === 'PGRST116') {
    return new Error('No data found');
  } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
    return new Error('Network connection error. Please check your internet connection.');
  } else if (error?.code === '42501') {
    return new Error('Access denied. Please check your permissions.');
  } else if (error?.code === 'PGRST301') {
    return new Error('Database schema error. Please contact support.');
  }
  
  return new Error(error?.message || 'An unexpected error occurred');
}

// Cache management utilities
export const CACHE_KEYS = {
  SERVICES: 'cached_services',
  WORKERS: 'cached_workers',
  ADDRESSES: 'cached_addresses',
  USER_PROFILE: 'cached_user_profile',
} as const;

export async function setCachedData<T>(key: string, data: T, expiryHours: number = 24): Promise<void> {
  try {
    const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
    const cachedData = {
      data,
      expiry: expiryTime
    };
    await storage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedItem = await storage.getItem(key);
    if (!cachedItem) return null;
    
    const parsed = JSON.parse(cachedItem);
    
    // Check if data has expired
    if (Date.now() > parsed.expiry) {
      await storage.removeItem(key);
      return null;
    }
    
    return parsed.data as T;
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    return null;
  }
}

export async function clearCache(key?: string): Promise<void> {
  try {
    if (key) {
      await storage.removeItem(key);
    } else {
      // Clear all cache keys
      const keys = Object.values(CACHE_KEYS);
      for (const cacheKey of keys) {
        await storage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Retry utility for network operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on authentication or permission errors
      if (error?.code === '42501' || error?.message?.includes('JWT')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}