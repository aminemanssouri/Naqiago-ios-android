// Example usage of the enhanced Supabase services
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { 
  servicesService, 
  workersService, 
  checkSupabaseConnection,
  type ConnectionStatus 
} from '../services';

export default function EnhancedServicesExample() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const status = await checkSupabaseConnection();
      setConnectionStatus(status);
      
      if (status.status === 'connected') {
        loadData();
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load services with caching
      const servicesData = await servicesService.getServices(true);
      setServices(servicesData);

      // Load workers with caching  
      const workersData = await workersService.getWorkers(true);
      setWorkers(workersData);
    } catch (error: any) {
      Alert.alert('Data Loading Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleSpecificPricing = async () => {
    try {
      setIsLoading(true);
      const suvServices = await servicesService.getServicesWithVehiclePricing('suv');
      setServices(suvServices);
      Alert.alert('Success', `Loaded ${suvServices.length} services with SUV pricing`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const findNearbyWorkers = async () => {
    try {
      setIsLoading(true);
      // Example coordinates (Casablanca, Morocco)
      const nearbyWorkers = await workersService.findNearbyWorkersWithDetails(
        33.5731, -7.5898, 10
      );
      setWorkers(nearbyWorkers);
      Alert.alert('Success', `Found ${nearbyWorkers.length} nearby workers`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Enhanced Supabase Services
      </Text>

      {/* Connection Status */}
      <View style={{
        padding: 15,
        marginBottom: 20,
        backgroundColor: connectionStatus?.status === 'connected' ? '#E8F5E8' : '#FFEBEE',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: connectionStatus?.status === 'connected' ? '#4CAF50' : '#F44336'
      }}>
        <Text style={{ fontWeight: 'bold' }}>
          Connection: {connectionStatus?.status || 'Unknown'}
        </Text>
        {connectionStatus?.latency && (
          <Text style={{ color: '#666' }}>
            Latency: {connectionStatus.latency}ms
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#2196F3',
            padding: 12,
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={loadData}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#FF9800',
            padding: 12,
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={getVehicleSpecificPricing}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Get SUV Pricing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#4CAF50',
            padding: 12,
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={findNearbyWorkers}
          disabled={isLoading}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Find Nearby Workers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Data Display */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Services ({services.length})
        </Text>
        <FlatList
          data={services.slice(0, 3)} // Show first 3 services
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{
              padding: 12,
              marginBottom: 8,
              backgroundColor: 'white',
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text style={{ color: '#666' }}>{item.desc}</Text>
            </View>
          )}
        />

        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 20 }}>
          Workers ({workers.length})
        </Text>
        <FlatList
          data={workers.slice(0, 2)} // Show first 2 workers
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{
              padding: 12,
              marginBottom: 8,
              backgroundColor: 'white',
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text style={{ color: '#666' }}>
                Rating: {item.rating} ({item.reviewCount} reviews)
              </Text>
              <Text style={{ color: '#666' }}>
                Available: {item.isAvailable ? 'Yes' : 'No'}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}