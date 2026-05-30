import type { Anomaly, Detection } from "../types";
import { AlertStatusCard, type HomeAlertLevel } from "../components/AlertStatusCard";
import { DETECTION_PRESETS, type DetectionKey } from "../detectionDefaults";
import {
  DEMO_DETECTION_KEY,
  demoStageSeverity,
  getDemoAlert,
  type HomeDemoStage,
} from "../homeDemo";

interface Props {
  anomalies: Anomaly[];
  privacyMode: boolean;
  detections?: Detection[];
  demoStage: HomeDemoStage;
  onResetDemoStage: () => void;
  onSelectDetection: (id: string) => void;
  onAddDetection?: () => void;
  onAcknowledge: (id: string) => void;
  onGoHotline: () => void;
}

const detectionTiles: Array<{
  id: DetectionKey;
  label: string;
  emoji: string;
  matcher: RegExp;
  firstDurationSeconds: number;
  secondDurationSeconds: number;
}> = [
  {
    id: "sink",
    label: "Sink",
    emoji: "💧",
    matcher: /(sink|kitchen|water)/i,
    firstDurationSeconds: DETECTION_PRESETS.sink.firstDurationSeconds,
    secondDurationSeconds: DETECTION_PRESETS.sink.secondDurationSeconds,
  },
  {
    id: "bath",
    label: "Bath",
    emoji: "🚿",
    matcher: /(bath|shower|bathtub|restroom)/i,
    firstDurationSeconds: DETECTION_PRESETS.bath.firstDurationSeconds,
    secondDurationSeconds: DETECTION_PRESETS.bath.secondDurationSeconds,
  },
  {
    id: "bed",
    label: "Bed",
    emoji: "🛏️",
    matcher: /(bed|sleep|bed_exit)/i,
    firstDurationSeconds: DETECTION_PRESETS.bed.firstDurationSeconds,
    secondDurationSeconds: DETECTION_PRESETS.bed.secondDurationSeconds,
  },
];

export function AnomaliesScreen({
  anomalies,
  privacyMode,
  detections = [],
  demoStage,
  onResetDemoStage,
  onSelectDetection,
  onAddDetection,
  onAcknowledge,
  onGoHotline,
}: Props) {
  const activeAlerts = anomalies.filter((anomaly) => !anomaly.acknowledged);
  const demoAlert = getDemoAlert(demoStage);
  const demoSeverity = demoStageSeverity(demoStage);
  const showDemoBanner = demoStage > 0;
  const primaryAlert =
    activeAlerts.find((anomaly) => anomaly.severity === "critical") ?? activeAlerts[0];

  function handleBannerAcknowledge() {
    if (demoStage > 0) {
      onResetDemoStage();
      return;
    }
    if (primaryAlert) {
      onAcknowledge(primaryAlert.id);
    }
  }

  const combined = detectionTiles.map((tile) => ({
    ...tile,
    meta: detections.find((d) => d.key === tile.id),
  }));

  const now = Date.now();
  const detectionTilesWithStatus = combined.map((tile) => {
    if (tile.id === DEMO_DETECTION_KEY && demoSeverity) {
      return { ...tile, severity: demoSeverity };
    }

    const matching = activeAlerts.filter((anomaly) => {
      const det = tile.meta;
      if (det?.trigger_on_sensor_id) {
        return anomaly.sensor_id === det.trigger_on_sensor_id;
      }
      return tile.matcher.test(`${anomaly.title} ${anomaly.sensor_name} ${anomaly.type}`);
    });

    if (matching.length === 0) return { ...tile, severity: null };

    const earliest = matching.reduce((min, a) => (new Date(a.occurred_at).getTime() < min ? new Date(a.occurred_at).getTime() : min), Infinity);
    const deltaSec = Math.max(0, Math.floor((now - earliest) / 1000));
    const det = tile.meta;
    const first = det?.first_duration_seconds ?? tile.firstDurationSeconds;
    const second = det?.second_duration_seconds ?? tile.secondDurationSeconds;

    const severity = deltaSec >= second ? "critical" : deltaSec >= first ? "warning" : "warning";
    return { ...tile, severity };
  });

  const activeAlertCard: {
    level: HomeAlertLevel;
    eyebrow: string;
    title: string;
    message: string;
  } | null =
    showDemoBanner && demoAlert && demoSeverity
      ? {
          level: demoSeverity,
          eyebrow: demoAlert.eyebrow,
          title: demoAlert.title,
          message: demoAlert.message,
        }
      : primaryAlert
        ? {
            level: primaryAlert.severity === "critical" ? "critical" : "warning",
            eyebrow:
              primaryAlert.severity === "critical" ? "Important alert" : "Watch closely",
            title: primaryAlert.title,
            message: primaryAlert.message,
          }
        : null;

  return (
    <div className="screen anomalies-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Detection</p>
        <h1>Anomaly Detection</h1>
        <p className="hero-copy">
          {privacyMode
            ? "Active monitoring is on. Critical alerts show red, and private info stays quiet unless needed."
            : "Active anomaly detection is on. Tap a sensor tile to open its settings page."}
        </p>
      </header>

      {activeAlertCard ? (
        <AlertStatusCard
          level={activeAlertCard.level}
          eyebrow={activeAlertCard.eyebrow}
          title={activeAlertCard.title}
          message={activeAlertCard.message}
          onAcknowledge={handleBannerAcknowledge}
          onGoHotline={onGoHotline}
        />
      ) : (
        <section className="alert-banner">
          <p className="alert-title">All clear</p>
          <p className="alert-copy">No active anomalies right now. Monitoring is quiet.</p>
        </section>
      )}

      <div className="screen-section">
        <div className="detection-grid">
          {detectionTilesWithStatus.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`detection-card${tile.severity ? ` severity-${tile.severity}` : ""}`}
              onClick={() => onSelectDetection(tile.id)}
            >
              <div className="detection-card-icon">{tile.emoji}</div>
              <h2 className="detection-card-label">{tile.label}</h2>
            </button>
          ))}
        </div>
      </div>

      <div className="screen-section">
        <button
          type="button"
          className="add-detection-btn"
          onClick={() => (onAddDetection ? onAddDetection() : window.alert("Add detection is coming soon!"))}
        >
          <span className="plus-sign">+</span>
          Add detection
        </button>
      </div>
    </div>
  );
}
