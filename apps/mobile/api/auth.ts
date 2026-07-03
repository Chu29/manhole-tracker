import apiClient from "./client";

export interface Technician {
  id: string;
  name: string;
  email: string;
  orgId: string | null;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  technician: Technician;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  orgId?: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}
