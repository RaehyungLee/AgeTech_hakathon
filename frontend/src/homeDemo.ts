import { DEMO_HOME_ALERTS, type HomeAlertLevel } from "./components/AlertStatusCard";
import type { DetectionKey } from "./detectionDefaults";

export type HomeDemoStage = 0 | 1 | 2;

/** Restroom demo alert maps to the Bath detection tile. */
export const DEMO_DETECTION_KEY: DetectionKey = "bath";

export function demoStageSeverity(stage: HomeDemoStage): HomeAlertLevel | null {
  if (stage === 1) return "warning";
  if (stage === 2) return "critical";
  return null;
}

export function getDemoAlert(stage: HomeDemoStage) {
  const severity = demoStageSeverity(stage);
  return severity ? DEMO_HOME_ALERTS[severity] : null;
}
