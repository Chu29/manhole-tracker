import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/use-auth-store";
import { useLocationStore } from "../../store/use-location-store";
import { useManholeStore } from "../../store/use-manhole-store";
import { getPendingCount, flushQueue } from "../../services/offline-queue";
import { Colors } from "../../constants/theme";

export default function ProfileScreen() {
  const { token, technician, logout } = useAuthStore();
  const { stopWatching } = useLocationStore();
  const { cachedManholes } = useManholeStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    getPendingCount().then(setPendingCount);
  }, []);

  if (token && !technician) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          stopWatching();
          await logout();
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
          ? "All items uploaded successfully."
          : `${remaining} item(s) still pending — check your connection.`,
      );
    } catch (err) {
      Alert.alert("Sync failed", "A network error occurred. Please try again later.");
    } finally {
      setFlushing(false);
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert("Copied", `${label} copied to clipboard!`);
    } catch (err) {
      Alert.alert("Details", `${label}:\n${text}`);
    }
  };

  const initials = technician?.name
    ? technician.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  const formattedDate = technician?.createdAt
    ? new Date(technician.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Avatar and Name */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{technician?.name || "Field Agent"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{technician?.role || "Technician"}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="folder-open" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{cachedManholes.length}</Text>
            <Text style={styles.statLabel}>Cached Manholes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="cloud-upload"
              size={24}
              color={pendingCount > 0 ? Colors.warning : Colors.success}
            />
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Sync</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{technician?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Organization ID</Text>
              <Text style={styles.infoValue}>
                {technician?.orgId || "Independent Contractor"}
              </Text>
            </View>
            {technician?.orgId && (
              <TouchableOpacity
                onPress={() => copyToClipboard(technician.orgId!, "Org ID")}
                style={styles.copyBtn}
              >
                <Ionicons name="copy-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="key-outline" size={20} color={Colors.textMuted} style={styles.rowIcon} />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Technician ID</Text>
              <Text style={[styles.infoValue, styles.monospace]}>{technician?.id}</Text>
            </View>
            {technician?.id && (
              <TouchableOpacity
                onPress={() => copyToClipboard(technician.id, "Technician ID")}
                style={styles.copyBtn}
              >
                <Ionicons name="copy-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sync Action Area */}
        {pendingCount > 0 && (
          <View style={styles.syncCard}>
            <View style={styles.syncCardText}>
              <Ionicons name="warning" size={22} color={Colors.warning} />
              <Text style={styles.syncTitle}>Unsynced Operations</Text>
            </View>
            <Text style={styles.syncDesc}>
              You have {pendingCount} offline inspection(s) or registration(s) that need to be sent to the server.
            </Text>
            <TouchableOpacity
              style={[styles.flushButton, flushing && styles.disabled]}
              onPress={handleFlush}
              disabled={flushing}
            >
              <Text style={styles.flushText}>
                {flushing ? "Syncing with Server…" : "Force Sync Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
  },
  monospace: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    color: Colors.textMuted,
  },
  copyBtn: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  syncCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
    marginBottom: 20,
  },
  syncCardText: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.warning,
    marginLeft: 8,
  },
  syncDesc: {
    fontSize: 13,
    color: Colors.warning,
    opacity: 0.85,
    marginBottom: 12,
    lineHeight: 18,
  },
  flushButton: {
    backgroundColor: Colors.warning,
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  flushText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
});

