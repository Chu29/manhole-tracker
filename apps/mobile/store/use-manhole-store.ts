import { create } from "zustand";
import { Manhole, fetchNearbyManholes } from "../api/manholes";
import { haversineDistance } from "../services/geo";
import { storeJSON, getJSON, STORAGE_KEYS } from "../utils/storage";
import { DEFAULT_RADIUS_METERS } from "@manhole-tracker/shared";

interface Coords {
  lat: number;
  lng: number;
}

interface ManholeState {
  /** Full list as returned by the last server fetch, used as source-of-truth for re-sorts. */
  cachedManholes: Manhole[];
  /** cachedManholes re-sorted by current distance — this is what the UI renders. */
  sortedList: Manhole[];
  isFetching: boolean;
  fetchError: string | null;
  /** Location at which the last successful server fetch was performed. */
  lastFetchLocation: Coords | null;

  // Actions
  hydrate: () => Promise<void>;
  fetchNearbyManholes: (coords: Coords, radiusMeters?: number) => Promise<void>;
  resortCachedList: (currentCoords: Coords) => void;
  addOrUpdateManhole: (manhole: Manhole) => void;
}

export const useManholeStore = create<ManholeState>((set, get) => ({
  cachedManholes: [],
  sortedList: [],
  isFetching: false,
  fetchError: null,
  lastFetchLocation: null,

  /** Restore the manhole list from AsyncStorage on app launch (before any network call). */
  hydrate: async () => {
    const cached = await getJSON<Manhole[]>(STORAGE_KEYS.CACHED_MANHOLES);
    const lastFetchLocation = await getJSON<Coords>(
      STORAGE_KEYS.LAST_FETCH_LOCATION,
    );
    if (cached) {
      set({ cachedManholes: cached, sortedList: cached, lastFetchLocation });
    }
  },

  /**
   * Tier 2: calls GET /manholes/nearby and replaces the cache.
   * Only called when the technician has moved ≥ REFETCH_THRESHOLD_METERS
   * from lastFetchLocation — that gate lives in use-location-store.ts.
   */
  fetchNearbyManholes: async (coords, radiusMeters = DEFAULT_RADIUS_METERS) => {
    set({ isFetching: true, fetchError: null });
    try {
      const manholes = await fetchNearbyManholes(
        coords.lat,
        coords.lng,
        radiusMeters,
      );
      // The server already sorts by distance_meters; store as-is for the initial render.
      await Promise.all([
        storeJSON(STORAGE_KEYS.CACHED_MANHOLES, manholes),
        storeJSON(STORAGE_KEYS.LAST_FETCH_LOCATION, coords),
      ]);
      set({
        cachedManholes: manholes,
        sortedList: manholes,
        lastFetchLocation: coords,
        isFetching: false,
      });
    } catch (err: any) {
      set({
        isFetching: false,
        fetchError: err.message ?? "Failed to fetch manholes",
      });
    }
  },

  /**
   * Tier 1: re-sorts the already-cached list by Haversine distance from
   * currentCoords. Instant — no network call.
   */
  resortCachedList: (currentCoords) => {
    const { cachedManholes } = get();
    if (cachedManholes.length === 0) return;

    const sorted = [...cachedManholes]
      .map((m) => ({
        ...m,
        distanceMeters: haversineDistance(currentCoords, {
          lat: m.lat,
          lng: m.lng,
        }),
      }))
      .sort(
        (a, b) =>
          (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
      );

    set({ sortedList: sorted });
  },

  /** Insert a newly registered manhole or update an existing one by id. */
  addOrUpdateManhole: (manhole) => {
    set((state) => {
      const exists = state.cachedManholes.some((m) => m.id === manhole.id);
      const updated = exists
        ? state.cachedManholes.map((m) => (m.id === manhole.id ? manhole : m))
        : [manhole, ...state.cachedManholes];
      storeJSON(STORAGE_KEYS.CACHED_MANHOLES, updated);
      return { cachedManholes: updated, sortedList: updated };
    });
  },
}));
