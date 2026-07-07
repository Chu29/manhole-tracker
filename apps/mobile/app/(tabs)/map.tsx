import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated as RNAnimated,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useManholeStore } from "../../store/use-manhole-store";
import { useLocationStore } from "../../store/use-location-store";
import { Colors, UtilityColors } from "../../constants/theme";
import { OfflineBanner } from "../../components/offline-banner";
import { formatDistance } from "../../services/geo";
import {
  DEFAULT_RADIUS_METERS,
  UTILITY_TYPES,
  MANHOLE_STATUSES,
} from "@manhole-tracker/shared";
import { Manhole } from "../../api/manholes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_COLLAPSED = 130;
const SHEET_EXPANDED = SCREEN_HEIGHT * 0.55;
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
  const {
    sortedList,
    isFetching,
    fetchError,
    fetchNearbyManholes,
    cachedManholes,
  } = useManholeStore();
  const {
    currentLocation,
    startWatching,
    permissionGranted,
    requestPermission,
  } = useLocationStore();
  const mapRef = useRef<MapView>(null);

  // UI state
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS_METERS);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [selectedManhole, setSelectedManhole] = useState<Manhole | null>(null);

  // Animated sheet height
  const sheetHeight = useRef(new RNAnimated.Value(SHEET_COLLAPSED)).current;
  const insets = useSafeAreaInsets();

  // Start location watching on mount
  useEffect(() => {
    startWatching();
  }, [startWatching]);

  // Filtered manholes based on utility type and status
  const filteredList = useMemo(() => {
    let list = sortedList;
    if (selectedUtility) {
      list = list.filter((m) => m.utilityType === selectedUtility);
    }
    if (selectedStatus) {
      list = list.filter((m) => m.status === selectedStatus);
    }
    return list;
  }, [sortedList, selectedUtility, selectedStatus]);

  // Stats computed from visible data
  const stats = useMemo(() => {
    const byUtility: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const m of sortedList) {
      if (m.utilityType)
        byUtility[m.utilityType] = (byUtility[m.utilityType] || 0) + 1;
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    }
    return { byUtility, byStatus, total: sortedList.length };
  }, [sortedList]);

  const toggleSheet = useCallback(() => {
    const toExpanded = !sheetExpanded;
    setSheetExpanded(toExpanded);
    RNAnimated.spring(sheetHeight, {
      toValue: toExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED,
      useNativeDriver: false,
      friction: 10,
      tension: 40,
    }).start();
  }, [sheetExpanded, sheetHeight]);

  const onGestureEvent = RNAnimated.event(
    [{ nativeEvent: { translationY: sheetHeight } }],
    { useNativeDriver: false },
  );

  const onHandlerStateChange = useCallback(
    ({ nativeEvent }: any) => {
      if (nativeEvent.state === State.END) {
        const { translationY } = nativeEvent;
        const isDraggingDown = translationY > 0;
        const threshold = 50;

        if (isDraggingDown && translationY > threshold) {
          setSheetExpanded(false);
          RNAnimated.spring(sheetHeight, {
            toValue: SHEET_COLLAPSED,
            useNativeDriver: false,
            friction: 10,
            tension: 40,
          }).start();
        } else if (!isDraggingDown && Math.abs(translationY) > threshold) {
          setSheetExpanded(true);
          RNAnimated.spring(sheetHeight, {
            toValue: SHEET_EXPANDED,
            useNativeDriver: false,
            friction: 10,
            tension: 40,
          }).start();
        } else {
          RNAnimated.spring(sheetHeight, {
            toValue: sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED,
            useNativeDriver: false,
            friction: 10,
            tension: 40,
          }).start();
        }
      }
    },
    [sheetExpanded, sheetHeight],
  );

  function centreOnMe() {
    if (!currentLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  }

  // Handle location permissions / locating state
  if (permissionGranted === false) {
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
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (permissionGranted === null || (!currentLocation && isFetching)) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Locating device...</Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleRefresh() {
    if (currentLocation) {
      fetchNearbyManholes(currentLocation, radius);
    }
  }

  function handleRadiusChange(newRadius: number) {
    setRadius(newRadius);
    setShowRadiusPicker(false);
    if (currentLocation) {
      fetchNearbyManholes(currentLocation, newRadius);
    }
  }

  function handleMarkerPress(manhole: Manhole) {
    setSelectedManhole(manhole);
    // Expand the sheet to show details
    if (!sheetExpanded) {
      setSheetExpanded(true);
      RNAnimated.spring(sheetHeight, {
        toValue: SHEET_EXPANDED,
        useNativeDriver: false,
        friction: 10,
        tension: 40,
      }).start();
    }
  }

  function handleNavigateToDetail(id: string) {
    router.push(`/nearby/${id}`);
  }

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return (
    <View style={styles.container}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        mapType={mapType}
        provider={PROVIDER_GOOGLE}
      >
        {/* Search radius circle */}
        {currentLocation && (
          <Circle
            center={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            radius={radius}
            strokeColor="rgba(26,110,191,0.35)"
            strokeWidth={1.5}
            fillColor="rgba(26,110,191,0.06)"
          />
        )}

        {/* Manhole markers */}
        {filteredList.map((m) => (
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
            onPress={() => handleMarkerPress(m)}
            onCalloutPress={() => handleNavigateToDetail(m.id)}
          />
        ))}
      </MapView>

      {/* Top-left stats badge */}
      <View
        style={[
          styles.topStatsContainer,
          { top: Platform.OS === "ios" ? insets.top + 16 : 24 },
        ]}
      >
        <View style={styles.topStatsBadge}>
          <Ionicons name="layers" size={14} color={Colors.primary} />
          <Text style={styles.topStatsText}>
            {filteredList.length}
            {filteredList.length !== stats.total ? ` / ${stats.total}` : ""}
          </Text>
          {isFetching && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
        {fetchError && (
          <View style={styles.errorBadge}>
            <Ionicons name="warning" size={12} color={Colors.danger} />
            <Text style={styles.errorBadgeText} numberOfLines={1}>
              {fetchError}
            </Text>
          </View>
        )}
      </View>

      {/* Filter Chips Bar */}
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
          {/* Radius chip */}
          <TouchableOpacity
            style={[styles.chip, styles.chipAccent]}
            onPress={() => setShowRadiusPicker(!showRadiusPicker)}
            activeOpacity={0.7}
          >
            <Ionicons name="radio-outline" size={14} color={Colors.primary} />
            <Text style={[styles.chipText, styles.chipAccentText]}>
              {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
            </Text>
            <Ionicons
              name={showRadiusPicker ? "chevron-up" : "chevron-down"}
              size={12}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {/* Utility type chips */}
          {UTILITY_TYPES.map((type) => {
            const isActive = selectedUtility === type;
            const color = UtilityColors[type] ?? Colors.primary;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setSelectedUtility(isActive ? null : type)}
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
                {stats.byUtility[type] && (
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
                      {stats.byUtility[type]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Status chips */}
          {MANHOLE_STATUSES.map((status) => {
            const isActive = selectedStatus === status;
            const color = getStatusColor(status);
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setSelectedStatus(isActive ? null : status)}
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

          {/* Clear filters */}
          {(selectedUtility || selectedStatus) && (
            <TouchableOpacity
              style={[styles.chip, styles.chipClear]}
              onPress={() => {
                setSelectedUtility(null);
                setSelectedStatus(null);
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

      {/* Radius Picker Dropdown */}
      {showRadiusPicker && (
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
                  radius === r && styles.radiusOptionActive,
                ]}
                onPress={() => handleRadiusChange(r)}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    radius === r && styles.radiusOptionTextActive,
                  ]}
                >
                  {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Right-side FAB column */}
      <View
        style={[
          styles.fabColumn,
          {
            bottom:
              Platform.OS === "ios"
                ? insets.bottom + SHEET_COLLAPSED + 16
                : SHEET_COLLAPSED + 16,
          },
        ]}
      >
        {/* Map type toggle */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            setMapType((t) => (t === "standard" ? "satellite" : "standard"))
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name={mapType === "standard" ? "globe-outline" : "map-outline"}
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>

        {/* Refresh */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleRefresh}
          activeOpacity={0.7}
          disabled={isFetching}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isFetching ? Colors.textMuted : Colors.primary}
          />
        </TouchableOpacity>

        {/* Centre on me */}
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={centreOnMe}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <RNAnimated.View style={[styles.sheet, { height: sheetHeight }]}>
          {/* Sheet Handle */}
          <TouchableOpacity
            style={styles.sheetHandleArea}
            onPress={toggleSheet}
            activeOpacity={0.8}
          >
            <View style={styles.sheetHandle} />
          </TouchableOpacity>

          {/* Sheet Header */}
          <TouchableOpacity
            style={styles.sheetHeader}
            onPress={toggleSheet}
            activeOpacity={0.8}
          >
            <View style={styles.sheetTitleRow}>
              <Ionicons name="list" size={18} color={Colors.text} />
              <Text style={styles.sheetTitle}>
                {selectedManhole ? "Selected Manhole" : "Nearby Manholes"}
              </Text>
            </View>
            <View style={styles.sheetCountBadge}>
              <Text style={styles.sheetCountText}>{filteredList.length}</Text>
            </View>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
          >
            {/* Selected Manhole Detail Card */}
            {selectedManhole && (
              <TouchableOpacity
                style={styles.selectedCard}
                onPress={() => handleNavigateToDetail(selectedManhole.id)}
                activeOpacity={0.7}
              >
                <View style={styles.selectedCardHeader}>
                  <View
                    style={[
                      styles.utilityIconCircle,
                      {
                        backgroundColor: selectedManhole.utilityType
                          ? UtilityColors[selectedManhole.utilityType] + "18"
                          : Colors.primaryLight,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getUtilityIcon(selectedManhole.utilityType)}
                      size={20}
                      color={
                        selectedManhole.utilityType
                          ? UtilityColors[selectedManhole.utilityType]
                          : Colors.primary
                      }
                    />
                  </View>
                  <View style={styles.selectedCardInfo}>
                    <Text style={styles.selectedCardCode} numberOfLines={1}>
                      {selectedManhole.code ?? "Unnamed Manhole"}
                    </Text>
                    <View style={styles.selectedCardMeta}>
                      {selectedManhole.utilityType && (
                        <Text
                          style={[
                            styles.utilityTag,
                            {
                              color:
                                UtilityColors[selectedManhole.utilityType] ??
                                Colors.primary,
                            },
                          ]}
                        >
                          {selectedManhole.utilityType.toUpperCase()}
                        </Text>
                      )}
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDotSmall,
                            {
                              backgroundColor: getStatusColor(
                                selectedManhole.status,
                              ),
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusTextSmall,
                            { color: getStatusColor(selectedManhole.status) },
                          ]}
                        >
                          {selectedManhole.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {selectedManhole.distanceMeters !== undefined && (
                    <View
                      style={[
                        styles.distanceBadge,
                        selectedManhole.distanceMeters < 10 &&
                          styles.distanceBadgeClose,
                      ]}
                    >
                      <Text
                        style={[
                          styles.distanceBadgeText,
                          selectedManhole.distanceMeters < 10 &&
                            styles.distanceBadgeTextClose,
                        ]}
                      >
                        {formatDistance(selectedManhole.distanceMeters)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Detail rows */}
                <View style={styles.divider} />
                <View style={styles.detailGrid}>
                  {selectedManhole.depthMeters != null && (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="resize-outline"
                        size={14}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.detailLabel}>Depth</Text>
                      <Text style={styles.detailValue}>
                        {selectedManhole.depthMeters}m
                      </Text>
                    </View>
                  )}
                  {selectedManhole.lastInspectedAt && (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={14}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.detailLabel}>Inspected</Text>
                      <Text style={styles.detailValue}>
                        {formatRelativeDate(selectedManhole.lastInspectedAt)}
                      </Text>
                    </View>
                  )}
                  {selectedManhole.installDate && (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.detailLabel}>Installed</Text>
                      <Text style={styles.detailValue}>
                        {selectedManhole.installDate}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.viewDetailRow}>
                  <Text style={styles.viewDetailText}>View Full Details</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.primary}
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Manhole List */}
            {selectedManhole && filteredList.length > 1 && (
              <View style={styles.listSectionHeader}>
                <Ionicons
                  name="locate-outline"
                  size={16}
                  color={Colors.textMuted}
                />
                <Text style={styles.listSectionTitle}>Other Nearby</Text>
              </View>
            )}

            {filteredList
              .filter((m) => m.id !== selectedManhole?.id)
              .map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.listCard}
                  onPress={() => {
                    setSelectedManhole(m);
                    mapRef.current?.animateToRegion({
                      latitude: m.lat,
                      longitude: m.lng,
                      latitudeDelta: 0.003,
                      longitudeDelta: 0.003,
                    });
                  }}
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
                    style={{ alignSelf: "center" }}
                  />
                </TouchableOpacity>
              ))}

            {filteredList.length === 0 && !isFetching && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={36}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTitle}>No Manholes Found</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedUtility || selectedStatus
                    ? "Try adjusting your filters or increasing the search radius."
                    : "Try increasing the search radius or moving to a different area."}
                </Text>
              </View>
            )}
          </ScrollView>
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },

  /* ── Top Stats Badge ── */
  topStatsContainer: {
    position: "absolute",
    left: 14,
    gap: 6,
  },
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
  topStatsText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
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
  errorBadgeText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: "500",
  },

  /* ── Filter Chip Bar ── */
  chipBarWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  chipBar: {
    paddingHorizontal: 14,
    gap: 8,
    paddingVertical: 2,
  },
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
  chipAccentText: {
    color: Colors.primary,
  },
  chipClear: {
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerLight,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  chipCount: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  chipCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
  },

  /* ── Radius Picker ── */
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
  radiusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
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
  radiusOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  radiusOptionTextActive: {
    color: "#fff",
  },

  /* ── FAB Column ── */
  fabColumn: {
    position: "absolute",
    right: 14,
    gap: 10,
  },
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
  fabPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  /* ── Status Dot ── */
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* ── Bottom Sheet ── */
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
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  sheetCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },

  /* ── Selected Manhole Card ── */
  selectedCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  utilityIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedCardInfo: {
    flex: 1,
  },
  selectedCardCode: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  selectedCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  utilityTag: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: "500",
  },
  distanceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  viewDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 6,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  /* ── List Section ── */
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  listSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  /* ── List Cards ── */
  listCard: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listCardStripe: {
    width: 4,
  },
  listCardBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
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
  listCardDistance: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  listCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  listCardTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusDotTiny: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listCardStatus: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  listCardInspected: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  /* ── Empty State ── */
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  permissionIcon: {
    marginBottom: 20,
  },
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
  permissionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
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
