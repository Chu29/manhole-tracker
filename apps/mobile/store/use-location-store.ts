import { create } from "zustand";
import * as Location from "expo-location";
import NetInfo from "@react-native-community/netinfo";
import {
  LOCAL_RESORT_INTERVAL_METERS,
  REFETCH_THRESHOLD_METERS,
} from "@manhole-tracker/shared";
import { haversineDistance } from "../services/geo";
import { useManholeStore } from "./use-manhole-store";

interface Coords {
  lat: number;
  lng: number;
}

interface LocationState {
  currentLocation: Coords | null;
  permissionGranted: boolean | null; // null = not yet asked
  watchSubscription: Location.LocationSubscription | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  permissionGranted: null,
  watchSubscription: null,

  requestPermission: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === "granted";
    set({ permissionGranted: granted });
    return granted;
  },

  startWatching: async () => {
    const { watchSubscription, requestPermission } = get();

    // Don't double-subscribe
    if (watchSubscription) return;

    const granted = await requestPermission();
    if (!granted) return;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        // Tier 1 gate: only fire callback when the device has moved ≥ 5 m.
        distanceInterval: LOCAL_RESORT_INTERVAL_METERS,
      },
      async (location) => {
        const coords: Coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        set({ currentLocation: coords });

        const manholeStore = useManholeStore.getState();

        // --- Tier 1: always re-sort the cached list ---
        manholeStore.resortCachedList(coords);

        // --- Tier 2: re-fetch from server if moved ≥ 15 m from last fetch ---
        const distanceMoved = manholeStore.lastFetchLocation
          ? haversineDistance(manholeStore.lastFetchLocation, coords)
          : Infinity;

        if (distanceMoved >= REFETCH_THRESHOLD_METERS) {
          const netState = await NetInfo.fetch();
          if (netState.isConnected) {
            // Read the user's selected scan radius from the manhole store
            const radius = manholeStore.scanRadius;
            await manholeStore.fetchNearbyManholes(coords, radius);
          }
          // If offline, tier 1 re-sort is still providing best available UX.
        }
      },
    );

    set({ watchSubscription: subscription });
  },

  stopWatching: () => {
    const { watchSubscription } = get();
    watchSubscription?.remove();
    set({ watchSubscription: null });
  },
}));
