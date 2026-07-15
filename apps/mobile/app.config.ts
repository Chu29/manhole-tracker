import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Manhole Tracker",
  slug: "mobile",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "mobile",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    package: "com.manholetracker.mobile",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#1a2744",
    },
  },
  web: {
    output: "static",
  },
  plugins: ["expo-router", "expo-splash-screen"],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "11bbb9f3-91e9-4b19-9492-fa0937865948",
    },
  },
});
