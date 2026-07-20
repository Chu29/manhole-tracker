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
  } = useNearbyController();

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
              onPress={createPressHandler(item.id)}
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

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="map-outline" size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.totalNearby}</Text>
                <Text style={styles.statLabel}>In Range</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.statValue}>{stats.closestText}</Text>
                <Text style={styles.statLabel}>Closest Dist</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={
                    stats.damagedCount > 0 ? Colors.danger : Colors.textMuted
                  }
                />
                <Text style={styles.statValue}>{stats.damagedCount}</Text>
                <Text style={styles.statLabel}>Damaged</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Scan Radius</Text>
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

            <Text style={styles.listTitle}>
              {processedList.length}{" "}
              {processedList.length === 1 ? "Manhole" : "Manholes"} Found
            </Text>
          </>
        }
        ListEmptyComponent={
          !isFetching ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={36}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No manholes found</Text>
              <Text style={styles.emptyText}>
                Try increasing the search radius.
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
  header: { alignItems: "center", marginVertical: 20 },
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
    paddingHorizontal: 16,
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
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginVertical: 4,
    textAlign: "center",
  },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: "center" },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  pillsScroll: { paddingRight: 16, gap: 8 },
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
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  pillTextActive: { color: "#fff" },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  emptyList: { flexGrow: 1 },
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
  errorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  errorTitle: { color: Colors.danger, fontWeight: "700", marginLeft: 8 },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: "500" },
});
