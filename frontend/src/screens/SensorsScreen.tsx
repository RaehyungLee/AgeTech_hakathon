import { SensorCard } from "../components/SensorCard";
import type { DashboardSummary, Sensor, User } from "../types";

interface Props {
  sensors: Sensor[];
  summary: DashboardSummary | null;
  user: User;
  onRename: (id: string, name: string) => Promise<void>;
}

export function SensorsScreen({ sensors, summary, user, onRename }: Props) {
  return (
    <div className="screen sensors-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Health check</p>
        <h1>Sensor Check</h1>
        <p className="hero-copy">
          {user.role === "caregiver"
            ? "See sensor status and battery. Activity logs stay private unless critical."
            : "Review battery, status, and naming for each sensor."}
        </p>
      </header>

      {summary && (
        <section className="sensor-summary-strip">
          <div>
            <strong>{summary.online_sensors}</strong>
            <span>Online</span>
          </div>
          <div>
            <strong>{summary.low_battery_sensors}</strong>
            <span>Low battery</span>
          </div>
          <div>
            <strong>{summary.total_sensors}</strong>
            <span>Total</span>
          </div>
        </section>
      )}

      <div className="sensor-list">
        {sensors.map((sensor) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            onRename={onRename}
            compact
            canRename={user.role === "resident"}
          />
        ))}
      </div>
    </div>
  );
}
