import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationContextType {
  expoPushToken: string | undefined;
  notification: Notifications.Notification | undefined;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    }).catch(err => {
      console.error("Failed to get push token", err);
      setError(err);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle navigation logic here if needed
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Update token when user changes (e.g. login/logout)
  useEffect(() => {
    if (expoPushToken && user) {
      saveTokenToDatabase(expoPushToken, user.id);
    }
  }, [user, expoPushToken]);

  const saveTokenToDatabase = async (token: string, userId: string) => {
    try {
      // Check if token needs to be updated
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
          // If profile fetch fails, maybe profile doesn't exist yet or connection error.
          // We'll try to update anyway.
          console.warn("Could not fetch profile to check token", fetchError);
      }

      if (profile && profile.expo_push_token === token) {
          return; // Token matches, no need to update
      }

      const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);

      if (error) {
        throw error;
      }
      console.log('Push token saved to database for user:', userId);
    } catch (err) {
      console.error('Error saving push token:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the token
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          console.warn('No EAS project ID found. This is required for push notifications.');
        }
        console.log('Attempting to get push token with projectId:', projectId);
        token = (await Notifications.getExpoPushTokenAsync({
            projectId,
        })).data;
        console.log('✅ Expo Push Token:', token);
    } catch (e: any) {
        console.error("❌ Error getting Expo push token:", e);
        console.error("Error details:", e.message);
    }
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}
