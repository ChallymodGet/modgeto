"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";

const STORAGE_KEY = "modgeto-theme";

/**
 * Runs synchronously while the HTML is parsed, so the saved or system theme is
 * applied before first paint (Next 16 "Preventing flash before hydration").
 * Rendered as text/plain on the client so it never re-executes during hydration.
 */
export function ThemeScript() {
  const html = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function resolveTheme(): "light" | "dark" {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Both icons and both labels are rendered; CSS shows the right one from
 * [data-theme], so server and client markup always match.
 */
export function ThemeToggle() {
  // Soft navigations don't run the inline script, so sync on mount.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolveTheme());
  }, []);

  function toggle() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="group inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface/70 text-foreground-secondary backdrop-blur transition-colors hover:bg-surface-subtle hover:text-foreground"
    >
      <Sun aria-hidden className="theme-icon-sun size-[18px]" />
      <Moon aria-hidden className="theme-icon-moon size-[18px]" />
      <span className="theme-label-to-dark sr-only">Switch to dark theme</span>
      <span className="theme-label-to-light sr-only">Switch to light theme</span>
    </button>
  );
}
