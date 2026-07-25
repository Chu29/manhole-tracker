import { Platform } from "react-native";
import apiClient, { BASE_URL } from "./client";
import { useAuthStore } from "../store/use-auth-store";
import type { Manhole, ManholeInput as CreateManholePayload, Inspection, ManholeStatus, UtilityType } from "@manhole-tracker/shared";
export type { Manhole, CreateManholePayload, Inspection, ManholeStatus, UtilityType };

// GET /manholes/nearby?lat=&lng=&radius=
export async function fetchNearbyManholes(
  lat: number,
  lng: number,
  radiusMeters?: number,
  signal?: AbortSignal,
): Promise<Manhole[]> {
  const params: Record<string, string | number> = { lat, lng };
  if (radiusMeters !== undefined) params.radius = radiusMeters;
  const { data } = await apiClient.get<Manhole[]>("/manholes/nearby", {
    params,
    signal,
  });
  return data;
}

// POST /manholes
export async function createManhole(
  payload: CreateManholePayload,
): Promise<Manhole> {
  const { data } = await apiClient.post<Manhole>("/manholes", payload);
  return data;
}

// GET /manholes/:id
export async function getManholeById(id: string): Promise<Manhole> {
  const { data } = await apiClient.get<Manhole>(`/manholes/${id}`);
  return data;
}

// PATCH /manholes/:id
export async function updateManhole(
  id: string,
  payload: Partial<CreateManholePayload> & { status?: string },
): Promise<Manhole> {
  const { data } = await apiClient.patch<Manhole>(`/manholes/${id}`, payload);
  return data;
}

// POST /manholes/:id/inspections
export async function createInspection(
  manholeId: string,
  payload: { notes?: string; photoUrl?: string },
): Promise<Inspection> {
  const { data } = await apiClient.post<Inspection>(
    `/manholes/${manholeId}/inspections`,
    payload,
  );
  return data;
}

// GET /manholes/:id/inspections
export async function listInspections(
  manholeId: string,
): Promise<Inspection[]> {
  const { data } = await apiClient.get<Inspection[]>(
    `/manholes/${manholeId}/inspections`,
  );
  return data;
}

// POST /uploads/photo
export async function uploadPhoto(uri: string): Promise<{ photoUrl: string }> {
  const token = useAuthStore.getState().token;
  const formData = new FormData();
  let filename = uri.split("/").pop() || "photo.jpg";
  if (!filename.includes(".")) {
    filename += ".jpg";
  }
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : "jpg";
  const type = ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : "image/jpeg";

  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append("photo", blob, filename);
  } else {
    formData.append("photo", {
      uri,
      name: filename,
      type,
    } as any);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/uploads/photo`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Photo upload failed with status ${response.status}`);
  }

  return await response.json();
}


