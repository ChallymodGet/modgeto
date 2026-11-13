/**
 * Shells without workspace navigation: the public storefront, authentication,
 * and Creative onboarding. The public commissioning flow avoids app
 * navigation (docs/04 §40).
 */
import NextLink from "next/link";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkipLink } from "./skip-link";
import { LogoMark, Wordmark } from "./wordmark";

/** Header, content, footer (docs/06 §11). Storefront pages fill the content. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <SkipLink />
        {/* Slim header: the storefront itself carries the Creative's identity (Phase 7.1). */}
        <header className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
          <NextLink
            href="/"
            aria-label="Modgeto home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <LogoMark className="size-7" />
          </NextLink>
          <NextLink
            href="/auth/sign-in"
            className="flex h-10 items-center rounded-full px-3 text-label text-foreground-secondary hover:bg-surface-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Sign in
          </NextLink>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-body-sm text-foreground-muted md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
            <NextLink
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-md text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Built with <span className="font-semibold text-foreground">modgeto</span>
            </NextLink>
            <p>
              Project payments are made directly to the Creative. Modgeto does not collect them.
            </p>
          </div>
        </footer>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

/** Centred, single-task layout for sign up, sign in and verification. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <SkipLink />
        <header className="mx-auto flex h-16 w-full max-w-[1280px] items-center px-4 md:px-6 lg:px-8">
          <NextLink
            href="/"
            aria-label="Modgeto home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
          >
            <Wordmark />
          </NextLink>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex flex-1 items-start justify-center px-4 pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] outline-none md:items-center md:pt-0"
        >
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-sm md:p-8">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
