import { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Clipboard,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
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
import { formatDistance, haversineDistance } from "../../services/geo";
import {
  DEFAULT_RADIUS_METERS,
  UTILITY_TYPES,
  MANHOLE_STATUSES,
} from "@manhole-tracker/shared";

const RADIUS_OPTIONS = [100, 250, 500, 1000, 2000, 5000];

export default function NearbyScreen() {
  const { sortedList, isFetching, fetchError, fetchNearbyManholes } =
    useManholeStore();
  const { currentLocation, startWatching, permissionGranted } =
    useLocationStore();

  const hasInitialFetch = useRef(false);
  const lastFetchedCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Filter/Sort and Radius States
  const [radius, setRadius] = useState(DEFAULT_RADIUS_METERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"distance" | "depth" | "inspected">("distance");

  // Keep watching location
  useEffect(() => {
    startWatching();
  }, [startWatching]);

  // Initial fetch when location is first available
  useEffect(() => {
    if (currentLocation && !hasInitialFetch.current) {
      hasInitialFetch.current = true;
      lastFetchedCoordsRef.current = currentLocation;
      fetchNearbyManholes(currentLocation, radius);
    }
  }, [currentLocation, fetchNearbyManholes, radius]);

  // Fetch when user changes the search radius manually
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (currentLocation) {
      lastFetchedCoordsRef.current = currentLocation;
      fetchNearbyManholes(currentLocation, newRadius);
    }
  };

  // Re-fetch when user moves significantly (>= 15 meters)
  useEffect(() => {
    if (currentLocation) {
      const distanceMoved = lastFetchedCoordsRef.current
        ? haversineDistance(lastFetchedCoordsRef.current, currentLocation)
        : Infinity;

      if (distanceMoved >= 15) {
        lastFetchedCoordsRef.current = currentLocation;
        fetchNearbyManholes(currentLocation, radius);
      }
    }
  }, [currentLocation, radius, fetchNearbyManholes]);

  const handleRefresh = () => {
    if (currentLocation) {
      lastFetchedCoordsRef.current = currentLocation;
      fetchNearbyManholes(currentLocation, radius);
    }
  };

  const handlePressManhole = (manhole: Manhole) => {
    router.push(`/nearby/${manhole.id}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert("Copied", `${label} copied to clipboard!`);
    } catch {
      Alert.alert("Details", `${label}:\n${text}`);
    }
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

    return { totalNearby: total, closestText: closestDist, damagedCount: damaged };
  }, [sortedList]);

  // Apply filters and sorting client-side
  const processedList = useMemo(() => {
    return sortedList
      .filter((m) => {
        // 1. Search Query
        if (searchQuery.trim() !== "") {
          const match = m.code?.toLowerCase().includes(searchQuery.toLowerCase());
          if (!match) return false;
        }
        // 2. Utility Filter
        if (selectedUtility && m.utilityType !== selectedUtility) {
          return false;
        }
        // 3. Status Filter
        if (selectedStatus && m.status !== selectedStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "distance") {
          return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
        }
        if (sortBy === "depth") {
          const aDepth = a.depthMeters ?? 0;
          const bDepth = b.depthMeters ?? 0;
          return aDepth - bDepth;
        }
        if (sortBy === "inspected") {
          const aTime = a.lastInspectedAt ? new Date(a.lastInspectedAt).getTime() : 0;
          const bTime = b.lastInspectedAt ? new Date(b.lastInspectedAt).getTime() : 0;
          return aTime - bTime;
        }
        return 0;
      });
  }, [sortedList, searchQuery, selectedUtility, selectedStatus, sortBy]);

  // Loading/Permission states
  if (permissionGranted === false) {
    return (
      <SafeAreaView style={styles.flex}>
        <OfflineBanner />
        <View style={[styles.emptyState, { flex: 1 }]}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>Location access needed</Text>
          <Text style={styles.emptyText}>
            Enable location permission in Settings to search and sort manholes by proximity.
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
      <Text style={styles.sectionTitle}>Scan & Filter Settings</Text>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color={Colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by code..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* Radius selector */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Scan Radius ({radius < 1000 ? `${radius}m` : `${radius / 1000}km`})</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pill, radius === opt && styles.pillActive]}
              onPress={() => handleRadiusChange(opt)}
            >
              <Text
                style={[
                  styles.pillText,
                  radius === opt && styles.pillTextActive,
                ]}
              >
                {opt < 1000 ? `${opt}m` : `${opt / 1000}km`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* Utility Type selector */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Utility Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              selectedUtility === null && styles.pillActive,
            ]}
            onPress={() => setSelectedUtility(null)}
          >
            <Text
              style={[
                styles.pillText,
                selectedUtility === null && styles.pillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {UTILITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pill,
                selectedUtility === type && styles.pillActive,
              ]}
              onPress={() => setSelectedUtility(type)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedUtility === type && styles.pillTextActive,
                ]}
              >
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* Status selector */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          <TouchableOpacity
            style={[styles.pill, selectedStatus === null && styles.pillActive]}
            onPress={() => setSelectedStatus(null)}
          >
            <Text
              style={[
                styles.pillText,
                selectedStatus === null && styles.pillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {MANHOLE_STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.pill,
                selectedStatus === status && styles.pillActive,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedStatus === status && styles.pillTextActive,
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {/* Sort By selector */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Sort By</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              sortBy === "distance" && styles.pillActive,
            ]}
            onPress={() => setSortBy("distance")}
          >
            <Text
              style={[
                styles.pillText,
                sortBy === "distance" && styles.pillTextActive,
              ]}
            >
              Distance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, sortBy === "depth" && styles.pillActive]}
            onPress={() => setSortBy("depth")}
          >
            <Text
              style={[
                styles.pillText,
                sortBy === "depth" && styles.pillTextActive,
              ]}
            >
              Depth
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pill,
              sortBy === "inspected" && styles.pillActive,
            ]}
            onPress={() => setSortBy("inspected")}
          >
            <Text
              style={[
                styles.pillText,
                sortBy === "inspected" && styles.pillTextActive,
              ]}
            >
              Last Inspected
            </Text>
          </TouchableOpacity>
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

    const formattedDate = item.lastInspectedAt
      ? new Date(item.lastInspectedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never";

    return (
      <TouchableOpacity
        style={styles.manholeCard}
        onPress={() => handlePressManhole(item)}
        activeOpacity={0.7}
      >
        <View style={styles.manholeCardBody}>
          {/* Row 1: Code and Distance Badge */}
          <View style={styles.manholeRow}>
            <Text style={[styles.manholeCode, styles.monospace]} numberOfLines={1}>
              {item.code || "UNNAMED"}
            </Text>
            {item.distanceMeters !== undefined && (
              <View style={[styles.distanceBadge, item.distanceMeters < 15 && styles.distanceBadgeClose]}>
                <Text style={[styles.distanceBadgeText, item.distanceMeters < 15 && styles.distanceBadgeTextClose]}>
                  {formatDistance(item.distanceMeters)}
                </Text>
              </View>
            )}
          </View>

          {/* Row 2: Status & Utility Badges */}
          <View style={[styles.manholeRow, { marginTop: 6, marginBottom: 8 }]}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            {item.utilityType && (
              <View style={[styles.utilityBadge, { backgroundColor: utilityColor + "15" }]}>
                <Text style={[styles.utilityBadgeText, { color: utilityColor }]}>
                  {item.utilityType.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* <View style={styles.divider} /> */}

          {/* Row 3: Metadata section */}
          {/* <View style={styles.manholeMetaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="resize-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.metaValue}>
                {item.depthMeters !== null ? `${item.depthMeters} m` : "N/A"}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.metaValue} numberOfLines={1}>
                Insp: {formattedDate}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <TouchableOpacity
                onPress={() => copyToClipboard(item.code || "", "Manhole Code")}
                style={styles.copyPill}
              >
                <Text style={styles.copyPillText}>Copy Code</Text>
              </TouchableOpacity>
            </View>
          </View> */}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.flex}>
      <OfflineBanner />

      {fetchError && (
        <View style={styles.errorBanner}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text style={{ color: Colors.danger, fontWeight: "700", marginLeft: 8 }}>
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
                <Ionicons name="location-outline" size={32} color={Colors.primary} />
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
                <Ionicons name="navigate-outline" size={20} color={Colors.success} />
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
              {processedList.length} {processedList.length === 1 ? "Manhole" : "Manholes"} Found
            </Text>
          </>
        }
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching manholes</Text>
              <Text style={styles.emptyText}>
                Try relaxing your search query or filters, or expand the scan radius.
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
