import { create } from "zustand";
import { Technician } from "../api/auth";
import { storeJSON, getJSON, removeItem, STORAGE_KEYS } from "../utils/storage";

interface AuthState {
  token: string | null;
  technician: Technician | null;
  isHydrated: boolean; // true once AsyncStorage has been read on launch

  // Actions
  setAuth: (token: string, technician: Technician) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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
  },
}));
