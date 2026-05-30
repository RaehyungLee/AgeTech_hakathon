export type HomeAlertLevel = "warning" | "critical";

export const DEMO_HOME_ALERTS: Record<
  HomeAlertLevel,
  { eyebrow: string; title: string; message: string }
> = {
  warning: {
    eyebrow: "Watch closely",
    title: "Extended restroom visit",
    message: "Visit lasted longer than your usual baseline. Kinu is watching closely.",
  },
  critical: {
    eyebrow: "Important alert",
    title: "Possible fall — prolonged restroom visit",
    message: "Restroom visit exceeded 35 minutes with no movement detected.",
  },
};

interface Props {
  level: HomeAlertLevel;
  title: string;
  message: string;
  eyebrow: string;
  onAcknowledge: () => void;
  onGoHotline: () => void;
}

export function AlertStatusCard({
  level,
  title,
  message,
  eyebrow,
  onAcknowledge,
  onGoHotline,
}: Props) {
  const isCritical = level === "critical";

  return (
    <section
      className={`status-card status-center ${isCritical ? "status-critical" : "status-warning"}`}
    >
      <span className={`status-icon${isCritical ? "" : " warning"}`} aria-hidden="true">
        {isCritical ? "!" : "?"}
      </span>
      <div className="status-body">
        <p className="status-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="status-alert-actions">
          <button type="button" className="hotline-btn" onClick={onGoHotline}>
            Hotline
          </button>
          <button type="button" className="ack-btn status-ack-btn" onClick={onAcknowledge}>
            Acknowledge
          </button>
        </div>
      </div>
    </section>
  );
}
