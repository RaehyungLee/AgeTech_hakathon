import { useCallback, useEffect, useState } from "react";
import { api, setAuthToken } from "./api";
import { BottomNav } from "./components/BottomNav";
import { MobileShell } from "./components/MobileShell";
import { AnomaliesScreen } from "./screens/AnomaliesScreen";
import { EmergencyScreen } from "./screens/EmergencyScreen";
import { HomeScreen, type HomeDemoStage } from "./screens/HomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SensorsScreen } from "./screens/SensorsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { AnomalyDetectionSettingsScreen } from "./screens/AnomalyDetectionSettingsScreen";
import { buildDefaultDetections } from "./detectionDefaults";
import type {
  Anomaly,
  AuthView,
  DashboardSummary,
  Sensor,
  TabId,
  User,
  WatchedResident,
  Detection,
} from "./types";
import "./App.css";

const DESIRED_SENSOR_NAMES = [
  "Sink water usage",
  "Bathroom door",
  "Bedroom motion",
  "Bed pressure",
];

const DEFAULT_SENSORS: Sensor[] = [
  {
    id: "sink-water-usage",
    name: "Sink water usage",
    type: "motion",
    location: "Kitchen",
    battery: 92,
    status: "online",
    last_seen: new Date().toISOString(),
  },
  {
    id: "bathroom-door",
    name: "Bathroom door",
    type: "door",
    location: "Bathroom",
    battery: 93,
    status: "online",
    last_seen: new Date().toISOString(),
  },
  {
    id: "bedroom-motion",
    name: "Bedroom motion",
    type: "motion",
    location: "Bedroom",
    battery: 45,
    status: "online",
    last_seen: new Date().toISOString(),
  },
  {
    id: "bed-pressure",
    name: "Bed pressure",
    type: "bed",
    location: "Bedroom",
    battery: 60,
    status: "online",
    last_seen: new Date().toISOString(),
  },
];

const DEFAULT_SUMMARY = {
  total_sensors: DEFAULT_SENSORS.length,
  online_sensors: DEFAULT_SENSORS.length,
  low_battery_sensors: DEFAULT_SENSORS.filter((s) => s.status === "low_battery").length,
  active_anomalies: 0,
  critical_anomalies: 0,
  privacy_mode: false,
  monitoring_active: true,
};

function App() {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [user, setUser] = useState<User | null>(null);
  const [watchedResidents, setWatchedResidents] = useState<WatchedResident[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("home");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>(DEFAULT_SENSORS);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>(() => buildDefaultDetections());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeDemoStage, setHomeDemoStage] = useState<HomeDemoStage>(0);

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
      setSummary(
        summaryData && summaryData.total_sensors >= DEFAULT_SENSORS.length ? summaryData : DEFAULT_SUMMARY,
      );
      const selectedSensors = sensorData.filter((sensor) => DESIRED_SENSOR_NAMES.includes(sensor.name));
      setSensors(
        selectedSensors.length === DESIRED_SENSOR_NAMES.length
          ? DESIRED_SENSOR_NAMES.map((name) => selectedSensors.find((sensor) => sensor.name === name)!)
          : DEFAULT_SENSORS,
      );
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

  useEffect(() => {
    if (tab !== "anomalies") {
      setSelectedDetection(null);
    }
  }, [tab]);

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

  function handleGoHotline() {
    setTab("emergency");
  }

  function advanceHomeDemoStage() {
    setHomeDemoStage((stage) => ((stage + 1) % 3) as HomeDemoStage);
  }

  function resetHomeDemoStage() {
    setHomeDemoStage(0);
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
              demoStage={homeDemoStage}
              onAdvanceDemoStage={advanceHomeDemoStage}
              onResetDemoStage={resetHomeDemoStage}
              onAcknowledge={(id) => void handleAcknowledge(id)}
              onGoHotline={handleGoHotline}
            />
          )}
          {tab === "anomalies" && !selectedDetection && (
            <AnomaliesScreen
              anomalies={anomalies}
              privacyMode={privacyMode}
              detections={detections}
              demoStage={homeDemoStage}
              onResetDemoStage={resetHomeDemoStage}
              onSelectDetection={(id) => setSelectedDetection(id)}
              onAddDetection={() => setSelectedDetection("sink")}
              onAcknowledge={(id) => void handleAcknowledge(id)}
              onGoHotline={handleGoHotline}
            />
          )}
          {selectedDetection && (
            <AnomalyDetectionSettingsScreen
              detectionId={selectedDetection as "sink" | "bath" | "bed"}
              sensors={sensors}
              onBack={() => setSelectedDetection(null)}
              onSave={(detection) => {
                setDetections((prev) => [
                  ...prev.filter((p) => p.key !== detection.key),
                  detection,
                ]);
                setSelectedDetection(null);
              }}
            />
          )}
          {tab === "emergency" && <EmergencyScreen />}
          {tab === "sensors" && (
            <SensorsScreen
              sensors={sensors}
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
