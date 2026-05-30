import type { SensorType } from "../../types";

interface Props {
  type: SensorType;
  className?: string;
}

export function SensorArt({ type, className = "" }: Props) {
  return (
    <svg
      className={`sensor-art ${className}`.trim()}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="72" height="72" rx="22" fill="var(--rose-soft)" />
      {type === "motion" && (
        <>
          <circle cx="40" cy="40" r="14" stroke="var(--rose-strong)" strokeWidth="3" />
          <path d="M40 18v8M40 54v8M18 40h8M54 40h8" stroke="var(--mint)" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {type === "fall" && (
        <>
          <circle cx="48" cy="24" r="6" fill="var(--rose-strong)" />
          <path d="M48 30v12M42 36h12M34 52l14-10" stroke="var(--rose-strong)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {type === "door" && (
        <>
          <rect x="24" y="18" width="32" height="44" rx="4" stroke="var(--rose-strong)" strokeWidth="3" />
          <circle cx="48" cy="40" r="3" fill="var(--mint)" />
        </>
      )}
      {type === "bed" && (
        <>
          <rect x="16" y="34" width="48" height="20" rx="6" fill="var(--mint-soft)" stroke="var(--rose-strong)" strokeWidth="2.5" />
          <path d="M22 34v-8h12v8" stroke="var(--rose-strong)" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {type === "wearable" && (
        <>
          <rect x="22" y="28" width="36" height="28" rx="10" stroke="var(--rose-strong)" strokeWidth="3" />
          <path d="M30 42h20" stroke="var(--mint)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="40" cy="42" r="4" fill="var(--rose-strong)" />
        </>
      )}
      {type === "temperature" && (
        <>
          <path d="M40 20v28" stroke="var(--rose-strong)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="40" cy="52" r="10" stroke="var(--rose-strong)" strokeWidth="3" />
          <path d="M36 48h8" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
