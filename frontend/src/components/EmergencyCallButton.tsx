import { useState } from "react";
import { api } from "../api";
import type { EmergencyInfo } from "../types";

interface Props {
  anomalyId: string;
}

export function EmergencyCallButton({ anomalyId }: Props) {
  const [info, setInfo] = useState<EmergencyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prepareCall() {
    setLoading(true);
    setError(null);
    try {
      const emergency = await api.getEmergencyInfo(anomalyId);
      setInfo(emergency);
    } catch {
      setError("Could not load local emergency details.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCallLinkClick() {
    await api.logEmergencyCall(anomalyId);
  }

  if (!info) {
    return (
      <div className="emergency-actions">
        <button
          type="button"
          className="emergency-btn"
          onClick={() => void prepareCall()}
          disabled={loading}
        >
          {loading ? "Finding local emergency…" : "Call local emergency"}
        </button>
        {error && <p className="emergency-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="emergency-panel">
      <p className="emergency-panel-title">Local emergency for {info.resident_name}</p>
      <p className="emergency-panel-copy">
        {info.emergency_label} · {info.address}, {info.city}, {info.region}
      </p>
      <div className="emergency-panel-actions">
        <a className="emergency-call-link" href={info.tel_uri} onClick={() => void handleCallLinkClick()}>
          Call {info.emergency_number}
        </a>
        <button type="button" className="ghost-btn" onClick={() => setInfo(null)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
