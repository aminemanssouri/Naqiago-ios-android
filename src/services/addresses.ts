import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import type { Address, NewAddressInput } from '../types/address';
import { handleSupabaseError, retryOperation, getCachedData, setCachedData, CACHE_KEYS } from './utils';

export async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error || new Error('Not authenticated');
  return data.user.id;
}

// High-precision reverse geocoding via OpenStreetMap Nominatim (no API key, rate-limited)
export async function reverseGeocodeDetailed(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'car-wash-app/1.0 (reverse-geocode)'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address || {};
    const parts = [
      a.road,
      a.house_number,
      a.neighbourhood || a.quarter || a.suburb,
      a.city || a.town || a.village,
      a.state,
      a.postcode,
      a.country,
    ].filter(Boolean);
    const formatted = parts.join(', ');
    return formatted || data?.display_name || null;
  } catch (e) {
    return null;
  }
}

export async function listAddresses(useCache: boolean = true): Promise<Address[]> {
  try {
    // Try cache first
    if (useCache) {
      const cached = await getCachedData<Address[]>(CACHE_KEYS.ADDRESSES);
      if (cached) return cached;
    }

    const addresses = await retryOperation(async () => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      return (data as Address[]) ?? [];
    });

    // Cache successful result
    await setCachedData(CACHE_KEYS.ADDRESSES, addresses, 12); // Cache for 12 hours
    return addresses;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    
    // Try to return cached data as fallback
    const fallbackData = await getCachedData<Address[]>(CACHE_KEYS.ADDRESSES);
    if (fallbackData) {
      console.log('Returning cached addresses as fallback');
      return fallbackData;
    }
    
    throw handleSupabaseError(error);
  }
}

export async function createAddress(input: NewAddressInput & { is_default?: boolean }): Promise<Address> {
  try {
    const userId = await getCurrentUserId();
    
    // Ensure we have a valid user ID
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    console.log('Creating address for user:', userId);
    console.log('Address input:', input);
    
    // Prepare the address data with required fields
    const addressData = {
      ...input,
      user_id: userId,
      is_default: input.is_default ?? false,
      // Ensure we have at least some address data
      address_line_1: input.address_line_1 || '',
      city: input.city || '',
      // Remove country_code since it doesn't exist in schema
      // postal_code is handled by input.postal_code
    };
    
    console.log('Final address data:', addressData);
    
    const { data, error } = await supabase
      .from('addresses')
      .insert([addressData])
      .select('*')
      .single();
      
    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }

    const created = data as Address;

    if (input.is_default) {
      // Ensure single default: set others to false
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', created.id);
    }

    // Invalidate cache after creating new address
    await setCachedData(CACHE_KEYS.ADDRESSES, null, 0);

    return created;
  } catch (error) {
    console.error('Error creating address:', error);
    throw handleSupabaseError(error);
  }
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
  // Invalidate cache after deletion
  await setCachedData(CACHE_KEYS.ADDRESSES, null, 0);
}

export async function setDefaultAddress(addressId: string): Promise<void> {
  const userId = await getCurrentUserId();
  // Unset others, set this one
  const { error: e1 } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId);
  if (e2) throw e2;
  // Invalidate cache after changing default
  await setCachedData(CACHE_KEYS.ADDRESSES, null, 0);
}

export async function geocodeFreeTextAddress(address: string, city?: string) {
  const query = [address, city].filter(Boolean).join(', ');
  if (!query) return null;
  try {
    const results = await Location.geocodeAsync(query);
    if (results && results.length > 0) {
      const first = results[0];
      return { latitude: first.latitude, longitude: first.longitude };
    }
  } catch (e) {
    // swallow to allow UI fallback
  }
  return null;
}

export async function getAddressById(id: string): Promise<Address | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Address) ?? null;
}

export async function updateAddress(id: string, payload: Partial<Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  // Invalidate cache after update
  await setCachedData(CACHE_KEYS.ADDRESSES, null, 0);
  return data as Address;
}
