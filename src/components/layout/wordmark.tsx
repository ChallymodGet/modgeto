/** Interim mark: two linked Service blocks with a forward/start gesture (docs/09 §43). Not the final logo. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  // The gradient is a CSS background rather than an SVG <linearGradient>: SVG
  // gradient IDs are document-global, so a hidden copy of the mark (e.g. the
  // desktop wordmark on phones) would blank out every visible one.
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 rounded-[28%] bg-[linear-gradient(135deg,#635bff_0%,#8b80ff_55%,#06b6d4_100%)] ${className}`}
    >
      <svg viewBox="0 0 32 32" className="size-full">
        <path
          d="M8 22V13.5a3.5 3.5 0 0 1 7 0V22M15 13.5a3.5 3.5 0 0 1 7 0V17"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M19.5 20.5 22 23l2.5-2.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[1.375rem] font-semibold tracking-[-0.03em] text-foreground">
        modgeto
      </span>
    </span>
  );
}
