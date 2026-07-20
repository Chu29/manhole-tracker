import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Animated, Dimensions } from "react-native";
import {
  HandlerStateChangeEvent,
  PanGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import MapView from "react-native-maps";
import { router } from "expo-router";
import { useManholeStore } from "../store/use-manhole-store";
import { useLocationStore } from "../store/use-location-store";
import { Manhole } from "../api/manholes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
export const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.4;
export const SHEET_MIN_HEIGHT = 30;

// TranslateY offset math:
// Fully collapsed = Max Height - Min Height (pushed down)
// Fully expanded = 0 (resting position at top)
const SNAP_BOTTOM = 0;
const SNAP_TOP = -(SHEET_MAX_HEIGHT - SHEET_MIN_HEIGHT);

interface UseMapControllerProps {
  // Config parameters removed from args since calculations are now standardized around translation offsets
}

export function useMapController() {
  const {
    sortedList,
    isFetching,
    fetchError,
    fetchNearbyManholes,
    scanRadius,
    setScanRadius,
  } = useManholeStore();

  const {
    currentLocation,
    startWatching,
    permissionGranted,
    requestPermission,
  } = useLocationStore();

  const mapRef = useRef<MapView>(null);

  // Animated value holding the structural resting layout translation offset
  const translateYOffset = useRef(new Animated.Value(SNAP_BOTTOM)).current;
  // Animated value tracking active, realtime drag deltas
  const translateYDrag = useRef(new Animated.Value(0)).current;

  // Total composite translation value combining historical position + active finger gesture
  const totalTranslateY = Animated.add(translateYOffset, translateYDrag);

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [selectedManhole, setSelectedManhole] = useState<Manhole | null>(null);

  useEffect(() => {
    startWatching();
  }, [startWatching]);

  const filteredList = useMemo(() => {
    let list = sortedList;
    if (selectedUtility)
      list = list.filter((m) => m.utilityType === selectedUtility);
    if (selectedStatus) list = list.filter((m) => m.status === selectedStatus);
    return list;
  }, [sortedList, selectedUtility, selectedStatus]);

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

  // Spring transition executing purely on native driver thread
  const animateSheet = useCallback(
    (toValue: number, callback?: () => void) => {
      Animated.spring(translateYOffset, {
        toValue,
        useNativeDriver: true,
        damping: 20,
        mass: 0.8,
        stiffness: 140,
      }).start(callback);
    },
    [translateYOffset],
  );

  const toggleSheet = useCallback(() => {
    const nextState = !sheetExpanded;
    setSheetExpanded(nextState);
    animateSheet(nextState ? SNAP_TOP : SNAP_BOTTOM);
  }, [sheetExpanded, animateSheet]);

  // Directly feeds the native pan drag events into the UI thread value
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateYDrag } }],
    { useNativeDriver: true },
  );

  const onHandlerStateChange = useCallback(
    (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (event.nativeEvent.state === State.END) {
        const { translationY, velocityY } = event.nativeEvent;

        // Calculate final positional projection accounting for velocity inertia
        const currentPosition =
          (sheetExpanded ? SNAP_TOP : SNAP_BOTTOM) + translationY;
        const projectedPosition = currentPosition + velocityY * 0.1;
        const midpoint = (SNAP_BOTTOM + SNAP_TOP) / 2;

        // Reset active drag accumulator to 0 before executing spring lock
        translateYDrag.setValue(0);

        if (projectedPosition < midpoint) {
          // Snap open/up (since it's moving into deeper negative values)
          translateYOffset.setValue(currentPosition);
          setSheetExpanded(true);
          animateSheet(SNAP_TOP);
        } else {
          // Snap closed/down (returning back up towards 0)
          translateYOffset.setValue(currentPosition);
          setSheetExpanded(false);
          animateSheet(SNAP_BOTTOM);
        }
      }
    },
    [sheetExpanded, translateYOffset, translateYDrag, animateSheet],
  );

  const centreOnMe = () => {
    if (!currentLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleRefresh = () => {
    if (currentLocation) fetchNearbyManholes(currentLocation, scanRadius);
  };

  const handleRadiusChange = (newRadius: number) => {
    setScanRadius(newRadius);
    setShowRadiusPicker(false);
    if (currentLocation) fetchNearbyManholes(currentLocation, newRadius);
  };

  const handleMarkerPress = (manhole: Manhole) => {
    setSelectedManhole(manhole);
    if (!sheetExpanded) {
      setSheetExpanded(true);
      animateSheet(SNAP_TOP);
    }
  };

  const handleSelectFromList = (manhole: Manhole) => {
    setSelectedManhole(manhole);
    mapRef.current?.animateToRegion({
      latitude: manhole.lat,
      longitude: manhole.lng,
      latitudeDelta: 0.003,
      longitudeDelta: 0.003,
    });
  };

  const handleNavigateToDetail = (id: string) => {
    router.push(`/nearby/${id}`);
  };

  return {
    mapRef,
    totalTranslateY,
    sheetExpanded,
    selectedUtility,
    setSelectedUtility,
    selectedStatus,
    setSelectedStatus,
    showRadiusPicker,
    setShowRadiusPicker,
    mapType,
    setMapType,
    selectedManhole,
    setSelectedManhole,
    permissionGranted,
    requestPermission,
    currentLocation,
    isFetching,
    fetchError,
    scanRadius,
    filteredList,
    stats,
    toggleSheet,
    onGestureEvent,
    onHandlerStateChange,
    centreOnMe,
    handleRefresh,
    handleRadiusChange,
    handleMarkerPress,
    handleSelectFromList,
    handleNavigateToDetail,
  };
}
