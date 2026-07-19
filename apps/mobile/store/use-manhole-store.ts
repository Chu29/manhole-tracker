import { create } from "zustand";
import { Manhole, fetchNearbyManholes } from "../api/manholes";
import { haversineDistance } from "../services/geo";
import { storeJSON, getJSON, STORAGE_KEYS } from "../utils/storage";
import { DEFAULT_RADIUS_METERS } from "@manhole-tracker/shared";
import axios from "axios";

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
  /** User-selected scan radius (meters). Shared across background watcher and UI. */
  scanRadius: number;

  // Actions
  hydrate: () => Promise<void>;
  fetchNearbyManholes: (coords: Coords, radiusMeters?: number) => Promise<void>;
  resortCachedList: (currentCoords: Coords) => void;
  addOrUpdateManhole: (manhole: Manhole) => void;
  setScanRadius: (radius: number) => void;
}

/**
 * Module-level AbortController for the singleton nearby-fetch request.
 * If a new fetch starts while a previous one is in flight, the previous
 * one is aborted immediately so stale responses can never overwrite fresh data.
 */
let activeAbortController: AbortController | null = null;

export const useManholeStore = create<ManholeState>((set, get) => ({
  cachedManholes: [],
  sortedList: [],
  isFetching: false,
  fetchError: null,
  lastFetchLocation: null,
  scanRadius: DEFAULT_RADIUS_METERS,

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
   *
   * Abort protection: if a previous fetch is still in flight, it is aborted
   * before the new one starts. Cancelled requests do not emit errors to the UI.
   */
  fetchNearbyManholes: async (coords, radiusMeters) => {
    // Abort any ongoing fetch to prevent out-of-order race conditions
    if (activeAbortController) {
      activeAbortController.abort();
    }

    const controller = new AbortController();
    activeAbortController = controller;

    set({ isFetching: true, fetchError: null });
    const { scanRadius } = get();
    const r = radiusMeters !== undefined ? radiusMeters : scanRadius;

    try {
      const manholes = await fetchNearbyManholes(
        coords.lat,
        coords.lng,
        r,
        controller.signal,
      );

      // Guard: only apply results if this is still the active request
      if (activeAbortController !== controller) return;

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
      activeAbortController = null;
    } catch (err: any) {
      // Silently ignore aborted/cancelled requests — they are intentional
      if (axios.isCancel(err) || err?.name === "AbortError") {
        if (activeAbortController === controller) {
          set({ isFetching: false });
          activeAbortController = null;
        }
        return;
      }

      // Only surface real errors if this is still the active request
      if (activeAbortController === controller) {
        set({
          isFetching: false,
          fetchError: err.message ?? "Failed to fetch manholes",
        });
        activeAbortController = null;
      }
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

  /** Update the user-selected scan radius (also used by background location watcher). */
  setScanRadius: (radius) => set({ scanRadius: radius }),
}));
