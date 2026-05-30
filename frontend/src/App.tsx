import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function App() {
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">(
    "loading",
  );

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => (res.ok ? setApiStatus("ok") : setApiStatus("error")))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <main className="app">
      <header>
        <h1>Sensor Alarm Dashboard</h1>
        <p>Heckathon demo — setup complete, UI design coming next.</p>
      </header>

      <section className="status-card">
        <h2>System status</h2>
        <p>
          Backend API:{" "}
          {apiStatus === "loading" && "Checking…"}
          {apiStatus === "ok" && "Connected"}
          {apiStatus === "error" && "Unavailable"}
        </p>
      </section>
    </main>
  );
}

export default App;
