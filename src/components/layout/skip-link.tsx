/** First focusable element on every page: jumps past the navigation (WCAG 2.4.1). */
export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only rounded-md bg-surface px-4 py-3 text-label text-foreground shadow-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:outline-2 focus:outline-focus"
    >
      Skip to content
    </a>
  );
}
