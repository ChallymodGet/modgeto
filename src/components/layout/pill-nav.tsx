"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, navSets, type NavSet } from "./nav-items";

type PillNavProps = { label: string; set: NavSet; className?: string };

/**
 * Desktop top navigation (D-031): a dark segmented pill. The current page is a
 * white pill with heavier text and `aria-current="page"`, so it never relies
 * on colour alone.
 */
export function PillNav({ label, set, className }: PillNavProps) {
  const pathname = usePathname();
  const items = navSets[set].top;
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex items-center gap-1 rounded-full bg-foreground p-1">
        {items.map((item) => {
          const current = isActive(pathname, item);
          return (
            <li key={item.href}>
              <NextLink
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-full px-4 text-label whitespace-nowrap transition-colors duration-150",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  current
                    ? "bg-surface font-semibold text-foreground"
                    : "text-neutral-300 hover:bg-white/10 hover:text-surface",
                )}
              >
                {item.label}
              </NextLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
