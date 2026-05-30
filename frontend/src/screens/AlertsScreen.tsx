import { AnomalyFeed } from "../components/AnomalyFeed";
import type { Anomaly } from "../types";

interface Props {
  anomalies: Anomaly[];
  onAcknowledge: (id: string) => Promise<void>;
}

export function AlertsScreen({ anomalies, onAcknowledge }: Props) {
  return (
    <div className="screen alerts-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Gentle watch</p>
        <h1>Alerts</h1>
        <p className="hero-copy">Anomalies that may need a soft, timely response.</p>
      </header>

      <AnomalyFeed anomalies={anomalies} onAcknowledge={onAcknowledge} mobile />
    </div>
  );
}
