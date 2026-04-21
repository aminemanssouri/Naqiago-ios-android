import React, { useEffect } from 'react';
import { Linking, View, BackHandler } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Settings, Wrench, Briefcase, User, TestTube, MessageCircle } from 'lucide-react-native';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import SimpleHomeScreen from '../screens/SimpleHomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LanguageScreen from '../screens/LanguageScreen';
import ServicesScreen from '../screens/ServicesScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WorkerDetailScreen from '../screens/WorkerDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingDateTimeScreen from '../screens/BookingDateTimeScreen';
import BookingVehicleScreen from '../screens/BookingVehicleScreen';
import BookingServicesScreen from '../screens/BookingServicesScreen';
import BookingLocationScreen from '../screens/BookingLocationScreen';
import BookingPaymentScreen from '../screens/BookingPaymentScreen';
import BookingReviewScreen from '../screens/BookingReviewScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HelpScreen from '../screens/HelpScreen';
import AddressesScreen from '../screens/AddressesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ServiceWorkersScreen from '../screens/ServiceWorkersScreen';
import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import WorkerBookingsScreen from '../screens/WorkerBookingsScreen';
import MessagingScreen from '../screens/MessagingScreen';
import ManageBookingScreen from '../screens/ManageBookingScreen';
import SupportLegalScreen from '../screens/SupportLegalScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import EditAddressScreen from '../screens/EditAddressScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';
import SearchScreen from '../screens/SearchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const theme = useThemeColors();
  const { user } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const userRole = user?.profile?.role || 'customer';
  const navigation = useNavigation();

  // Prevent back navigation when authenticated on main tabs
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back from main tabs when authenticated
      if (user) {
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [user]);

  // Rely on initialRouteName and Tab key reset; avoid imperative navigation here

  return (
    <Tab.Navigator
      key={`${userRole}-${user?.id ?? 'unauthenticated'}`}
      initialRouteName={userRole === 'worker' ? 'WorkerBookings' : 'Home'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === 'Home') {
            IconComponent = Home;
          } else if (route.name === 'Bookings') {
            IconComponent = Calendar;
          } else if (route.name === 'WorkerBookings') {
            IconComponent = Calendar;
          } else if (route.name === 'Services') {
            IconComponent = Wrench;
          } else if (route.name === 'Dashboard') {
            IconComponent = Briefcase;
          } else if (route.name === 'Messaging') {
            IconComponent = MessageCircle;
          } else if (route.name === 'Profile') {
            IconComponent = User;
          } else if (route.name === 'Settings') {
            IconComponent = Settings;
          }

          return IconComponent ? <IconComponent size={size} color={color} /> : null;
        },
        tabBarLabel: (() => {
          switch (route.name) {
            case 'Home':
              return t('home') || 'Home';
            case 'Services':
              return t('services_title') || 'Services';
            case 'Bookings':
              return t('my_bookings') || 'Bookings';
            case 'WorkerBookings':
              return t('my_bookings') || 'Bookings';
            case 'Dashboard':
              return t('dashboard') || 'Dashboard';
            case 'Messaging':
              return t('messaging') || 'Messaging';
            case 'Profile':
              return t('profile') || 'Profile';
            case 'Settings':
              return t('settings') || 'Settings';
            default:
              return route.name;
          }
        })(),
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.cardBorder,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 62 + Math.max(insets.bottom, 10),
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
        },
      })}
    >
      {userRole === 'worker' ? (
        <>
          <Tab.Screen name="WorkerBookings" component={WorkerBookingsScreen} />
          <Tab.Screen name="Messaging" component={MessagingScreen} />
          <Tab.Screen name="Dashboard" component={WorkerDashboardScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={WelcomeScreen} />
          <Tab.Screen name="Services" component={ServicesScreen} />
          <Tab.Screen name="Bookings" component={BookingsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}

// Loading screen component
function LoadingScreen() {
  return null;
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { user, loading } = useAuth();
  
  // Create a wrapper component that handles the initial routing logic
  const InitialScreen = () => {
    const navigation = useNavigation();
    const theme = useThemeColors();
    const prevUserRef = React.useRef(user);
    
    React.useEffect(() => {
      // Skip if still loading
      if (loading) {
        return;
      }
      
      const currentRoute = navigation.getState()?.routes[navigation.getState()?.index || 0]?.name;
      
      // Don't redirect if on password reset or forgot password screens
      if (currentRoute === 'ResetPassword' || currentRoute === 'ForgotPassword') {
        console.log('🔗 On auth flow screen, skipping redirect');
        prevUserRef.current = user;
        return;
      }
      
      // Handle the case when user changes (login or logout)
      const userChanged = prevUserRef.current !== user;
      const isAuthenticated = !!user;
      const onAuthScreen = ['Login', 'Signup', 'ForgotPassword', 'EntryScreen'].includes(currentRoute);
      const onMainApp = currentRoute === 'MainTabs' || !['Login', 'Signup', 'ForgotPassword', 'EntryScreen', 'ResetPassword', 'ChangePassword'].includes(currentRoute);
      
      if (isAuthenticated && (onAuthScreen || currentRoute === 'EntryScreen')) {
        // User is logged in but on auth screen - go to main app
        console.log('✅ User authenticated, navigating to MainTabs');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' as never }],
        });
      } else if (!isAuthenticated && (onMainApp || currentRoute === 'EntryScreen')) {
        // User is logged out but on main app - go to login
        console.log('🔒 No user, navigating to Login');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      }
      
      prevUserRef.current = user;
    }, [user, loading, navigation]);
    
    // Show a simple loading view instead of WelcomeScreen to prevent flash
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }} />
    );
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EntryScreen" component={InitialScreen} />
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{
          gestureEnabled: false,
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          gestureEnabled: false,
          presentation: 'card'
        }}
      />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingDateTime" component={BookingDateTimeScreen} />
      <Stack.Screen name="BookingVehicle" component={BookingVehicleScreen} />
      <Stack.Screen name="BookingServices" component={BookingServicesScreen} />
      <Stack.Screen name="BookingLocation" component={BookingLocationScreen} />
      <Stack.Screen name="BookingPayment" component={BookingPaymentScreen} />
      <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SupportLegal" component={SupportLegalScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
      <Stack.Screen name="ServiceWorkers" component={ServiceWorkersScreen} />
      <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} />
      <Stack.Screen name="ManageBooking" component={ManageBookingScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="EditAddress" component={EditAddressScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation({ navigationRef }: { navigationRef?: any }) {
  const theme = useThemeColors();
  const { user, loading } = useAuth();

  // ALWAYS show AppStack - don't switch navigators based on loading
  // Switching navigators resets navigation state
  return (
    <NavigationContainer 
      ref={navigationRef}
      theme={theme.isDark ? NavigationDarkTheme : NavigationLightTheme} 
      linking={{
      prefixes: [
        'naqiago://',
        'exp+carwash-pro://',
        'https://auth.expo.io/@Naqiago/carwash-pro',
        'https://prxsvouchiodqppqeamz.supabase.co'
      ],
      config: {
        screens: {
          EntryScreen: '',
          MainTabs: {
            screens: {
              Home: 'home',
              Services: 'services',
              Bookings: 'bookings',
              Profile: 'profile',
            },
          },
          ResetPassword: {
            path: 'reset-password',
            parse: {
              token: (token: string) => token,
              type: (type: string) => type,
              code: (code: string) => code,
              redirect_to: (redirect: string) => redirect,
            },
          },
          ForgotPassword: 'forgot-password',
          Login: 'login',
          Signup: 'signup',
          // Also catch the Supabase web verify URL
          'ResetPassword-verify': {
            path: 'auth/v1/verify',
            parse: {
              token: (token: string) => token,
              type: (type: string) => type,
              code: (code: string) => code,
            },
          },
        },
      },
      async getInitialURL() {
        // Check if app was opened by a deep link
        const url = await Linking.getInitialURL();
        if (url) {
          console.log('🔗 Initial URL detected:', url);
        }
        return url;
      },
      subscribe(listener) {
        const onReceiveURL = ({ url }: { url: string }) => {
          console.log('🔗 Deep link received:', url);
          listener(url);
        };
        const subscription = Linking.addEventListener('url', onReceiveURL);
        return () => subscription.remove();
      },
    }}>
      <AppStack />
    </NavigationContainer>
  );
}
