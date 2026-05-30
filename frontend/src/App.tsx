import { useCallback, useEffect, useState } from "react";
import { api, setAuthToken } from "./api";
import { BottomNav } from "./components/BottomNav";
import { MobileShell } from "./components/MobileShell";
import { AlertsScreen } from "./screens/AlertsScreen";
import { CareScreen } from "./screens/CareScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SensorsScreen } from "./screens/SensorsScreen";
import type {
  Anomaly,
  CareInsight,
  DashboardSummary,
  Sensor,
  TabId,
  User,
  WatchedResident,
} from "./types";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [watchedResidents, setWatchedResidents] = useState<WatchedResident[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("home");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [care, setCare] = useState<CareInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const [me, summaryData, sensorData, anomalyData, careData] = await Promise.all([
        api.getMe(),
        api.getSummary(),
        api.getSensors(),
        api.getAnomalies(),
        api.getCare(),
      ]);
      setUser(me.user);
      setWatchedResidents(me.watched_residents);
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
  }, [user]);

  useEffect(() => {
    async function restoreSession() {
      try {
        const me = await api.getMe();
        setUser(me.user);
        setWatchedResidents(me.watched_residents);
      } catch {
        setAuthToken(null);
      } finally {
        setAuthLoading(false);
      }
    }
    void restoreSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadDashboard();
    const interval = window.setInterval(() => void loadDashboard(), 30000);
    return () => window.clearInterval(interval);
  }, [loadDashboard, user]);

  async function handleLogin(_nextUser: User) {
    const me = await api.getMe();
    setUser(me.user);
    setWatchedResidents(me.watched_residents);
    setLoading(true);
  }

  function handleSignOut() {
    setAuthToken(null);
    setUser(null);
    setWatchedResidents([]);
    setSummary(null);
    setSensors([]);
    setAnomalies([]);
    setCare(null);
    setLoading(true);
    setError(null);
    setTab("home");
  }

  async function handleRename(id: string, name: string) {
    const updated = await api.renameSensor(id, name);
    setSensors((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setAnomalies((prev) =>
      prev.map((a) => (a.sensor_id === id ? { ...a, sensor_name: updated.name } : a)),
    );
  }

  async function handleAcknowledge(id: string) {
    await api.acknowledgeAnomaly(id);
    await loadDashboard();
  }

  if (authLoading) {
    return (
      <MobileShell live={false}>
        <div className="loading-banner standalone">Waking Kinu gently…</div>
      </MobileShell>
    );
  }

  if (!user) {
    return (
      <MobileShell live={false}>
        <div className="screen-stack login-stack">
          <LoginScreen onLogin={(nextUser) => void handleLogin(nextUser)} />
        </div>
      </MobileShell>
    );
  }

  const activeAlerts =
    user.role === "caregiver"
      ? anomalies.filter((a) => !a.acknowledged && a.severity === "critical").length
      : anomalies.filter((a) => !a.acknowledged).length;
  const privacyMode = summary?.privacy_mode ?? false;

  return (
    <MobileShell live={!error} user={user} onSignOut={handleSignOut}>
      <div className="app-body">
        {loading && <div className="loading-banner">Waking Kinu gently…</div>}
        {error && <div className="error-banner">{error}</div>}

        <div className="screen-stack">
          {tab === "home" && summary && (
            <HomeScreen
              summary={summary}
              anomalies={anomalies}
              user={user}
              watchedResidents={watchedResidents}
              onGoAlerts={() => setTab("alerts")}
              onGoCare={() => setTab("care")}
            />
          )}
          {tab === "sensors" && (
            <SensorsScreen
              sensors={sensors}
              user={user}
              privacyMode={privacyMode}
              onRename={handleRename}
            />
          )}
          {tab === "alerts" && (
            <AlertsScreen
              anomalies={anomalies}
              user={user}
              privacyMode={privacyMode}
              onAcknowledge={handleAcknowledge}
            />
          )}
          {tab === "care" && care && <CareScreen care={care} user={user} />}
        </div>
      </div>

      <BottomNav active={tab} alertCount={activeAlerts} onChange={setTab} />
    </MobileShell>
  );
}

export default App;
