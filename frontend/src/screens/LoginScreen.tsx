import { useState } from "react";
import { api, setAuthToken } from "../api";
import type { User } from "../types";

const demoAccounts = [
  {
    email: "daughter@kinu.demo",
    name: "Daughter",
    relation: "Caregiver",
    hint: "Watches Father — sensors visible, critical alerts only",
  },
  {
    email: "father@kinu.demo",
    name: "Father",
    relation: "Resident",
    hint: "Full sensor and activity access",
  },
] as const;

const DEMO_PASSWORD = "demo123";

interface Props {
  onLogin: (user: User) => void;
  onGoSignup: () => void;
}

export function LoginScreen({ onLogin, onGoSignup }: Props) {
  const [email, setEmail] = useState("daughter@kinu.demo");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.login(email, password);
      setAuthToken(token);
      onLogin(user);
    } catch {
      setError("Could not sign in. Use a demo account below.");
    } finally {
      setLoading(false);
    }
  }

  async function quickSignIn(accountEmail: string) {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.login(accountEmail, DEMO_PASSWORD);
      setAuthToken(token);
      onLogin(user);
    } catch {
      setError("Could not sign in with the demo account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <header className="login-header">
        <div className="kinu-logo" aria-hidden="true">
          <span className="logo-bloom" />
          <span className="logo-core">K</span>
        </div>
        <h1>Sign in to Kinu</h1>
        <p className="hero-copy">Calm elder care monitoring for family.</p>
      </header>

      <form className="login-form soft-card" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field-label">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field-label">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New here?{" "}
        <button type="button" className="text-link" onClick={onGoSignup}>
          Create an account
        </button>
      </p>

      <section className="demo-accounts">
        <h2>Demo accounts</h2>
        <p className="demo-note">
          Password: <strong>{DEMO_PASSWORD}</strong>
        </p>
        <div className="demo-account-list">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              className="demo-account-card soft-card"
              onClick={() => void quickSignIn(account.email)}
              disabled={loading}
            >
              <div className="demo-account-top">
                <strong>{account.name}</strong>
                <span className="soft-chip">{account.relation}</span>
              </div>
              <p>{account.hint}</p>
              <span className="demo-email">{account.email}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
