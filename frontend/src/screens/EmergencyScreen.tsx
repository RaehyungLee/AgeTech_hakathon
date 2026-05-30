import { useEffect, useState, type DragEvent } from "react";
import { api } from "../api";
import type { EmergencyContact } from "../types";

export function EmergencyScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function deleteContact(id: string) {
    if (!window.confirm("Delete this contact?")) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }


  useEffect(() => {
    void api
      .getEmergencyContacts()
      .then(setContacts)
      .catch(() => setError("Could not load emergency contacts."))
      .finally(() => setLoading(false));
  }, []);

  function onDragStart(id: string, event: DragEvent<HTMLElement>) {
    setDraggedId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function onDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(id: string, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const sourceId = draggedId ?? event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === id) return;
    setContacts((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === sourceId);
      const targetIndex = prev.findIndex((item) => item.id === id);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedId(null);
  }

  function onDragEnd() {
    setDraggedId(null);
  }

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
            draggable
            onDragStart={(event) => onDragStart(contact.id, event)}
            onDragOver={onDragOver}
            onDrop={(event) => onDrop(contact.id, event)}
            onDragEnd={onDragEnd}
            className={`contact-card soft-card${contact.is_emergency ? " emergency-contact" : ""}${draggedId === contact.id ? " dragging" : ""}`}
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
            <div className="contact-actions">
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setEditing(contact);
                  setName(contact.name);
                  setRelation(contact.relation);
                  setNotes(contact.when_to_call || "");
                  setPhone(contact.phone);
                  setFormError(null);
                  setShowForm(true);
                }}
              >
                Edit
              </button>
              <button type="button" className="text-link delete-btn" onClick={() => deleteContact(contact.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
        <div className="contact-actions">
          <button
            type="button"
            className="add-detection-btn"
            onClick={() => {
              setEditing(null);
              setName("");
              setRelation("");
              setNotes("");
              setPhone("");
              setFormError(null);
              setShowForm(true);
            }}
          >
            + Add contact
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card soft-card">
            <h2>{editing ? "Edit contact" : "Add contact"}</h2>
            {formError && <div className="error-banner">{formError}</div>}
            <label className="detail-label">Name<span className="required-star">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} />

            <label className="detail-label">Relationship</label>
            <input value={relation} onChange={(e) => setRelation(e.target.value)} />

            <label className="detail-label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

            <label className="detail-label">Phone number<span className="required-star">*</span></label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />

            <div className="settings-actions">
              <button
                type="button"
                className="add-detection-btn"
                onClick={() => {
                  if (!name.trim() || !phone.trim()) {
                    setFormError("Name and phone are required.");
                    return;
                  }

                  const contact: EmergencyContact = {
                    id: editing ? editing.id : String(Date.now()),
                    name: name.trim(),
                    relation: relation.trim(),
                    phone: phone.trim(),
                    tel_uri: `tel:${phone.trim()}`,
                    when_to_call: notes.trim(),
                    is_emergency: editing ? editing.is_emergency : false,
                  };

                  setContacts((prev) => {
                    if (editing) {
                      return prev.map((c) => (c.id === contact.id ? contact : c));
                    }
                    return [...prev, contact];
                  });
                  setShowForm(false);
                }}
              >
                Save
              </button>
              <button type="button" className="rename-btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && contacts.length === 0 && !error && (
        <p className="sensor-grid-empty">Family and support contacts will appear here when available.</p>
      )}
    </div>
  );
}
