import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/use-auth-store";
import { useLocationStore } from "../../store/use-location-store";
import { getPendingCount, flushQueue } from "../../services/offline-queue";
import { Colors } from "../../constants/theme";

export default function ProfileScreen() {
  const { technician, logout } = useAuthStore();
  const { stopWatching } = useLocationStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    getPendingCount().then(setPendingCount);
  }, []);

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          stopWatching();
          await logout();
          // Auth gate in root _layout.tsx redirects to login
        },
      },
    ]);
  }

  async function handleFlush() {
    setFlushing(true);
    try {
      await flushQueue();
      const remaining = await getPendingCount();
      setPendingCount(remaining);
      Alert.alert(
        "Sync complete",
        remaining === 0
          ? "All queued items uploaded successfully."
          : `${remaining} item(s) still pending — check your connection.`,
      );
    } finally {
      setFlushing(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        {/* Identity card */}
        <View style={styles.card}>
          <Text style={styles.name}>{technician?.name}</Text>
          <Text style={styles.email}>{technician?.email}</Text>
          <Text style={styles.role}>{technician?.role}</Text>
        </View>

        {/* Offline queue status */}
        {pendingCount > 0 && (
          <View style={styles.queueCard}>
            <Text style={styles.queueText}>
              {pendingCount} item{pendingCount !== 1 ? "s" : ""} waiting to sync
            </Text>
            <TouchableOpacity
              style={[styles.flushButton, flushing && styles.buttonDisabled]}
              onPress={handleFlush}
              disabled={flushing}
            >
              <Text style={styles.flushButtonText}>
                {flushing ? "Syncing…" : "Sync now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { color: Colors.primary, fontSize: 14, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "700", color: Colors.text },
  content: { padding: 16 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  email: { fontSize: 14, color: Colors.textMuted },
  role: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  queueCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueText: { fontSize: 14, color: Colors.warning, flex: 1 },
  flushButton: {
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  flushButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  logoutText: { color: Colors.danger, fontWeight: "600", fontSize: 15 },
});
