import type {
  Anomaly,
  DashboardSummary,
  EmergencyContact,
  EmergencyInfo,
  MeResponse,
  Sensor,
  User,
  UserRole,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "kinu_auth_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    relation: string;
  }) =>
    request<{ token: string; user: User }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMe: () => request<MeResponse>("/api/auth/me"),
  getSummary: () => request<DashboardSummary>("/api/summary"),
  getSensors: () => request<Sensor[]>("/api/sensors"),
  getAnomalies: () => request<Anomaly[]>("/api/anomalies"),
  getEmergencyContacts: () => request<EmergencyContact[]>("/api/emergency/contacts"),
  getEmergencyInfo: (anomalyId: string) =>
    request<EmergencyInfo>(`/api/emergency/${anomalyId}`),
  logEmergencyCall: (anomalyId: string) =>
    request<EmergencyInfo>(`/api/emergency/${anomalyId}/call`, { method: "POST" }),
  renameSensor: (id: string, name: string) =>
    request<Sensor>(`/api/sensors/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  acknowledgeAnomaly: (id: string) =>
    request<Anomaly>(`/api/anomalies/${id}/acknowledge`, { method: "PATCH" }),
};
