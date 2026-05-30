import { AnomalyFeed } from "../components/AnomalyFeed";
import { PrivacyNotice } from "../components/PrivacyNotice";
import type { Anomaly, User } from "../types";

interface Props {
  anomalies: Anomaly[];
  user: User;
  privacyMode: boolean;
  onAcknowledge: (id: string) => Promise<void>;
}

export function AlertsScreen({ anomalies, user, privacyMode, onAcknowledge }: Props) {
  const canCallEmergency = user.role === "caregiver";
  const activeCritical = anomalies.filter(
    (a) => !a.acknowledged && a.severity === "critical",
  );

  return (
    <div className="screen alerts-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Gentle watch</p>
        <h1>Alerts</h1>
        <p className="hero-copy">
          {canCallEmergency
            ? privacyMode
              ? "Warning and info alerts stay private. Only critical danger is shared with your care circle."
              : "Critical details and local emergency reach are available while this alert is active."
            : "Anomalies that may need a soft, timely response."}
        </p>
      </header>

      {canCallEmergency && privacyMode && (
        <PrivacyNotice
          compact
          title="No critical alerts"
          message="Daily alerts remain private. Kinu will open sharing only for critical issues."
        />
      )}

      <AnomalyFeed
        anomalies={anomalies}
        onAcknowledge={onAcknowledge}
        canCallEmergency={canCallEmergency && activeCritical.length > 0}
        mobile
        emptyMessage={
          canCallEmergency
            ? "No critical alerts right now. Everything else stays private."
            : "No active anomalies right now"
        }
      />
    </div>
  );
}
