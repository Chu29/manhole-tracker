import apiClient from "./client";

export interface Manhole {
  id: string;
  code: string | null;
  lat: number;
  lng: number;
  utilityType: "sewer" | "electrical" | "telecom" | "water" | null;
  depthMeters: number | null;
  status: string;
  photoUrl: string | null;
  installDate: string | null;
  lastInspectedAt: string | null;
  lastInspectedBy: string | null;
  distanceMeters?: number; // present on /nearby results
  createdAt: string;
}

export interface Inspection {
  id: string;
  manholeId: string;
  technicianId: string;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface CreateManholePayload {
  lat: number;
  lng: number;
  code?: string;
  utilityType?: Manhole["utilityType"];
  depthMeters?: number;
  photoUrl?: string;
  installDate?: string;
}

// GET /manholes/nearby?lat=&lng=&radius=
export async function fetchNearbyManholes(
  lat: number,
  lng: number,
  radiusMeters?: number,
): Promise<Manhole[]> {
  const params: Record<string, string | number> = { lat, lng };
  if (radiusMeters !== undefined) params.radius = radiusMeters;
  const { data } = await apiClient.get<Manhole[]>("/manholes/nearby", {
    params,
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
