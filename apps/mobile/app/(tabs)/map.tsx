import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useMapController } from "../../hooks/useMapController";
import { OfflineBanner } from "../../components/offline-banner";
import { Colors, UtilityColors } from "../../constants/theme";
import { formatDistance } from "../../services/geo";
import { UTILITY_TYPES, MANHOLE_STATUSES } from "@manhole-tracker/shared";

const RADIUS_OPTIONS = [100, 250, 500, 1000, 2000, 5000];

function getUtilityIcon(
  type: string | null,
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (type?.toLowerCase()) {
    case "sewer":
      return "water";
    case "electrical":
      return "flash";
    case "telecom":
      return "wifi";
    case "water":
      return "water-outline";
    default:
      return "construct-outline";
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return Colors.success;
    case "damaged":
      return Colors.danger;
    case "buried":
      return Colors.warning;
    case "inactive":
      return Colors.offline;
    default:
      return Colors.textMuted;
  }
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const controller = useMapController();
  const markerRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    if (controller.selectedManhole?.id) {
      const selectedId = controller.selectedManhole.id;
      const timer = setTimeout(() => {
        markerRefs.current[selectedId]?.showCallout();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [controller.selectedManhole]);

  if (controller.permissionGranted === false) {
    return (
      <SafeAreaView style={styles.flex}>
        <OfflineBanner />
        <View style={styles.permissionContainer}>
          <Ionicons
            name="location-outline"
            size={64}
            color={Colors.textMuted}
            style={styles.permissionIcon}
          />
          <Text style={styles.permissionTitle}>Location Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            To view manholes on the map and find those near you, please grant
            location permission.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={controller.requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (
    controller.permissionGranted === null ||
    (!controller.currentLocation && controller.isFetching)
  ) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Locating device...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initialRegion = controller.currentLocation
    ? {
        latitude: controller.currentLocation.lat,
        longitude: controller.currentLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <OfflineBanner />

      <MapView
        ref={controller.mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsMyLocationButton={false}
        mapType={controller.mapType}
        provider={PROVIDER_GOOGLE}
      >
        {controller.currentLocation && (
          <Marker
            coordinate={{
              latitude: controller.currentLocation.lat,
              longitude: controller.currentLocation.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={999}
          >
            <View style={styles.userDotOuter}>
              <View style={styles.userDotInner} />
            </View>
          </Marker>
        )}

        {controller.currentLocation && (
          <Circle
            center={{
              latitude: controller.currentLocation.lat,
              longitude: controller.currentLocation.lng,
            }}
            radius={controller.scanRadius}
            strokeColor="rgba(26,110,191,0.35)"
            strokeWidth={1.5}
            fillColor="rgba(26,110,191,0.06)"
          />
        )}

        {controller.filteredList.map((m) => (
          <Marker
            key={m.id}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[m.id] = ref;
              }
            }}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            title={m.code ?? "Manhole"}
            description={
              [
                m.utilityType?.toUpperCase(),
                m.status,
                m.distanceMeters ? formatDistance(m.distanceMeters) : null,
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
            pinColor={
              m.utilityType ? UtilityColors[m.utilityType] : Colors.primary
            }
            onPress={() => controller.handleMarkerPress(m)}
            onCalloutPress={() => controller.handleNavigateToDetail(m.id)}
          />
        ))}
      </MapView>

      {/* Stats Overlay */}
      <View
        style={[
          styles.topStatsContainer,
          { top: Platform.OS === "ios" ? insets.top + 16 : 24 },
        ]}
      >
        <View style={styles.topStatsBadge}>
          <View style={styles.livePulseDot} />
          <Ionicons name="map-outline" size={14} color={Colors.primary} />
          <Text style={styles.topStatsText}>
            {controller.filteredList.length}
            {controller.filteredList.length !== controller.stats.total
              ? ` / ${controller.stats.total}`
              : ""} Assets
          </Text>
          {controller.isFetching && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        {controller.fetchError && (
          <View style={styles.errorBadge}>
            <Ionicons name="warning" size={12} color={Colors.danger} />
            <Text style={styles.errorBadgeText} numberOfLines={1}>
              {controller.fetchError}
            </Text>
          </View>
        )}
      </View>

      {/* Filters Overlay */}
      <View
        style={[
          styles.chipBarWrapper,
          { top: Platform.OS === "ios" ? insets.top + 48 : 64 },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipBar}
        >
          <TouchableOpacity
            style={[styles.chip, styles.chipAccent]}
            onPress={() =>
              controller.setShowRadiusPicker(!controller.showRadiusPicker)
            }
            activeOpacity={0.8}
          >
            <Ionicons name="radio-outline" size={14} color={Colors.primary} />
            <Text style={[styles.chipText, styles.chipAccentText]}>
              Radius: {controller.scanRadius >= 1000
                ? `${controller.scanRadius / 1000}km`
                : `${controller.scanRadius}m`}
            </Text>
            <Ionicons
              name={controller.showRadiusPicker ? "chevron-up" : "chevron-down"}
              size={12}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {UTILITY_TYPES.map((type) => {
            const isActive = controller.selectedUtility === type;
            const color = UtilityColors[type] ?? Colors.primary;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() =>
                  controller.setSelectedUtility(isActive ? null : type)
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name={getUtilityIcon(type)}
                  size={13}
                  color={isActive ? "#fff" : color}
                />
                <Text
                  style={[
                    styles.chipText,
                    isActive && { color: "#fff" },
                    !isActive && { color },
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
                {controller.stats.byUtility[type] && (
                  <View
                    style={[
                      styles.chipCount,
                      isActive && { backgroundColor: "rgba(255,255,255,0.3)" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipCountText,
                        isActive && { color: "#fff" },
                      ]}
                    >
                      {controller.stats.byUtility[type]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {MANHOLE_STATUSES.map((status) => {
            const isActive = controller.selectedStatus === status;
            const color = getStatusColor(status);
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() =>
                  controller.setSelectedStatus(isActive ? null : status)
                }
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? "#fff" : color },
                  ]}
                />
                <Text
                  style={[
                    styles.chipText,
                    isActive && { color: "#fff" },
                    !isActive && { color },
                  ]}
                >
                  {status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}

          {(controller.selectedUtility || controller.selectedStatus) && (
            <TouchableOpacity
              style={[styles.chip, styles.chipClear]}
              onPress={() => {
                controller.setSelectedUtility(null);
                controller.setSelectedStatus(null);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={14} color={Colors.danger} />
              <Text style={[styles.chipText, { color: Colors.danger }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Dropdown Options */}
      {controller.showRadiusPicker && (
        <View
          style={[
            styles.radiusPicker,
            { top: Platform.OS === "ios" ? insets.top + 92 : 108 },
          ]}
        >
          <Text style={styles.radiusPickerTitle}>Search Radius Filter</Text>
          <View style={styles.radiusGrid}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusOption,
                  controller.scanRadius === r && styles.radiusOptionActive,
                ]}
                onPress={() => controller.handleRadiusChange(r)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    controller.scanRadius === r &&
                      styles.radiusOptionTextActive,
                  ]}
                >
                  {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* FABs */}
      <View
        style={[
          styles.fabColumn,
          { bottom: insets.bottom + (controller.selectedManhole ? 170 : 20) },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            controller.setMapType((t) =>
              t === "standard" ? "satellite" : "standard",
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name={
              controller.mapType === "standard"
                ? "globe-outline"
                : "map-outline"
            }
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={controller.handleRefresh}
          activeOpacity={0.8}
          disabled={controller.isFetching}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={controller.isFetching ? Colors.textMuted : Colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={controller.centreOnMe}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  topStatsContainer: { position: "absolute", left: 14, gap: 6 },
  topStatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  topStatsText: { fontSize: 13, fontWeight: "800", color: Colors.text },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    maxWidth: 200,
  },
  errorBadgeText: { fontSize: 11, color: Colors.danger, fontWeight: "600" },
  chipBarWrapper: { position: "absolute", left: 0, right: 0 },
  chipBar: { paddingHorizontal: 14, gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipAccent: {
    borderColor: "#BAE6FD",
    backgroundColor: Colors.primaryLight,
  },
  chipAccentText: { color: Colors.primary, fontWeight: "800" },
  chipClear: {
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerLight,
  },
  chipText: { fontSize: 11, fontWeight: "700", color: Colors.text, letterSpacing: 0.5 },
  chipCount: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  chipCountText: { fontSize: 10, fontWeight: "800", color: Colors.primary },
  radiusPicker: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  radiusPickerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  radiusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radiusOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusOptionText: { fontSize: 13, fontWeight: "700", color: Colors.text },
  radiusOptionTextActive: { color: "#fff" },
  fabColumn: { position: "absolute", right: 14, gap: 10 },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fabPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },

  userDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(26,110,191,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#fff",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  gestureHeaderContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  sheetHandleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  sheetCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetCountText: { fontSize: 24, fontWeight: "700", color: Colors.primary },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  listCard: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listCardBody: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  listCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listCardCode: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  listCardDistance: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  listCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  listCardTag: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  statusDotTiny: { width: 6, height: 6, borderRadius: 3 },
  listCardStatus: { fontSize: 11, color: Colors.textMuted },
  listCardInspected: { fontSize: 11, color: Colors.textMuted },
  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  flex: { flex: 1, backgroundColor: Colors.background },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  permissionIcon: { marginBottom: 20 },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  permissionButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  selectedCardFloatingContainer: {
    position: "absolute",
    left: 14,
    right: 14,
  },
});