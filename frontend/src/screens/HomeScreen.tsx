import type { Anomaly, DashboardSummary, User, WatchedResident } from "../types";
import { formatRelativeTime, severityLabels } from "../utils";
import { PrivacyNotice } from "../components/PrivacyNotice";

interface Props {
  summary: DashboardSummary;
  anomalies: Anomaly[];
  user: User;
  watchedResidents: WatchedResident[];
  onGoAlerts: () => void;
  onGoCare: () => void;
}

export function HomeScreen({
  summary,
  anomalies,
  user,
  watchedResidents,
  onGoAlerts,
  onGoCare,
}: Props) {
  const active = anomalies.filter((a) => !a.acknowledged);
  const preview = active.slice(0, 2);
  const critical = active.filter((a) => a.severity === "critical");
  const watching = watchedResidents[0];
  const isCaregiver = user.role === "caregiver";
  const privacyMode = isCaregiver && summary.privacy_mode;

  return (
    <div className="screen home-screen">
      <header className="screen-header hero-header">
        <div className="kinu-logo" aria-hidden="true">
          <span className="logo-bloom" />
          <span className="logo-core">K</span>
        </div>
        <p className="greeting-eyebrow">
          {isCaregiver ? `Watching ${watching?.name ?? "loved one"}` : "Good morning"}
        </p>
        <h1>Kinu</h1>
        <p className="hero-copy">
          {isCaregiver
            ? privacyMode
              ? "Routine details stay private. Kinu will share more only if a critical alert needs you."
              : "A critical alert needs your attention. Location and emergency reach are now available."
            : "A calm companion for gentle elder care monitoring."}
        </p>
      </header>

      {isCaregiver && watching && (
        <section className="soft-card care-circle-card">
          <p className="care-circle-label">Care circle</p>
          <strong>{watching.name}</strong>
          <p>{watching.address}</p>
          {!privacyMode && (
            <p className="care-circle-emergency">
              Local emergency: {watching.emergency_number} ({watching.emergency_label})
            </p>
          )}
        </section>
      )}

      {isCaregiver && privacyMode && (
        <PrivacyNotice
          title="Quiet monitoring"
          message="Sensors, wellness, and daily alerts remain private. You will only see details if a critical issue appears."
        />
      )}

      {isCaregiver && critical.length > 0 && (
        <section className="emergency-banner">
          <strong>{critical.length} critical alert{critical.length > 1 ? "s" : ""}</strong>
          <p>
            Open Alerts to review what happened and call{" "}
            {watching?.emergency_number ?? "local emergency"} near {watching?.city ?? "home"}.
          </p>
          <button type="button" className="emergency-btn compact" onClick={onGoAlerts}>
            Review & call emergency
          </button>
        </section>
      )}

      {!isCaregiver && (
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
      )}

      {isCaregiver && summary.monitoring_active && privacyMode && (
        <section className="soft-card monitoring-card">
          <p className="care-circle-label">Status</p>
          <strong>Kinu is watching quietly</strong>
          <p>No critical issues right now. Privacy stays on until help is truly needed.</p>
        </section>
      )}

      {!isCaregiver && (
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
      )}

      {isCaregiver && !privacyMode && preview.length > 0 && (
        <section className="screen-section">
          <div className="section-title-row">
            <h2>Critical now</h2>
            <button type="button" className="text-link" onClick={onGoAlerts}>
              See all
            </button>
          </div>
          {preview.map((anomaly) => (
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
          ))}
        </section>
      )}
    </div>
  );
}
