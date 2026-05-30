import type { AnomalySeverity, SensorType } from "./types";

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function batteryLevel(battery: number): "high" | "medium" | "low" {
  if (battery > 60) return "high";
  if (battery > 25) return "medium";
  return "low";
}

export const sensorTypeLabels: Record<SensorType, string> = {
  motion: "Motion",
  fall: "Fall Detection",
  door: "Door",
  bed: "Bed Mat",
  wearable: "Wearable",
  temperature: "Temperature",
};

export const severityLabels: Record<AnomalySeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function sensorIcon(type: SensorType): string {
  switch (type) {
    case "motion":
      return "◎";
    case "fall":
      return "⚠";
    case "door":
      return "▭";
    case "bed":
      return "▬";
    case "wearable":
      return "◉";
    case "temperature":
      return "°";
    default:
      return "•";
  }
}
