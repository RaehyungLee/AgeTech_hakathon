import type { Anomaly, Detection } from "../types";
import { DETECTION_PRESETS, type DetectionKey } from "../detectionDefaults";

interface Props {
  anomalies: Anomaly[];
  privacyMode: boolean;
  detections?: Detection[];
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
  onSelectDetection,
  onAddDetection,
  onAcknowledge,
  onGoHotline,
}: Props) {
  const activeAlerts = anomalies.filter((anomaly) => !anomaly.acknowledged);
  const alertCount = activeAlerts.length;
  const activeAlertsLabel = alertCount === 1 ? "1 alert active" : `${alertCount} alerts active`;
  const primaryAlert =
    activeAlerts.find((anomaly) => anomaly.severity === "critical") ?? activeAlerts[0];

  const combined = detectionTiles.map((tile) => ({
    ...tile,
    meta: detections.find((d) => d.key === tile.id),
  }));

  const now = Date.now();
  const detectionTilesWithStatus = combined.map((tile) => {
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

      <section className={`alert-banner${alertCount > 0 ? " active" : ""}`}>
        <p className="alert-title">{alertCount > 0 ? "Alert active" : "All clear"}</p>
        <p className="alert-copy">
          {alertCount > 0 && primaryAlert
            ? `${primaryAlert.title}. ${activeAlertsLabel}.`
            : "No active anomalies right now. Monitoring is quiet."}
        </p>
        {alertCount > 0 && primaryAlert && (
          <div className="status-alert-actions alert-banner-actions">
            <button type="button" className="hotline-btn" onClick={onGoHotline}>
              Hotline
            </button>
            <button
              type="button"
              className="ack-btn status-ack-btn"
              onClick={() => onAcknowledge(primaryAlert.id)}
            >
              Acknowledge
            </button>
          </div>
        )}
      </section>

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
