import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { PanGestureHandler } from "react-native-gesture-handler";
import {
  useMapController,
  SHEET_MAX_HEIGHT,
  SHEET_MIN_HEIGHT,
} from "../../hooks/useMapController";
import { MapSelectedCard } from "../../components/map/map-selected-card";
import { OfflineBanner } from "../../components/offline-banner";
import { Colors, UtilityColors } from "../../constants/theme";
import { formatDistance } from "../../services/geo";
import { UTILITY_TYPES, MANHOLE_STATUSES } from "@manhole-tracker/shared";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
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

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const controller = useMapController();

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
        showsUserLocation
        showsMyLocationButton={false}
        mapType={controller.mapType}
        provider={PROVIDER_GOOGLE}
      >
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
          <Ionicons name="layers" size={14} color={Colors.primary} />
          <Text style={styles.topStatsText}>
            {controller.filteredList.length}
            {controller.filteredList.length !== controller.stats.total
              ? ` / ${controller.stats.total}`
              : ""}
          </Text>
          {controller.isFetching && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginLeft: 6 }}
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
          { top: Platform.OS === "ios" ? insets.top + 40 : 56 },
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
            activeOpacity={0.7}
          >
            <Ionicons name="radio-outline" size={14} color={Colors.primary} />
            <Text style={[styles.chipText, styles.chipAccentText]}>
              {controller.scanRadius >= 1000
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
                activeOpacity={0.7}
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
                  {type.charAt(0).toUpperCase() + type.slice(1)}
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
                activeOpacity={0.7}
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
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
              activeOpacity={0.7}
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
            { top: Platform.OS === "ios" ? insets.top + 82 : 98 },
          ]}
        >
          <Text style={styles.radiusPickerTitle}>Search Radius</Text>
          <View style={styles.radiusGrid}>
            {RADIUS_OPTIONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusOption,
                  controller.scanRadius === r && styles.radiusOptionActive,
                ]}
                onPress={() => controller.handleRadiusChange(r)}
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
          { bottom: insets.bottom + SHEET_MIN_HEIGHT + 16 },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            controller.setMapType((t) =>
              t === "standard" ? "satellite" : "standard",
            )
          }
          activeOpacity={0.7}
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
          activeOpacity={0.7}
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
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Hardware Accelerated Action Sheet Container */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [
              {
                translateY: Animated.add(
                  new Animated.Value(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT),
                  controller.totalTranslateY,
                ),
              },
            ],
          },
        ]}
      >
        {/* Wrap ONLY the header drag areas inside the gesture tracker */}
        <PanGestureHandler
          onGestureEvent={controller.onGestureEvent}
          onHandlerStateChange={controller.onHandlerStateChange}
        >
          <Animated.View style={styles.gestureHeaderContainer}>
            {/* Gesture Drag Zone Target Bar */}
            <TouchableOpacity
              style={styles.sheetHandleArea}
              onPress={controller.toggleSheet}
              activeOpacity={0.8}
            >
              <View style={styles.sheetHandle} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetHeader}
              onPress={controller.toggleSheet}
              activeOpacity={0.8}
            >
              <View style={styles.sheetTitleRow}>
                <Ionicons name="list" size={18} color={Colors.text} />
                <Text style={styles.sheetTitle}>
                  {controller.selectedManhole
                    ? "Selected Manhole"
                    : "Nearby Manholes"}
                </Text>
              </View>
              <View style={styles.sheetCountBadge}>
                <Text style={styles.sheetCountText}>
                  {controller.filteredList.length}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>

        {/* ScrollView separated out with its own clean constraints */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
        >
          {controller.selectedManhole && (
            <MapSelectedCard
              manhole={controller.selectedManhole}
              onNavigate={controller.handleNavigateToDetail}
              getUtilityIcon={getUtilityIcon}
              getStatusColor={getStatusColor}
              formatRelativeDate={formatRelativeDate}
            />
          )}

          {controller.selectedManhole && controller.filteredList.length > 1 && (
            <View style={styles.listSectionHeader}>
              <Ionicons
                name="locate-outline"
                size={16}
                color={Colors.textMuted}
              />
              <Text style={styles.listSectionTitle}>Other Nearby</Text>
            </View>
          )}

          {controller.filteredList
            .filter((m) => m.id !== controller.selectedManhole?.id)
            .map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.listCard}
                onPress={() => controller.handleSelectFromList(m)}
                activeOpacity={0.7}
              >
                <View style={styles.listCardBody}>
                  <View style={styles.listCardTopRow}>
                    <Text style={styles.listCardCode} numberOfLines={1}>
                      {m.code ?? "Unnamed"}
                    </Text>
                    {m.distanceMeters !== undefined && (
                      <Text style={styles.listCardDistance}>
                        {formatDistance(m.distanceMeters)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.listCardMetaRow}>
                    {m.utilityType && (
                      <Text
                        style={[
                          styles.listCardTag,
                          {
                            color:
                              UtilityColors[m.utilityType] ?? Colors.primary,
                          },
                        ]}
                      >
                        {m.utilityType.toUpperCase()}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.statusDotTiny,
                        { backgroundColor: getStatusColor(m.status) },
                      ]}
                    />
                    <Text style={styles.listCardStatus}>{m.status}</Text>
                    {m.lastInspectedAt && (
                      <Text style={styles.listCardInspected}>
                        · {formatRelativeDate(m.lastInspectedAt)}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.border}
                  style={{ alignSelf: "center", marginRight: 12 }}
                />
              </TouchableOpacity>
            ))}

          {controller.filteredList.length === 0 && !controller.isFetching && (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={36}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No Manholes Found</Text>
              <Text style={styles.emptySubtitle}>
                {controller.selectedUtility || controller.selectedStatus
                  ? "Try adjusting your filters or increasing the search radius."
                  : "Try increasing the search radius or moving to a different area."}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
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
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topStatsText: { fontSize: 13, fontWeight: "700", color: Colors.text },
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
  errorBadgeText: { fontSize: 11, color: Colors.danger, fontWeight: "500" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  chipAccent: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primaryLight,
  },
  chipAccentText: { color: Colors.primary },
  chipClear: {
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerLight,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: Colors.text },
  chipCount: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  chipCountText: { fontSize: 10, fontWeight: "700", color: Colors.primary },
  radiusPicker: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  radiusPickerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  radiusOptionText: { fontSize: 13, fontWeight: "600", color: Colors.text },
  radiusOptionTextActive: { color: "#fff" },
  fabColumn: { position: "absolute", right: 14, gap: 10 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fabPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_MAX_HEIGHT,
    // Force the sheet to slide off-screen by default, leaving EXACTLY the min-height tip exposed
    transform: [{ translateY: SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT }],
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
});
