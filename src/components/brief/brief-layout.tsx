/** Brief structure: sections and progress (docs/06 §32). */
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProgressSection = { id: string; title: string; complete: boolean };

/**
 * "Section 2 of 4" with a step list. Desktop shows every section beside the
 * form; phones show the count and the current title (docs/06 §32).
 */
export function BriefProgress({
  sections,
  currentId,
  onSelect,
}: {
  sections: ProgressSection[];
  currentId: string;
  /** Jump to a section. Only completed sections and the current one are reachable. */
  onSelect?: (sectionId: string) => void;
}) {
  const index = Math.max(
    0,
    sections.findIndex((s) => s.id === currentId),
  );
  const current = sections[index];
  return (
    <nav aria-label="Brief sections" className="flex flex-col gap-3">
      <p className="text-label text-foreground-secondary lg:hidden">
        Section {index + 1} of {sections.length}
        <span className="text-foreground">: {current?.title}</span>
      </p>
      <ol className="flex gap-1.5 lg:flex-col lg:gap-1">
        {sections.map((s, i) => {
          const state = s.id === currentId ? "current" : s.complete ? "done" : "upcoming";
          const reachable = Boolean(onSelect) && (state !== "upcoming" || i <= index);
          const body = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary text-primary-text",
                  state === "upcoming" && "border-border-control text-foreground-muted",
                )}
              >
                {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-body-sm lg:inline",
                  state === "current"
                    ? "font-semibold text-foreground"
                    : "text-foreground-secondary",
                )}
              >
                {s.title}
              </span>
              <span className="sr-only lg:hidden">{s.title}</span>
              {state === "done" && <span className="sr-only"> (complete)</span>}
            </>
          );
          return (
            <li key={s.id} className="flex-1 lg:flex-none">
              {/* Phone: a segmented bar; desktop: a vertical list. */}
              <span
                aria-hidden="true"
                className={cn(
                  "block h-1 rounded-full lg:hidden",
                  state === "upcoming" ? "bg-border" : "bg-primary",
                )}
              />
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect?.(s.id)}
                  aria-current={state === "current" ? "step" : undefined}
                  className="sr-only flex items-center gap-3 rounded-md px-2 py-2 text-left focus-visible:not-sr-only focus-visible:outline-2 focus-visible:outline-focus lg:not-sr-only lg:w-full lg:hover:bg-surface-subtle"
                >
                  {body}
                </button>
              ) : (
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className="sr-only flex items-center gap-3 px-2 py-2 lg:not-sr-only"
                >
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** One Brief section: a heading, optional intro, and its questions 24px apart (docs/07 §13). */
export function BriefSection({
  title,
  intro,
  children,
  headingLevel: Heading = "h2",
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Heading className="text-h3 text-foreground">{title}</Heading>
        {intro && <p className="text-body-sm text-foreground-secondary">{intro}</p>}
      </div>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}
