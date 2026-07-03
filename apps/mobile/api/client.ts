import axios from 'axios';
import { useAuthStore } from '../store/use-auth-store';

// Set this to your machine's LAN IP when testing on a physical device.
// Expo Go on a real phone cannot reach `localhost` — it needs your dev machine's
// actual IP on the same Wi-Fi network, e.g. http://192.168.1.42:3000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from auth store to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centrally handle 401 — clear auth state so the root layout re-routes to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;