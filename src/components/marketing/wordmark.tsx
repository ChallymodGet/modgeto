/** Interim mark: two linked Service blocks with a forward/start gesture (docs/09 §43). Not the final logo. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="mg-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#635BFF" />
          <stop offset="0.55" stopColor="#8B80FF" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#mg-mark)" />
      <path
        d="M8 22V13.5a3.5 3.5 0 0 1 7 0V22M15 13.5a3.5 3.5 0 0 1 7 0V17"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M19.5 20.5 22 23l2.5-2.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[1.375rem] font-semibold tracking-[-0.03em] text-foreground">modgeto</span>
    </span>
  );
}
