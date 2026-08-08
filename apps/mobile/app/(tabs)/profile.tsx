import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProfileController } from "../../hooks/useProfileController";
import { Colors } from "../../constants/theme";

export default function ProfileScreen() {
  const {
    token,
    technician,
    cachedManholesCount,
    pendingCount,
    flushing,
    initials,
    formattedDate,
    handleLogout,
    handleFlush,
    copyToClipboard,
  } = useProfileController();

  if (token && !technician) {
    return (
      <SafeAreaView style={styles.flex}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Avatar and Name */}
        <View style={styles.heroHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{technician?.name || "Field Agent"}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.primary} />
            <Text style={styles.roleText}>
              {technician?.role || "Technician"}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="folder-open-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{cachedManholesCount}</Text>
            <Text style={styles.statLabel}>Cached Assets</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconWrapper,
                {
                  backgroundColor:
                    pendingCount > 0 ? Colors.warningLight : Colors.successLight,
                },
              ]}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color={pendingCount > 0 ? Colors.warning : Colors.success}
              />
            </View>
            <Text
              style={[
                styles.statValue,
                pendingCount > 0 && { color: Colors.warning },
              ]}
            >
              {pendingCount}
            </Text>
            <Text style={styles.statLabel}>Pending Sync</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Account Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{technician?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="business-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>
                {technician?.orgId || "Independent Contractor"}
              </Text>
            </View>
            {technician?.orgId && (
              <TouchableOpacity
                onPress={() => copyToClipboard(technician.orgId!, "Org ID")}
                style={styles.copyBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="copy-outline"
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="key-outline"
              size={20}
              color={Colors.textMuted}
              style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>Technician ID</Text>
              <Text style={[styles.infoValue, styles.monospace]}>
                {technician?.id}
              </Text>
            </View>
            {technician?.id && (
              <TouchableOpacity
                onPress={() => copyToClipboard(technician.id, "Technician ID")}
                style={styles.copyBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="copy-outline"
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sync Action Area */}
        {pendingCount > 0 && (
          <View style={styles.syncCard}>
            <View style={styles.syncCardText}>
              <Ionicons name="warning" size={20} color={Colors.warning} />
              <Text style={styles.syncTitle}>Unsynced Operations</Text>
            </View>
            <Text style={styles.syncDesc}>
              You have {pendingCount} offline inspection(s) or registration(s)
              waiting to be synced with the server.
            </Text>
            <TouchableOpacity
              style={[styles.flushButton, flushing && styles.disabled]}
              onPress={handleFlush}
              disabled={flushing}
              activeOpacity={0.8}
            >
              <Text style={styles.flushText}>
                {flushing ? "Syncing with Server…" : "Force Sync Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: 40 },
  heroHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  monospace: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  copyBtn: {
    padding: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  syncCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  syncCardText: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.warning,
    marginLeft: 8,
  },
  syncDesc: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: "500",
    marginBottom: 12,
    lineHeight: 18,
  },
  flushButton: {
    backgroundColor: Colors.warning,
    borderRadius: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  flushText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  logoutButton: {
    flexDirection: "row",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 4,
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: "800",
    fontSize: 15,
    marginLeft: 8,
  },
});

