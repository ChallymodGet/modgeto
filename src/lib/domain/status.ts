/**
 * Actor-facing status language (docs/04 §9, §21, §46–47, docs/07 §37, docs/08 §15,
 * D-006, D-007, D-027). Backend enums never reach the UI directly (CLAUDE.md §13).
 * Wording follows the Brand Guidelines: never "Paid" for Ready to Start.
 */
import type { ServiceLifecycle } from "./capacity";
import type { ModerationStatus, ProjectStatus } from "./lifecycles";
import type { Availability } from "./policies";
import type { AwaitingClientReason, RequestStatus } from "./request";

export type StatusIntent = "neutral" | "info" | "success" | "warning" | "danger";

export type StatusLabel = { label: string; intent: StatusIntent };

export type CreativeRequestGroup =
  "NEW" | "AWAITING_CLIENT" | "AWAITING_PAYMENT" | "READY_TO_START" | "CLOSED";
export type ClientRequestGroup =
  | "AWAITING_CREATIVE"
  | "ACTION_REQUIRED"
  | "AWAITING_PAYMENT_CONFIRMATION"
  | "READY_TO_START"
  | "CLOSED";

export type RequestView = {
  status: RequestStatus;
  awaitingClientReason: AwaitingClientReason | null;
  /** The latest RequestResponse is from the Client and has no reply yet (D-027). */
  clientAwaitingReply?: boolean;
};

export const CREATIVE_GROUP_LABELS: Record<CreativeRequestGroup, string> = {
  NEW: "New",
  AWAITING_CLIENT: "Awaiting Client",
  AWAITING_PAYMENT: "Awaiting Payment",
  READY_TO_START: "Ready to Start",
  CLOSED: "Closed",
};

export const CLIENT_GROUP_LABELS: Record<ClientRequestGroup, string> = {
  AWAITING_CREATIVE: "Awaiting Creative",
  ACTION_REQUIRED: "Action Required",
  AWAITING_PAYMENT_CONFIRMATION: "Awaiting Payment Confirmation",
  READY_TO_START: "Ready to Start",
  CLOSED: "Closed",
};

export function creativeRequestGroup(status: RequestStatus): CreativeRequestGroup {
  switch (status) {
    case "SUBMITTED":
      return "NEW";
    case "AWAITING_CLIENT":
    case "ACCEPTED":
    case "AWAITING_TERMS":
      return "AWAITING_CLIENT";
    case "AWAITING_COMMITMENT":
    case "AWAITING_PAYMENT_CONFIRMATION":
    case "PARTIALLY_CONFIRMED":
      return "AWAITING_PAYMENT";
    case "READY_TO_START":
      return "READY_TO_START";
    case "CONVERTED_TO_PROJECT":
    case "DECLINED":
    case "WITHDRAWN":
    case "EXPIRED":
      return "CLOSED";
  }
}

export function clientRequestGroup(status: RequestStatus): ClientRequestGroup {
  switch (status) {
    case "SUBMITTED":
      return "AWAITING_CREATIVE";
    case "AWAITING_CLIENT":
    case "ACCEPTED":
    case "AWAITING_TERMS":
    case "AWAITING_COMMITMENT":
    case "PARTIALLY_CONFIRMED":
      return "ACTION_REQUIRED";
    case "AWAITING_PAYMENT_CONFIRMATION":
      return "AWAITING_PAYMENT_CONFIRMATION";
    case "READY_TO_START":
      return "READY_TO_START";
    case "CONVERTED_TO_PROJECT":
    case "DECLINED":
    case "WITHDRAWN":
    case "EXPIRED":
      return "CLOSED";
  }
}

const CLOSED_LABELS: Partial<Record<RequestStatus, StatusLabel>> = {
  CONVERTED_TO_PROJECT: { label: "Project started", intent: "info" },
  DECLINED: { label: "Declined", intent: "danger" },
  WITHDRAWN: { label: "Withdrawn", intent: "neutral" },
  EXPIRED: { label: "Expired", intent: "neutral" },
};

export function creativeRequestLabel(view: RequestView): StatusLabel {
  const closed = CLOSED_LABELS[view.status];
  if (closed) return closed;
  switch (view.status) {
    case "SUBMITTED":
      return view.clientAwaitingReply
        ? { label: "Client responded", intent: "info" }
        : { label: "New Request", intent: "info" };
    case "AWAITING_CLIENT":
      if (view.clientAwaitingReply) return { label: "Client asked a question", intent: "info" };
      if (view.awaitingClientReason === "QUOTE_PROPOSED")
        return { label: "Quote sent", intent: "neutral" };
      if (view.awaitingClientReason === "CHANGES_PROPOSED")
        return { label: "Changes sent", intent: "neutral" };
      return { label: "Question sent", intent: "neutral" };
    case "ACCEPTED":
    case "AWAITING_TERMS":
      return { label: "Awaiting Client", intent: "neutral" };
    case "AWAITING_COMMITMENT":
      return { label: "Awaiting payment", intent: "warning" };
    case "AWAITING_PAYMENT_CONFIRMATION":
      return { label: "Payment to confirm", intent: "warning" };
    case "PARTIALLY_CONFIRMED":
      return { label: "Partial commitment", intent: "warning" };
    default:
      return { label: "Ready to Start", intent: "success" };
  }
}

export function clientRequestLabel(view: RequestView): StatusLabel {
  const closed = CLOSED_LABELS[view.status];
  if (closed) return closed;
  switch (view.status) {
    case "SUBMITTED":
      return { label: "Awaiting Creative", intent: "neutral" };
    case "AWAITING_CLIENT":
      if (view.clientAwaitingReply) return { label: "Waiting for a reply", intent: "neutral" };
      if (view.awaitingClientReason === "QUOTE_PROPOSED")
        return { label: "Review proposal", intent: "info" };
      if (view.awaitingClientReason === "CHANGES_PROPOSED")
        return { label: "Review changes", intent: "info" };
      return { label: "Answer question", intent: "info" };
    case "ACCEPTED":
    case "AWAITING_TERMS":
      return { label: "Accept terms", intent: "info" };
    case "AWAITING_COMMITMENT":
      return { label: "Commitment payment", intent: "warning" };
    case "AWAITING_PAYMENT_CONFIRMATION":
      return { label: "Payment declared", intent: "warning" };
    case "PARTIALLY_CONFIRMED":
      return { label: "Remaining commitment", intent: "warning" };
    default:
      return { label: "Ready to Start", intent: "success" };
  }
}

/** Platform disabled overrides the lifecycle in the Creative's own view (docs/08 §15). */
export function serviceStatusLabel(
  lifecycle: ServiceLifecycle,
  moderation: ModerationStatus,
): StatusLabel {
  if (moderation === "PLATFORM_DISABLED") return { label: "Platform disabled", intent: "danger" };
  switch (lifecycle) {
    case "DRAFT":
      return { label: "Draft", intent: "neutral" };
    case "PUBLISHED":
      return { label: "Published", intent: "success" };
    case "UNAVAILABLE":
      return { label: "Unavailable", intent: "neutral" };
    case "SUBSCRIPTION_INACTIVE":
      return { label: "Subscription inactive", intent: "warning" };
    case "ARCHIVED":
      return { label: "Archived", intent: "neutral" };
  }
}

export function projectStatusLabel(status: ProjectStatus): StatusLabel {
  return status === "ACTIVE"
    ? { label: "Active", intent: "info" }
    : { label: "Completed", intent: "success" };
}

export function availabilityLabel(availability: Availability): StatusLabel {
  switch (availability) {
    case "AVAILABLE":
      return { label: "Available", intent: "success" };
    case "LIMITED":
      return { label: "Limited availability", intent: "warning" };
    case "UNAVAILABLE":
      return { label: "Unavailable", intent: "neutral" };
  }
}
