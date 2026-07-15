import axios from "axios";
import { create } from "zustand";
import { Technician } from "../api/auth";
import { storeJSON, getJSON, removeItem, STORAGE_KEYS } from "../utils/storage";

interface AuthState {
  token: string | null;
  technician: Technician | null;
  isHydrated: boolean; // true once AsyncStorage has been read on launch

  // Actions
  setAuth: (token: string, technician: Technician) => Promise<void>;
  setTechnician: (technician: Technician) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  technician: null,
  isHydrated: false,

  setAuth: async (token, technician) => {
    await Promise.all([
      storeJSON(STORAGE_KEYS.AUTH_TOKEN, token),
      storeJSON(STORAGE_KEYS.TECHNICIAN, technician),
    ]);
    set({ token, technician });
  },

  setTechnician: async (technician) => {
    await storeJSON(STORAGE_KEYS.TECHNICIAN, technician);
    set({ technician });
  },

  logout: async () => {
    await Promise.all([
      removeItem(STORAGE_KEYS.AUTH_TOKEN),
      removeItem(STORAGE_KEYS.TECHNICIAN),
    ]);
    set({ token: null, technician: null });
  },

  // Call once on app launch (in root _layout.tsx) to restore persisted session
  hydrate: async () => {
    const [token, technician] = await Promise.all([
      getJSON<string>(STORAGE_KEYS.AUTH_TOKEN),
      getJSON<Technician>(STORAGE_KEYS.TECHNICIAN),
    ]);
    set({ token, technician, isHydrated: true });

    if (token) {
      // Async background refresh of the technician profile.
      // IMPORTANT: use a raw axios instance (not the shared apiClient) so that
      // a transient 401 / network error here does NOT trigger the global logout
      // interceptor and silently wipe the persisted session from AsyncStorage.
      (async () => {
        try {
          const baseURL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
          const response = await axios.get<Technician>(`${baseURL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10_000,
          });
          const freshTechnician = response.data;
          const currentTechnician = get().technician;
          const mergedTechnician = currentTechnician
            ? { ...currentTechnician, ...freshTechnician }
            : freshTechnician;
          await storeJSON(STORAGE_KEYS.TECHNICIAN, mergedTechnician);
          set({ technician: mergedTechnician });
        } catch (err) {
          // Soft failure: keep the cached technician that was already restored
          // from AsyncStorage. Do NOT call logout() here — a transient server
          // error or expired token should not destroy the user's local session.
          console.warn("Background technician refresh failed — using cached data:", err);
        }
      })();
    }
  },
}));
