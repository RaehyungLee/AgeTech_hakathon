import type { Detection } from "./types";

export type DetectionKey = "sink" | "bath" | "bed";

/** Defaults derived from single_patient_detailed_1000_visits.csv + backend/app/ml/thresholds.py */
export interface DetectionPresetConfig {
  name: string;
  emoji: string;
  triggerOnName: string;
  triggerOffName: string;
  firstDurationSeconds: number;
  secondDurationSeconds: number;
  learnSourceLabel: string;
}

export const DETECTION_PRESETS: Record<DetectionKey, DetectionPresetConfig> = {
  sink: {
    name: "Sink",
    emoji: "💧",
    triggerOnName: "Sink water usage",
    triggerOffName: "Sink water usage",
    // Kitchen water left on — ~1.2× dataset median visit (8.2 min)
    firstDurationSeconds: 10 * 60,
    // ML clinical soft warning (20 min)
    secondDurationSeconds: 20 * 60,
    learnSourceLabel: "1,001 daily visits (median 8.2 min kitchen baseline)",
  },
  bath: {
    name: "Bath",
    emoji: "🚿",
    triggerOnName: "Bathroom door",
    triggerOffName: "Bathroom door",
    // ML duration_yellow_min
    firstDurationSeconds: 20 * 60,
    // ML duration_red_min
    secondDurationSeconds: 35 * 60,
    learnSourceLabel: "1,001 restroom visits (personalized duration model)",
  },
  bed: {
    name: "Bed",
    emoji: "🛏️",
    triggerOnName: "Bed pressure",
    triggerOffName: "Bedroom motion",
    // Night visit median 9.3 min (558 s) from dataset
    firstDurationSeconds: 558,
    // Prolonged out-of-bed / nocturnal trip — ML yellow threshold
    secondDurationSeconds: 20 * 60,
    learnSourceLabel: "127 night visits (median 9.3 min nocturnal baseline)",
  },
};

/** Demo “learned” values — slightly tighter personal baseline after ML fit */
export const DETECTION_LEARNED: Record<
  DetectionKey,
  { firstDurationSeconds: number; secondDurationSeconds: number }
> = {
  sink: { firstDurationSeconds: 8 * 60 + 11, secondDurationSeconds: 17 * 60 },
  bath: { firstDurationSeconds: 18 * 60, secondDurationSeconds: 32 * 60 },
  bed: { firstDurationSeconds: 558, secondDurationSeconds: 18 * 60 },
};

export function isDetectionKey(id: string): id is DetectionKey {
  return id === "sink" || id === "bath" || id === "bed";
}

export function presetToDetection(key: DetectionKey, sensorLookup?: (name: string) => string): Detection {
  const preset = DETECTION_PRESETS[key];
  return {
    id: `preset-${key}`,
    key,
    name: preset.name,
    emoji: preset.emoji,
    trigger_on_sensor_id: sensorLookup?.(preset.triggerOnName) || null,
    trigger_off_sensor_id: sensorLookup?.(preset.triggerOffName) || null,
    first_duration_seconds: preset.firstDurationSeconds,
    second_duration_seconds: preset.secondDurationSeconds,
  };
}

export function buildDefaultDetections(sensorLookup?: (name: string) => string): Detection[] {
  return (["sink", "bath", "bed"] as DetectionKey[]).map((key) =>
    presetToDetection(key, sensorLookup),
  );
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
