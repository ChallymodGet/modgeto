/**
 * Task shells: Client configuration (docs/04 §35, §41) and the Service
 * Builder (docs/04 §12, §37). Both keep every step reachable on phones.
 */
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { SectionNavigation, type SectionNavItem } from "@/components/ui/section-navigation";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PageContainer, PageHeader } from "./page";
import { SkipLink } from "./skip-link";
import { LogoMark } from "./wordmark";

type Step = { label: string; href?: string };

/** Step progress as an ordered list; the current step has `aria-current="step"`. */
function StepProgress({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2 text-label">
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          const content = (
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
                  // Only the current step's name shows on phones; all show from md.
                  state === "current" ? "text-foreground" : "sr-only md:not-sr-only",
                  state === "upcoming" && "text-foreground-muted",
                  state === "done" && "text-foreground-secondary",
                )}
              >
                {step.label}
                {state === "done" && <span className="sr-only"> (complete)</span>}
              </span>
            </>
          );
          return (
            <li key={step.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="h-px w-4 bg-border-strong md:w-8" />}
              {step.href && state === "done" ? (
                <NextLink
                  href={step.href}
                  className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {content}
                </NextLink>
              ) : (
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className="flex items-center gap-2"
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type ConfigurationShellProps = {
  back: { href: string; label: string };
  steps: Step[];
  currentStep: number;
  /** Price summary. A sticky aside from `lg`; under the content below that. */
  summary: ReactNode;
  children: ReactNode;
};

/** Configure → Brief → Review. No workspace navigation (docs/04 §40). */
export function ConfigurationShell({
  back,
  steps,
  currentStep,
  summary,
  children,
}: ConfigurationShellProps) {
  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-background">
        <SkipLink />
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:px-6 lg:px-8">
            <NextLink
              href={back.href}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1 text-label text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              <span className="sr-only sm:not-sr-only">{back.label}</span>
              <span className="sm:hidden">Back</span>
            </NextLink>
            <div className="flex flex-1 justify-center">
              <StepProgress steps={steps} current={currentStep} />
            </div>
            <LogoMark className="hidden size-7 sm:block" />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="outline-none">
          <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)] lg:gap-10 lg:px-8">
            <div className="min-w-0">{children}</div>
            <aside aria-label="Price summary" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              {summary}
            </aside>
          </div>
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

type BuilderShellProps = {
  title: string;
  status?: ReactNode;
  back: { href: string; label: string };
  actions?: ReactNode;
  sections: SectionNavItem[];
  currentHref: string;
  previous?: { href: string; label: string };
  next?: { href: string; label: string };
  children: ReactNode;
};

/**
 * Service Builder: global navigation stays (it lives inside the Creative
 * shell), sections sit in a local sidebar, and Previous / Continue move
 * through them. The Builder is never a forced linear wizard (docs/04 §37).
 */
export function BuilderShell({
  title,
  status,
  back,
  actions,
  sections,
  currentHref,
  previous,
  next,
  children,
}: BuilderShellProps) {
  return (
    <PageContainer>
      <PageHeader title={title} status={status} back={back} actions={actions} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <SectionNavigation
            label="Service Builder sections"
            items={sections}
            currentHref={currentHref}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          {children}
          {(previous || next) && (
            <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
              {previous ? (
                <ButtonLink href={previous.href} variant="secondary">
                  <ChevronLeft aria-hidden="true" />
                  {previous.label}
                </ButtonLink>
              ) : (
                <span />
              )}
              {next && (
                <ButtonLink href={next.href}>
                  {next.label}
                  <ChevronRight aria-hidden="true" />
                </ButtonLink>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
