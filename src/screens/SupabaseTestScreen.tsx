import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SupabaseConnectionTest } from '../utils/supabaseTests';

interface TestResult {
  service: string;
  status: 'success' | 'error';
  message: string;
  latency?: number;
}

interface TestResults {
  overallStatus: 'success' | 'partial' | 'failed';
  results: TestResult[];
}

export default function SupabaseTestScreen() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  const runConnectionTest = async () => {
    setIsTestingConnection(true);
    setTestResults(null);

    try {
      const tester = new SupabaseConnectionTest();
      const results = await tester.runAllTests();
      setTestResults(results);
      
      // Show alert with overall result
      const statusEmoji = results.overallStatus === 'success' ? '✅' : results.overallStatus === 'partial' ? '⚠️' : '❌';
      Alert.alert(
        'Test Complete',
        `${statusEmoji} Overall Status: ${results.overallStatus.toUpperCase()}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Test Failed', error.message || 'An unexpected error occurred');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusColor = (status: 'success' | 'error') => {
    return status === 'success' ? '#4CAF50' : '#F44336';
  };

  const getStatusEmoji = (status: 'success' | 'error') => {
    return status === 'success' ? '✅' : '❌';
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20 }}>
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
          Supabase Connection Test
        </Text>
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
          This screen tests the connection to your Supabase database and verifies that all services are working correctly.
        </Text>

        <TouchableOpacity
          onPress={runConnectionTest}
          disabled={isTestingConnection}
          style={{
            backgroundColor: isTestingConnection ? '#cccccc' : '#2196F3',
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          {isTestingConnection ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Testing Connection...</Text>
            </View>
          ) : (
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Run Connection Test</Text>
          )}
        </TouchableOpacity>
      </View>

      {testResults && (
        <View>
          <View style={{
            backgroundColor: testResults.overallStatus === 'success' ? '#E8F5E8' : 
                          testResults.overallStatus === 'partial' ? '#FFF3E0' : '#FFEBEE',
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: testResults.overallStatus === 'success' ? '#4CAF50' : 
                            testResults.overallStatus === 'partial' ? '#FF9800' : '#F44336'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>
              Overall Status: {testResults.overallStatus.toUpperCase()}
            </Text>
            <Text style={{ color: '#666' }}>
              {testResults.results.filter(r => r.status === 'success').length}/{testResults.results.length} tests passed
            </Text>
          </View>

          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>
            Test Results:
          </Text>

          {testResults.results.map((result, index) => (
            <View
              key={index}
              style={{
                backgroundColor: 'white',
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
                borderLeftWidth: 3,
                borderLeftColor: getStatusColor(result.status),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Text style={{ fontSize: 16, marginRight: 5 }}>
                  {getStatusEmoji(result.status)}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>
                  {result.service}
                </Text>
                {result.latency && (
                  <Text style={{ fontSize: 12, color: '#666' }}>
                    {result.latency}ms
                  </Text>
                )}
              </View>
              <Text style={{ color: '#666', fontSize: 14 }}>
                {result.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}