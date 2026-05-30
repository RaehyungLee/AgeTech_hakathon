import { useEffect, useState } from "react";
import { api } from "../api";
import type { EmergencyContact } from "../types";

export function EmergencyScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .getEmergencyContacts()
      .then(setContacts)
      .catch(() => setError("Could not load emergency contacts."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen emergency-screen">
      <header className="screen-header">
        <p className="greeting-eyebrow">Reach out</p>
        <h1>Emergency Hotline</h1>
        <p className="hero-copy">
          You are not alone. Reach someone you trust, or local emergency services when it matters.
        </p>
      </header>

      {loading && <div className="loading-banner inline">Loading contacts…</div>}
      {error && <div className="error-banner inline">{error}</div>}

      <div className="contact-list">
        {contacts.map((contact) => (
          <article
            key={contact.id}
            className={`contact-card soft-card${contact.is_emergency ? " emergency-contact" : ""}`}
          >
            <div className="contact-top">
              <div>
                <h2>{contact.name}</h2>
                <p className="contact-relation">{contact.relation}</p>
              </div>
              {contact.is_emergency && <span className="severity-tag critical">Emergency</span>}
            </div>
            <p className="contact-when">{contact.when_to_call}</p>
            <p className="contact-phone">{contact.phone}</p>
            <a className="contact-call-btn" href={contact.tel_uri}>
              Call {contact.phone}
            </a>
          </article>
        ))}
      </div>

      {!loading && contacts.length === 0 && !error && (
        <p className="sensor-grid-empty">Family and support contacts will appear here when available.</p>
      )}
    </div>
  );
}
