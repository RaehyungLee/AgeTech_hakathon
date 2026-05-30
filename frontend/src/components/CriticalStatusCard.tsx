import type { Anomaly } from "../types";

interface Props {
  criticalAlerts: Anomaly[];
  onAcknowledge: (id: string) => void;
  onGoHotline: () => void;
}

export function CriticalStatusCard({
  criticalAlerts,
  onAcknowledge,
  onGoHotline,
}: Props) {
  const primary = criticalAlerts[0];

  return (
    <section className="status-card status-critical status-center">
      <span className="status-icon" aria-hidden="true">!</span>
      <div className="status-body">
        <p className="status-eyebrow">Important alert</p>
        <h2>{primary.title}</h2>
        <p>{primary.message}</p>
        {criticalAlerts.length > 1 && (
          <p className="status-meta">+{criticalAlerts.length - 1} more critical alert(s)</p>
        )}
        <div className="status-alert-actions">
          <button type="button" className="hotline-btn" onClick={onGoHotline}>
            Hotline
          </button>
          <button
            type="button"
            className="ack-btn status-ack-btn"
            onClick={() => onAcknowledge(primary.id)}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </section>
  );
}
