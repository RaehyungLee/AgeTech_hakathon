import type { Anomaly, Detection } from "../types";

interface Props {
  anomalies: Anomaly[];
  privacyMode: boolean;
  detections?: Detection[];
  onSelectDetection: (id: string) => void;
  onAddDetection?: () => void;
  onAcknowledge: (id: string) => void;
  onGoHotline: () => void;
}

const detectionTiles = [
  {
    id: "sink" as const,
    label: "Sink",
    emoji: "💧",
    description: "Water use and kitchen flow",
    matcher: /(sink|kitchen|water)/i,
  },
  {
    id: "bath" as const,
    label: "Bath",
    emoji: "🚿",
    description: "Bathroom motion and inactivity",
    matcher: /(bath|shower|bathtub)/i,
  },
  {
    id: "bed" as const,
    label: "Bed",
    emoji: "🛏️",
    description: "Bed exits and rest changes",
    matcher: /(bed|sleep|bed_exit)/i,
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

  const combined = [...detectionTiles, ...detections.map((d) => ({
    id: d.id,
    label: d.name,
    emoji: d.emoji,
    matcher: d.trigger_on_sensor_id
      ? new RegExp("^" + d.trigger_on_sensor_id + "$")
      : new RegExp(d.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    meta: d,
  }))];

  const now = Date.now();
  const detectionTilesWithStatus = combined.map((tile) => {
    const matching = activeAlerts.filter((anomaly) => {
      const det = (tile as any).meta as Detection | undefined;
      if (det && det.trigger_on_sensor_id) {
        return anomaly.sensor_id === det.trigger_on_sensor_id;
      }
      return tile.matcher.test(`${anomaly.title} ${anomaly.sensor_name} ${anomaly.type}`);
    });

    if (matching.length === 0) return { ...tile, severity: null };

    const earliest = matching.reduce((min, a) => (new Date(a.occurred_at).getTime() < min ? new Date(a.occurred_at).getTime() : min), Infinity);
    const deltaSec = Math.max(0, Math.floor((now - earliest) / 1000));
    const det = (tile as any).meta as Detection | undefined;
    const first = det ? det.first_duration_seconds : 30;
    const second = det ? det.second_duration_seconds : 60;

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
