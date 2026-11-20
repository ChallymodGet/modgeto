"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

type SectionNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Shown as a count, such as Requests in a grouping. */
  count?: number;
  /** Builder sections show completion with a tick and "Complete" for screen readers. */
  complete?: boolean;
  /**
   * Fuller Builder state (docs/06 §55). Each state has its own shape, not just
   * a colour: a filled tick, an exclamation mark, an empty ring or a dashed ring.
   */
  progress?: SectionProgress;
};

type SectionProgress = "complete" | "attention" | "incomplete" | "optional";

const PROGRESS_LABEL: Record<SectionProgress, string> = {
  complete: "Complete",
  attention: "Needs attention",
  incomplete: "Incomplete",
  optional: "Optional",
};

function ProgressMark({ progress }: { progress: SectionProgress }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border",
        progress === "complete" && "border-success bg-success text-surface",
        progress === "attention" && "border-warning-text bg-warning-text text-surface",
        progress === "incomplete" && "border-border-control",
        progress === "optional" && "border-dashed border-border-control",
      )}
    >
      {progress === "complete" && <Check aria-hidden="true" className="size-3" strokeWidth={3} />}
      {progress === "attention" && (
        <span aria-hidden="true" className="text-caption leading-none font-bold">
          !
        </span>
      )}
      <span className="sr-only">{PROGRESS_LABEL[progress]}</span>
    </span>
  );
}

type SectionNavigationProps = {
  /** Names the landmark, for example "Request groups" or "Settings". */
  label: string;
  items: SectionNavItem[];
  /** Overrides route matching, for anchors or query-string sections. */
  currentHref?: string;
  className?: string;
};

/**
 * Section sidebar (D-031) for pages with sub-navigation. A vertical list from
 * `lg`; a horizontally scrolling row of pills below it, so every section stays
 * reachable on phones without hover. The current item uses `aria-current`,
 * weight and a surface, never colour alone.
 *
 * Inside a grid or flex parent, give the parent cell `min-w-0` so the scrolling
 * row can shrink below its content width.
 */
function SectionNavigation({ label, items, currentHref, className }: SectionNavigationProps) {
  const pathname = usePathname();
  const active = currentHref ?? pathname;
  const listRef = useRef<HTMLUListElement>(null);

  // On phones the row scrolls sideways: keep the current section in view.
  useEffect(() => {
    const current = listRef.current?.querySelector<HTMLElement>("[aria-current=page]");
    const list = listRef.current;
    if (!current || !list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2,
      behavior: "instant",
    });
  }, [active]);

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ul
        ref={listRef}
        className={cn(
          "relative flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1",
          "lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0",
        )}
      >
        {items.map((item) => {
          const current = item.href === active;
          return (
            <li key={item.href} className="shrink-0">
              <NextLink
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-full border border-border bg-surface px-4 text-label whitespace-nowrap text-foreground-secondary",
                  "lg:h-10 lg:rounded-md lg:border-transparent lg:bg-transparent lg:px-3",
                  "transition-colors duration-150 hover:bg-surface-subtle hover:text-foreground",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  "aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:font-semibold aria-[current=page]:text-surface",
                  "lg:aria-[current=page]:border-transparent lg:aria-[current=page]:bg-surface lg:aria-[current=page]:text-foreground lg:aria-[current=page]:shadow-sm",
                  "[&_svg]:size-4 [&_svg]:shrink-0",
                )}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {(item.progress ??
                  (item.complete !== undefined
                    ? item.complete
                      ? "complete"
                      : "incomplete"
                    : null)) && (
                  <ProgressMark
                    progress={item.progress ?? (item.complete ? "complete" : "incomplete")}
                  />
                )}
                {item.count !== undefined && (
                  <span className="text-caption font-medium text-current tabular-nums opacity-80">
                    {item.count}
                  </span>
                )}
              </NextLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { SectionNavigation };
export type { SectionNavItem, SectionProgress };
