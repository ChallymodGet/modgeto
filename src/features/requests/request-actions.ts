/**
 * Request commands (docs/03 §37–50, D-002, D-008, D-027–D-030). Each command
 * runs through the domain state machine, then records what happened:
 * proposals, the agreement, clarification responses, terms acceptances,
 * payment declarations, confirmations, adjustments, and the Project on Start.
 *
 * Pure: the fixture-phase simulation uses it now, and Phase 8 Server Actions
 * call the same function inside a transaction.
 */
import {
  type Actor,
  type BasisPoints,
  type ChargeConfig,
  type Discount,
  type RequestAction,
  type RequestEvent,
  type RequestState,
  type Result,
  calculateProposalTotals,
  err,
  ok,
  transitionRequest,
} from "@/lib/domain";
import type {
  CommercialAgreement,
  CommercialProposal,
  PaymentMethod,
  Project,
  RequestDetail,
  RequestResponse,
  ScopeSnapshot,
  Turnaround,
} from "@/types";

export type CommandContext = {
  now: string;
  /** The acting user's id. */
  userId: string;
  newId: (prefix: string) => string;
  participants?: { creativeSuspended: boolean; clientSuspended: boolean };
};

export type ProposalDraft = {
  kind: "CHANGES" | "QUOTE";
  scope: ScopeSnapshot;
  subtotalMinor: bigint;
  discount: Discount | null;
  charges: ChargeConfig[];
  commitmentBps: BasisPoints | null;
  turnaround: Turnaround;
  note: string | null;
  validUntil: string | null;
};

export type CreativeCommand =
  | { type: "ACCEPT" }
  | { type: "PROPOSE"; proposal: ProposalDraft }
  | { type: "ASK"; message: string }
  /** A reply about an open proposal: no status change (D-027). */
  | { type: "NOTE"; message: string }
  | { type: "DECLINE"; reason: string | null }
  | { type: "CONFIRM_PAYMENT"; declarationId: string; amountMinor: bigint }
  | { type: "NOT_RECEIVED"; declarationId: string; note: string }
  | { type: "ADJUST"; amountMinor: bigint; reason: string }
  | { type: "START" };

export type ClientCommand =
  | { type: "REPLY"; message: string }
  /** A question about an open proposal: no status change; it can still be accepted (D-027). */
  | { type: "ASK_ABOUT_PROPOSAL"; message: string }
  | { type: "ACCEPT_PROPOSAL" }
  | { type: "REJECT_PROPOSAL"; note: string | null }
  | { type: "ACCEPT_TERMS" }
  | {
      type: "DECLARE_PAYMENT";
      method: Pick<PaymentMethod, "id" | "type" | "label">;
      amountMinor: bigint;
      paidOn: string;
      reference: string | null;
    }
  | { type: "WITHDRAW"; reason: string | null };

export type CommandResult = { detail: RequestDetail; events: RequestEvent[]; project?: Project };

export function requestState(detail: RequestDetail): RequestState {
  const r = detail.request;
  return {
    status: r.status,
    awaitingClientReason: r.awaitingClientReason,
    submittedPriceState: r.submittedPriceState,
    agreed: r.agreed,
    finalTermsAccepted: r.finalTermsAccepted,
    requiredCommitmentMinor: r.requiredCommitmentMinor,
    confirmedMinor: r.confirmedMinor,
    pendingDeclarations: r.pendingDeclarations,
  };
}

/** The proposal the Client can act on now, if any. */
export function openProposal(detail: RequestDetail): CommercialProposal | null {
  return (
    [...detail.proposals]
      .filter((p) => p.status === "PROPOSED")
      .sort((a, b) => b.version - a.version)[0] ?? null
  );
}

/** A message about the open proposal leaves the status as it is (D-027). */
function proposalMessage(
  detail: RequestDetail,
  ctx: CommandContext,
  role: RequestResponse["authorRole"],
  message: string,
): Result<CommandResult> {
  const proposal = openProposal(detail);
  const r = detail.request;
  if (
    !proposal ||
    r.status !== "AWAITING_CLIENT" ||
    r.awaitingClientReason === "CLARIFICATION_REQUESTED"
  ) {
    return err("NO_OPEN_PROPOSAL", "There's no open proposal to discuss.");
  }
  if (!message.trim()) return err("MESSAGE_REQUIRED", "Write your message.");
  return ok({
    detail: {
      ...detail,
      request: { ...r, updatedAt: ctx.now },
      responses: [
        ...detail.responses,
        response(
          detail,
          ctx,
          role,
          role === "CLIENT" ? "CLIENT_CLARIFICATION" : "PROPOSAL_NOTE",
          message.trim(),
          proposal.id,
        ),
      ],
    },
    events: ["RequestResponseCreated"],
  });
}

/** The current commercial position: the agreement if there is one, else the submission. */
export function currentTerms(detail: RequestDetail) {
  const { request, agreement } = detail;
  if (agreement) {
    return {
      totalMinor: agreement.agreedPriceMinor,
      turnaround: agreement.turnaround,
      commitmentBps: agreement.commitmentBps,
      commitmentAmountMinor: agreement.commitmentAmountMinor,
      scope: agreement.scope,
    };
  }
  const s = request.snapshot;
  return {
    totalMinor: s.price.total?.amountMinor ?? null,
    turnaround: s.scope.turnaround,
    commitmentBps: s.commitment.bps,
    commitmentAmountMinor: s.commitment.amountMinor,
    scope: s.scope,
  };
}

function step(
  detail: RequestDetail,
  action: RequestAction,
  actor: Actor,
  ctx: CommandContext,
): Result<{ state: RequestState; events: RequestEvent[] }> {
  const t = transitionRequest(requestState(detail), action, actor, ctx.participants);
  return t.ok ? ok(t.value) : t;
}

function withState(detail: RequestDetail, state: RequestState, now: string): RequestDetail {
  return { ...detail, request: { ...detail.request, ...state, updatedAt: now } };
}

function response(
  detail: RequestDetail,
  ctx: CommandContext,
  role: RequestResponse["authorRole"],
  type: RequestResponse["type"],
  message: string,
  proposalId: string | null = null,
): RequestResponse {
  return {
    id: ctx.newId("resp"),
    requestId: detail.request.id,
    proposalId,
    authorUserId: ctx.userId,
    authorRole: role,
    type,
    message,
    attachmentIds: [],
    createdAt: ctx.now,
  };
}

export function applyCreativeCommand(
  detail: RequestDetail,
  command: CreativeCommand,
  ctx: CommandContext,
): Result<CommandResult> {
  const r = detail.request;
  const now = ctx.now;

  switch (command.type) {
    case "ACCEPT": {
      const required = r.snapshot.commitment.amountMinor;
      const t = step(
        detail,
        { type: "ACCEPT_REQUEST", requiredCommitmentMinor: required },
        "CREATIVE",
        ctx,
      );
      if (!t.ok) return t;
      const total = r.snapshot.price.total;
      if (!total) return err("PROPOSAL_REQUIRED", "Send a proposal to set the final price.");
      const agreement: CommercialAgreement = {
        id: ctx.newId("agr"),
        requestId: r.id,
        proposalId: null,
        scope: r.snapshot.scope,
        currency: total.currency,
        agreedPriceMinor: total.amountMinor,
        turnaround: r.snapshot.scope.turnaround,
        commitmentBps: r.snapshot.commitment.bps,
        commitmentAmountMinor: required,
        agreedAt: now,
      };
      return ok({
        detail: { ...withState(detail, t.value.state, now), agreement },
        events: t.value.events,
      });
    }

    case "PROPOSE": {
      const p = command.proposal;
      if (p.kind === "CHANGES" && !p.note?.trim()) {
        return err("NOTE_REQUIRED", "Explain what changed and why.", "note");
      }
      const totals = calculateProposalTotals({
        currency: r.snapshot.service.currency,
        subtotalMinor: p.subtotalMinor,
        discount: p.discount,
        charges: p.charges,
        commitmentBps: p.commitmentBps,
      });
      if (!totals.ok) return totals;
      const t = step(detail, { type: "SEND_PROPOSAL", kind: p.kind }, "CREATIVE", ctx);
      if (!t.ok) return t;
      const version = Math.max(0, ...detail.proposals.map((x) => x.version)) + 1;
      const proposal: CommercialProposal = {
        id: ctx.newId("prop"),
        requestId: r.id,
        version,
        kind: p.kind,
        proposedByUserId: ctx.userId,
        scope: { ...p.scope, turnaround: p.turnaround },
        currency: r.snapshot.service.currency,
        subtotalMinor: p.subtotalMinor,
        discount: p.discount,
        charges: p.charges,
        totalMinor: totals.value.total.amountMinor,
        commitmentBps: p.commitmentBps,
        commitmentAmountMinor: totals.value.commitment?.amountMinor ?? null,
        turnaround: p.turnaround,
        note: p.note?.trim() || null,
        validUntil: p.validUntil,
        status: "PROPOSED",
        createdAt: now,
        respondedAt: null,
      };
      // A new proposal replaces an open one (D-008, D-030).
      const proposals = [
        ...detail.proposals.map((x) =>
          x.status === "PROPOSED" ? { ...x, status: "SUPERSEDED" as const } : x,
        ),
        proposal,
      ];
      const responses = proposal.note
        ? [
            ...detail.responses,
            response(
              detail,
              ctx,
              "CREATIVE",
              p.kind === "CHANGES" ? "CHANGE_REQUEST_NOTE" : "PROPOSAL_NOTE",
              proposal.note,
              proposal.id,
            ),
          ]
        : detail.responses;
      return ok({
        detail: { ...withState(detail, t.value.state, now), proposals, responses },
        events: t.value.events,
      });
    }

    case "ASK": {
      if (!command.message.trim()) return err("MESSAGE_REQUIRED", "Write your question.");
      const t = step(detail, { type: "REQUEST_CLARIFICATION" }, "CREATIVE", ctx);
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          responses: [
            ...detail.responses,
            response(detail, ctx, "CREATIVE", "CREATIVE_CLARIFICATION", command.message.trim()),
          ],
        },
        events: t.value.events,
      });
    }

    case "NOTE":
      return proposalMessage(detail, ctx, "CREATIVE", command.message);

    case "DECLINE": {
      const t = step(detail, { type: "DECLINE" }, "CREATIVE", ctx);
      if (!t.ok) return t;
      const next = withState(detail, t.value.state, now);
      return ok({
        detail: {
          ...next,
          request: {
            ...next.request,
            closedAt: now,
            closureReason: command.reason?.trim() || null,
          },
          proposals: detail.proposals.map((x) =>
            x.status === "PROPOSED" ? { ...x, status: "SUPERSEDED" as const } : x,
          ),
        },
        events: t.value.events,
      });
    }

    case "CONFIRM_PAYMENT": {
      const declaration = detail.declarations.find((d) => d.id === command.declarationId);
      if (!declaration || declaration.resolution !== "PENDING") {
        return err("NO_PENDING_DECLARATION", "This payment has already been dealt with.");
      }
      const t = step(
        detail,
        { type: "CONFIRM_PAYMENT", amountMinor: command.amountMinor, resolvesDeclaration: true },
        "CREATIVE",
        ctx,
      );
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          declarations: detail.declarations.map((d) =>
            d.id === declaration.id
              ? { ...d, resolution: "CONFIRMED" as const, resolvedAt: now }
              : d,
          ),
          confirmations: [
            ...detail.confirmations,
            {
              id: ctx.newId("conf"),
              requestId: r.id,
              declarationId: declaration.id,
              creativeId: r.creativeId,
              confirmedAmountMinor: command.amountMinor,
              currency: declaration.currency,
              confirmedAt: now,
            },
          ],
        },
        events: t.value.events,
      });
    }

    case "NOT_RECEIVED": {
      if (!command.note.trim())
        return err("NOTE_REQUIRED", "Add a short note for the Client.", "note");
      const declaration = detail.declarations.find((d) => d.id === command.declarationId);
      if (!declaration || declaration.resolution !== "PENDING") {
        return err("NO_PENDING_DECLARATION", "This payment has already been dealt with.");
      }
      const t = step(detail, { type: "MARK_NOT_RECEIVED" }, "CREATIVE", ctx);
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          declarations: detail.declarations.map((d) =>
            d.id === declaration.id
              ? {
                  ...d,
                  resolution: "NOT_RECEIVED" as const,
                  resolutionNote: command.note.trim(),
                  resolvedAt: now,
                }
              : d,
          ),
        },
        events: t.value.events,
      });
    }

    case "ADJUST": {
      if (!command.reason.trim())
        return err("REASON_REQUIRED", "Give the reason for this correction.", "reason");
      const t = step(
        detail,
        { type: "RECORD_ADJUSTMENT", amountMinor: command.amountMinor },
        "CREATIVE",
        ctx,
      );
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          adjustments: [
            ...detail.adjustments,
            {
              id: ctx.newId("adj"),
              requestId: r.id,
              creativeId: r.creativeId,
              amountMinor: command.amountMinor,
              currency: r.snapshot.service.currency,
              reason: command.reason.trim(),
              createdAt: now,
            },
          ],
        },
        events: t.value.events,
      });
    }

    case "START": {
      const t = step(detail, { type: "START_PROJECT" }, "CREATIVE", ctx);
      if (!t.ok) return t;
      const agreement = detail.agreement;
      if (!agreement) return err("NOT_AGREED", "There is no agreement to start from.");
      const projectId = ctx.newId("proj");
      const confirmed = r.confirmedMinor;
      const outstanding = agreement.agreedPriceMinor - confirmed;
      const project: Project = {
        id: projectId,
        requestId: r.id,
        creativeId: r.creativeId,
        clientId: r.clientId,
        title: r.title,
        service: r.snapshot.service,
        agreement,
        brief: r.snapshot.brief,
        paymentSummary: {
          currency: agreement.currency,
          projectTotalMinor: agreement.agreedPriceMinor,
          requiredCommitmentMinor: r.requiredCommitmentMinor,
          totalConfirmedMinor: confirmed,
          outstandingBalanceMinor: outstanding > 0n ? outstanding : 0n,
        },
        agreedTimeline: agreement.turnaround,
        status: "ACTIVE",
        startedAt: now,
        completedAt: null,
      };
      const next = withState(detail, t.value.state, now);
      return ok({
        detail: { ...next, request: { ...next.request, projectId, closedAt: now } },
        events: t.value.events,
        project,
      });
    }
  }
}

export function applyClientCommand(
  detail: RequestDetail,
  command: ClientCommand,
  ctx: CommandContext,
): Result<CommandResult> {
  const r = detail.request;
  const now = ctx.now;

  switch (command.type) {
    case "REPLY": {
      if (!command.message.trim()) return err("MESSAGE_REQUIRED", "Write your reply.");
      const t = step(detail, { type: "RESPOND_TO_CLARIFICATION" }, "CLIENT", ctx);
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          responses: [
            ...detail.responses,
            response(detail, ctx, "CLIENT", "CLIENT_CLARIFICATION", command.message.trim()),
          ],
        },
        events: t.value.events,
      });
    }

    case "ASK_ABOUT_PROPOSAL":
      return proposalMessage(detail, ctx, "CLIENT", command.message);

    case "ACCEPT_PROPOSAL": {
      const proposal = openProposal(detail);
      if (!proposal) return err("NO_OPEN_PROPOSAL", "There's no proposal to accept.");
      const expired = proposal.validUntil !== null && proposal.validUntil < now.slice(0, 10);
      const t = step(
        detail,
        {
          type: "ACCEPT_PROPOSAL",
          requiredCommitmentMinor: proposal.commitmentAmountMinor,
          proposalExpired: expired,
        },
        "CLIENT",
        ctx,
      );
      if (!t.ok) return t;
      const agreement: CommercialAgreement = {
        id: ctx.newId("agr"),
        requestId: r.id,
        proposalId: proposal.id,
        scope: proposal.scope,
        currency: proposal.currency,
        agreedPriceMinor: proposal.totalMinor,
        turnaround: proposal.turnaround,
        commitmentBps: proposal.commitmentBps,
        commitmentAmountMinor: proposal.commitmentAmountMinor,
        agreedAt: now,
      };
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          agreement,
          proposals: detail.proposals.map((x) =>
            x.id === proposal.id ? { ...x, status: "ACCEPTED" as const, respondedAt: now } : x,
          ),
        },
        events: t.value.events,
      });
    }

    case "REJECT_PROPOSAL": {
      const proposal = openProposal(detail);
      if (!proposal) return err("NO_OPEN_PROPOSAL", "There's no proposal to respond to.");
      const t = step(detail, { type: "REJECT_PROPOSAL" }, "CLIENT", ctx);
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          proposals: detail.proposals.map((x) =>
            x.id === proposal.id ? { ...x, status: "REJECTED" as const, respondedAt: now } : x,
          ),
          responses: command.note?.trim()
            ? [
                ...detail.responses,
                response(
                  detail,
                  ctx,
                  "CLIENT",
                  "PROPOSAL_RESPONSE",
                  command.note.trim(),
                  proposal.id,
                ),
              ]
            : detail.responses,
        },
        events: t.value.events,
      });
    }

    case "ACCEPT_TERMS": {
      const t = step(detail, { type: "ACCEPT_TERMS" }, "CLIENT", ctx);
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          termsAcceptances: [
            ...detail.termsAcceptances,
            {
              id: ctx.newId("terms"),
              requestId: r.id,
              clientId: r.clientId,
              kind: "FINAL",
              terms: r.snapshot.terms,
              acceptedAt: now,
            },
          ],
        },
        events: t.value.events,
      });
    }

    case "DECLARE_PAYMENT": {
      if (command.amountMinor <= 0n)
        return err("INVALID_AMOUNT", "Enter the amount you sent.", "amount");
      const t = step(detail, { type: "DECLARE_PAYMENT" }, "CLIENT", ctx);
      if (!t.ok) return t;
      return ok({
        detail: {
          ...withState(detail, t.value.state, now),
          declarations: [
            ...detail.declarations,
            {
              id: ctx.newId("decl"),
              requestId: r.id,
              clientId: r.clientId,
              paymentMethod: command.method,
              declaredAmountMinor: command.amountMinor,
              currency: r.snapshot.service.currency,
              paidOn: command.paidOn,
              reference: command.reference,
              evidenceAssetId: null,
              resolution: "PENDING",
              resolutionNote: null,
              declaredAt: now,
              resolvedAt: null,
            },
          ],
        },
        events: t.value.events,
      });
    }

    case "WITHDRAW": {
      const t = step(detail, { type: "WITHDRAW" }, "CLIENT", ctx);
      if (!t.ok) return t;
      const next = withState(detail, t.value.state, now);
      return ok({
        detail: {
          ...next,
          request: {
            ...next.request,
            closedAt: now,
            closureReason: command.reason?.trim() || null,
          },
          proposals: detail.proposals.map((x) =>
            x.status === "PROPOSED" ? { ...x, status: "SUPERSEDED" as const } : x,
          ),
        },
        events: t.value.events,
      });
    }
  }
}
