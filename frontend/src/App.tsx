import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { BottomNav } from "./components/BottomNav";
import { MobileShell } from "./components/MobileShell";
import { AlertsScreen } from "./screens/AlertsScreen";
import { CareScreen } from "./screens/CareScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { SensorsScreen } from "./screens/SensorsScreen";
import type { Anomaly, CareInsight, DashboardSummary, Sensor, TabId } from "./types";
import "./App.css";

function App() {
  const [tab, setTab] = useState<TabId>("home");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [care, setCare] = useState<CareInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [summaryData, sensorData, anomalyData, careData] = await Promise.all([
        api.getSummary(),
        api.getSensors(),
        api.getAnomalies(),
        api.getCare(),
      ]);
      setSummary(summaryData);
      setSensors(sensorData);
      setAnomalies(anomalyData);
      setCare(careData);
      setError(null);
    } catch {
      setError("Kinu cannot reach the sensor service right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const interval = window.setInterval(() => void loadDashboard(), 30000);
    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  async function handleRename(id: string, name: string) {
    const updated = await api.renameSensor(id, name);
    setSensors((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setAnomalies((prev) =>
      prev.map((a) => (a.sensor_id === id ? { ...a, sensor_name: updated.name } : a)),
    );
  }

  async function handleAcknowledge(id: string) {
    const updated = await api.acknowledgeAnomaly(id);
    setAnomalies((prev) => prev.map((a) => (a.id === id ? updated : a)));
    const summaryData = await api.getSummary();
    setSummary(summaryData);
  }

  const activeAlerts = anomalies.filter((a) => !a.acknowledged).length;

  return (
    <MobileShell live={!error}>
      <div className="app-body">
        {loading && <div className="loading-banner">Waking Kinu gently…</div>}
        {error && <div className="error-banner">{error}</div>}

        <div className="screen-stack">
          {tab === "home" && summary && (
            <HomeScreen
              summary={summary}
              anomalies={anomalies}
              onGoAlerts={() => setTab("alerts")}
              onGoCare={() => setTab("care")}
            />
          )}
          {tab === "sensors" && (
            <SensorsScreen sensors={sensors} onRename={handleRename} />
          )}
          {tab === "alerts" && (
            <AlertsScreen anomalies={anomalies} onAcknowledge={handleAcknowledge} />
          )}
          {tab === "care" && care && <CareScreen care={care} />}
        </div>
      </div>

      <BottomNav active={tab} alertCount={activeAlerts} onChange={setTab} />
    </MobileShell>
  );
}

export default App;
