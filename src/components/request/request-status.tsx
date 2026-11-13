/**
 * Request status in each actor's language, with "what happens next" (docs/04
 * §46–47, D-027, CLAUDE.md §13). Backend enums never reach the UI.
 */
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { type RequestView, clientRequestLabel, creativeRequestLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

export type RequestActor = "CREATIVE" | "CLIENT";

/** The next step in plain words. `counterpart` is the other person's display name. */
export function nextStep(view: RequestView, actor: RequestActor, counterpart: string): string {
  const s = view.status;
  if (actor === "CREATIVE") {
    switch (s) {
      case "SUBMITTED":
        return view.clientAwaitingReply
          ? `${counterpart} replied. Review their answer, then respond.`
          : "Review the Brief, then accept, propose changes, send a quote, ask a question or decline.";
      case "AWAITING_CLIENT":
        if (view.clientAwaitingReply)
          return `${counterpart} asked a question. Reply to keep things moving.`;
        return view.awaitingClientReason === "CLARIFICATION_REQUESTED"
          ? `Waiting for ${counterpart} to answer your question.`
          : `Waiting for ${counterpart} to review your proposal.`;
      case "ACCEPTED":
      case "AWAITING_TERMS":
        return `Waiting for ${counterpart} to accept the final terms.`;
      case "AWAITING_COMMITMENT":
        return `Waiting for ${counterpart} to pay the commitment directly to you.`;
      case "AWAITING_PAYMENT_CONFIRMATION":
        return `${counterpart} says they've paid. Check your account, then confirm the amount you received.`;
      case "PARTIALLY_CONFIRMED":
        return "Part of the commitment is confirmed. Waiting for the rest.";
      case "READY_TO_START":
        return "Everything required to begin this Project is complete. Start the Project when you're ready.";
      case "CONVERTED_TO_PROJECT":
        return "This Request is now a Project.";
      case "DECLINED":
        return "You declined this Request.";
      case "WITHDRAWN":
        return `${counterpart} withdrew this Request.`;
      case "EXPIRED":
        return "This Request expired.";
    }
  }
  switch (s) {
    case "SUBMITTED":
      return `${counterpart} is reviewing your Request. We'll email you when there's an update.`;
    case "AWAITING_CLIENT":
      if (view.clientAwaitingReply) return `Waiting for ${counterpart} to reply.`;
      if (view.awaitingClientReason === "QUOTE_PROPOSED")
        return "Review the proposal, then accept or decline it.";
      if (view.awaitingClientReason === "CHANGES_PROPOSED")
        return "Review the proposed changes, then accept or decline them.";
      return `Answer ${counterpart}'s question so they can continue.`;
    case "ACCEPTED":
    case "AWAITING_TERMS":
      return "Review and accept the final terms.";
    case "AWAITING_COMMITMENT":
      return `Pay the commitment directly to ${counterpart}, then let them know you've paid.`;
    case "AWAITING_PAYMENT_CONFIRMATION":
      return `Payment declared. Waiting for ${counterpart} to confirm they received it.`;
    case "PARTIALLY_CONFIRMED":
      return "Part of your commitment is confirmed. Pay the remaining amount to continue.";
    case "READY_TO_START":
      return `Everything required is in place. ${counterpart} will start the Project.`;
    case "CONVERTED_TO_PROJECT":
      return "Your Project has started.";
    case "DECLINED":
      return `${counterpart} declined this Request.`;
    case "WITHDRAWN":
      return "You withdrew this Request.";
    case "EXPIRED":
      return "This Request expired.";
  }
}

export function requestLabel(view: RequestView, actor: RequestActor) {
  return actor === "CREATIVE" ? creativeRequestLabel(view) : clientRequestLabel(view);
}

/** Status badge plus the next step. `banner` is the prominent version for detail pages. */
export function RequestStatus({
  view,
  actor,
  counterpart,
  variant = "inline",
  className,
}: {
  view: RequestView;
  actor: RequestActor;
  counterpart: string;
  variant?: "inline" | "banner";
  className?: string;
}) {
  const label = requestLabel(view, actor);
  const text = nextStep(view, actor, counterpart);
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-4",
          label.intent === "warning" && "border-warning-border bg-warning-subtle",
          label.intent === "success" && "border-success-border bg-success-subtle",
          label.intent === "info" && "border-info-border bg-info-subtle",
          (label.intent === "neutral" || label.intent === "danger") && "border-border bg-surface",
          className,
        )}
      >
        <StatusBadge status={label} size="md" className="bg-surface" />
        <p className="flex items-start gap-2 text-body-sm text-foreground">
          <ArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground-muted" />
          <span>
            <span className="sr-only">Next step: </span>
            {text}
          </span>
        </p>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <StatusBadge status={label} />
      <p className="text-body-sm text-foreground-secondary">{text}</p>
    </div>
  );
}
