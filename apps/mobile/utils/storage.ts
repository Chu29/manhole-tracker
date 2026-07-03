import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "@manhole:auth_token",
  TECHNICIAN: "@manhole:technician",
  CACHED_MANHOLES: "@manhole:cached_manholes",
  LAST_FETCH_LOCATION: "@manhole:last_fetch_location",
  OFFLINE_QUEUE: "@manhole:offline_queue",
} as const;

export async function storeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
