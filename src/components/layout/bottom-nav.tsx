"use client";

import { Ellipsis } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { isActive, navSets, type NavItem, type NavSet } from "./nav-items";

type BottomNavProps = {
  label: string;
  /** The workspace's items. Its `more` items sit behind a "More" tab in a bottom drawer (docs/04 §36). */
  set: NavSet;
  className?: string;
};

const tab = cn(
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 pt-1.5 pb-1 text-caption leading-none font-medium text-foreground-secondary",
  "transition-colors duration-150 select-none [-webkit-tap-highlight-color:transparent]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
  "aria-[current=page]:font-semibold aria-[current=page]:text-foreground",
);

/** The icon sits in a pill that fills when current: shape plus weight, not colour alone. */
function TabIcon({ item, current }: { item: Pick<NavItem, "icon">; current: boolean }) {
  const Icon = item.icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-150",
        current ? "bg-primary-subtle text-primary-text" : "text-foreground-muted",
      )}
    >
      <Icon className="size-5" strokeWidth={current ? 2.25 : 2} />
    </span>
  );
}

/**
 * Phone and tablet bottom navigation. Fixed to the bottom with the home
 * indicator inset, labelled icons only (no icon-only tabs), 3–5 destinations.
 */
export function BottomNav({ label, set, className }: BottomNavProps) {
  const pathname = usePathname();
  const { bottom: items, more } = navSets[set];
  const [open, setOpen] = useState(false);
  const moreCurrent = more?.some((item) => isActive(pathname, item)) ?? false;

  return (
    <nav
      aria-label={label}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-surface/85",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-xl items-stretch gap-1 px-2">
        {items.map((item) => {
          const current = isActive(pathname, item);
          return (
            <li key={item.href} className="flex flex-1">
              <NextLink
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={tab}
              >
                <TabIcon item={item} current={current} />
                {item.label}
              </NextLink>
            </li>
          );
        })}
        {more && (
          <li className="flex flex-1">
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger className={cn(tab, moreCurrent && "font-semibold text-foreground")}>
                <TabIcon item={{ icon: Ellipsis }} current={moreCurrent} />
                More
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>More</DrawerTitle>
                </DrawerHeader>
                <ul className="flex flex-col gap-1 p-3">
                  {more.map((item) => {
                    const current = isActive(pathname, item);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <DrawerClose
                          nativeButton={false}
                          render={
                            <NextLink
                              href={item.href}
                              aria-current={current ? "page" : undefined}
                              className={cn(
                                "flex min-h-12 items-center gap-3 rounded-md px-3 text-body text-foreground",
                                "hover:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                                "aria-[current=page]:bg-surface-subtle aria-[current=page]:font-semibold",
                              )}
                            />
                          }
                        >
                          <Icon aria-hidden="true" className="size-5 text-foreground-muted" />
                          {item.label}
                        </DrawerClose>
                      </li>
                    );
                  })}
                </ul>
              </DrawerContent>
            </Drawer>
          </li>
        )}
      </ul>
    </nav>
  );
}
