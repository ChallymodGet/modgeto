import { describe, expect, it } from "vitest";
import { requestDetails } from "@/lib/fixtures";
import type { RequestDetail } from "@/types";
import {
  type CommandContext,
  type ProposalDraft,
  applyClientCommand,
  applyCreativeCommand,
  openProposal,
  requestState,
} from "./request-actions";
import { transitionRequest } from "@/lib/domain";
import { clientAwaitingReply } from "./model";

const get = (id: string): RequestDetail =>
  structuredClone(requestDetails.find((d) => d.request.id === id)!);
let n = 0;
const ctx = (userId = "u-ada"): CommandContext => ({
  now: "2026-11-20T10:00:00.000Z",
  userId,
  newId: (p) => `${p}-${++n}`,
});
const value = <T>(r: { ok: true; value: T } | { ok: false; error: { code: string } }) => {
  if (!r.ok) throw new Error(`Expected ok, got ${r.error.code}`);
  return r.value;
};

const draft = (d: RequestDetail, over: Partial<ProposalDraft> = {}): ProposalDraft => ({
  kind: "CHANGES",
  scope: d.request.snapshot.scope,
  subtotalMinor: 30_000_000n,
  discount: null,
  charges: [],
  commitmentBps: 5_000,
  turnaround: { value: 3, unit: "WEEKS" },
  note: "Adding a second round of concepts.",
  validUntil: null,
  ...over,
});

describe("Creative commands", () => {
  it("accepts a calculated Request and records the agreement from the submission", () => {
    const d = get("req-bloom");
    const { detail, events } = value(applyCreativeCommand(d, { type: "ACCEPT" }, ctx()));
    expect(events).toContain("RequestAccepted");
    expect(detail.agreement).toMatchObject({
      proposalId: null,
      agreedPriceMinor: d.request.snapshot.price.total!.amountMinor,
    });
    expect(["AWAITING_COMMITMENT", "READY_TO_START"]).toContain(detail.request.status);
  });

  it("requires a note for Request Changes (D-008)", () => {
    const d = get("req-bloom");
    const r = applyCreativeCommand(
      d,
      { type: "PROPOSE", proposal: draft(d, { note: " " }) },
      ctx(),
    );
    expect(r.ok ? null : r.error.code).toBe("NOTE_REQUIRED");
  });

  it("sends a proposal with its totals and note, and supersedes an open one", () => {
    const d = get("req-fieldnote");
    const before = openProposal(d)!;
    const { detail } = value(
      applyCreativeCommand(
        d,
        {
          type: "PROPOSE",
          proposal: draft(d, {
            kind: "QUOTE",
            discount: { label: "Returning client", modifier: { kind: "PERCENT", bps: 1_000 } },
          }),
        },
        ctx(),
      ),
    );
    expect(detail.request).toMatchObject({
      status: "AWAITING_CLIENT",
      awaitingClientReason: "QUOTE_PROPOSED",
    });
    expect(detail.proposals.find((p) => p.id === before.id)!.status).toBe("SUPERSEDED");
    const latest = openProposal(detail)!;
    expect(latest.version).toBe(before.version + 1);
    expect(latest.totalMinor).toBe(27_000_000n);
    expect(latest.commitmentAmountMinor).toBe(13_500_000n);
    expect(detail.responses.at(-1)).toMatchObject({ type: "PROPOSAL_NOTE", proposalId: latest.id });
  });

  it("only shows valid transitions: no accepting while waiting on the Client", () => {
    const r = applyCreativeCommand(get("req-atlas"), { type: "ACCEPT" }, ctx());
    expect(r.ok ? null : r.error.code).toBe("INVALID_TRANSITION");
  });

  it("asks a clarification question, which makes it the Client's turn", () => {
    const { detail } = value(
      applyCreativeCommand(
        get("req-bloom"),
        { type: "ASK", message: "Do you have a logo?" },
        ctx(),
      ),
    );
    expect(detail.request.awaitingClientReason).toBe("CLARIFICATION_REQUESTED");
    expect(detail.responses.at(-1)!.type).toBe("CREATIVE_CLARIFICATION");
  });

  it("confirms the amount actually received, not the amount declared (PAY-005)", () => {
    const d = get("req-lumen");
    const decl = d.declarations.find((x) => x.resolution === "PENDING")!;
    const required = d.request.requiredCommitmentMinor!;
    const partial = value(
      applyCreativeCommand(
        d,
        { type: "CONFIRM_PAYMENT", declarationId: decl.id, amountMinor: required / 2n },
        ctx(),
      ),
    ).detail;
    expect(partial.request.status).toBe("PARTIALLY_CONFIRMED");
    expect(partial.declarations.find((x) => x.id === decl.id)!.resolution).toBe("CONFIRMED");
    expect(partial.confirmations.at(-1)!.confirmedAmountMinor).toBe(required / 2n);

    const full = value(
      applyCreativeCommand(
        d,
        { type: "CONFIRM_PAYMENT", declarationId: decl.id, amountMinor: required },
        ctx(),
      ),
    );
    expect(full.detail.request.status).toBe("READY_TO_START");
    expect(full.events).toContain("RequestReadyToStart");
  });

  it("marks a declaration not received with a note (D-028)", () => {
    const d = get("req-lumen");
    const decl = d.declarations.find((x) => x.resolution === "PENDING")!;
    const { detail } = value(
      applyCreativeCommand(
        d,
        { type: "NOT_RECEIVED", declarationId: decl.id, note: "Nothing has arrived yet." },
        ctx(),
      ),
    );
    expect(detail.request.status).toBe("AWAITING_COMMITMENT");
    expect(detail.declarations.find((x) => x.id === decl.id)!.resolutionNote).toBe(
      "Nothing has arrived yet.",
    );
  });

  it("corrects a confirmation with a reversing adjustment that can drop Ready to Start (D-030)", () => {
    const d = get("req-tidewater");
    const { detail } = value(
      applyCreativeCommand(
        d,
        {
          type: "ADJUST",
          amountMinor: -d.request.confirmedMinor,
          reason: "Transfer reversed by bank.",
        },
        ctx(),
      ),
    );
    expect(detail.request.status).not.toBe("READY_TO_START");
    expect(detail.adjustments.at(-1)!.amountMinor).toBe(-d.request.confirmedMinor);
  });

  it("starts the Project only from Ready to Start, capturing the payment summary", () => {
    const d = get("req-tidewater");
    const { detail, project } = value(applyCreativeCommand(d, { type: "START" }, ctx()));
    expect(detail.request.status).toBe("CONVERTED_TO_PROJECT");
    expect(detail.request.projectId).toBe(project!.id);
    expect(project!.paymentSummary.totalConfirmedMinor).toBe(d.request.confirmedMinor);
    const notReady = applyCreativeCommand(get("req-harbor"), { type: "START" }, ctx());
    expect(notReady.ok).toBe(false);
  });

  it("declines with an optional reason", () => {
    const { detail } = value(
      applyCreativeCommand(get("req-bloom"), { type: "DECLINE", reason: "Fully booked." }, ctx()),
    );
    expect(detail.request).toMatchObject({ status: "DECLINED", closureReason: "Fully booked." });
  });
});

describe("Client commands", () => {
  it("accepting a proposal needs explicit final terms next (D-002)", () => {
    const d = get("req-kitchen");
    const accepted = value(
      applyClientCommand(d, { type: "ACCEPT_PROPOSAL" }, ctx(d.request.clientId)),
    ).detail;
    expect(accepted.request.status).toBe("AWAITING_TERMS");
    expect(accepted.agreement!.proposalId).toBe(openProposal(d)!.id);
    const terms = value(
      applyClientCommand(accepted, { type: "ACCEPT_TERMS" }, ctx(d.request.clientId)),
    ).detail;
    expect(terms.termsAcceptances.at(-1)!.kind).toBe("FINAL");
    expect(terms.request.status).not.toBe("AWAITING_TERMS");
  });

  it("asks about a proposal without changing the status, and the Creative can reply (D-027)", () => {
    const d = get("req-kitchen");
    const asked = value(
      applyClientCommand(
        d,
        { type: "ASK_ABOUT_PROPOSAL", message: "Does this include the menu boards?" },
        ctx(d.request.clientId),
      ),
    ).detail;
    expect(asked.request.status).toBe(d.request.status);
    expect(openProposal(asked)!.id).toBe(openProposal(d)!.id);
    expect(clientAwaitingReply(asked)).toBe(true);
    const replied = value(
      applyCreativeCommand(asked, { type: "NOTE", message: "Yes, both boards." }, ctx()),
    ).detail;
    expect(replied.request.status).toBe(d.request.status);
    expect(clientAwaitingReply(replied)).toBe(false);
    expect(applyClientCommand(asked, { type: "ACCEPT_PROPOSAL" }, ctx(d.request.clientId)).ok).toBe(
      true,
    );
  });

  it("cannot accept an expired quote (D-017)", () => {
    const d = get("req-fieldnote");
    d.proposals = d.proposals.map((p) =>
      p.status === "PROPOSED" ? { ...p, validUntil: "2026-11-01" } : p,
    );
    const r = applyClientCommand(d, { type: "ACCEPT_PROPOSAL" }, ctx(d.request.clientId));
    expect(r.ok ? null : r.error.code).toBe("PROPOSAL_EXPIRED");
  });

  it("declares a payment, which waits for the Creative to confirm", () => {
    const d = get("req-harbor");
    const { detail } = value(
      applyClientCommand(
        d,
        {
          type: "DECLARE_PAYMENT",
          method: { id: "pm-ada-bank", type: "BANK_TRANSFER", label: "Bank transfer" },
          amountMinor: 1_000_000n,
          paidOn: "2026-11-19",
          reference: "HC-1",
        },
        ctx(d.request.clientId),
      ),
    );
    expect(detail.request.status).toBe("AWAITING_PAYMENT_CONFIRMATION");
    expect(detail.declarations.at(-1)!.resolution).toBe("PENDING");
  });

  it("only the Creative can start a Project", () => {
    const r = transitionRequest(
      requestState(get("req-tidewater")),
      { type: "START_PROJECT" },
      "CLIENT",
    );
    expect(r.ok ? null : r.error.code).toBe("WRONG_ACTOR");
  });
});
