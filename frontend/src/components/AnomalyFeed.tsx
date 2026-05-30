import type { Anomaly } from "../types";
import { formatRelativeTime, formatTimestamp, severityLabels } from "../utils";

interface Props {
  anomalies: Anomaly[];
  onAcknowledge: (id: string) => Promise<void>;
  mobile?: boolean;
}

export function AnomalyFeed({ anomalies, onAcknowledge, mobile = false }: Props) {
  const active = anomalies.filter((a) => !a.acknowledged);
  const resolved = anomalies.filter((a) => a.acknowledged);

  return (
    <section className={`anomaly-panel${mobile ? " mobile" : ""}`}>
      {!mobile && (
        <header className="panel-header">
          <div>
            <h2>Anomaly alerts</h2>
            <p>Events from sensors that may need caregiver attention</p>
          </div>
          <span className="panel-badge">{active.length} active</span>
        </header>
      )}

      <div className="anomaly-list">
        {active.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">✓</span>
            <p>No active anomalies right now</p>
          </div>
        ) : (
          active.map((anomaly) => (
            <AnomalyCard
              key={anomaly.id}
              anomaly={anomaly}
              onAcknowledge={onAcknowledge}
            />
          ))
        )}
      </div>

      {resolved.length > 0 && (
        <>
          <h3 className="resolved-heading">Recently acknowledged</h3>
          <div className="anomaly-list resolved">
            {resolved.slice(0, 3).map((anomaly) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} resolved />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AnomalyCard({
  anomaly,
  onAcknowledge,
  resolved = false,
}: {
  anomaly: Anomaly;
  onAcknowledge?: (id: string) => Promise<void>;
  resolved?: boolean;
}) {
  return (
    <article className={`anomaly-card severity-${anomaly.severity}${resolved ? " resolved" : ""}`}>
      <div className="anomaly-card-header">
        <span className={`severity-tag ${anomaly.severity}`}>
          {severityLabels[anomaly.severity]}
        </span>
        <time dateTime={anomaly.occurred_at} title={formatTimestamp(anomaly.occurred_at)}>
          {formatRelativeTime(anomaly.occurred_at)}
        </time>
      </div>

      <h3>{anomaly.title}</h3>
      <p className="anomaly-message">{anomaly.message}</p>

      <footer className="anomaly-footer">
        <span className="sensor-ref">{anomaly.sensor_name}</span>
        {!resolved && onAcknowledge && (
          <button type="button" className="ack-btn" onClick={() => void onAcknowledge(anomaly.id)}>
            Acknowledge
          </button>
        )}
      </footer>
    </article>
  );
}
