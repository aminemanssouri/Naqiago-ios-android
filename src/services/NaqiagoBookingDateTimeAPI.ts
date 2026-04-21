// Naqiago Booking DateTime API integration
const API_CONFIG = {
  BASE_URL: 'https://naqiago.com/api',
  TIMEOUT: 10000, // 10 seconds
};

export interface TimeSlot {
  label: string;
  value: string;
}

export interface CityTimeSlot {
  startHour: number;
  startMinutes: number;
  endHour: number;
  endMinutes: number;
  city: string;
  status: 'active' | 'inactive';
}

export interface CityAvailability {
  [date: string]: CityTimeSlot;
}

// Fallback time slots if API fails
const FALLBACK_TIME_SLOTS: TimeSlot[] = [
  { label: '9:00', value: '9:00' },
  { label: '11:00', value: '11:00' },
  { label: '13:00', value: '13:00' },
  { label: '15:00', value: '15:00' },
  { label: '17:00', value: '17:00' },
];

// Cache for API responses
let timeSlotsCache: TimeSlot[] | null = null;
let cityAvailabilityCache = new Map<string, CityAvailability>();
let cacheTimestamps = {
  timeSlots: 0,
  cityAvailability: new Map<string, number>(),
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

/**
 * Fetches data from the API with timeout handling
 * @param url - The URL to fetch from
 * @param options - Fetch options
 * @returns Promise with the response data
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Checks if cache is still valid based on timestamp
 * @param timestamp - The timestamp of when the cache was set
 * @returns boolean indicating if cache is valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export const NaqiagoBookingDateTimeAPI = {
  /**
   * Get available time slots for bookings
   * @returns Promise<TimeSlot[]> Array of available time slots
   */
  async getTimeSlots(): Promise<TimeSlot[]> {
    try {
      // Return cached data if still valid
      if (
        timeSlotsCache &&
        isCacheValid(cacheTimestamps.timeSlots)
      ) {
        console.log('Returning cached time slots');
        return timeSlotsCache;
      }

      const response = await fetchWithTimeout(
        `${API_CONFIG.BASE_URL}/time_slots/get`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const slots: TimeSlot[] = data.data.map((slot: string) => ({
          label: slot,
          value: slot,
        }));

        // Cache the successful response
        timeSlotsCache = slots;
        cacheTimestamps.timeSlots = Date.now();

        console.log('Time slots fetched successfully:', slots.length);
        return slots;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);

      // Return fallback data on error
      return FALLBACK_TIME_SLOTS;
    }
  },

  /**
   * Get city-specific availability for given date
   * @param city - City name to get availability for
   * @returns Promise<CityAvailability> Object containing availability data
   */
  async getCityAvailability(city: string): Promise<CityAvailability> {
    try {
      // Check cache first
      if (
        cityAvailabilityCache.has(city) &&
        isCacheValid(cacheTimestamps.cityAvailability.get(city) || 0)
      ) {
        console.log(`Returning cached availability for ${city}`);
        return cityAvailabilityCache.get(city)!;
      }

      const response = await fetchWithTimeout(
        `${API_CONFIG.BASE_URL}/app/times/get`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ city }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate and transform response
      if (data && typeof data === 'object') {
        const availability: CityAvailability = data;

        // Cache the successful response
        cityAvailabilityCache.set(city, availability);
        cacheTimestamps.cityAvailability.set(city, Date.now());

        console.log(`City availability fetched for ${city}:`, Object.keys(availability).length, 'dates');
        return availability;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Error fetching city availability for ${city}:`, error);

      // Return empty availability on error (UI will use default time slots)
      return {};
    }
  },

  /**
   * Clear all cached data
   */
  clearCache(): void {
    timeSlotsCache = null;
    cityAvailabilityCache.clear();
    cacheTimestamps.timeSlots = 0;
    cacheTimestamps.cityAvailability.clear();
    console.log('API cache cleared');
  },

  /**
   * Clear cache for specific city
   * @param city - City name to clear cache for
   */
  clearCityCache(city: string): void {
    cityAvailabilityCache.delete(city);
    cacheTimestamps.cityAvailability.delete(city);
    console.log(`Cache cleared for city: ${city}`);
  },

  /**
   * Filter time slots based on city availability
   * @param timeSlots - Array of available time slots
   * @param citySlot - City slot data for a specific date
   * @returns TimeSlot[] Filtered time slots
   */
  filterTimeSlotsByAvailability(
    timeSlots: TimeSlot[],
    citySlot: CityTimeSlot | undefined
  ): TimeSlot[] {
    // If no slot data, return all time slots
    if (!citySlot) {
      return timeSlots;
    }

    // If status is inactive, return no time slots
    if (citySlot.status === 'inactive') {
      return [];
    }

    // If status is active, filter based on start/end hours
    if (citySlot.status === 'active') {
      const startMinutes = citySlot.startHour * 60 + citySlot.startMinutes;
      const endMinutes = citySlot.endHour * 60 + citySlot.endMinutes;

      return timeSlots.filter((slot) => {
        const [hours, minutes] = slot.value.split(':').map(Number);
        const slotMinutes = hours * 60 + minutes;
        return slotMinutes >= startMinutes && slotMinutes <= endMinutes;
      });
    }

    return timeSlots;
  },

  /**
   * Get fallback time slots
   * @returns TimeSlot[] Default fallback time slots
   */
  getFallbackTimeSlots(): TimeSlot[] {
    return FALLBACK_TIME_SLOTS;
  },
};
