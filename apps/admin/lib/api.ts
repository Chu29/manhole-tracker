import axios from "axios";
import { getToken, clearToken } from "./auth";
import { DEFAULT_API_BASE_URL } from "@manhole-tracker/shared";
import type { Manhole, ManholeInput, ManholeStatus, UtilityType, Technician, Inspection } from "@manhole-tracker/shared";
export type { Manhole, ManholeInput, ManholeStatus, UtilityType, Technician, Inspection };

export interface TechnicianDetail extends Technician {
  inspectionLogs?: Inspection[];
}

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
  const { data } = await api.post<{ token: string; technician: Technician }>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function getMe() {
  const { data } = await api.get<Technician>("/auth/me");
  return data;
}

export async function listManholes() {
  const { data } = await api.get<Manhole[]>("/manholes");
  return data;
}

export async function getManhole(id: string) {
  const { data } = await api.get<Manhole>(`/manholes/${id}`);
  return data;
}

export async function createManhole(input: ManholeInput) {
  const { data } = await api.post<Manhole>("/manholes", input);
  return data;
}

export async function updateManhole(id: string, input: Partial<ManholeInput>) {
  const { data } = await api.patch<Manhole>(`/manholes/${id}`, input);
  return data;
}

export async function deleteManhole(id: string) {
  await api.delete(`/manholes/${id}`);
}

export async function listTechnicians() {
  const { data } = await api.get<Technician[]>("/technicians");
  return data;
}

export async function getTechnician(id: string) {
  const { data } = await api.get<TechnicianDetail>(`/technicians/${id}`);
  return data;
}

export async function updateTechnician(id: string, input: { role?: string; orgId?: string | null }) {
  const { data: updated } = await api.patch<Technician>(`/technicians/${id}`, input);
  return updated;
}


export async function listAllInspections(params?: { technicianId?: string; manholeId?: string }) {
  const { data } = await api.get<Inspection[]>("/inspections", { params });
  return data;
}

export async function listManholeInspections(manholeId: string) {
  const { data } = await api.get<Inspection[]>(`/manholes/${manholeId}/inspections`);
  return data;
}

