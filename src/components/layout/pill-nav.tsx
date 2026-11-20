"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { isActive, navSets, type NavSet } from "./nav-items";

type PillNavProps = { label: string; set: NavSet; className?: string };

/**
 * Desktop top navigation (D-031): a dark segmented pill. The current page is a
 * white pill with heavier text and `aria-current="page"`, so it never relies
 * on colour alone.
 */
function PillNavView({ label, set, className, pathname }: PillNavProps & { pathname: string }) {
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
                    : "text-surface/75 hover:bg-surface/10 hover:text-surface",
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

function PillNavLive(props: PillNavProps) {
  return <PillNavView {...props} pathname={usePathname()} />;
}

/**
 * The current path is request data, so it streams in under Suspense. Until it
 * does (and in prerendered shells of dynamic routes) the links render without
 * a current page.
 */
export function PillNav(props: PillNavProps) {
  return (
    <Suspense fallback={<PillNavView {...props} pathname="" />}>
      <PillNavLive {...props} />
    </Suspense>
  );
}
