import "react-native-get-random-values";
import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { useAuthStore } from "../store/use-auth-store";
import { useManholeStore } from "../store/use-manhole-store";
import { startQueueFlusher } from "../services/offline-queue";

/**
 * Auth gate: redirects unauthenticated users to /auth/login and authenticated
 * users away from the auth screens.
 */
function useAuthGate() {
  const { token, isHydrated } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (!isHydrated) return; // wait until AsyncStorage has been read

    const inAuthGroup = String(segments[0]) === "(auth)";

    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)/nearby"); // ← was '/nearby'
    }
  }, [token, isHydrated, segments]);
}

export default function RootLayout() {
  const { hydrate: hydrateAuth } = useAuthStore();
  const { hydrate: hydrateManholes } = useManholeStore();

  // Hydrate persisted state and start offline queue flusher on launch
  useEffect(() => {
    hydrateAuth();
    hydrateManholes();
    const unsubscribe = startQueueFlusher();
    return unsubscribe;
  }, [hydrateAuth, hydrateManholes]);

  useAuthGate();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="nearby/[id]"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </>
  );
}
