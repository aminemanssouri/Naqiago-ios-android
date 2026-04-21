// Services index file - exports all services from one place
export { authService } from './auth';
export { servicesService } from './services';
export { bookingsService } from './bookings';
export { workersService } from './workers';
export { paymentsService } from './payments';
export { messagingService } from './messaging';
export { NaqiagoVehicleAPI } from './NaqiagoVehicleAPI';

// Address services are exported as functions
export * from './addresses';

// Utility functions for connection testing and error handling
export type { ConnectionStatus } from './utils';
export { 
  checkSupabaseConnection, 
  handleSupabaseError,
  getCachedData,
  setCachedData,
  clearCache,
  retryOperation,
  CACHE_KEYS
} from './utils';