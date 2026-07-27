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

// Reject fixes worse than this radius (meters). expo-location reports
// coords.accuracy as the 68% confidence radius, so anything above ~25m
// near buildings/underground infra is usually noise, not real movement.
const MAX_ACCEPTABLE_ACCURACY_METERS = 25;

// Exponential smoothing factor applied to accepted fixes. Lower = smoother
// but slower to react to real movement; higher = more responsive but jitterier.
const SMOOTHING_ALPHA = 0.25;

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
        // Gate 1: drop fixes that are too imprecise to trust. This is the
        // single biggest source of jitter — a bad fix near a building or
        // underground utility can be off by 50m+ and will yank the sort
        // order around even though the tech hasn't actually moved.
        if (
          location.coords.accuracy != null &&
          location.coords.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS
        ) {
          return;
        }

        const rawCoords: Coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        // Gate 2: smooth accepted fixes with exponential smoothing rather
        // than snapping straight to the new point. This absorbs the
        // remaining wobble between "good enough" fixes without introducing
        // noticeable lag when the tech is actually walking.
        const previous = get().currentLocation;
        const coords: Coords = previous
          ? {
              lat:
                previous.lat +
                SMOOTHING_ALPHA * (rawCoords.lat - previous.lat),
              lng:
                previous.lng +
                SMOOTHING_ALPHA * (rawCoords.lng - previous.lng),
            }
          : rawCoords;

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