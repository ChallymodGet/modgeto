/**
 * Workspace shells (docs/06 §11, D-031):
 *
 * | Shell    | Desktop (≥1024)  | Tablet (768–1023)       | Phone (<768)            |
 * |----------|------------------|-------------------------|-------------------------|
 * | Creative | Top pill bar     | Bottom nav + More sheet | Bottom nav + More sheet |
 * | Client   | Top pill bar     | Top pill bar            | Bottom nav              |
 */
import { Settings } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Viewer } from "@/features/auth/viewer";
import { AccountMenu, type Workspace } from "./account-menu";
import { BottomNav } from "./bottom-nav";
import { CLIENT_HOME, CREATIVE_HOME, creativeSettings } from "./nav-items";
import { NotificationsLink, UtilityLink } from "./notifications-link";
import { PillNav } from "./pill-nav";
import { SkipLink } from "./skip-link";
import { LogoMark, Wordmark } from "./wordmark";

function TopBar({
  home,
  workspaceLabel,
  nav,
  utilities,
}: {
  home: string;
  workspaceLabel: string;
  nav: ReactNode;
  utilities: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:px-6 lg:px-8">
        <NextLink
          href={home}
          aria-label={`Modgeto ${workspaceLabel} home`}
          className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <span className="hidden sm:inline-flex">
            <Wordmark />
          </span>
          <LogoMark className="size-8 sm:hidden" />
          <span className="hidden rounded-full border border-border px-2.5 py-0.5 text-caption font-medium text-foreground-secondary xl:inline">
            {workspaceLabel}
          </span>
        </NextLink>
        <div className="flex flex-1 justify-center">{nav}</div>
        <div className="flex shrink-0 items-center gap-1">{utilities}</div>
      </div>
    </header>
  );
}

type ShellProps = { viewer: Viewer; children: ReactNode };

function accountMenu(viewer: Viewer, workspace: Workspace) {
  return (
    <AccountMenu
      name={viewer.creative?.displayName ?? viewer.user.fullName}
      email={viewer.user.email}
      avatarUrl={viewer.creative?.avatarUrl ?? viewer.user.avatarUrl}
      workspace={workspace}
      hasCreative={viewer.creative !== null}
    />
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        {children}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export function CreativeAppShell({ viewer, children }: ShellProps) {
  return (
    <Frame>
      <TopBar
        home={CREATIVE_HOME}
        workspaceLabel="Creative"
        nav={<PillNav label="Creative workspace" set="creative" className="hidden lg:block" />}
        utilities={
          <>
            <UtilityLink href={creativeSettings.href} label="Settings" className="hidden lg:flex">
              <Settings />
            </UtilityLink>
            <NotificationsLink
              href={`${CREATIVE_HOME}/notifications`}
              unread={viewer.unreadNotifications}
            />
            {accountMenu(viewer, "creative")}
          </>
        }
      />
      <main
        id="main"
        tabIndex={-1}
        // Clears the fixed bottom navigation and the home indicator.
        className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] outline-none lg:pb-16"
      >
        {children}
      </main>
      <BottomNav label="Creative workspace" set="creative" className="lg:hidden" />
    </Frame>
  );
}

export function ClientAppShell({ viewer, children }: ShellProps) {
  return (
    <Frame>
      <TopBar
        home={CLIENT_HOME}
        workspaceLabel="Client"
        nav={<PillNav label="Client workspace" set="client" className="hidden md:block" />}
        utilities={
          <>
            <NotificationsLink
              href={`${CLIENT_HOME}/notifications`}
              unread={viewer.unreadNotifications}
            />
            {accountMenu(viewer, "client")}
          </>
        }
      />
      <main
        id="main"
        tabIndex={-1}
        className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] outline-none md:pb-16"
      >
        {children}
      </main>
      <BottomNav label="Client workspace" set="client" className="md:hidden" />
    </Frame>
  );
}
