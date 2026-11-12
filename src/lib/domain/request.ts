/**
 * Request state machine (docs/03 §37–50, D-002, D-006, D-007, D-008, D-027, D-028, D-030).
 *
 * Principle (D-027): the status describes the commercial position. Who owes a
 * reply is derived from RequestResponses, not stored here.
 *
 * After agreement, the status is always derived from facts (terms, commitment,
 * confirmed payments), so it can never drift from them. ACCEPTED is part of the
 * approved status set but is never a resting state: an agreed Request always has
 * a next step (terms, commitment, or Ready to Start).
 */
import type { Actor } from "./actors";
import type { PriceState } from "./pricing";
import { type Result, err, ok } from "./result";

export const REQUEST_STATUSES = [
  "SUBMITTED",
  "AWAITING_CLIENT",
  "ACCEPTED",
  "AWAITING_TERMS",
  "AWAITING_COMMITMENT",
  "AWAITING_PAYMENT_CONFIRMATION",
  "PARTIALLY_CONFIRMED",
  "READY_TO_START",
  "CONVERTED_TO_PROJECT",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED", // reserved, no automatic timer in V1 (D-017)
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type AwaitingClientReason =
  "CHANGES_PROPOSED" | "QUOTE_PROPOSED" | "CLARIFICATION_REQUESTED";

export const CLOSED_STATUSES: readonly RequestStatus[] = [
  "CONVERTED_TO_PROJECT",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED",
];

export type RequestState = {
  status: RequestStatus;
  /** Set only while status is AWAITING_CLIENT. */
  awaitingClientReason: AwaitingClientReason | null;
  /** Price state of the submitted configuration. */
  submittedPriceState: PriceState;
  /** A CommercialAgreement exists for scope and price. */
  agreed: boolean;
  /** D-002: true when the submission acknowledgement counts, or the Client accepted final terms. */
  finalTermsAccepted: boolean;
  /** Commitment from the current agreement, in minor units. Null means no commitment required. */
  requiredCommitmentMinor: bigint | null;
  /** Creative-confirmed total, net of reversing adjustments. Only this counts (PAY-005). */
  confirmedMinor: bigint;
  /** Client declarations the Creative has not yet resolved (D-028). */
  pendingDeclarations: number;
};

/** Facts about the participants that the caller loads (docs/03 invariant 4, D-030). */
export type Participants = { creativeSuspended: boolean; clientSuspended: boolean };

export type RequestAction =
  // Creative
  | { type: "ACCEPT_REQUEST"; requiredCommitmentMinor: bigint | null }
  | { type: "SEND_PROPOSAL"; kind: "CHANGES" | "QUOTE" }
  | { type: "REQUEST_CLARIFICATION" }
  | { type: "DECLINE" }
  | { type: "CONFIRM_PAYMENT"; amountMinor: bigint; resolvesDeclaration: boolean }
  | { type: "MARK_NOT_RECEIVED" }
  | { type: "RECORD_ADJUSTMENT"; amountMinor: bigint }
  | { type: "START_PROJECT" }
  // Client
  | { type: "RESPOND_TO_CLARIFICATION" }
  | { type: "ACCEPT_PROPOSAL"; requiredCommitmentMinor: bigint | null; proposalExpired: boolean }
  | { type: "REJECT_PROPOSAL" }
  | { type: "ACCEPT_TERMS" }
  | { type: "DECLARE_PAYMENT" }
  | { type: "WITHDRAW" };

export type RequestActionType = RequestAction["type"];

/** Domain events emitted by transitions (docs/03 §62), for notifications, audit and analytics. */
export type RequestEvent =
  | "RequestAccepted"
  | "CommercialProposalCreated"
  | "RequestChangesRequested"
  | "RequestResponseCreated"
  | "CommercialProposalAccepted"
  | "CommercialProposalRejected"
  | "RequestDeclined"
  | "RequestWithdrawn"
  | "TermsAccepted"
  | "PaymentDeclared"
  | "PaymentConfirmed"
  | "PaymentNotReceived"
  | "PaymentAdjusted"
  | "CommitmentSatisfied"
  | "RequestReadyToStart"
  | "ProjectStarted";

export type Transition = { state: RequestState; events: RequestEvent[] };

const CREATIVE_ACTIONS: ReadonlySet<RequestActionType> = new Set([
  "ACCEPT_REQUEST",
  "SEND_PROPOSAL",
  "REQUEST_CLARIFICATION",
  "DECLINE",
  "CONFIRM_PAYMENT",
  "MARK_NOT_RECEIVED",
  "RECORD_ADJUSTMENT",
  "START_PROJECT",
]);

const PAYMENT_STATUSES: readonly RequestStatus[] = [
  "AWAITING_COMMITMENT",
  "AWAITING_PAYMENT_CONFIRMATION",
  "PARTIALLY_CONFIRMED",
];

/** After agreement, where the Request stands (D-002, D-028). */
export function deriveAgreedStatus(state: RequestState): RequestStatus {
  if (!state.finalTermsAccepted) return "AWAITING_TERMS";
  const required = state.requiredCommitmentMinor;
  if (required === null || required === 0n) return "READY_TO_START";
  if (state.confirmedMinor >= required) return "READY_TO_START";
  if (state.pendingDeclarations > 0) return "AWAITING_PAYMENT_CONFIRMATION";
  if (state.confirmedMinor > 0n) return "PARTIALLY_CONFIRMED";
  return "AWAITING_COMMITMENT";
}

/** A commitment exists and Creative-confirmed payments cover it (docs/03 §46). */
export function commitmentSatisfied(state: RequestState): boolean {
  const required = state.requiredCommitmentMinor;
  return state.agreed && required !== null && required > 0n && state.confirmedMinor >= required;
}

export function isClosed(status: RequestStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

/** Initial state at submission. The submission acknowledgement is recorded as terms acceptance (D-002). */
export function submittedRequest(submittedPriceState: PriceState): RequestState {
  return {
    status: "SUBMITTED",
    awaitingClientReason: null,
    submittedPriceState,
    agreed: false,
    finalTermsAccepted: true,
    requiredCommitmentMinor: null,
    confirmedMinor: 0n,
    pendingDeclarations: 0,
  };
}

function settle(previous: RequestState, next: RequestState, events: RequestEvent[]): Transition {
  const status = deriveAgreedStatus(next);
  const settled: RequestState = { ...next, status, awaitingClientReason: null };
  const out = [...events];
  if (commitmentSatisfied(next) && !commitmentSatisfied(previous)) {
    out.push("CommitmentSatisfied");
  }
  if (status === "READY_TO_START" && previous.status !== "READY_TO_START") {
    out.push("RequestReadyToStart");
  }
  return { state: settled, events: out };
}

/**
 * Applies an action. Returns a stable error code when the actor may not do it or
 * the Request is not in a state that allows it.
 */
export function transitionRequest(
  state: RequestState,
  action: RequestAction,
  actor: Actor,
  participants: Participants = { creativeSuspended: false, clientSuspended: false },
): Result<Transition> {
  // Admins inspect but never act for participants (docs/04 §29).
  if (actor === "ADMIN" || actor === "SYSTEM") {
    return err("NOT_A_PARTICIPANT", "Only the Creative or Client can act on a Request.");
  }
  const expected = CREATIVE_ACTIONS.has(action.type) ? "CREATIVE" : "CLIENT";
  if (actor !== expected) {
    return err("WRONG_ACTOR", `Only the ${expected.toLowerCase()} can ${action.type}.`);
  }
  if (isClosed(state.status)) {
    return err("REQUEST_CLOSED", "This Request is closed.");
  }
  if (actor === "CREATIVE" ? participants.creativeSuspended : participants.clientSuspended) {
    return err("ACCOUNT_SUSPENDED", "Suspended accounts cannot act on Requests.");
  }

  const { status } = state;
  const notAllowed = () =>
    err<Transition>("INVALID_TRANSITION", `${action.type} is not allowed while ${status}.`);
  const proposalOpen =
    status === "AWAITING_CLIENT" && state.awaitingClientReason !== "CLARIFICATION_REQUESTED";

  switch (action.type) {
    case "ACCEPT_REQUEST": {
      if (status !== "SUBMITTED") return notAllowed();
      // Starting From and Custom Quote need a proposal the Client accepts (docs/01 §13.6–13.7).
      if (state.submittedPriceState !== "CALCULATED") {
        return err("PROPOSAL_REQUIRED", "Send a proposal to set the final price.");
      }
      return ok(
        settle(
          state,
          { ...state, agreed: true, requiredCommitmentMinor: action.requiredCommitmentMinor },
          ["RequestAccepted"],
        ),
      );
    }

    case "SEND_PROPOSAL": {
      // Allowed any time before Project Start; replaces an open proposal (D-008, D-030).
      return ok({
        state: {
          ...state,
          status: "AWAITING_CLIENT",
          awaitingClientReason: action.kind === "QUOTE" ? "QUOTE_PROPOSED" : "CHANGES_PROPOSED",
        },
        events:
          action.kind === "QUOTE"
            ? ["CommercialProposalCreated"]
            : ["CommercialProposalCreated", "RequestChangesRequested"],
      });
    }

    case "REQUEST_CLARIFICATION": {
      if (status !== "SUBMITTED") return notAllowed();
      return ok({
        state: {
          ...state,
          status: "AWAITING_CLIENT",
          awaitingClientReason: "CLARIFICATION_REQUESTED",
        },
        events: ["RequestResponseCreated"],
      });
    }

    case "RESPOND_TO_CLARIFICATION": {
      if (
        status !== "AWAITING_CLIENT" ||
        state.awaitingClientReason !== "CLARIFICATION_REQUESTED"
      ) {
        return notAllowed();
      }
      // Back to the Creative's turn (D-027).
      return ok({
        state: { ...state, status: "SUBMITTED", awaitingClientReason: null },
        events: ["RequestResponseCreated"],
      });
    }

    case "ACCEPT_PROPOSAL": {
      if (!proposalOpen) return notAllowed();
      if (action.proposalExpired) {
        return err("PROPOSAL_EXPIRED", "This quote has expired. Ask the Creative to renew it.");
      }
      // Any accepted proposal needs explicit final terms acceptance (D-002).
      return ok(
        settle(
          state,
          {
            ...state,
            agreed: true,
            finalTermsAccepted: false,
            requiredCommitmentMinor: action.requiredCommitmentMinor,
          },
          ["CommercialProposalAccepted"],
        ),
      );
    }

    case "REJECT_PROPOSAL": {
      if (!proposalOpen) return notAllowed();
      // Back to the Creative's turn; an earlier agreement still stands.
      if (!state.agreed) {
        return ok({
          state: { ...state, status: "SUBMITTED", awaitingClientReason: null },
          events: ["CommercialProposalRejected"],
        });
      }
      return ok(settle(state, state, ["CommercialProposalRejected"]));
    }

    case "ACCEPT_TERMS": {
      if (status !== "AWAITING_TERMS") return notAllowed();
      return ok(settle(state, { ...state, finalTermsAccepted: true }, ["TermsAccepted"]));
    }

    case "DECLARE_PAYMENT": {
      if (!PAYMENT_STATUSES.includes(status)) return notAllowed();
      return ok(
        settle(state, { ...state, pendingDeclarations: state.pendingDeclarations + 1 }, [
          "PaymentDeclared",
        ]),
      );
    }

    case "CONFIRM_PAYMENT": {
      if (!PAYMENT_STATUSES.includes(status)) return notAllowed();
      if (action.amountMinor <= 0n) {
        return err("INVALID_AMOUNT", "Confirm the amount actually received, above zero.");
      }
      if (action.resolvesDeclaration && state.pendingDeclarations === 0) {
        return err("NO_PENDING_DECLARATION", "There is no declaration waiting for confirmation.");
      }
      return ok(
        settle(
          state,
          {
            ...state,
            confirmedMinor: state.confirmedMinor + action.amountMinor,
            pendingDeclarations: state.pendingDeclarations - (action.resolvesDeclaration ? 1 : 0),
          },
          ["PaymentConfirmed"],
        ),
      );
    }

    case "MARK_NOT_RECEIVED": {
      if (state.pendingDeclarations === 0) {
        return err("NO_PENDING_DECLARATION", "There is no declaration waiting for confirmation.");
      }
      return ok(
        settle(state, { ...state, pendingDeclarations: state.pendingDeclarations - 1 }, [
          "PaymentNotReceived",
        ]),
      );
    }

    case "RECORD_ADJUSTMENT": {
      // Reversing correction; confirmations are immutable (D-030).
      if (!state.agreed || status === "AWAITING_CLIENT") return notAllowed();
      if (action.amountMinor >= 0n) {
        return err(
          "INVALID_AMOUNT",
          "An adjustment reverses a confirmed amount, so it must be negative.",
        );
      }
      if (state.confirmedMinor + action.amountMinor < 0n) {
        return err("INVALID_AMOUNT", "An adjustment cannot exceed the confirmed total.");
      }
      return ok(
        settle(state, { ...state, confirmedMinor: state.confirmedMinor + action.amountMinor }, [
          "PaymentAdjusted",
        ]),
      );
    }

    case "START_PROJECT": {
      if (status !== "READY_TO_START") return notAllowed();
      if (participants.clientSuspended) {
        return err("ACCOUNT_SUSPENDED", "A Project cannot start while a participant is suspended.");
      }
      return ok({
        state: { ...state, status: "CONVERTED_TO_PROJECT", awaitingClientReason: null },
        events: ["ProjectStarted"],
      });
    }

    case "DECLINE":
      return ok({
        state: { ...state, status: "DECLINED", awaitingClientReason: null },
        events: ["RequestDeclined"],
      });

    case "WITHDRAW":
      return ok({
        state: { ...state, status: "WITHDRAWN", awaitingClientReason: null },
        events: ["RequestWithdrawn"],
      });
  }
}

/** Which actions the actor can take now, so screens show only valid actions (docs/04 §10). */
export function availableRequestActions(
  state: RequestState,
  actor: Actor,
  participants?: Participants,
): RequestActionType[] {
  const probes: RequestAction[] = [
    { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null },
    { type: "SEND_PROPOSAL", kind: "CHANGES" },
    { type: "REQUEST_CLARIFICATION" },
    { type: "DECLINE" },
    {
      type: "CONFIRM_PAYMENT",
      amountMinor: 1n,
      resolvesDeclaration: state.pendingDeclarations > 0,
    },
    { type: "MARK_NOT_RECEIVED" },
    { type: "START_PROJECT" },
    { type: "RESPOND_TO_CLARIFICATION" },
    { type: "ACCEPT_PROPOSAL", requiredCommitmentMinor: null, proposalExpired: false },
    { type: "REJECT_PROPOSAL" },
    { type: "ACCEPT_TERMS" },
    { type: "DECLARE_PAYMENT" },
    { type: "WITHDRAW" },
  ];
  return probes
    .filter((action) => transitionRequest(state, action, actor, participants).ok)
    .map((action) => action.type);
}
