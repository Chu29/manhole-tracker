import { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
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
  const { technician } = useAuthStore();
  const hasInitialFetch = useRef(false);

  useEffect(() => {
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    if (currentLocation && !hasInitialFetch.current) {
      hasInitialFetch.current = true;
      fetchNearbyManholes(currentLocation);
    }
  }, [currentLocation, fetchNearbyManholes]);

  function handleRefresh() {
    if (currentLocation) fetchNearbyManholes(currentLocation);
  }

  function handlePressManhole(manhole: Manhole) {
    router.push(`/nearby/${manhole.id}`);
  }

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <View style={styles.header}>
        <Text style={styles.heading}>Nearby Manholes</Text>
        {currentLocation && (
          <Text style={styles.subheading}>
            {sortedList.length} found · sorted by distance
          </Text>
        )}
      </View>

      {permissionGranted === false && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>Location access needed</Text>
          <Text style={styles.emptyText}>
            Enable location permission in Settings to sort manholes by
            proximity.
          </Text>
        </View>
      )}

      {permissionGranted && !currentLocation && (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Getting your location…</Text>
        </View>
      )}

      {fetchError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

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
                  Nothing found within range. Use the Register tab to add one.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: { fontSize: 20, fontWeight: "700", color: Colors.text },
  subheading: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
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
});
