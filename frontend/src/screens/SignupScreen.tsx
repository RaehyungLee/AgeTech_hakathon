import { useState } from "react";
import { api, setAuthToken } from "../api";
import type { User, UserRole } from "../types";

interface Props {
  onSignup: (user: User) => void;
  onGoLogin: () => void;
}

export function SignupScreen({ onSignup, onGoLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [relation, setRelation] = useState("Caregiver");
  const [role, setRole] = useState<UserRole>("caregiver");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.signup({
        name,
        email,
        password,
        role,
        relation: role === "resident" ? "Resident" : relation,
      });
      setAuthToken(token);
      onSignup(user);
    } catch {
      setError("Could not create account. This email may already be registered.");
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
        <p className="greeting-eyebrow">Join the care circle</p>
        <h1>Create account</h1>
        <p className="hero-copy">Sign up as Father (resident) or Daughter (caregiver).</p>
      </header>

      <form className="login-form soft-card" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field-label">
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={64} />
        </label>
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
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <label className="field-label">
          I am
          <select
            value={role}
            onChange={(e) => {
              const next = e.target.value as UserRole;
              setRole(next);
              setRelation(next === "resident" ? "Father" : "Daughter");
            }}
          >
            <option value="caregiver">Daughter (caregiver)</option>
            <option value="resident">Father (resident)</option>
          </select>
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" className="text-link" onClick={onGoLogin}>
          Sign in
        </button>
      </p>
    </div>
  );
}
