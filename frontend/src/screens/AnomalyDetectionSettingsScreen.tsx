import { useEffect, useState } from "react";
import type { Sensor, Detection } from "../types";
import {
  DETECTION_LEARNED,
  DETECTION_PRESETS,
  formatDuration,
  isDetectionKey,
} from "../detectionDefaults";

interface Props {
  detectionId: "sink" | "bath" | "bed" | string;
  sensors: Sensor[];
  onBack: () => void;
  onSave: (d: Detection) => void;
}

function findSensorId(sensors: Sensor[], name: string) {
  return sensors.find((sensor) => sensor.name.toLowerCase() === name.toLowerCase())?.id ?? "";
}

function applySeconds(
  first: number,
  second: number,
  setters: {
    setH: (v: number) => void;
    setM: (v: number) => void;
    setS: (v: number) => void;
    setM2: (v: number) => void;
    setS2: (v: number) => void;
  },
) {
  setters.setH(Math.floor(first / 3600));
  setters.setM(Math.floor((first % 3600) / 60));
  setters.setS(first % 60);
  setters.setM2(Math.floor(second / 60));
  setters.setS2(second % 60);
}

export function AnomalyDetectionSettingsScreen({ detectionId, sensors, onBack, onSave }: Props) {
  const preset = isDetectionKey(detectionId) ? DETECTION_PRESETS[detectionId] : null;
  const def = preset ?? {
    name: detectionId,
    emoji: "🔔",
    triggerOnName: "",
    triggerOffName: "",
    firstDurationSeconds: 10 * 60,
    secondDurationSeconds: 10 * 60,
    learnSourceLabel: "recent activity",
  };

  const [emoji, setEmoji] = useState(def.emoji);
  const [name, setName] = useState(def.name);
  const [triggerOn, setTriggerOn] = useState<string | "">("");
  const [triggerOff, setTriggerOff] = useState<string | "">("");
  const [h, setH] = useState(Math.floor(def.firstDurationSeconds / 3600));
  const [m, setM] = useState(Math.floor((def.firstDurationSeconds % 3600) / 60));
  const [s, setS] = useState(def.firstDurationSeconds % 60);
  const [m2, setM2] = useState(Math.floor(def.secondDurationSeconds / 60));
  const [s2, setS2] = useState(def.secondDurationSeconds % 60);
  const [learning, setLearning] = useState(false);
  const [learned, setLearned] = useState(false);
  const [learningNote, setLearningNote] = useState<string | null>(null);

  useEffect(() => {
    if (!preset) return;

    setEmoji(preset.emoji);
    setName(preset.name);
    setLearned(false);
    setLearningNote(null);
    applySeconds(preset.firstDurationSeconds, preset.secondDurationSeconds, {
      setH,
      setM,
      setS,
      setM2,
      setS2,
    });
    setTriggerOn(findSensorId(sensors, preset.triggerOnName));
    setTriggerOff(findSensorId(sensors, preset.triggerOffName));
  }, [detectionId, preset, sensors]);

  function chooseEmoji() {
    const val = window.prompt("Enter emoji (single character)", emoji) || emoji;
    setEmoji(val.slice(0, 2));
  }

  function handleLearnFromActivity() {
    if (!isDetectionKey(detectionId)) return;

    setLearning(true);
    setLearningNote(null);
    window.setTimeout(() => {
      const values = DETECTION_LEARNED[detectionId];
      applySeconds(values.firstDurationSeconds, values.secondDurationSeconds, {
        setH,
        setM,
        setS,
        setM2,
        setS2,
      });
      setLearning(false);
      setLearned(true);
      setLearningNote(
        `Updated from ${DETECTION_PRESETS[detectionId].learnSourceLabel}. ` +
          `1st: ${formatDuration(values.firstDurationSeconds)}, ` +
          `2nd: ${formatDuration(values.secondDurationSeconds)}.`,
      );
    }, 1200);
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
        <h1>Detection Setting</h1>
        <p className="hero-copy">
          Defaults are tuned from 1,001 restroom visits. Use learning to refine the personal baseline
          (demo).
        </p>
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

        {preset && (
          <p className="detection-preset-note">
            Dataset defaults — warning: {formatDuration(preset.firstDurationSeconds)}, critical:{" "}
            {formatDuration(preset.secondDurationSeconds)}.
          </p>
        )}

        <button
          type="button"
          className={`learn-activity-btn${learned ? " learned" : ""}`}
          onClick={handleLearnFromActivity}
          disabled={learning || !isDetectionKey(detectionId)}
        >
          {learning ? "Learning from daily activity…" : "Learning from daily activity"}
        </button>

        {learningNote && <p className="learning-note">{learningNote}</p>}

        <hr className="settings-divider" />

        <label className="detail-label">Trigger ON: select sensor</label>
        <select className="settings-select" value={triggerOn} onChange={(e) => setTriggerOn(e.target.value)}>
          <option value="">-- choose sensor --</option>
          {sensors.map((sensor) => (
            <option key={sensor.id} value={sensor.id}>
              {sensor.name}
            </option>
          ))}
        </select>

        <label className="detail-label">Trigger OFF: select sensor</label>
        <select className="settings-select" value={triggerOff} onChange={(e) => setTriggerOff(e.target.value)}>
          <option value="">-- choose sensor --</option>
          {sensors.map((sensor) => (
            <option key={sensor.id} value={sensor.id}>
              {sensor.name}
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
