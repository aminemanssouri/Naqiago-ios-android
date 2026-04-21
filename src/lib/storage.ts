import * as SecureStore from 'expo-secure-store';

// Storage utility that works with Expo
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },

  async clear(): Promise<void> {
    // SecureStore doesn't have a clear all method, so we'll need to track keys
    // For now, we'll just log this action
    console.log('Storage clear requested - implement key tracking if needed');
  }
};
