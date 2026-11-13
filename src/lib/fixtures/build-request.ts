/**
 * Builds fixture Requests by running real steps through the domain engine, so
 * every fixture is a state the product can actually reach.
 */
import {
  type Answers,
  type BasisPoints,
  type ChargeConfig,
  type Discount,
  type RequestAction,
  type Selection,
  calculatePrice,
  calculateProposalTotals,
  submittedRequest,
  transitionRequest,
  unwrap,
  validateBriefAnswers,
  visibleQuestions,
} from "@/lib/domain";
import { serviceCommitmentBps, toPricingConfig } from "@/features/services/model";
import type {
  CommercialAgreement,
  CommercialProposal,
  CreativeProfile,
  PaymentDeclaration,
  Project,
  RequestDetail,
  RequestSnapshot,
  ScopeSnapshot,
  Service,
  TermsSnapshot,
  Turnaround,
} from "@/types";
import { daysAgo, daysFromNow, plusHours } from "./time";

export type Step =
  | { do: "accept" }
  | { do: "clarify"; message: string }
  | { do: "clientNote"; message: string }
  | { do: "creativeNote"; message: string }
  | {
      do: "propose";
      kind: "CHANGES" | "QUOTE";
      subtotal: bigint;
      commitmentBps: BasisPoints | null;
      note?: string;
      discount?: Discount;
      charges?: ChargeConfig[];
      turnaround?: Turnaround;
      validForDays?: number;
    }
  | { do: "acceptProposal" }
  | { do: "rejectProposal" }
  | { do: "acceptTerms" }
  | { do: "declare"; amount: bigint; methodId: string; reference?: string }
  | { do: "confirm"; amount: bigint; ofDeclaration: boolean }
  | { do: "notReceived"; note: string }
  | { do: "start" }
  | { do: "close" }
  | { do: "decline"; reason?: string }
  | { do: "withdraw"; reason?: string };

export type RequestSeed = {
  id: string;
  reference: string;
  title: string;
  service: Service;
  creative: CreativeProfile;
  clientId: string;
  selection: Selection;
  answers: Answers;
  submittedDaysAgo: number;
  steps: Step[];
};

export type BuiltRequest = { detail: RequestDetail; project: Project | null };

function buildScope(service: Service, selection: Selection): ScopeSnapshot {
  const pkg = service.packages.find((p) => p.id === selection.packageId) ?? null;
  const delivery =
    service.deliveryOptions.find((d) => d.id === selection.deliveryOptionId) ??
    service.deliveryOptions.find((d) => d.isStandard)!;
  return {
    selection,
    packageName: pkg?.name ?? null,
    deliverables: service.deliverables
      .filter((d) => d.packageId === null || d.packageId === pkg?.id)
      .map((d) => ({ name: d.name, description: d.description })),
    turnaround: delivery.isStandard && pkg ? pkg.turnaround : delivery.turnaround,
    revisions: pkg?.revisions ?? service.revisions.policy,
  };
}

export function buildSnapshot(
  service: Service,
  creative: CreativeProfile,
  selection: Selection,
  answers: Answers,
): RequestSnapshot {
  const issues = validateBriefAnswers(service.brief, answers);
  if (issues.length > 0) {
    throw new Error(
      `Fixture Brief for ${service.slug} is incomplete: ${issues.map((i) => i.target).join(", ")}`,
    );
  }
  const bps = serviceCommitmentBps(service, creative);
  const price = unwrap(calculatePrice(toPricingConfig(service), selection, bps));
  return {
    service: {
      serviceId: service.id,
      name: service.name,
      slug: service.slug,
      shortDescription: service.shortDescription,
      pricingMode: service.pricingMode,
      currency: service.currency,
      creative: {
        userId: creative.userId,
        username: creative.username,
        displayName: creative.displayName,
        professionalTitle: creative.professionalTitle,
      },
    },
    scope: buildScope(service, selection),
    brief: {
      brief: service.brief,
      answers,
      visibleQuestionIds: visibleQuestions(service.brief, answers).map((q) => q.id),
    },
    price,
    terms: { content: service.terms.content, version: service.terms.version },
    commitment: {
      bps: price.commitment ? bps : null,
      amountMinor: price.commitment?.amountMinor ?? null,
    },
  };
}

export function buildRequest(seed: RequestSeed): BuiltRequest {
  const snapshot = buildSnapshot(seed.service, seed.creative, seed.selection, seed.answers);
  const submittedAt = daysAgo(seed.submittedDaysAgo);
  const terms: TermsSnapshot = snapshot.terms;
  const currency = seed.service.currency;
  const creativeId = seed.creative.userId;

  let state = submittedRequest(snapshot.price.priceState);
  let clock = submittedAt;
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${seed.id}-${++seq}`;
  const tick = () => (clock = plusHours(clock, 5));

  const detail: RequestDetail = {
    request: undefined as never,
    proposals: [],
    agreement: null,
    termsAcceptances: [
      {
        id: nextId("ta"),
        requestId: seed.id,
        clientId: seed.clientId,
        kind: "SUBMISSION",
        terms,
        acceptedAt: submittedAt,
      },
    ],
    responses: [],
    declarations: [],
    confirmations: [],
    adjustments: [],
  };
  let project: Project | null = null;
  let closedAt: string | null = null;
  let closureReason: string | null = null;

  const act = (action: RequestAction, actor: "CREATIVE" | "CLIENT") => {
    const result = transitionRequest(state, action, actor);
    if (!result.ok) {
      throw new Error(`Fixture ${seed.reference}: ${action.type} failed with ${result.error.code}`);
    }
    state = result.value.state;
  };
  const openProposal = () => detail.proposals.find((p) => p.status === "PROPOSED");
  const respond = (
    role: "CREATIVE" | "CLIENT",
    type: RequestDetail["responses"][number]["type"],
    message: string,
  ) =>
    detail.responses.push({
      id: nextId("rr"),
      requestId: seed.id,
      proposalId: openProposal()?.id ?? null,
      authorUserId: role === "CREATIVE" ? creativeId : seed.clientId,
      authorRole: role,
      type,
      message,
      attachmentIds: [],
      createdAt: clock,
    });

  for (const step of seed.steps) {
    tick();
    switch (step.do) {
      case "accept": {
        const required = snapshot.commitment.amountMinor;
        act({ type: "ACCEPT_REQUEST", requiredCommitmentMinor: required }, "CREATIVE");
        detail.agreement = {
          id: nextId("ag"),
          requestId: seed.id,
          proposalId: null,
          scope: snapshot.scope,
          currency,
          agreedPriceMinor: snapshot.price.total!.amountMinor,
          turnaround: snapshot.scope.turnaround,
          commitmentBps: snapshot.commitment.bps,
          commitmentAmountMinor: required,
          agreedAt: clock,
        };
        break;
      }
      case "clarify":
        act({ type: "REQUEST_CLARIFICATION" }, "CREATIVE");
        respond("CREATIVE", "CREATIVE_CLARIFICATION", step.message);
        break;
      case "clientNote":
        if (
          state.status === "AWAITING_CLIENT" &&
          state.awaitingClientReason === "CLARIFICATION_REQUESTED"
        ) {
          act({ type: "RESPOND_TO_CLARIFICATION" }, "CLIENT");
        }
        respond("CLIENT", "CLIENT_CLARIFICATION", step.message);
        break;
      case "creativeNote":
        respond("CREATIVE", "CREATIVE_CLARIFICATION", step.message);
        break;
      case "propose": {
        const previous = openProposal();
        if (previous) previous.status = "SUPERSEDED";
        act({ type: "SEND_PROPOSAL", kind: step.kind }, "CREATIVE");
        const totals = unwrap(
          calculateProposalTotals({
            currency,
            subtotalMinor: step.subtotal,
            discount: step.discount ?? null,
            charges: step.charges ?? [],
            commitmentBps: step.commitmentBps,
          }),
        );
        const proposal: CommercialProposal = {
          id: nextId("cp"),
          requestId: seed.id,
          version: detail.proposals.length + 1,
          kind: step.kind,
          proposedByUserId: creativeId,
          scope: snapshot.scope,
          currency,
          subtotalMinor: step.subtotal,
          discount: step.discount ?? null,
          charges: step.charges ?? [],
          totalMinor: totals.total.amountMinor,
          commitmentBps: step.commitmentBps,
          commitmentAmountMinor: totals.commitment?.amountMinor ?? null,
          turnaround: step.turnaround ?? snapshot.scope.turnaround,
          note: step.note ?? null,
          validUntil: step.validForDays === undefined ? null : daysFromNow(step.validForDays),
          status: "PROPOSED",
          createdAt: clock,
          respondedAt: null,
        };
        detail.proposals.push(proposal);
        if (step.note)
          respond(
            "CREATIVE",
            step.kind === "CHANGES" ? "CHANGE_REQUEST_NOTE" : "PROPOSAL_NOTE",
            step.note,
          );
        break;
      }
      case "acceptProposal": {
        const proposal = openProposal()!;
        act(
          {
            type: "ACCEPT_PROPOSAL",
            requiredCommitmentMinor: proposal.commitmentAmountMinor,
            proposalExpired: false,
          },
          "CLIENT",
        );
        proposal.status = "ACCEPTED";
        proposal.respondedAt = clock;
        detail.agreement = {
          id: nextId("ag"),
          requestId: seed.id,
          proposalId: proposal.id,
          scope: proposal.scope,
          currency,
          agreedPriceMinor: proposal.totalMinor,
          turnaround: proposal.turnaround,
          commitmentBps: proposal.commitmentBps,
          commitmentAmountMinor: proposal.commitmentAmountMinor,
          agreedAt: clock,
        };
        break;
      }
      case "rejectProposal": {
        const proposal = openProposal()!;
        act({ type: "REJECT_PROPOSAL" }, "CLIENT");
        proposal.status = "REJECTED";
        proposal.respondedAt = clock;
        break;
      }
      case "acceptTerms":
        act({ type: "ACCEPT_TERMS" }, "CLIENT");
        detail.termsAcceptances.push({
          id: nextId("ta"),
          requestId: seed.id,
          clientId: seed.clientId,
          kind: "FINAL",
          terms,
          acceptedAt: clock,
        });
        break;
      case "declare": {
        act({ type: "DECLARE_PAYMENT" }, "CLIENT");
        const declaration: PaymentDeclaration = {
          id: nextId("pd"),
          requestId: seed.id,
          clientId: seed.clientId,
          paymentMethod: {
            id: step.methodId,
            type: step.methodId.endsWith("paypal") ? "PAYPAL" : "BANK_TRANSFER",
            label: step.methodId.endsWith("paypal") ? "PayPal" : "Bank transfer (Naira)",
          },
          declaredAmountMinor: step.amount,
          currency,
          paidOn: clock.slice(0, 10),
          reference: step.reference ?? null,
          evidenceAssetId: null,
          resolution: "PENDING",
          resolutionNote: null,
          declaredAt: clock,
          resolvedAt: null,
        };
        detail.declarations.push(declaration);
        break;
      }
      case "confirm": {
        const pending = step.ofDeclaration
          ? detail.declarations.find((d) => d.resolution === "PENDING")
          : undefined;
        act(
          {
            type: "CONFIRM_PAYMENT",
            amountMinor: step.amount,
            resolvesDeclaration: step.ofDeclaration,
          },
          "CREATIVE",
        );
        if (pending) {
          pending.resolution = "CONFIRMED";
          pending.resolvedAt = clock;
        }
        detail.confirmations.push({
          id: nextId("pc"),
          requestId: seed.id,
          declarationId: pending?.id ?? null,
          creativeId,
          confirmedAmountMinor: step.amount,
          currency,
          confirmedAt: clock,
        });
        break;
      }
      case "notReceived": {
        const pending = detail.declarations.find((d) => d.resolution === "PENDING")!;
        act({ type: "MARK_NOT_RECEIVED" }, "CREATIVE");
        pending.resolution = "NOT_RECEIVED";
        pending.resolutionNote = step.note;
        pending.resolvedAt = clock;
        break;
      }
      case "start": {
        act({ type: "START_PROJECT" }, "CREATIVE");
        const agreement: CommercialAgreement = detail.agreement!;
        const confirmed = detail.confirmations.reduce((sum, c) => sum + c.confirmedAmountMinor, 0n);
        project = {
          id: `prj-${seed.id}`,
          requestId: seed.id,
          creativeId,
          clientId: seed.clientId,
          title: seed.title,
          service: snapshot.service,
          agreement,
          brief: snapshot.brief,
          paymentSummary: {
            currency,
            projectTotalMinor: agreement.agreedPriceMinor,
            requiredCommitmentMinor: agreement.commitmentAmountMinor,
            totalConfirmedMinor: confirmed,
            outstandingBalanceMinor: agreement.agreedPriceMinor - confirmed,
          },
          agreedTimeline: agreement.turnaround,
          status: "ACTIVE",
          startedAt: clock,
          completedAt: null,
        };
        closedAt = clock;
        break;
      }
      case "close": {
        // TS narrows `project` to null across loop iterations; widen it explicitly.
        const started = project as Project | null;
        if (!started) throw new Error(`Fixture ${seed.reference}: close before start`);
        project = { ...started, status: "COMPLETED", completedAt: clock };
        break;
      }
      case "decline":
        act({ type: "DECLINE" }, "CREATIVE");
        closedAt = clock;
        closureReason = step.reason ?? null;
        break;
      case "withdraw":
        act({ type: "WITHDRAW" }, "CLIENT");
        closedAt = clock;
        closureReason = step.reason ?? null;
        break;
    }
  }

  detail.request = {
    ...state,
    id: seed.id,
    reference: seed.reference,
    serviceId: seed.service.id,
    creativeId,
    clientId: seed.clientId,
    title: seed.title,
    snapshot,
    idempotencyKey: `idem-${seed.id}`,
    submittedAt,
    updatedAt: clock,
    closedAt,
    closureReason,
    projectId: project?.id ?? null,
  };
  return { detail, project };
}
