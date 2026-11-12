/**
 * Service, moderation, proposal, project, account and subscription state machines
 * (docs/03 §71–76, D-003, D-005, D-015, D-017, D-019). The Request machine is in request.ts.
 */
import type { Actor } from "./actors";
import {
  type ServiceLifecycle,
  type SubscriptionStatus,
  graceEndsAt,
  isValidCapacity,
} from "./capacity";
import { type Result, err, ok } from "./result";

type Rule<S extends string, A extends string, X extends string> = {
  action: A;
  from: readonly S[];
  to: S;
  actors: readonly X[];
};

function applyRule<S extends string, A extends string, X extends string>(
  machine: string,
  rules: readonly Rule<S, A, X>[],
  state: S,
  action: A,
  actor: X,
): Result<S> {
  const rule = rules.find((r) => r.action === action);
  if (!rule) return err("UNKNOWN_ACTION", `${machine}: unknown action ${action}.`);
  if (!rule.actors.includes(actor)) {
    return err("WRONG_ACTOR", `${machine}: ${actor} cannot ${action}.`);
  }
  if (!rule.from.includes(state)) {
    return err("INVALID_TRANSITION", `${machine}: ${action} is not allowed while ${state}.`);
  }
  return ok(rule.to);
}

// ---------------------------------------------------------------------------
// Service lifecycle (docs/03 §72, D-005)
// ---------------------------------------------------------------------------

export type ServiceAction =
  | "PUBLISH"
  | "UNPUBLISH"
  | "MAKE_UNAVAILABLE"
  | "RESTORE_AVAILABILITY"
  | "DEACTIVATE_FOR_CAPACITY"
  | "REACTIVATE"
  | "ARCHIVE"
  | "RESTORE_TO_DRAFT";

const SERVICE_RULES: readonly Rule<ServiceLifecycle, ServiceAction, Actor>[] = [
  { action: "PUBLISH", from: ["DRAFT"], to: "PUBLISHED", actors: ["CREATIVE"] },
  // Unpublishing frees the slot and returns to Draft (D-005).
  { action: "UNPUBLISH", from: ["PUBLISHED", "UNAVAILABLE"], to: "DRAFT", actors: ["CREATIVE"] },
  { action: "MAKE_UNAVAILABLE", from: ["PUBLISHED"], to: "UNAVAILABLE", actors: ["CREATIVE"] },
  { action: "RESTORE_AVAILABILITY", from: ["UNAVAILABLE"], to: "PUBLISHED", actors: ["CREATIVE"] },
  {
    action: "DEACTIVATE_FOR_CAPACITY",
    from: ["PUBLISHED", "UNAVAILABLE"],
    to: "SUBSCRIPTION_INACTIVE",
    actors: ["SYSTEM"],
  },
  // Renewal revalidates and reactivates without rebuilding (SUB-007).
  {
    action: "REACTIVATE",
    from: ["SUBSCRIPTION_INACTIVE"],
    to: "PUBLISHED",
    actors: ["CREATIVE", "SYSTEM"],
  },
  {
    action: "ARCHIVE",
    from: ["DRAFT", "PUBLISHED", "UNAVAILABLE", "SUBSCRIPTION_INACTIVE"],
    to: "ARCHIVED",
    actors: ["CREATIVE"],
  },
  { action: "RESTORE_TO_DRAFT", from: ["ARCHIVED"], to: "DRAFT", actors: ["CREATIVE"] },
];

export type ServiceGuards = {
  /** Output of publish validation (policies.ts); empty means publishable. */
  publishBlockerCount?: number;
  /** The Creative has a free published slot (capacity.ts). */
  hasFreeSlot?: boolean;
};

export function transitionService(
  lifecycle: ServiceLifecycle,
  action: ServiceAction,
  actor: Actor,
  guards: ServiceGuards = {},
): Result<ServiceLifecycle> {
  const next = applyRule("Service", SERVICE_RULES, lifecycle, action, actor);
  if (!next.ok) return next;
  if (action === "PUBLISH" || action === "REACTIVATE") {
    if ((guards.publishBlockerCount ?? 0) > 0) {
      return err("NOT_PUBLISHABLE", "Fix the highlighted sections before publishing.");
    }
    if (!guards.hasFreeSlot) {
      return err(
        "NO_CAPACITY",
        "All published-Service slots are in use. Increase capacity to publish.",
      );
    }
  }
  return next;
}

/** Drafts with no Request or Project history may be deleted; anything else is archived (SRV-012). */
export function canDeleteService(lifecycle: ServiceLifecycle, hasHistory: boolean): boolean {
  return lifecycle === "DRAFT" && !hasHistory;
}

// ---------------------------------------------------------------------------
// Service moderation overlay (docs/03 §14, D-003)
// ---------------------------------------------------------------------------

export type ModerationStatus = "NORMAL" | "PLATFORM_DISABLED";

/** Admin-only; a reason is always required and audited (docs/06 §78). */
export function transitionModeration(
  status: ModerationStatus,
  action: "DISABLE" | "RESTORE",
  actor: Actor,
  reason: string,
): Result<ModerationStatus> {
  if (actor !== "ADMIN") return err("WRONG_ACTOR", "Only an Admin can moderate Services.");
  if (reason.trim().length === 0) return err("REASON_REQUIRED", "Enter a reason for this action.");
  if (action === "DISABLE") {
    return status === "NORMAL"
      ? ok("PLATFORM_DISABLED")
      : err("INVALID_TRANSITION", "Already disabled.");
  }
  // Restoring moderation never changes the lifecycle state (docs/05 §27).
  return status === "PLATFORM_DISABLED" ? ok("NORMAL") : err("INVALID_TRANSITION", "Not disabled.");
}

// ---------------------------------------------------------------------------
// CommercialProposal (docs/03 §41, §73, D-017)
// ---------------------------------------------------------------------------

export type ProposalStatus = "PROPOSED" | "ACCEPTED" | "REJECTED" | "SUPERSEDED" | "EXPIRED";
export type ProposalAction = "ACCEPT" | "REJECT" | "SUPERSEDE" | "EXPIRE";

const PROPOSAL_RULES: readonly Rule<ProposalStatus, ProposalAction, Actor>[] = [
  { action: "ACCEPT", from: ["PROPOSED"], to: "ACCEPTED", actors: ["CLIENT"] },
  { action: "REJECT", from: ["PROPOSED"], to: "REJECTED", actors: ["CLIENT"] },
  // A replacement proposal from the Creative supersedes an unaccepted one.
  { action: "SUPERSEDE", from: ["PROPOSED"], to: "SUPERSEDED", actors: ["CREATIVE"] },
  { action: "EXPIRE", from: ["PROPOSED"], to: "EXPIRED", actors: ["SYSTEM"] },
];

export function isProposalExpired(validUntil: Date | null, now: Date): boolean {
  return validUntil !== null && now.getTime() > validUntil.getTime();
}

export function transitionProposal(
  status: ProposalStatus,
  action: ProposalAction,
  actor: Actor,
  context: { validUntil: Date | null; now: Date },
): Result<ProposalStatus> {
  const next = applyRule("Proposal", PROPOSAL_RULES, status, action, actor);
  if (!next.ok) return next;
  const expired = isProposalExpired(context.validUntil, context.now);
  if (action === "ACCEPT" && expired) {
    return err("PROPOSAL_EXPIRED", "This quote has expired. Ask the Creative to renew it.");
  }
  if (action === "EXPIRE" && !expired) {
    return err("NOT_EXPIRED", "This proposal is still valid.");
  }
  return next;
}

// ---------------------------------------------------------------------------
// Project (docs/03 §47–52, §75)
// ---------------------------------------------------------------------------

export type ProjectStatus = "ACTIVE" | "COMPLETED";

/** Only the owning Creative closes an Active Project. No V2 conditions apply (PRJ-005). */
export function closeProject(
  status: ProjectStatus,
  actor: Actor,
  creativeSuspended = false,
): Result<ProjectStatus> {
  if (actor !== "CREATIVE") return err("WRONG_ACTOR", "Only the Creative can close a Project.");
  if (creativeSuspended)
    return err("ACCOUNT_SUSPENDED", "Suspended accounts cannot close Projects.");
  if (status !== "ACTIVE")
    return err("INVALID_TRANSITION", "Only an Active Project can be closed.");
  return ok("COMPLETED");
}

// ---------------------------------------------------------------------------
// Account (docs/03 §5, §71)
// ---------------------------------------------------------------------------

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETION_PENDING";
/** OWNER is the account holder acting on their own account. */
export type AccountActor = "OWNER" | "ADMIN" | "SYSTEM";
export type AccountAction = "COMPLETE_VERIFICATION" | "SUSPEND" | "RESTORE" | "REQUEST_DELETION";

const ACCOUNT_RULES: readonly Rule<AccountStatus, AccountAction, AccountActor>[] = [
  {
    action: "COMPLETE_VERIFICATION",
    from: ["PENDING_VERIFICATION"],
    to: "ACTIVE",
    actors: ["SYSTEM"],
  },
  {
    action: "SUSPEND",
    from: ["ACTIVE", "PENDING_VERIFICATION"],
    to: "SUSPENDED",
    actors: ["ADMIN"],
  },
  { action: "RESTORE", from: ["SUSPENDED"], to: "ACTIVE", actors: ["ADMIN"] },
  {
    action: "REQUEST_DELETION",
    from: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"],
    to: "DELETION_PENDING",
    actors: ["OWNER"],
  },
];

export function transitionAccount(
  status: AccountStatus,
  action: AccountAction,
  actor: AccountActor,
  context: { emailVerified?: boolean; phoneVerified?: boolean; reason?: string } = {},
): Result<AccountStatus> {
  const next = applyRule("Account", ACCOUNT_RULES, status, action, actor);
  if (!next.ok) return next;
  if (action === "COMPLETE_VERIFICATION" && !(context.emailVerified && context.phoneVerified)) {
    return err("VERIFICATION_INCOMPLETE", "Both email and phone must be verified.");
  }
  if ((action === "SUSPEND" || action === "RESTORE") && !context.reason?.trim()) {
    return err("REASON_REQUIRED", "Enter a reason for this action.");
  }
  return next;
}

// ---------------------------------------------------------------------------
// Platform subscription (docs/03 §57–58, §76, D-015)
// ---------------------------------------------------------------------------

export type SubscriptionState = {
  status: SubscriptionStatus;
  publishedServiceLimit: number;
  /** Downgrade waiting for the end of the billing period (D-015). */
  scheduledServiceLimit: number | null;
  pastDueSince: Date | null;
};

/**
 * Status changes come only from server-verified Paystack events or scheduled jobs.
 * A browser return never activates capacity (docs/05 §51).
 */
export type SubscriptionEvent =
  | { type: "PAYMENT_VERIFIED"; limit: number }
  | { type: "PAYMENT_FAILED"; at: Date }
  | { type: "PAYMENT_RECOVERED" }
  | { type: "GRACE_PERIOD_CHECK"; now: Date }
  | { type: "PERIOD_ENDED" }
  | { type: "CANCELLATION_EFFECTIVE" };

export const FREE_SUBSCRIPTION: SubscriptionState = {
  status: "FREE",
  publishedServiceLimit: 1,
  scheduledServiceLimit: null,
  pastDueSince: null,
};

export function applySubscriptionEvent(
  state: SubscriptionState,
  event: SubscriptionEvent,
  actor: Actor,
): Result<SubscriptionState> {
  if (actor !== "SYSTEM") {
    return err("WRONG_ACTOR", "Subscription status changes only after server verification.");
  }
  const invalid = () =>
    err<SubscriptionState>(
      "INVALID_TRANSITION",
      `${event.type} is not allowed while ${state.status}.`,
    );

  switch (event.type) {
    case "PAYMENT_VERIFIED":
      // First upgrade, renewal, or upgrade (immediate, full price, new cycle; D-015).
      if (!isValidCapacity(event.limit) || event.limit < 2) {
        return err("INVALID_CAPACITY", "Paid capacity is 2 to 10 Services.");
      }
      if (state.status === "PAST_DUE") return invalid();
      return ok({
        status: "ACTIVE",
        publishedServiceLimit: event.limit,
        scheduledServiceLimit: null,
        pastDueSince: null,
      });

    case "PAYMENT_FAILED":
      return state.status === "ACTIVE"
        ? ok({ ...state, status: "PAST_DUE", pastDueSince: event.at })
        : invalid();

    case "PAYMENT_RECOVERED":
      return state.status === "PAST_DUE"
        ? ok({ ...state, status: "ACTIVE", pastDueSince: null })
        : invalid();

    case "GRACE_PERIOD_CHECK":
      if (state.status !== "PAST_DUE" || !state.pastDueSince) return invalid();
      if (event.now.getTime() < graceEndsAt(state.pastDueSince).getTime()) return ok(state);
      // Unresolved after 7 days: expires and capacity reverts to 1 (D-015).
      return ok({
        ...state,
        status: "EXPIRED",
        publishedServiceLimit: 1,
        scheduledServiceLimit: null,
      });

    case "PERIOD_ENDED":
      if (state.status !== "ACTIVE") return invalid();
      if (state.scheduledServiceLimit === null) return ok(state);
      return ok(
        state.scheduledServiceLimit === 1
          ? { ...FREE_SUBSCRIPTION }
          : {
              ...state,
              publishedServiceLimit: state.scheduledServiceLimit,
              scheduledServiceLimit: null,
            },
      );

    case "CANCELLATION_EFFECTIVE":
      return state.status === "ACTIVE" || state.status === "PAST_DUE"
        ? ok({
            status: "CANCELLED",
            publishedServiceLimit: 1,
            scheduledServiceLimit: null,
            pastDueSince: null,
          })
        : invalid();
  }
}

/** The Creative schedules a downgrade; it applies at period end (D-015). */
export function scheduleDowngrade(
  state: SubscriptionState,
  limit: number,
): Result<SubscriptionState> {
  if (state.status !== "ACTIVE")
    return err("INVALID_TRANSITION", "Only an active subscription can be downgraded.");
  if (!isValidCapacity(limit) || limit >= state.publishedServiceLimit) {
    return err("INVALID_CAPACITY", "Choose a lower capacity.");
  }
  return ok({ ...state, scheduledServiceLimit: limit });
}
