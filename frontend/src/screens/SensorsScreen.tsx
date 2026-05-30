import { SensorCard } from "../components/SensorCard";
import type { Sensor } from "../types";

interface Props {
  sensors: Sensor[];
  onRename: (id: string, name: string) => Promise<void>;
}

export function SensorsScreen({ sensors, onRename }: Props) {
  return (
    <div className="screen sensors-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Your network</p>
        <h1>Sensors</h1>
        <p className="hero-copy">Name each sensor the way your family remembers home.</p>
      </header>

      <div className="sensor-list">
        {sensors.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} onRename={onRename} compact />
        ))}
      </div>
    </div>
  );
}
