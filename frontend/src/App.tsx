import { useCallback, useEffect, useState } from "react";
import { api, setAuthToken } from "./api";
import { BottomNav } from "./components/BottomNav";
import { MobileShell } from "./components/MobileShell";
import { AnomaliesScreen } from "./screens/AnomaliesScreen";
import { EmergencyScreen } from "./screens/EmergencyScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SensorsScreen } from "./screens/SensorsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SignupScreen } from "./screens/SignupScreen";
import type {
  Anomaly,
  AuthView,
  DashboardSummary,
  Sensor,
  TabId,
  User,
  WatchedResident,
} from "./types";
import "./App.css";

function App() {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [user, setUser] = useState<User | null>(null);
  const [watchedResidents, setWatchedResidents] = useState<WatchedResident[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("home");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const [me, summaryData, sensorData, anomalyData] = await Promise.all([
        api.getMe(),
        api.getSummary(),
        api.getSensors(),
        api.getAnomalies(),
      ]);
      setUser(me.user);
      setWatchedResidents(me.watched_residents);
      setSummary(summaryData);
      setSensors(sensorData);
      setAnomalies(anomalyData);
      setError(null);
    } catch {
      setError("Kinu cannot reach the sensor service right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const me = await api.getMe();
        setUser(me.user);
        setWatchedResidents(me.watched_residents);
        setAuthView("app");
      } catch {
        setAuthToken(null);
      } finally {
        setAuthLoading(false);
      }
    }
    void restoreSession();
  }, []);

  useEffect(() => {
    if (!user || authView !== "app") return;
    void loadDashboard();
    const interval = window.setInterval(() => void loadDashboard(), 3000);
    return () => window.clearInterval(interval);
  }, [user?.id, authView, loadDashboard]);

  async function handleAuthSuccess(_nextUser: User) {
    const me = await api.getMe();
    setUser(me.user);
    setWatchedResidents(me.watched_residents);
    setAuthView("app");
    setLoading(true);
    setTab("home");
  }

  function handleSignOut() {
    setAuthToken(null);
    setUser(null);
    setWatchedResidents([]);
    setSummary(null);
    setSensors([]);
    setAnomalies([]);
    setLoading(true);
    setError(null);
    setTab("home");
    setAuthView("login");
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

  if (authView === "login") {
    return (
      <MobileShell live={false}>
        <div className="screen-stack login-stack">
          <LoginScreen
            onLogin={(nextUser) => void handleAuthSuccess(nextUser)}
            onGoSignup={() => setAuthView("signup")}
          />
        </div>
      </MobileShell>
    );
  }

  if (authView === "signup") {
    return (
      <MobileShell live={false}>
        <div className="screen-stack login-stack">
          <SignupScreen
            onSignup={(nextUser) => void handleAuthSuccess(nextUser)}
            onGoLogin={() => setAuthView("login")}
          />
        </div>
      </MobileShell>
    );
  }

  if (!user) {
    return null;
  }

  const privacyMode = summary?.privacy_mode ?? false;
  const alertCount =
    user.role === "caregiver"
      ? anomalies.filter((a) => !a.acknowledged && a.severity === "critical").length
      : anomalies.filter((a) => !a.acknowledged).length;

  return (
    <MobileShell live={!error} user={user}>
      <div className="app-body">
        {loading && <div className="loading-banner">Waking Kinu gently…</div>}
        {error && <div className="error-banner">{error}</div>}

        <div className="screen-stack">
          {tab === "home" && summary && (
            <HomeScreen
              anomalies={anomalies}
              user={user}
              privacyMode={privacyMode}
              watchedResidents={watchedResidents}
              onGoAnomalies={() => setTab("anomalies")}
            />
          )}
          {tab === "anomalies" && (
            <AnomaliesScreen
              anomalies={anomalies}
              user={user}
              privacyMode={privacyMode}
              onAcknowledge={handleAcknowledge}
            />
          )}
          {tab === "emergency" && <EmergencyScreen />}
          {tab === "sensors" && (
            <SensorsScreen
              sensors={sensors}
              summary={summary}
              user={user}
              onRename={handleRename}
            />
          )}
          {tab === "settings" && (
            <SettingsScreen
              user={user}
              watchedResidents={watchedResidents}
              privacyMode={privacyMode}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>

      <BottomNav active={tab} alertCount={alertCount} onChange={setTab} />
    </MobileShell>
  );
}

export default App;
