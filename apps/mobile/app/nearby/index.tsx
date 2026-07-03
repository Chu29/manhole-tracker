import { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useManholeStore } from "../../store/use-manhole-store";
import { useLocationStore } from "../../store/use-location-store";
import { useAuthStore } from "../../store/use-auth-store";
import { ManholeListItem } from "../../components/manhole-list-item";
import { OfflineBanner } from "../../components/offline-banner";
import { Colors } from "../../constants/theme";
import { Manhole } from "../../api/manholes";

export default function NearbyScreen() {
  const { sortedList, isFetching, fetchError, fetchNearbyManholes } =
    useManholeStore();
  const { currentLocation, startWatching, permissionGranted } =
    useLocationStore();
  const { technician, logout } = useAuthStore();
  const hasInitialFetch = useRef(false);

  // Start the GPS watcher when this screen mounts (it orchestrates both tiers).
  useEffect(() => {
    startWatching();
  }, []);

  // Trigger the first server fetch once we have a location fix.
  useEffect(() => {
    if (currentLocation && !hasInitialFetch.current) {
      hasInitialFetch.current = true;
      fetchNearbyManholes(currentLocation);
    }
  }, [currentLocation]);

  function handleRefresh() {
    if (currentLocation) fetchNearbyManholes(currentLocation);
  }

  function handlePressManhole(manhole: Manhole) {
    router.push(`/nearby/${manhole.id}`);
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Nearby Manholes</Text>
          {currentLocation && (
            <Text style={styles.subheading}>
              {sortedList.length} found · auto-sorted by distance
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/register-mahole")}
          >
            <Text style={styles.iconButtonText}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/map")}
          >
            <Text style={styles.iconButtonText}>🗺</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Permission denied */}
      {permissionGranted === false && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>Location access needed</Text>
          <Text style={styles.emptyText}>
            Enable location permission in Settings so the app can sort manholes
            by proximity.
          </Text>
        </View>
      )}

      {/* Waiting for first GPS fix */}
      {permissionGranted && !currentLocation && (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Getting your location…</Text>
        </View>
      )}

      {/* Error */}
      {fetchError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {/* The list — this is the "automated filtering" feature */}
      {currentLocation && (
        <FlatList
          data={sortedList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ManholeListItem
              manhole={item}
              onPress={() => handlePressManhole(item)}
            />
          )}
          contentContainerStyle={
            sortedList.length === 0 ? styles.emptyList : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            !isFetching ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No manholes nearby</Text>
                <Text style={styles.emptyText}>
                  No manholes found within range. Register one with the ＋
                  button.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Profile / sign out */}
      <TouchableOpacity
        style={styles.profileBar}
        onPress={() => router.push("/profile")}
      >
        <Text style={styles.profileText}>👤 {technician?.name}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: { fontSize: 20, fontWeight: "700", color: Colors.text },
  subheading: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: { fontSize: 18 },
  listContent: { paddingVertical: 10 },
  emptyList: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: Colors.dangerLight,
    padding: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: { color: Colors.danger, fontSize: 13 },
  profileBar: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  profileText: { fontSize: 14, color: Colors.textMuted },
});
