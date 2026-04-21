import 'dotenv/config';
export default {
  expo: {
    name: process.env.EXPO_PUBLIC_APP_NAME || "Naqiago",
    slug: "carwash-pro",
    owner: process.env.EXPO_OWNER || "naqiago",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/192x192 NAQIAGO.png",
    userInterfaceStyle: "light",
    description: "Naqiago - Your trusted platform for professional services. Find and book verified service providers near you.",
    primaryColor: "#3b82f6",
    newArchEnabled: true,
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'carwash-pro',
    splash: {
      image: "./assets/icons/192x192 NAQIAGO.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.naqiago.appdev",
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We use your location to show nearby service providers and recenter the map.",
        NSCameraUsageDescription: "Allow Naqiago to access your camera to take photos.",
        NSPhotoLibraryUsageDescription: "Allow Naqiago to access your photo library to select images.",
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: ["applinks:prxsvouchiodqppqeamz.supabase.co"]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/192x192 NAQIAGO.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      config: {
        googleMaps: {
          // Use only the raw key string from env (not a URL)
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
        }
      },
      package: process.env.ANDROID_PACKAGE || "com.naqiago.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "prxsvouchiodqppqeamz.supabase.co",
              pathPrefix: "/auth/v1/verify"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/images/Logo Naqiago White.png"
    },
    plugins: [
      "expo-asset",
      "expo-font",
      "expo-secure-store",
      "expo-system-ui",
      "expo-audio",
      [
        "expo-notifications",
        {
          icon: "./assets/icons/96x96 NAQIAGO.png",
          color: "#ffffff"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Naqiago to use your location to show nearby service providers."
        }
      ]
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'd92b61b1-c9f0-44db-bec3-dd2b018b2583'
      }
    }
  }
};
