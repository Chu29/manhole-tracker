import axios from "axios";
import { getToken, clearToken } from "./auth";
import { DEFAULT_API_BASE_URL } from "@manhole-tracker/shared";
import type { Manhole, ManholeInput, ManholeStatus, UtilityType } from "@manhole-tracker/shared";
export type { Manhole, ManholeInput, ManholeStatus, UtilityType };

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `${DEFAULT_API_BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string }>("/auth/login", {
    email,
    password,
  });
  return data.token;
}

export async function listManholes() {
  const { data } = await api.get<Manhole[]>("/manholes");
  return data;
}

export async function getManhole(id: string) {
  const { data } = await api.get<Manhole>(`/manholes/${id}`);
  return data;
}

export async function updateManhole(id: string, input: Partial<ManholeInput>) {
  const { data } = await api.patch<Manhole>(`/manholes/${id}`, input);
  return data;
}

export async function deleteManhole(id: string) {
  await api.delete(`/manholes/${id}`);
}
