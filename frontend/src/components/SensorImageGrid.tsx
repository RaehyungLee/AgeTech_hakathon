import type { Sensor } from "../types";
import { SensorArt } from "./sensors/SensorArt";

interface Props {
  sensors: Sensor[];
  onSelect: (sensor: Sensor) => void;
  compact?: boolean;
}

export function SensorImageGrid({ sensors, onSelect, compact = false }: Props) {
  return (
    <section className={`sensor-grid-section${compact ? " compact" : ""}`}>
      <h2 className="section-label">Sensors</h2>
      {!compact && (
        <p className="section-hint">Tap a sensor to view setup and status.</p>
      )}
      <div className="sensor-image-grid">
        {sensors.map((sensor) => (
          <button
            key={sensor.id}
            type="button"
            className={`sensor-image-card status-${sensor.status}`}
            onClick={() => onSelect(sensor)}
          >
            <SensorArt type={sensor.type} />
            <span className={`sensor-dot ${sensor.status}`} aria-hidden="true" />
            <strong>{sensor.name}</strong>
            <span>{sensor.location}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
