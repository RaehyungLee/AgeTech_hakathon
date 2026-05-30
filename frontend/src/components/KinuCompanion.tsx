interface Props {
  className?: string;
}

export function KinuCompanion({ className = "" }: Props) {
  return (
    <div className={`kinu-companion ${className}`.trim()} aria-hidden="true">
      <svg
        className="kinu-companion-art"
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="100" cy="198" rx="52" ry="10" fill="rgba(79, 115, 89, 0.12)" />

        <g className="kinu-companion-body">
          <path
            d="M100 38c-38 0-62 28-62 58 0 22 10 42 26 54 8 6 18 10 28 12 4 1 8 1 12 0 10-2 20-6 28-12 16-12 26-32 26-54 0-30-24-58-62-58z"
            fill="var(--rose-soft)"
            stroke="var(--rose-strong)"
            strokeWidth="3"
          />
          <circle cx="100" cy="52" r="18" fill="var(--mint-soft)" stroke="var(--mint)" strokeWidth="2.5" />
          <path
            d="M88 46c4-6 10-8 12-8s8 2 12 8"
            stroke="var(--mint)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="78" cy="88" r="6" fill="var(--text-strong)" />
          <circle cx="122" cy="88" r="6" fill="var(--text-strong)" />
          <circle cx="80" cy="86" r="2" fill="#fffef8" />
          <circle cx="124" cy="86" r="2" fill="#fffef8" />
          <ellipse cx="68" cy="98" rx="8" ry="5" fill="rgba(201, 154, 82, 0.22)" />
          <ellipse cx="132" cy="98" rx="8" ry="5" fill="rgba(201, 154, 82, 0.22)" />
          <path
            d="M88 108c6 8 18 8 24 0"
            stroke="var(--rose-strong)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M54 96c-8 4-14 14-12 24"
            stroke="var(--rose-strong)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M146 96c8 4 14 14 12 24"
            stroke="var(--rose-strong)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        <g className="kinu-companion-sparkles">
          <circle cx="34" cy="72" r="4" fill="var(--lilac)" opacity="0.7" />
          <circle cx="166" cy="64" r="3" fill="var(--mint)" opacity="0.75" />
          <circle cx="168" cy="118" r="2.5" fill="var(--lilac)" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
