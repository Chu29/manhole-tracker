import { useEffect, useMemo } from "react";
import { router } from "expo-router";
import { useManholeStore } from "../store/use-manhole-store";
import { useLocationStore } from "../store/use-location-store";
import { formatDistance } from "../services/geo";
import { Manhole } from "../api/manholes";

export function useNearbyController() {
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

  useEffect(() => {
    startWatching();
  }, [startWatching]);

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

  const createPressHandler = (manhole: Manhole) => () => {
    router.push({
      pathname: "/(tabs)/map",
      params: {
        manholeId: manhole.id,
        lat: String(manhole.lat),
        lng: String(manhole.lng),
      },
    });
  };

  const stats = useMemo(() => {
    const total = sortedList.length;
    const closest = sortedList.find((m) => m.distanceMeters !== undefined);
    const closestDist =
      closest?.distanceMeters !== undefined
        ? formatDistance(closest.distanceMeters)
        : "—";
    const damaged = sortedList.filter((m) => m.status === "damaged").length;

    return {
      totalNearby: total,
      closestText: closestDist,
      damagedCount: damaged,
    };
  }, [sortedList]);

  return {
    processedList: sortedList,
    isFetching,
    fetchError,
    scanRadius,
    permissionGranted,
    currentLocation,
    stats,
    handleRadiusChange,
    handleRefresh,
    createPressHandler,
  };
}
