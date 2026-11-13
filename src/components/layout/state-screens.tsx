/**
 * Shared system states (docs/04 §45, docs/06 §9). Public unavailable states
 * never reveal private reasons such as a Creative's subscription (CLAUDE.md §12).
 */
import { Construction, FileQuestion, Lock, PauseCircle } from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type StateProps = {
  title?: string;
  description?: ReactNode;
  action?: { href: string; label: string };
};

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-12 md:py-20">{children}</div>
  );
}

export function NotFoundScreen({
  title = "We can't find that page",
  description = "The link may be wrong, or the page may have moved.",
  action = { href: "/", label: "Go to Modgeto" },
}: StateProps) {
  return (
    <Centered>
      <EmptyState
        headingLevel="h2"
        icon={<FileQuestion />}
        title={title}
        description={description}
        actions={<ButtonLink href={action.href}>{action.label}</ButtonLink>}
      />
    </Centered>
  );
}

export function PermissionDeniedScreen({
  title = "You don't have access to this",
  description = "This page belongs to another account. Check that you're signed in with the right email address.",
  action,
}: StateProps) {
  return (
    <Centered>
      <EmptyState
        icon={<Lock />}
        title={title}
        description={description}
        actions={action && <ButtonLink href={action.href}>{action.label}</ButtonLink>}
      />
    </Centered>
  );
}

/** A Service or profile that exists but can't take Requests right now. */
export function ResourceUnavailableScreen({
  title = "This isn't available right now",
  description = "It may be paused or no longer offered. Existing Requests are not affected.",
  action,
}: StateProps) {
  return (
    <Centered>
      <EmptyState
        icon={<PauseCircle />}
        title={title}
        description={description}
        actions={action && <ButtonLink href={action.href}>{action.label}</ButtonLink>}
      />
    </Centered>
  );
}

/**
 * Development placeholder for routes whose screen is built in a later phase
 * (D-026 order). Only reachable where preview routes are enabled (D-040).
 */
export function ScreenPlaceholder({
  title,
  phase,
  source,
}: {
  title: string;
  phase: string;
  source: string;
}) {
  return (
    <EmptyState
      icon={<Construction />}
      title={`${title} is built in ${phase}`}
      description={`The route and shell are ready. Screen specification: ${source}.`}
    />
  );
}
