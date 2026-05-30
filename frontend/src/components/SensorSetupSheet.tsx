import { useState } from "react";
import type { Anomaly, Sensor, User } from "../types";
import { batteryLevel, formatRelativeTime, sensorTypeLabels } from "../utils";
import { SensorArt } from "./sensors/SensorArt";

interface Props {
  sensor: Sensor | null;
  anomalies: Anomaly[];
  user: User;
  onClose: () => void;
  onRename: (id: string, name: string) => Promise<void>;
}

export function SensorSetupSheet({ sensor, anomalies, user, onClose, onRename }: Props) {
  const [draftName, setDraftName] = useState(sensor?.name ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!sensor) return null;

  const linked = anomalies.filter((a) => a.sensor_id === sensor.id).slice(0, 3);
  const level = batteryLevel(sensor.battery);
  const showActivity = user.role === "resident";

  async function saveName() {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === sensor!.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(sensor!.id, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sensor-setup-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="sensor-sheet-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="sheet-header">
          <SensorArt type={sensor.type} />
          <div>
            <p className="greeting-eyebrow">{sensorTypeLabels[sensor.type]}</p>
            <h2 id="sensor-sheet-title">{sensor.name}</h2>
            <p className="hero-copy">{sensor.location}</p>
          </div>
        </div>

        <div className="sheet-stats">
          <div>
            <span className="detail-label">Status</span>
            <span className={`status-pill ${sensor.status}`}>
              {sensor.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="detail-label">Last seen</span>
            <span className="detail-value">{formatRelativeTime(sensor.last_seen)}</span>
          </div>
        </div>

        <div className="battery-block">
          <div className="battery-header">
            <span className="detail-label">Battery</span>
            <span className={`battery-percent level-${level}`}>{sensor.battery}%</span>
          </div>
          <div className="battery-track">
            <div className={`battery-fill level-${level}`} style={{ width: `${sensor.battery}%` }} />
          </div>
        </div>

        {user.role === "resident" && (
          <div className="sheet-rename">
            {editing ? (
              <form
                className="rename-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveName();
                }}
              >
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  maxLength={64}
                  aria-label="Sensor name"
                />
                <button type="submit" disabled={saving}>Save</button>
                <button type="button" className="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </form>
            ) : (
              <button type="button" className="text-link" onClick={() => setEditing(true)}>
                Rename sensor
              </button>
            )}
          </div>
        )}

        {showActivity ? (
          <section className="sheet-linked">
            <h3>Recent activity</h3>
            {linked.length === 0 ? (
              <p className="sheet-empty">No recent alerts for this sensor.</p>
            ) : (
              linked.map((anomaly) => (
                <article key={anomaly.id} className="sheet-alert-row">
                  <strong>{anomaly.title}</strong>
                  <span>{formatRelativeTime(anomaly.occurred_at)}</span>
                </article>
              ))
            )}
          </section>
        ) : (
          <p className="sheet-empty sheet-privacy-note">
            Detection logs for this sensor stay private unless a critical alert is shared.
          </p>
        )}
      </div>
    </div>
  );
}
