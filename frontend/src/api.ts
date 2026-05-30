import type { Anomaly, CareInsight, DashboardSummary, Sensor } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getSummary: () => request<DashboardSummary>("/api/summary"),
  getSensors: () => request<Sensor[]>("/api/sensors"),
  getAnomalies: () => request<Anomaly[]>("/api/anomalies"),
  getCare: () => request<CareInsight>("/api/care"),
  renameSensor: (id: string, name: string) =>
    request<Sensor>(`/api/sensors/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  acknowledgeAnomaly: (id: string) =>
    request<Anomaly>(`/api/anomalies/${id}/acknowledge`, { method: "PATCH" }),
};
