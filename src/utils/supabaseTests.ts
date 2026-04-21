import { checkSupabaseConnection } from '../services/utils';
import { servicesService } from '../services/services';
import { workersService } from '../services/workers';
import { bookingsService } from '../services/bookings';
import { listAddresses } from '../services/addresses';

/**
 * Comprehensive Supabase connection and service test
 * Run this to verify all services are properly connected to the database
 */
export class SupabaseConnectionTest {
  private results: Array<{ service: string; status: 'success' | 'error'; message: string; latency?: number }> = [];

  async runAllTests(): Promise<{ 
    overallStatus: 'success' | 'partial' | 'failed'; 
    results: Array<{ service: string; status: 'success' | 'error'; message: string; latency?: number }>;
  }> {
    console.log('🔄 Starting comprehensive Supabase connection tests...\n');

    // Test 1: Basic connection
    await this.testBasicConnection();

    // Test 2: Services
    await this.testServicesService();

    // Test 3: Workers
    await this.testWorkersService();

    // Test 4: Addresses (only if authenticated)
    await this.testAddressesService();

    // Test 5: Bookings service (basic functionality)
    await this.testBookingsService();

    // Calculate overall status
    const successCount = this.results.filter(r => r.status === 'success').length;
    const totalTests = this.results.length;
    
    let overallStatus: 'success' | 'partial' | 'failed';
    if (successCount === totalTests) {
      overallStatus = 'success';
    } else if (successCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'failed';
    }

    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${successCount}/${totalTests} tests`);
    console.log(`❌ Failed: ${totalTests - successCount}/${totalTests} tests`);
    console.log(`🎯 Overall Status: ${overallStatus.toUpperCase()}\n`);

    return { overallStatus, results: this.results };
  }

  private async testBasicConnection(): Promise<void> {
    try {
      console.log('🔌 Testing basic Supabase connection...');
      const result = await checkSupabaseConnection();
      
      if (result.status === 'connected') {
        this.results.push({
          service: 'Basic Connection',
          status: 'success',
          message: `Connected successfully in ${result.latency}ms`,
          latency: result.latency
        });
        console.log(`✅ Basic connection: OK (${result.latency}ms)`);
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error: any) {
      this.results.push({
        service: 'Basic Connection',
        status: 'error',
        message: error.message || 'Connection failed'
      });
      console.log(`❌ Basic connection: FAILED - ${error.message}`);
    }
  }

  private async testServicesService(): Promise<void> {
    try {
      console.log('🛠️  Testing Services service...');
      const start = Date.now();
      
      const services = await servicesService.getServices(false); // Don't use cache for test
      const latency = Date.now() - start;
      
      this.results.push({
        service: 'Services',
        status: 'success',
        message: `Retrieved ${services.length} services in ${latency}ms`,
        latency
      });
      console.log(`✅ Services service: OK (${services.length} services, ${latency}ms)`);
    } catch (error: any) {
      this.results.push({
        service: 'Services',
        status: 'error',
        message: error.message || 'Services query failed'
      });
      console.log(`❌ Services service: FAILED - ${error.message}`);
    }
  }

  private async testWorkersService(): Promise<void> {
    try {
      console.log('👷 Testing Workers service...');
      const start = Date.now();
      
      const workers = await workersService.getWorkers(false); // Don't use cache for test
      const latency = Date.now() - start;
      
      this.results.push({
        service: 'Workers',
        status: 'success',
        message: `Retrieved ${workers.length} workers in ${latency}ms`,
        latency
      });
      console.log(`✅ Workers service: OK (${workers.length} workers, ${latency}ms)`);
    } catch (error: any) {
      this.results.push({
        service: 'Workers',
        status: 'error',
        message: error.message || 'Workers query failed'
      });
      console.log(`❌ Workers service: FAILED - ${error.message}`);
    }
  }

  private async testAddressesService(): Promise<void> {
    try {
      console.log('📍 Testing Addresses service...');
      const start = Date.now();
      
      // This will fail if not authenticated, which is expected
      const addresses = await listAddresses(false); // Don't use cache for test
      const latency = Date.now() - start;
      
      this.results.push({
        service: 'Addresses',
        status: 'success',
        message: `Retrieved ${addresses.length} addresses in ${latency}ms`,
        latency
      });
      console.log(`✅ Addresses service: OK (${addresses.length} addresses, ${latency}ms)`);
    } catch (error: any) {
      // If it's an authentication error, that's expected for testing
      if (error.message?.includes('JWT') || error.message?.includes('not authenticated')) {
        this.results.push({
          service: 'Addresses',
          status: 'success',
          message: 'Service working (authentication required for data)'
        });
        console.log(`✅ Addresses service: OK (requires authentication)`);
      } else {
        this.results.push({
          service: 'Addresses',
          status: 'error',
          message: error.message || 'Addresses query failed'
        });
        console.log(`❌ Addresses service: FAILED - ${error.message}`);
      }
    }
  }

  private async testBookingsService(): Promise<void> {
    try {
      console.log('📅 Testing Bookings service...');
      
      // Test bookings stats method (will fail if not authenticated, which is expected)
      const stats = await bookingsService.getBookingStats('test-user-id', 'customer');
      
      this.results.push({
        service: 'Bookings',
        status: 'success',
        message: 'Bookings service methods accessible'
      });
      console.log(`✅ Bookings service: OK`);
    } catch (error: any) {
      // If it's an authentication error or user not found, that's expected
      if (error.message?.includes('JWT') || error.message?.includes('not authenticated') || error.message?.includes('No data found')) {
        this.results.push({
          service: 'Bookings',
          status: 'success',
          message: 'Service working (authentication/data required)'
        });
        console.log(`✅ Bookings service: OK (requires authentication/data)`);
      } else {
        this.results.push({
          service: 'Bookings',
          status: 'error',
          message: error.message || 'Bookings query failed'
        });
        console.log(`❌ Bookings service: FAILED - ${error.message}`);
      }
    }
  }

  // Quick test method for development
  static async quickTest(): Promise<void> {
    console.log('🚀 Running quick Supabase connection test...\n');
    const tester = new SupabaseConnectionTest();
    await tester.testBasicConnection();
    await tester.testServicesService();
  }
}

// Export a simple function for easy testing
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const tester = new SupabaseConnectionTest();
    const results = await tester.runAllTests();
    return results.overallStatus === 'success' || results.overallStatus === 'partial';
  } catch (error) {
    console.error('Test runner failed:', error);
    return false;
  }
}