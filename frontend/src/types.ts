export type SensorType =
  | "motion"
  | "fall"
  | "door"
  | "bed"
  | "wearable"
  | "temperature";

export type SensorStatus = "online" | "offline" | "low_battery";

export type AnomalySeverity = "critical" | "warning" | "info";

export type AnomalyType =
  | "fall"
  | "no_movement"
  | "wandering"
  | "door_open"
  | "temperature"
  | "heart_rate"
  | "bed_exit"
  | "medication";

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  battery: number;
  status: SensorStatus;
  last_seen: string;
}

export interface Anomaly {
  id: string;
  sensor_id: string;
  sensor_name: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  message: string;
  occurred_at: string;
  acknowledged: boolean;
}

export interface DashboardSummary {
  total_sensors: number;
  online_sensors: number;
  low_battery_sensors: number;
  active_anomalies: number;
  critical_anomalies: number;
}

export interface CareInsight {
  calm_score: number;
  calm_label: string;
  rest_hours: number;
  rest_quality: string;
  ambient_comfort: string;
  temperature: number;
  humidity: number;
  daily_affirmation: string;
  gentle_tip: string;
  hydration_reminder: string;
  moments_of_peace: number;
}

export type TabId = "home" | "sensors" | "alerts" | "care";
