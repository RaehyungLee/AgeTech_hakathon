import type { Anomaly } from "../types";

interface Props {
  criticalAlerts: Anomaly[];
  privacyMode: boolean;
  isCaregiver: boolean;
  onViewDetails: () => void;
}

export function CriticalStatusCard({
  criticalAlerts,
  privacyMode,
  isCaregiver,
  onViewDetails,
}: Props) {
  if (criticalAlerts.length > 0) {
    const primary = criticalAlerts[0];
    return (
      <section className="status-card status-critical status-center">
        <span className="status-icon" aria-hidden="true">!</span>
        <div className="status-body">
          <p className="status-eyebrow">Important</p>
          <h2>{primary.title}</h2>
          <p>{primary.message}</p>
          {criticalAlerts.length > 1 && (
            <p className="status-meta">+{criticalAlerts.length - 1} more critical alert(s)</p>
          )}
          <button type="button" className="status-action" onClick={onViewDetails}>
            View details
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="status-card status-calm status-center">
      <span className="status-icon calm" aria-hidden="true">✓</span>
      <div className="status-body">
        <p className="status-eyebrow">Status</p>
        <h2>All is well</h2>
        <p>No critical concerns right now. Kinu is quietly watching.</p>
        {isCaregiver && privacyMode && (
          <p className="status-meta">
            Sensors are visible. Daily activity logs stay private until critical.
          </p>
        )}
      </div>
    </section>
  );
}
