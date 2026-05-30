import { SensorCard } from "../components/SensorCard";
import { PrivacyNotice } from "../components/PrivacyNotice";
import type { Sensor, User } from "../types";

interface Props {
  sensors: Sensor[];
  user: User;
  privacyMode: boolean;
  onRename: (id: string, name: string) => Promise<void>;
}

export function SensorsScreen({ sensors, user, privacyMode, onRename }: Props) {
  const isPrivate = user.role === "caregiver" || privacyMode;

  return (
    <div className="screen sensors-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Your network</p>
        <h1>Sensors</h1>
        <p className="hero-copy">
          {user.role === "caregiver"
            ? "Sensor locations and activity stay private unless a critical alert opens sharing."
            : "Name each sensor the way your family remembers home."}
        </p>
      </header>

      {isPrivate ? (
        <PrivacyNotice
          title="Sensor details are private"
          message={
            user.role === "caregiver"
              ? "Only the resident can view sensor names, rooms, and battery levels day to day."
              : "Your sensor network is visible only on your account."
          }
        />
      ) : (
        <div className="sensor-list">
          {sensors.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} onRename={onRename} compact />
          ))}
        </div>
      )}
    </div>
  );
}
