export type UserRole = "resident" | "caregiver";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  relation: string;
  watches: string[];
}

export interface WatchedResident {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  country_code: string;
  emergency_number: string;
  emergency_label: string;
}

export interface MeResponse {
  user: User;
  watched_residents: WatchedResident[];
  privacy_mode: boolean;
}

export interface EmergencyInfo {
  anomaly_id: string;
  resident_id: string;
  resident_name: string;
  caller_name: string;
  address: string;
  city: string;
  region: string;
  country_code: string;
  latitude: number;
  longitude: number;
  emergency_number: string;
  emergency_label: string;
  tel_uri: string;
  alert_title: string;
  alert_message: string;
}

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
  privacy_mode: boolean;
  monitoring_active: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  tel_uri: string;
  when_to_call: string;
  is_emergency: boolean;
}

export type AuthView = "login" | "signup" | "app";

export type TabId = "home" | "anomalies" | "emergency" | "sensors" | "settings";