import type { Anomaly, User, WatchedResident } from "../types";
import { CriticalStatusCard } from "../components/CriticalStatusCard";
import { KinuCompanion } from "../components/KinuCompanion";

interface Props {
  anomalies: Anomaly[];
  user: User;
  privacyMode: boolean;
  watchedResidents: WatchedResident[];
  onAcknowledge: (id: string) => void;
  onGoHotline: () => void;
}

export function HomeScreen({
  anomalies,
  user,
  privacyMode,
  watchedResidents,
  onAcknowledge,
  onGoHotline,
}: Props) {
  const isCaregiver = user.role === "caregiver";
  const watching = watchedResidents[0];
  const critical = anomalies.filter(
    (a) => !a.acknowledged && a.severity === "critical",
  );
  const hasCritical = critical.length > 0;

  return (
    <div className="screen home-screen home-simple">
      <header className="home-top">
        <div className="kinu-logo small" aria-hidden="true">
          <span className="logo-bloom" />
          <span className="logo-core">K</span>
        </div>
        <p className="greeting-eyebrow">
          {isCaregiver ? `Watching ${watching?.name ?? "Father"}` : `Welcome, ${user.name.split(" ")[0]}`}
        </p>
      </header>

      <div className="home-center">
        {hasCritical ? (
          <CriticalStatusCard
            criticalAlerts={critical}
            onAcknowledge={onAcknowledge}
            onGoHotline={onGoHotline}
          />
        ) : (
          <div className="home-companion-wrap">
            <KinuCompanion />
            <p className="home-companion-greeting">All is well</p>
            <p className="home-companion-copy">Kinu is quietly watching over things.</p>
            {isCaregiver && privacyMode && (
              <p className="home-companion-meta">
                Sensors are visible. Daily activity logs stay private until critical.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
