import { useState } from "react";
import type { Sensor } from "../types";
import {
  batteryLevel,
  formatRelativeTime,
  sensorIcon,
  sensorTypeLabels,
} from "../utils";

interface Props {
  sensor: Sensor;
  onRename: (id: string, name: string) => Promise<void>;
  compact?: boolean;
}

export function SensorCard({ sensor, onRename, compact = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(sensor.name);
  const [saving, setSaving] = useState(false);

  const level = batteryLevel(sensor.battery);

  async function saveName() {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === sensor.name) {
      setDraftName(sensor.name);
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onRename(sensor.id, trimmed);
      setEditing(false);
    } catch {
      setDraftName(sensor.name);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`sensor-card status-${sensor.status}${compact ? " compact" : ""}`}>
      <div className="sensor-card-top">
        <div className="sensor-icon" aria-hidden="true">
          {sensorIcon(sensor.type)}
        </div>
        <div className="sensor-meta">
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
                autoFocus
                maxLength={64}
                aria-label="Sensor name"
              />
              <button type="submit" disabled={saving}>
                Save
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setDraftName(sensor.name);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="sensor-title-row">
              <h3>{sensor.name}</h3>
              <button
                type="button"
                className="rename-btn"
                onClick={() => setEditing(true)}
                aria-label={`Rename ${sensor.name}`}
              >
                Rename
              </button>
            </div>
          )}
          <p className="sensor-type">{sensorTypeLabels[sensor.type]}</p>
        </div>
        <span className={`status-pill ${sensor.status}`}>
          {sensor.status.replace("_", " ")}
        </span>
      </div>

      <div className="sensor-details">
        <div>
          <span className="detail-label">Location</span>
          <span className="detail-value">{sensor.location}</span>
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
        <div className="battery-track" role="progressbar" aria-valuenow={sensor.battery} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`battery-fill level-${level}`}
            style={{ width: `${sensor.battery}%` }}
          />
        </div>
      </div>
    </article>
  );
}
