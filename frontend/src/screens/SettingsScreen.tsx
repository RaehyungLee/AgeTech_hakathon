import type { User, WatchedResident } from "../types";

interface Props {
  user: User;
  watchedResidents: WatchedResident[];
  privacyMode: boolean;
  onSignOut: () => void;
}

export function SettingsScreen({ user, watchedResidents, privacyMode, onSignOut }: Props) {
  const watching = watchedResidents[0];

  return (
    <div className="screen settings-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Account</p>
        <h1>Settings</h1>
        <p className="hero-copy">Your Kinu profile, care circle, and privacy preferences.</p>
      </header>

      <section className="soft-card settings-card">
        <p className="care-circle-label">Signed in as</p>
        <strong>{user.name}</strong>
        <p>{user.email}</p>
        <p className="settings-meta">
          {user.relation} · {user.role === "caregiver" ? "Shared caregiver" : "Resident"}
        </p>
      </section>

      {user.role === "caregiver" && watching && (
        <section className="soft-card settings-card">
          <p className="care-circle-label">Care circle</p>
          <strong>{watching.name}</strong>
          <p>{watching.address}</p>
          {!privacyMode && (
            <p className="settings-meta">
              Local emergency: {watching.emergency_number} ({watching.emergency_label})
            </p>
          )}
        </section>
      )}

      <section className="soft-card settings-card">
        <p className="care-circle-label">Privacy</p>
        <p>
          Sensors are always visible. Detection logs and daily activity stay private — shared
          caregivers only see critical alerts and location when help is needed.
        </p>
      </section>

      <section className="soft-card settings-card">
        <p className="care-circle-label">Demo accounts</p>
        <p>
          <strong>father@kinu.demo</strong> (Father) · <strong>daughter@kinu.demo</strong> (Daughter)
          <br />
          Password: <strong>demo123</strong>
        </p>
      </section>

      <button type="button" className="primary-btn settings-signout" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
