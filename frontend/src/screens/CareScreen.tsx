import type { CareInsight, User } from "../types";
import { PrivacyNotice } from "../components/PrivacyNotice";
import type { CSSProperties } from "react";

interface Props {
  care: CareInsight;
  user: User;
}

export function CareScreen({ care, user }: Props) {
  if (user.role === "caregiver") {
    return (
      <div className="screen care-screen">
        <header className="screen-header">
          <p className="greeting-eyebrow">Beauty & calm</p>
          <h1>Care</h1>
          <p className="hero-copy">Wellness rhythms stay with the resident for privacy and dignity.</p>
        </header>
        <PrivacyNotice
          title="Wellness is private"
          message={care.daily_affirmation}
        />
      </div>
    );
  }

  return (
    <div className="screen care-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Beauty & calm</p>
        <h1>Care</h1>
        <p className="hero-copy">Soft wellness insights for a peaceful day at home.</p>
      </header>

      <section className="calm-score-card">
        <div className="calm-ring" style={{ "--score": care.calm_score } as CSSProperties}>
          <div className="calm-ring-inner">
            <strong>{care.calm_score}</strong>
            <span>Calm score</span>
          </div>
        </div>
        <div>
          <h2>{care.calm_label}</h2>
          <p>{care.moments_of_peace} peaceful moments recorded today</p>
        </div>
      </section>

      <section className="care-grid">
        <article className="beauty-card">
          <span className="beauty-icon" aria-hidden="true">☾</span>
          <h3>Rest & rhythm</h3>
          <p className="beauty-value">{care.rest_hours}h</p>
          <p className="beauty-detail">{care.rest_quality} sleep last night</p>
        </article>

        <article className="beauty-card">
          <span className="beauty-icon" aria-hidden="true">❀</span>
          <h3>Ambient comfort</h3>
          <p className="beauty-value">{care.ambient_comfort}</p>
          <p className="beauty-detail">
            {care.temperature}°C · {care.humidity}% humidity
          </p>
        </article>
      </section>

      <article className="affirmation-card">
        <p className="affirmation-label">Daily bloom</p>
        <blockquote>{care.daily_affirmation}</blockquote>
      </article>

      <section className="care-tips">
        <article className="tip-card">
          <h3>Gentle tip</h3>
          <p>{care.gentle_tip}</p>
        </article>
        <article className="tip-card hydration">
          <h3>Hydration & glow</h3>
          <p>{care.hydration_reminder}</p>
        </article>
      </section>
    </div>
  );
}
