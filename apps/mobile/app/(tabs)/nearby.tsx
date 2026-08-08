import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useNearbyController } from "../../hooks/useNearbyController";
import { ManholeListItem } from "../../components/manhole-list-item";
import { OfflineBanner } from "../../components/offline-banner";
import { Colors } from "../../constants/theme";
import { Manhole } from "../../api/manholes";

const RADIUS_OPTIONS = [100, 250, 500, 1000, 2000, 5000];

export default function NearbyScreen() {
  const {
    processedList,
    isFetching,
    fetchError,
    scanRadius,
    permissionGranted,
    currentLocation,
    stats,
    handleRadiusChange,
    handleRefresh,
    createPressHandler,
    createDetailHandler,
  } = useNearbyController();

  if (permissionGranted === false) {
    return (
      <SafeAreaView style={styles.flex}>
        <OfflineBanner />
        <View style={[styles.emptyState, { flex: 1 }]}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="location-outline" size={32} color={Colors.primary} />
          </View>
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
            Acquiring GPS lock…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <OfflineBanner />

      {fetchError && (
        <View style={styles.errorBanner}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text style={styles.errorTitle}>Sync Failure</Text>
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
            {/* Matches your exact component specification */}
            <ManholeListItem
              manhole={item}
              onPress={createPressHandler(item)}
              onViewDetails={createDetailHandler(item.id)}
            />
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
            <View style={styles.heroHeader}>
              <View style={styles.heroRow}>
                <View style={styles.heroLeft}>
                  <Text style={styles.heroSubtitle}>REAL-TIME GEOSPATIAL</Text>
                  <Text style={styles.heroTitle}>Nearby Manholes</Text>
                </View>
                <View style={styles.heroIconBadge}>
                  <Ionicons name="radio-outline" size={24} color={Colors.primary} />
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: Colors.primaryLight }]}>
                  <Ionicons name="map-outline" size={18} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.totalNearby}</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconWrapper, { backgroundColor: Colors.successLight }]}>
                  <Ionicons name="navigate-outline" size={18} color={Colors.success} />
                </View>
                <Text style={styles.statValue}>{stats.closestText}</Text>
                <Text style={styles.statLabel}>Closest</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconWrapper,
                    {
                      backgroundColor:
                        stats.damagedCount > 0 ? Colors.dangerLight : "#F1F5F9",
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={stats.damagedCount > 0 ? Colors.danger : Colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.statValue,
                    stats.damagedCount > 0 && { color: Colors.danger },
                  ]}
                >
                  {stats.damagedCount}
                </Text>
                <Text style={styles.statLabel}>Damaged</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="options-outline" size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Scan Radius</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsScroll}
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.pill,
                      scanRadius === opt && styles.pillActive,
                    ]}
                    onPress={() => handleRadiusChange(opt)}
                    activeOpacity={0.7}
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

            <View style={styles.listHeaderRow}>
              <Text style={styles.listTitle}>
                Assets Found ({processedList.length})
              </Text>
              <Text style={styles.listSubtitle}>Auto-sorted by proximity</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={Colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>No manholes found</Text>
              <Text style={styles.emptyText}>
                Try increasing the search radius to discover assets nearby.
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
  container: { paddingBottom: 40 },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLeft: { flex: 1 },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 2,
    textAlign: "center",
  },
  statLabel: { fontSize: 11, fontWeight: "600", color: Colors.textMuted, textAlign: "center" },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
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
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.1,
  },
  pillsScroll: { gap: 8 },
  pill: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: { fontSize: 12, fontWeight: "700", color: Colors.textMuted },
  pillTextActive: { color: "#FFF" },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.2,
  },
  listSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  emptyList: { flexGrow: 1 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
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
  errorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  errorTitle: { color: Colors.danger, fontWeight: "700", marginLeft: 8 },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: "500" },
});

