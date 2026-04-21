// Naqiago Vehicle API integration
import { hasLocalBrandLogo } from '../components/icons/BrandLogos';

const API_CONFIG = {
  BASE_URL: 'https://naqiago.com/api',
  BRANDS_TOKEN: 'Bearer a47c1d2f9b8e3a6c9d7e5f4a1b0c2d3e4f6a7b8c9d1e2f3a4b5c6d7e8f9a0b1',
  MODELS_TOKEN: 'Bearer 9f2e7b4c8a1d6e3f5b0c9a7d2e4f6b8c1d3a5f7e9b0c2d4f6a8b1c3d5e7f9a0'
};

export interface CarBrand {
  id: number;
  name: string;
  logo: string | null;
  popular?: boolean;
  hasLocalLogo?: boolean;
}

export interface CarModel {
  id: number;
  name: string;
  type?: string;
  car_brand_id: number;
}

// Cache for API responses
let brandsCache: CarBrand[] | null = null;
let modelsCache = new Map<number, CarModel[]>();

export const NaqiagoVehicleAPI = {
  // Get all car brands with logos
  async getAllBrands(): Promise<CarBrand[]> {
    try {
      // Return cached data if available
      if (brandsCache) {
        return brandsCache;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/car_brands_logos`, {
        headers: {
          'Authorization': API_CONFIG.BRANDS_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to expected format
      const transformedData: CarBrand[] = data.map((brand: any) => ({
        id: brand.id,
        name: brand.car_brand_name,
        logo: brand.car_brand_image ? `https://naqiago.com/storage/${brand.car_brand_image}` : null,
        popular: this.getPopularBrandIds().includes(brand.id),
        hasLocalLogo: hasLocalBrandLogo(brand.car_brand_name)
      }));
      
      // Cache the successful response
      brandsCache = transformedData;
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching car brands:', error);
      
      // Return fallback data on error
      return this.getPopularBrands();
    }
  },

  // Get models for a specific brand ID
  async getModelsForBrand(brandId: number): Promise<CarModel[]> {
    try {
      // Check cache first
      if (modelsCache.has(brandId)) {
        return modelsCache.get(brandId)!;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/car_models_names/${brandId}`, {
        headers: {
          'Authorization': API_CONFIG.MODELS_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to expected format
      const transformedData: CarModel[] = data.map((model: any) => ({
        id: model.id,
        name: model.model_name,
        // The upstream API has historically used different field names for the
        // "vehicle product type" classification. Keep this resilient by mapping
        // multiple possible keys to our unified `type`.
        type:
          (typeof model.type === 'string' && model.type) ||
          (typeof model.product_type === 'string' && model.product_type) ||
          (typeof model.vehicle_type === 'string' && model.vehicle_type) ||
          (typeof model.car_type === 'string' && model.car_type) ||
          (typeof model.segment === 'string' && model.segment) ||
          (typeof model.category === 'string' && model.category) ||
          undefined,
        car_brand_id: model.car_brand_id
      }));
      
      // Cache the successful response
      modelsCache.set(brandId, transformedData);
      
      return transformedData;
    } catch (error) {
      console.error(`Error fetching models for brand ${brandId}:`, error);
      
      // Return fallback data on error
      return this.getPopularModels();
    }
  },

  // Get popular brand IDs for marking brands as popular
  getPopularBrandIds(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Adjust based on actual popular brand IDs
  },

  // Fallback popular brands data
  getPopularBrands(): CarBrand[] {
    return [
      { id: 1, name: 'Toyota', logo: null, popular: true, hasLocalLogo: true },
      { id: 2, name: 'Honda', logo: null, popular: true, hasLocalLogo: true },
      { id: 3, name: 'Ford', logo: null, popular: true, hasLocalLogo: true },
      { id: 4, name: 'Chevrolet', logo: null, popular: true, hasLocalLogo: true },
      { id: 5, name: 'BMW', logo: null, popular: true, hasLocalLogo: true },
      { id: 6, name: 'Mercedes-Benz', logo: null, popular: true, hasLocalLogo: true },
      { id: 7, name: 'Audi', logo: null, popular: true, hasLocalLogo: true },
      { id: 8, name: 'Nissan', logo: null, popular: true, hasLocalLogo: true },
      { id: 9, name: 'Hyundai', logo: null, popular: true, hasLocalLogo: true },
      { id: 10, name: 'Volkswagen', logo: null, popular: true, hasLocalLogo: true }
    ];
  },

  // Fallback popular models data
  getPopularModels(): CarModel[] {
    return [
      { id: 1, name: 'Camry', car_brand_id: 1 },
      { id: 2, name: 'Corolla', car_brand_id: 1 },
      { id: 3, name: 'Prius', car_brand_id: 1 },
      { id: 4, name: 'RAV4', car_brand_id: 1 },
      { id: 5, name: 'Highlander', car_brand_id: 1 }
    ];
  },

  // Generate year options (current year back to 1990)
  getYearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year);
    }
    return years;
  },

  // Clear cache (useful for refreshing data)
  clearCache(): void {
    brandsCache = null;
    modelsCache.clear();
  },

  // Get cached brands without API call
  getCachedBrands(): CarBrand[] {
    return brandsCache || this.getPopularBrands();
  },

  // Get cached models for a brand without API call
  getCachedModels(brandId: number): CarModel[] {
    return modelsCache.get(brandId) || this.getPopularModels();
  },

  // Search brands by name
  searchBrands(brands: CarBrand[], searchTerm: string): CarBrand[] {
    if (!searchTerm.trim()) return brands;
    
    const term = searchTerm.toLowerCase().trim();
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(term)
    );
  },

  // Search models by name
  searchModels(models: CarModel[], searchTerm: string): CarModel[] {
    if (!searchTerm.trim()) return models;
    
    const term = searchTerm.toLowerCase().trim();
    return models.filter(model => 
      model.name.toLowerCase().includes(term)
    );
  }
};
