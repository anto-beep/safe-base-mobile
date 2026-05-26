import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FloatingOverlays } from "@/src/components/FloatingOverlays";
import { AccessibilityProvider } from "@/src/context/AccessibilityContext";
import { AdminAuthProvider } from "@/src/context/AdminAuthContext";
import { AuthProvider } from "@/src/context/AuthContext";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { startBackgroundSync } from "@/src/lib/offline-queue";

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Start NetInfo-driven offline capture sync as soon as the app mounts.
  useEffect(() => {
    startBackgroundSync();
  }, []);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#FFFFFF" },
                animation: "fade",
              }}
            />
            <FloatingOverlays />
          </AdminAuthProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}
