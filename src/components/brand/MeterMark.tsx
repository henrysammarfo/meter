type MarkProps = {
  className?: string;
  title?: string;
};

/**
 * METER mark — a "settled meter": a bracket that closes around three
 * ascending bars. Single-colour, currentColor, no gradients: it prints
 * clean on hoodies, caps, stickers and embroidery at 1 colour.
 */
export function MeterMark({ className, title = "METER" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
    >
      {/* left bracket */}
      <path
        d="M96 16H40C26.7 16 16 26.7 16 40v176c0 13.3 10.7 24 24 24h56"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
      />
      {/* right bracket */}
      <path
        d="M160 16h56c13.3 0 24 10.7 24 24v176c0 13.3-10.7 24-24 24h-56"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
      />
      {/* ascending meter bars */}
      <rect x="76" y="150" width="24" height="56" rx="12" fill="currentColor" />
      <rect x="116" y="110" width="24" height="96" rx="12" fill="currentColor" />
      <rect x="156" y="50" width="24" height="156" rx="12" fill="currentColor" />
    </svg>
  );
}

export function MeterWordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-display tracking-[0.18em]">METER</span>
    </span>
  );
}
