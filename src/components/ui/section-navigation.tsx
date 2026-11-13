"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SectionNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Shown as a count, such as Requests in a grouping. */
  count?: number;
  /** Builder sections show completion with a tick and "Complete" for screen readers. */
  complete?: boolean;
};

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

  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ul
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
                {item.complete !== undefined && (
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      item.complete
                        ? "border-success bg-success text-surface"
                        : "border-border-control",
                    )}
                  >
                    {item.complete && (
                      <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                    )}
                    <span className="sr-only">{item.complete ? "Complete" : "Incomplete"}</span>
                  </span>
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
export type { SectionNavItem };
