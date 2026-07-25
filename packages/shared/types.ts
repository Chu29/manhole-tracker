export type ManholeStatus = "active" | "inactive" | "buried" | "damaged";

export type UtilityType = "sewer" | "electrical" | "telecom" | "water";

export interface Manhole {
  id: string;
  code: string | null;
  lat: number;
  lng: number;
  utilityType: UtilityType | null;
  depthMeters: number | null;
  status: ManholeStatus;
  photoUrl: string | null;
  installDate: string | null;
  lastInspectedAt: string | null;
  lastInspectedBy: string | null;
  createdAt: string;
  distanceMeters?: number; // optionally returned by /nearby
}

export interface ManholeInput {
  lat: number;
  lng: number;
  code?: string;
  utilityType?: UtilityType;
  depthMeters?: number;
  status?: ManholeStatus;
  photoUrl?: string;
  installDate?: string;
}

export interface Inspection {
  id: string;
  manholeId: string;
  technicianId: string;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export * from "./constants.js";
