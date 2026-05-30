import { useState } from "react";
import type { Sensor, Detection } from "../types";

interface Props {
  detectionId: "sink" | "bath" | "bed" | string;
  sensors: Sensor[];
  onBack: () => void;
  onSave: (d: Detection) => void;
}

const defaults: Record<string, { name: string; emoji: string }> = {
  sink: { name: "Sink", emoji: "💧" },
  bath: { name: "Bath", emoji: "🚿" },
  bed: { name: "Bed", emoji: "🛏️" },
};

export function AnomalyDetectionSettingsScreen({ detectionId, sensors, onBack, onSave }: Props) {
  const def = defaults[detectionId] ?? { name: detectionId, emoji: "🔔" };

  const [emoji, setEmoji] = useState(def.emoji);
  const [name, setName] = useState(def.name);
  const [triggerOn, setTriggerOn] = useState<string | "">("");
  const [triggerOff, setTriggerOff] = useState<string | "">("");
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [s, setS] = useState(30);
  const [m2, setM2] = useState(0);
  const [s2, setS2] = useState(30);

  function chooseEmoji() {
    const val = window.prompt("Enter emoji (single character)", emoji) || emoji;
    setEmoji(val.slice(0, 2));
  }

  function handleSave() {
    const first = h * 3600 + m * 60 + s;
    const second = m2 * 60 + s2;
    const detection: Detection = {
      id: String(Date.now()),
      key: detectionId,
      name,
      emoji,
      trigger_on_sensor_id: triggerOn || null,
      trigger_off_sensor_id: triggerOff || null,
      first_duration_seconds: Math.max(1, first),
      second_duration_seconds: Math.max(1, second),
    };
    onSave(detection);
  }

  return (
    <div className="screen anomalies-settings-screen">
      <button className="text-link back-link" type="button" onClick={onBack}>
        ← Back
      </button>

      <header className="screen-header">
        <p className="greeting-eyebrow">{name} Detection</p>
        <h1>{name} Settings</h1>
        <p className="hero-copy">Configure the detection behavior and triggers.</p>
      </header>

      <div className="soft-card settings-form">
        <div className="settings-top">
          <button type="button" className="detection-card-icon emoji-picker" onClick={chooseEmoji} aria-label="Choose icon">
            {emoji}
          </button>
          <div className="settings-title">
            <label className="settings-name">
              <input className="settings-input" value={name} onChange={(e) => setName(e.target.value)} />
              <button type="button" className="text-link rename-icon" onClick={() => { const n = window.prompt("Rename detection", name); if (n) setName(n); }}>
                ✎
              </button>
            </label>
          </div>
        </div>

        <hr className="settings-divider" />

        <label className="detail-label">Trigger ON: select sensor</label>
        <select className="settings-select" value={triggerOn} onChange={(e) => setTriggerOn(e.target.value)}>
          <option value="">-- choose sensor --</option>
          {sensors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <label className="detail-label">Trigger OFF: select sensor</label>
        <select className="settings-select" value={triggerOff} onChange={(e) => setTriggerOff(e.target.value)}>
          <option value="">-- choose sensor --</option>
          {sensors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <hr className="settings-divider" />

        <div className="settings-row">
          <div className="settings-col">
            <p className="detail-label">1st trigger duration</p>
            <div className="duration-inputs">
              <label className="duration-field"><input className="settings-input small" type="number" min={0} value={h} onChange={(e) => setH(Number(e.target.value))} /> <span>H</span></label>
              <label className="duration-field"><input className="settings-input small" type="number" min={0} value={m} onChange={(e) => setM(Number(e.target.value))} /> <span>M</span></label>
              <label className="duration-field"><input className="settings-input small" type="number" min={0} value={s} onChange={(e) => setS(Number(e.target.value))} /> <span>S</span></label>
            </div>
          </div>

          <div className="settings-col">
            <p className="detail-label">2nd trigger after 1st</p>
            <div className="duration-inputs">
              <label className="duration-field"><input className="settings-input small" type="number" min={0} value={m2} onChange={(e) => setM2(Number(e.target.value))} /> <span>M</span></label>
              <label className="duration-field"><input className="settings-input small" type="number" min={0} value={s2} onChange={(e) => setS2(Number(e.target.value))} /> <span>S</span></label>
              <span className="muted">(default 30s)</span>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="add-detection-btn" onClick={handleSave}>
            Save
          </button>
          <button type="button" className="rename-btn" onClick={onBack}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
