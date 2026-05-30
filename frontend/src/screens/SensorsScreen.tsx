import { SensorCard } from "../components/SensorCard";
import type { Sensor, User } from "../types";

interface Props {
  sensors: Sensor[];
  user: User;
  onRename: (id: string, name: string) => Promise<void>;
}

export function SensorsScreen({ sensors, user, onRename }: Props) {
  const onlineCount = sensors.filter((s) => s.status !== "offline").length;
  const lowBatteryCount = sensors.filter((s) => s.status === "low_battery").length;
  const totalCount = sensors.length;

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

      <section className="sensor-summary-strip">
        <div>
          <strong>{onlineCount}</strong>
          <span>Online</span>
        </div>
        <div>
          <strong>{lowBatteryCount}</strong>
          <span>Low battery</span>
        </div>
        <div>
          <strong>{totalCount}</strong>
          <span>Total</span>
        </div>
      </section>

      <div className="sensor-list">
        {[...sensors]
          .sort((a, b) => a.battery - b.battery)
          .map((sensor) => (
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
