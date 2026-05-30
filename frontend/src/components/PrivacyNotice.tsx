interface Props {
  title?: string;
  message?: string;
  compact?: boolean;
}

export function PrivacyNotice({
  title = "Private for now",
  message = "Kinu keeps daily routines, sensors, and wellness details with the resident. Shared caregivers only see information when a critical alert needs attention.",
  compact = false,
}: Props) {
  return (
    <article className={`privacy-notice${compact ? " compact" : ""}`}>
      <span className="privacy-icon" aria-hidden="true">◌</span>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </article>
  );
}
