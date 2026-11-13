"use client";

import { Menu } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { ADMIN_HOME, adminNav, isActive } from "./nav-items";
import { SkipLink } from "./skip-link";
import { LogoMark, Wordmark } from "./wordmark";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin workspace">
      <ul className="flex flex-col gap-1">
        {adminNav.map((item) => {
          const current = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <NextLink
                href={item.href}
                onClick={onNavigate}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-label text-foreground-secondary md:min-h-10",
                  "transition-colors hover:bg-surface-subtle hover:text-foreground",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus",
                  "aria-[current=page]:bg-surface-subtle aria-[current=page]:font-semibold aria-[current=page]:text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4.5",
                    current ? "text-primary-text" : "text-foreground-muted",
                  )}
                />
                {item.label}
              </NextLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type AdminAppShellProps = {
  name: string;
  email: string;
  children: ReactNode;
};

/**
 * Admin shell (D-031): a fixed sidebar from `lg`; below that the same
 * navigation opens from a menu button (full screen on phones).
 */
export function AdminAppShell({ name, email, children }: AdminAppShellProps) {
  const [open, setOpen] = useState(false);
  const menu = (
    <AccountMenu name={name} email={email} avatarUrl={null} workspace="admin" hasCreative={false} />
  );

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-border bg-surface px-4 py-5 lg:flex">
          <NextLink
            href={ADMIN_HOME}
            aria-label="Modgeto Admin home"
            className="flex items-center gap-3 rounded-md px-2 focus-visible:outline-2 focus-visible:outline-focus"
          >
            <Wordmark />
          </NextLink>
          <p className="px-3 text-caption font-medium tracking-wide text-foreground-muted uppercase">
            Admin
          </p>
          <SidebarNav />
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger
                  render={
                    <IconButton label="Open navigation" icon={<Menu />} className="lg:hidden" />
                  }
                />
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Admin</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto px-3 pb-6">
                    <SidebarNav onNavigate={() => setOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <NextLink
                href={ADMIN_HOME}
                aria-label="Modgeto Admin home"
                className="rounded-md focus-visible:outline-2 focus-visible:outline-focus lg:hidden"
              >
                <LogoMark />
              </NextLink>
              <span className="text-label text-foreground-secondary lg:hidden">Admin</span>
              <div className="ml-auto">{menu}</div>
            </div>
          </header>
          <main id="main" tabIndex={-1} className="pb-16 outline-none">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
