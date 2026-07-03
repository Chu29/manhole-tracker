import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../store/use-auth-store";

export default function Index() {
  const { isHydrated, token } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (token) {
      router.replace("/(tabs)/nearby");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isHydrated, token]);

  // Show a blank loading screen while AsyncStorage hydrates (usually <300ms)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1A6EBF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },
});
