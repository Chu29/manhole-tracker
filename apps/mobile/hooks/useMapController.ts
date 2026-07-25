import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import { useManholeStore } from "../store/use-manhole-store";
import { useLocationStore } from "../store/use-location-store";
import { Manhole } from "../api/manholes";

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

  const { manholeId, lat, lng } = useLocalSearchParams<{
    manholeId?: string;
    lat?: string;
    lng?: string;
  }>();

  const mapRef = useRef<MapView>(null);

  const [selectedUtility, setSelectedUtility] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [selectedManhole, setSelectedManhole] = useState<Manhole | null>(null);

  useEffect(() => {
    startWatching();
  }, [startWatching]);

  useEffect(() => {
    if (manholeId) {
      const found = sortedList.find((m) => m.id === manholeId);
      if (found) {
        setSelectedManhole(found);
      }
    }
    if (lat && lng) {
      const targetLat = parseFloat(lat);
      const targetLng = parseFloat(lng);
      if (!isNaN(targetLat) && !isNaN(targetLng)) {
        mapRef.current?.animateToRegion({
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        });
      }
    }
  }, [manholeId, lat, lng, sortedList]);

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
    centreOnMe,
    handleRefresh,
    handleRadiusChange,
    handleMarkerPress,
    handleSelectFromList,
    handleNavigateToDetail,
  };
}
