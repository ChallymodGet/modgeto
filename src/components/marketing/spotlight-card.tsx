"use client";

import type { ReactNode } from "react";

/** Card with a pointer-following glow. The glow is decorative and hover-only. */
export function SpotlightCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`mg-spotlight rounded-xl border border-border bg-surface ${className}`}
    >
      {children}
    </div>
  );
}
