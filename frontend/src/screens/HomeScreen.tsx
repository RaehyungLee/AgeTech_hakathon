import type { Anomaly, User, WatchedResident } from "../types";
import { AlertStatusCard, DEMO_HOME_ALERTS } from "../components/AlertStatusCard";
import { KinuCompanion } from "../components/KinuCompanion";
import type { HomeDemoStage } from "../homeDemo";

export type { HomeDemoStage };

interface Props {
  anomalies: Anomaly[];
  user: User;
  privacyMode: boolean;
  watchedResidents: WatchedResident[];
  demoStage: HomeDemoStage;
  onAdvanceDemoStage: () => void;
  onResetDemoStage: () => void;
  onAcknowledge: (id: string) => void;
  onGoHotline: () => void;
}

export function HomeScreen({
  anomalies,
  user,
  privacyMode,
  watchedResidents,
  demoStage,
  onAdvanceDemoStage,
  onResetDemoStage,
  onAcknowledge,
  onGoHotline,
}: Props) {
  const isCaregiver = user.role === "caregiver";
  const watching = watchedResidents[0];
  const critical = anomalies.filter(
    (a) => !a.acknowledged && a.severity === "critical",
  );
  const hasRealCritical = critical.length > 0;

  function handleAlertAcknowledge() {
    if (demoStage > 0) {
      onResetDemoStage();
      return;
    }
    if (critical[0]) {
      onAcknowledge(critical[0].id);
    }
  }

  let center;

  if (demoStage === 1) {
    const alert = DEMO_HOME_ALERTS.warning;
    center = (
      <AlertStatusCard
        level="warning"
        eyebrow={alert.eyebrow}
        title={alert.title}
        message={alert.message}
        onAcknowledge={handleAlertAcknowledge}
        onGoHotline={onGoHotline}
      />
    );
  } else if (demoStage === 2 || (demoStage === 0 && hasRealCritical)) {
    const alert =
      demoStage === 2
        ? DEMO_HOME_ALERTS.critical
        : {
            eyebrow: "Important alert",
            title: critical[0].title,
            message: critical[0].message,
          };
    center = (
      <AlertStatusCard
        level="critical"
        eyebrow={alert.eyebrow}
        title={alert.title}
        message={alert.message}
        onAcknowledge={handleAlertAcknowledge}
        onGoHotline={onGoHotline}
      />
    );
  } else {
    center = (
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
    );
  }

  return (
    <div className="screen home-screen home-simple">
      <header className="home-top">
        <button
          type="button"
          className="home-logo-trigger"
          onClick={onAdvanceDemoStage}
          aria-label="Kinu"
        >
          <div className="kinu-logo small" aria-hidden="true">
            <span className="logo-bloom" />
            <span className="logo-core">K</span>
          </div>
        </button>
        <p className="greeting-eyebrow">
          {isCaregiver ? `Watching ${watching?.name ?? "Father"}` : `Welcome, ${user.name.split(" ")[0]}`}
        </p>
      </header>

      <div className="home-center">{center}</div>
    </div>
  );
}
