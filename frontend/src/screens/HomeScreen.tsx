import type { Anomaly, DashboardSummary } from "../types";
import { formatRelativeTime, severityLabels } from "../utils";

interface Props {
  summary: DashboardSummary;
  anomalies: Anomaly[];
  onGoAlerts: () => void;
  onGoCare: () => void;
}

export function HomeScreen({ summary, anomalies, onGoAlerts, onGoCare }: Props) {
  const active = anomalies.filter((a) => !a.acknowledged);
  const preview = active.slice(0, 2);

  return (
    <div className="screen home-screen">
      <header className="screen-header hero-header">
        <div className="kinu-logo" aria-hidden="true">
          <span className="logo-bloom" />
          <span className="logo-core">K</span>
        </div>
        <p className="greeting-eyebrow">Good morning</p>
        <h1>Kinu</h1>
        <p className="hero-copy">
          A calm companion for gentle elder care monitoring.
        </p>
      </header>

      <section className="hero-card calm-card">
        <div className="hero-card-top">
          <span className="soft-chip">Today feels calm</span>
          <button type="button" className="text-link" onClick={onGoCare}>
            Open Care
          </button>
        </div>
        <p className="hero-metric">{summary.online_sensors} sensors watching softly</p>
        <div className="hero-stats-row">
          <div>
            <strong>{summary.active_anomalies}</strong>
            <span>Alerts</span>
          </div>
          <div>
            <strong>{summary.low_battery_sensors}</strong>
            <span>Low battery</span>
          </div>
          <div>
            <strong>{summary.critical_anomalies}</strong>
            <span>Critical</span>
          </div>
        </div>
      </section>

      <section className="screen-section">
        <div className="section-title-row">
          <h2>Needs attention</h2>
          {active.length > 0 && (
            <button type="button" className="text-link" onClick={onGoAlerts}>
              See all
            </button>
          )}
        </div>

        {preview.length === 0 ? (
          <article className="soft-card empty-soft-card">
            <span className="bloom-icon" aria-hidden="true">✿</span>
            <p>Everything feels peaceful right now.</p>
          </article>
        ) : (
          preview.map((anomaly) => (
            <article
              key={anomaly.id}
              className={`soft-card alert-preview severity-${anomaly.severity}`}
            >
              <div className="alert-preview-top">
                <span className={`severity-tag ${anomaly.severity}`}>
                  {severityLabels[anomaly.severity]}
                </span>
                <time>{formatRelativeTime(anomaly.occurred_at)}</time>
              </div>
              <h3>{anomaly.title}</h3>
              <p>{anomaly.message}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
