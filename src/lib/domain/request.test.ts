import { describe, expect, it } from "vitest";
import type { Actor } from "./actors";
import {
  type RequestAction,
  type RequestState,
  type Transition,
  availableRequestActions,
  submittedRequest,
  transitionRequest,
} from "./request";

const NGN = (n: number) => BigInt(n) * 100n;

/** Applies a sequence of [actor, action] steps, failing loudly on any rejection. */
function run(state: RequestState, steps: [Actor, RequestAction][]): Transition {
  let current: Transition = { state, events: [] };
  for (const [actor, action] of steps) {
    const result = transitionRequest(current.state, action, actor);
    if (!result.ok) throw new Error(`${action.type} by ${actor}: ${result.error.code}`);
    current = result.value;
  }
  return current;
}

function attempt(state: RequestState, actor: Actor, action: RequestAction) {
  const result = transitionRequest(state, action, actor);
  return result.ok ? "ok" : result.error.code;
}

describe("fixed-price path with commitment (docs/03 §74)", () => {
  it("SUBMITTED → AWAITING_COMMITMENT → AWAITING_PAYMENT_CONFIRMATION → READY_TO_START → CONVERTED", () => {
    let t = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: NGN(150_000) }],
    ]);
    // Submission acknowledgement counts as terms acceptance (D-002), so no AWAITING_TERMS.
    expect(t.state.status).toBe("AWAITING_COMMITMENT");
    expect(t.events).toEqual(["RequestAccepted"]);

    t = run(t.state, [["CLIENT", { type: "DECLARE_PAYMENT" }]]);
    expect(t.state.status).toBe("AWAITING_PAYMENT_CONFIRMATION");

    t = run(t.state, [
      [
        "CREATIVE",
        { type: "CONFIRM_PAYMENT", amountMinor: NGN(150_000), resolvesDeclaration: true },
      ],
    ]);
    expect(t.state.status).toBe("READY_TO_START");
    expect(t.events).toEqual(["PaymentConfirmed", "CommitmentSatisfied", "RequestReadyToStart"]);

    t = run(t.state, [["CREATIVE", { type: "START_PROJECT" }]]);
    expect(t.state.status).toBe("CONVERTED_TO_PROJECT");
    expect(t.events).toEqual(["ProjectStarted"]);
  });

  it("never starts the Project automatically (docs/03 invariant 39)", () => {
    const t = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
    ]);
    expect(t.state.status).toBe("READY_TO_START");
    expect(t.events).not.toContain("ProjectStarted");
  });
});

describe("no-commitment path", () => {
  it("goes straight to READY_TO_START; payment is not a condition (PAY-008)", () => {
    const t = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
    ]);
    expect(t.state.status).toBe("READY_TO_START");
    expect(attempt(t.state, "CLIENT", { type: "DECLARE_PAYMENT" })).toBe("INVALID_TRANSITION");
  });
});

describe("estimated and quoted prices need a proposal (docs/01 §13.6–13.7)", () => {
  it("refuses a direct accept for Starting From and Custom Quote", () => {
    for (const priceState of ["ESTIMATED", "QUOTE_REQUIRED"] as const) {
      expect(
        attempt(submittedRequest(priceState), "CREATIVE", {
          type: "ACCEPT_REQUEST",
          requiredCommitmentMinor: null,
        }),
      ).toBe("PROPOSAL_REQUIRED");
    }
  });

  it("quote → accept → explicit terms acceptance → commitment (D-002)", () => {
    let t = run(submittedRequest("QUOTE_REQUIRED"), [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "QUOTE" }],
    ]);
    expect(t.state).toMatchObject({
      status: "AWAITING_CLIENT",
      awaitingClientReason: "QUOTE_PROPOSED",
    });

    t = run(t.state, [
      [
        "CLIENT",
        { type: "ACCEPT_PROPOSAL", requiredCommitmentMinor: NGN(225_000), proposalExpired: false },
      ],
    ]);
    expect(t.state.status).toBe("AWAITING_TERMS");

    t = run(t.state, [["CLIENT", { type: "ACCEPT_TERMS" }]]);
    expect(t.state.status).toBe("AWAITING_COMMITMENT");
    expect(t.events).toEqual(["TermsAccepted"]);
  });

  it("an expired quote cannot be accepted until renewed (D-017)", () => {
    const t = run(submittedRequest("QUOTE_REQUIRED"), [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "QUOTE" }],
    ]);
    expect(
      attempt(t.state, "CLIENT", {
        type: "ACCEPT_PROPOSAL",
        requiredCommitmentMinor: null,
        proposalExpired: true,
      }),
    ).toBe("PROPOSAL_EXPIRED");
    // Renewing is a new proposal that supersedes the old one.
    const renewed = run(t.state, [["CREATIVE", { type: "SEND_PROPOSAL", kind: "QUOTE" }]]);
    expect(renewed.state.status).toBe("AWAITING_CLIENT");
  });
});

describe("negotiation (D-008, D-027)", () => {
  it("Request Changes sends a CHANGES proposal", () => {
    const t = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "CHANGES" }],
    ]);
    expect(t.state.awaitingClientReason).toBe("CHANGES_PROPOSED");
    expect(t.events).toEqual(["CommercialProposalCreated", "RequestChangesRequested"]);
  });

  it("clarification: Client's answer returns the Request to the Creative (SUBMITTED)", () => {
    const t = run(submittedRequest("ESTIMATED"), [
      ["CREATIVE", { type: "REQUEST_CLARIFICATION" }],
      ["CLIENT", { type: "RESPOND_TO_CLARIFICATION" }],
    ]);
    expect(t.state).toMatchObject({ status: "SUBMITTED", awaitingClientReason: null });
  });

  it("a Client question about a proposal does not change status; the proposal stays acceptable", () => {
    // Questions are RequestResponses, not transitions, so there is no action for them here.
    const t = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "CHANGES" }],
    ]);
    expect(attempt(t.state, "CLIENT", { type: "RESPOND_TO_CLARIFICATION" })).toBe(
      "INVALID_TRANSITION",
    );
    expect(availableRequestActions(t.state, "CLIENT")).toEqual([
      "ACCEPT_PROPOSAL",
      "REJECT_PROPOSAL",
      "WITHDRAW",
    ]);
  });

  it("rejecting a first proposal returns to SUBMITTED for the Creative to revise or decline", () => {
    const t = run(submittedRequest("QUOTE_REQUIRED"), [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "QUOTE" }],
      ["CLIENT", { type: "REJECT_PROPOSAL" }],
    ]);
    expect(t.state.status).toBe("SUBMITTED");
    expect(t.events).toEqual(["CommercialProposalRejected"]);
  });
});

describe("payments (D-028, docs/03 §85)", () => {
  const awaitingCommitment = run(submittedRequest("CALCULATED"), [
    ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: NGN(150_000) }],
  ]).state;

  it("partial confirmation accumulates to satisfaction", () => {
    let t = run(awaitingCommitment, [
      ["CLIENT", { type: "DECLARE_PAYMENT" }],
      [
        "CREATIVE",
        { type: "CONFIRM_PAYMENT", amountMinor: NGN(100_000), resolvesDeclaration: true },
      ],
    ]);
    expect(t.state.status).toBe("PARTIALLY_CONFIRMED");

    // A new declaration after partial confirmation waits for the Creative again.
    t = run(t.state, [["CLIENT", { type: "DECLARE_PAYMENT" }]]);
    expect(t.state.status).toBe("AWAITING_PAYMENT_CONFIRMATION");

    t = run(t.state, [
      [
        "CREATIVE",
        { type: "CONFIRM_PAYMENT", amountMinor: NGN(50_000), resolvesDeclaration: true },
      ],
    ]);
    expect(t.state.status).toBe("READY_TO_START");
    expect(t.state.confirmedMinor).toBe(NGN(150_000));
  });

  it("Not received resolves the declaration without counting money", () => {
    const t = run(awaitingCommitment, [
      ["CLIENT", { type: "DECLARE_PAYMENT" }],
      ["CREATIVE", { type: "MARK_NOT_RECEIVED" }],
    ]);
    expect(t.state).toMatchObject({
      status: "AWAITING_COMMITMENT",
      pendingDeclarations: 0,
      confirmedMinor: 0n,
    });
    expect(t.events).toEqual(["PaymentNotReceived"]);
  });

  it("the Creative may record an undeclared payment; confirmations must be above zero", () => {
    const t = run(awaitingCommitment, [
      [
        "CREATIVE",
        { type: "CONFIRM_PAYMENT", amountMinor: NGN(150_000), resolvesDeclaration: false },
      ],
    ]);
    expect(t.state.status).toBe("READY_TO_START");
    expect(
      attempt(awaitingCommitment, "CREATIVE", {
        type: "CONFIRM_PAYMENT",
        amountMinor: 0n,
        resolvesDeclaration: false,
      }),
    ).toBe("INVALID_AMOUNT");
    expect(
      attempt(awaitingCommitment, "CREATIVE", {
        type: "CONFIRM_PAYMENT",
        amountMinor: 1n,
        resolvesDeclaration: true,
      }),
    ).toBe("NO_PENDING_DECLARATION");
  });

  it("only the Creative confirms receipt (docs/03 invariant 32)", () => {
    const declared = run(awaitingCommitment, [["CLIENT", { type: "DECLARE_PAYMENT" }]]).state;
    expect(
      attempt(declared, "CLIENT", {
        type: "CONFIRM_PAYMENT",
        amountMinor: NGN(150_000),
        resolvesDeclaration: true,
      }),
    ).toBe("WRONG_ACTOR");
  });

  it("a declaration alone never makes the Request ready (docs/03 invariant 33)", () => {
    const declared = run(awaitingCommitment, [
      ["CLIENT", { type: "DECLARE_PAYMENT" }],
      ["CLIENT", { type: "DECLARE_PAYMENT" }],
    ]).state;
    expect(declared.status).toBe("AWAITING_PAYMENT_CONFIRMATION");
  });
});

describe("changes after Ready to Start (D-030)", () => {
  const ready = run(submittedRequest("CALCULATED"), [
    ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: NGN(150_000) }],
    [
      "CREATIVE",
      { type: "CONFIRM_PAYMENT", amountMinor: NGN(150_000), resolvesDeclaration: false },
    ],
  ]).state;

  it("a reversing adjustment drops the Request back to the payment stage", () => {
    const t = run(ready, [["CREATIVE", { type: "RECORD_ADJUSTMENT", amountMinor: -NGN(50_000) }]]);
    expect(t.state).toMatchObject({ status: "PARTIALLY_CONFIRMED", confirmedMinor: NGN(100_000) });
    expect(attempt(ready, "CREATIVE", { type: "RECORD_ADJUSTMENT", amountMinor: NGN(1) })).toBe(
      "INVALID_AMOUNT",
    );
    expect(
      attempt(ready, "CREATIVE", { type: "RECORD_ADJUSTMENT", amountMinor: -NGN(150_001) }),
    ).toBe("INVALID_AMOUNT");
  });

  it("a new proposal is allowed; acceptance needs new terms and keeps confirmed payments", () => {
    let t = run(ready, [["CREATIVE", { type: "SEND_PROPOSAL", kind: "CHANGES" }]]);
    expect(t.state.status).toBe("AWAITING_CLIENT");

    t = run(t.state, [
      [
        "CLIENT",
        { type: "ACCEPT_PROPOSAL", requiredCommitmentMinor: NGN(200_000), proposalExpired: false },
      ],
      ["CLIENT", { type: "ACCEPT_TERMS" }],
    ]);
    expect(t.state).toMatchObject({ status: "PARTIALLY_CONFIRMED", confirmedMinor: NGN(150_000) });
  });

  it("rejecting that proposal keeps the earlier agreement", () => {
    const t = run(ready, [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "CHANGES" }],
      ["CLIENT", { type: "REJECT_PROPOSAL" }],
    ]);
    expect(t.state.status).toBe("READY_TO_START");
  });

  it("suspension blocks Start Project but keeps the status", () => {
    const blocked = transitionRequest(ready, { type: "START_PROJECT" }, "CREATIVE", {
      creativeSuspended: false,
      clientSuspended: true,
    });
    expect(blocked.ok).toBe(false);
    const suspendedCreative = transitionRequest(ready, { type: "START_PROJECT" }, "CREATIVE", {
      creativeSuspended: true,
      clientSuspended: false,
    });
    expect(!suspendedCreative.ok && suspendedCreative.error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("permissions and closure", () => {
  const submitted = submittedRequest("CALCULATED");

  it("only the Creative starts the Project; the Client never sees Start Project (docs/06 §68)", () => {
    const ready = run(submitted, [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
    ]).state;
    expect(attempt(ready, "CLIENT", { type: "START_PROJECT" })).toBe("WRONG_ACTOR");
    expect(availableRequestActions(ready, "CLIENT")).toEqual(["WITHDRAW"]);
    expect(availableRequestActions(ready, "CREATIVE")).toEqual([
      "SEND_PROPOSAL",
      "DECLINE",
      "START_PROJECT",
    ]);
  });

  it("Admins cannot act for participants (docs/04 §29)", () => {
    expect(attempt(submitted, "ADMIN", { type: "DECLINE" })).toBe("NOT_A_PARTICIPANT");
    expect(availableRequestActions(submitted, "ADMIN")).toEqual([]);
  });

  it("closed Requests accept no further actions", () => {
    for (const step of [
      ["CREATIVE", { type: "DECLINE" }],
      ["CLIENT", { type: "WITHDRAW" }],
    ] as [Actor, RequestAction][]) {
      const closed = run(submitted, [step]).state;
      expect(attempt(closed, "CREATIVE", { type: "SEND_PROPOSAL", kind: "CHANGES" })).toBe(
        "REQUEST_CLOSED",
      );
      expect(availableRequestActions(closed, "CLIENT")).toEqual([]);
    }
  });

  it("the Client can withdraw until the Project starts (docs/03 invariant 29)", () => {
    const ready = run(submitted, [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
    ]).state;
    expect(attempt(ready, "CLIENT", { type: "WITHDRAW" })).toBe("ok");
    const started = run(ready, [["CREATIVE", { type: "START_PROJECT" }]]).state;
    expect(attempt(started, "CLIENT", { type: "WITHDRAW" })).toBe("REQUEST_CLOSED");
  });

  it("Start Project is idempotent at the state level: a second start is refused", () => {
    const started = run(submitted, [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
      ["CREATIVE", { type: "START_PROJECT" }],
    ]).state;
    expect(attempt(started, "CREATIVE", { type: "START_PROJECT" })).toBe("REQUEST_CLOSED");
  });
});
