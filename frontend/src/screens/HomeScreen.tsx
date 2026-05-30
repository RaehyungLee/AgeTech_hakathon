import type { Anomaly, User, WatchedResident } from "../types";
import { CriticalStatusCard } from "../components/CriticalStatusCard";

interface Props {
  anomalies: Anomaly[];
  user: User;
  privacyMode: boolean;
  watchedResidents: WatchedResident[];
  onGoAnomalies: () => void;
}

export function HomeScreen({
  anomalies,
  user,
  privacyMode,
  watchedResidents,
  onGoAnomalies,
}: Props) {
  const isCaregiver = user.role === "caregiver";
  const watching = watchedResidents[0];
  const critical = anomalies.filter(
    (a) => !a.acknowledged && a.severity === "critical",
  );

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
        <CriticalStatusCard
          criticalAlerts={critical}
          privacyMode={privacyMode}
          isCaregiver={isCaregiver}
          onViewDetails={onGoAnomalies}
        />
      </div>
    </div>
  );
}
