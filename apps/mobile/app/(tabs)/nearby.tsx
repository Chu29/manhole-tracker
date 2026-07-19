import { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useManholeStore } from "../../store/use-manhole-store";
import { useLocationStore } from "../../store/use-location-store";
import { OfflineBanner } from "../../components/offline-banner";
import { Colors, UtilityColors } from "../../constants/theme";
import { Manhole } from "../../api/manholes";
import { formatDistance } from "../../services/geo";

const RADIUS_OPTIONS = [100, 250, 500, 1000, 2000, 5000];

export default function NearbyScreen() {
  const {
    sortedList,
    isFetching,
    fetchError,
    fetchNearbyManholes,
    scanRadius,
    setScanRadius,
  } = useManholeStore();
  const { currentLocation, startWatching, permissionGranted } =
    useLocationStore();

  // Filter/Sort States (radius is now store-managed via scanRadius)

  // Keep watching location (background watcher handles Tier 1/Tier 2 logic)
  useEffect(() => {
    startWatching();
  }, [startWatching]);

  // Fetch when user changes the search radius manually
  const handleRadiusChange = (newRadius: number) => {
    setScanRadius(newRadius);
    if (currentLocation) {
      fetchNearbyManholes(currentLocation, newRadius);
    }
  };

  const handleRefresh = () => {
    if (currentLocation) {
      fetchNearbyManholes(currentLocation, scanRadius);
    }
  };

  const handlePressManhole = (manhole: Manhole) => {
    router.push(`/nearby/${manhole.id}`);
  };

  // Calculate high-level stats from the raw sortedList within radius
  const { totalNearby, closestText, damagedCount } = useMemo(() => {
    const total = sortedList.length;
    const closest = sortedList.find((m) => m.distanceMeters !== undefined);
    const closestDist =
      closest && closest.distanceMeters !== undefined
        ? formatDistance(closest.distanceMeters)
        : "—";
    const damaged = sortedList.filter((m) => m.status === "damaged").length;

    return {
      totalNearby: total,
      closestText: closestDist,
      damagedCount: damaged,
    };
  }, [sortedList]);

  // Apply filters and sorting client-side
  const processedList = sortedList;

  // Loading/Permission states
  if (permissionGranted === false) {
    return (
      <SafeAreaView style={styles.flex}>
        <OfflineBanner />
        <View style={[styles.emptyState, { flex: 1 }]}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>Location access needed</Text>
          <Text style={styles.emptyText}>
            Enable location permission in Settings to search and sort manholes
            by proximity.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionGranted && !currentLocation) {
    return (
      <SafeAreaView style={styles.flex}>
        <OfflineBanner />
        <View style={[styles.emptyState, { flex: 1 }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 12 }]}>
            Acquiring high-accuracy GPS lock…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderSettingsCard = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Scan Radius</Text>

      {/* Radius selector */}
      <View style={styles.filterGroup}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, scanRadius === opt && styles.pillActive]}
              onPress={() => handleRadiusChange(opt)}
            >
              <Text
                style={[
                  styles.pillText,
                  scanRadius === opt && styles.pillTextActive,
                ]}
              >
                {opt < 1000 ? `${opt}m` : `${opt / 1000}km`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderManholeItem = (item: Manhole) => {
    const utilityColor = item.utilityType
      ? (UtilityColors[item.utilityType] ?? Colors.primary)
      : Colors.textMuted;

    const statusColor =
      item.status === "active"
        ? Colors.success
        : item.status === "damaged"
          ? Colors.danger
          : item.status === "buried"
            ? Colors.warning
            : Colors.textMuted;

    return (
      <TouchableOpacity
        style={styles.manholeCard}
        onPress={() => handlePressManhole(item)}
        activeOpacity={0.7}
      >
        <View style={styles.manholeCardBody}>
          {/* Row 1: Code and Distance Badge */}
          <View style={styles.manholeRow}>
            <Text
              style={[styles.manholeCode, styles.monospace]}
              numberOfLines={1}
            >
              {item.code || "UNNAMED"}
            </Text>
            {item.distanceMeters !== undefined && (
              <View
                style={[
                  styles.distanceBadge,
                  item.distanceMeters < 15 && styles.distanceBadgeClose,
                ]}
              >
                <Text
                  style={[
                    styles.distanceBadgeText,
                    item.distanceMeters < 15 && styles.distanceBadgeTextClose,
                  ]}
                >
                  {formatDistance(item.distanceMeters)}
                </Text>
              </View>
            )}
          </View>

          {/* Row 2: Status & Utility Badges */}
          <View style={[styles.manholeRow, { marginTop: 6, marginBottom: 8 }]}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            {item.utilityType && (
              <View
                style={[
                  styles.utilityBadge,
                  { backgroundColor: utilityColor + "15" },
                ]}
              >
                <Text
                  style={[styles.utilityBadgeText, { color: utilityColor }]}
                >
                  {item.utilityType.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <OfflineBanner />

      {fetchError && (
        <View style={styles.errorBanner}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text
              style={{ color: Colors.danger, fontWeight: "700", marginLeft: 8 }}
            >
              Sync Failure
            </Text>
          </View>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      <Animated.FlatList
        data={processedList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Manhole }) => (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            layout={LinearTransition}
          >
            {renderManholeItem(item)}
          </Animated.View>
        )}
        contentContainerStyle={[
          styles.container,
          processedList.length === 0 && styles.emptyList,
        ]}
        itemLayoutAnimation={LinearTransition}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <Ionicons
                  name="location-outline"
                  size={32}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.name}>Nearby Tracker</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Geospatial Scan</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="map-outline" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{totalNearby}</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.statValue}>{closestText}</Text>
                <Text style={styles.statLabel}>Closest Dist</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={damagedCount > 0 ? Colors.danger : Colors.textMuted}
                />
                <Text style={styles.statValue}>{damagedCount}</Text>
                <Text style={styles.statLabel}>Damaged</Text>
              </View>
            </View>

            {/* Scan & Filter settings */}
            {renderSettingsCard()}

            <Text style={styles.listTitle}>
              {processedList.length}{" "}
              {processedList.length === 1 ? "Manhole" : "Manholes"} Found
            </Text>
          </>
        }
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No manholes found</Text>
              <Text style={styles.emptyText}>
                Try increasing the search radius or moving to a different area.
              </Text>
            </View>
          ) : null
        }
      />
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
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginVertical: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
  filterGroup: {
    marginVertical: 8,
  },
  filterGroupLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pillsScroll: {
    paddingRight: 16,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  pillTextActive: {
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  emptyList: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: "500" },
  manholeCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  utilityAccent: {
    width: 6,
  },
  manholeCardBody: {
    flex: 1,
    padding: 16,
  },
  manholeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  manholeCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  monospace: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  distanceBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceBadgeClose: {
    backgroundColor: Colors.successLight,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  distanceBadgeTextClose: {
    color: Colors.success,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  utilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  utilityBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  manholeMetaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaValue: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  copyPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.primary,
  },
});
