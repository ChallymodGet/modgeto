/**
 * Request aggregate: draft configuration, immutable submission snapshots,
 * negotiation, terms and external payment records (docs/03 §36–46, D-002,
 * D-007–D-009, D-027–D-030, D-035).
 */
import type {
  Answers,
  BasisPoints,
  Brief,
  ChargeConfig,
  Currency,
  Discount,
  PriceBreakdown,
  PricingMode,
  ProposalStatus,
  RequestState,
  RevisionPolicy,
  Selection,
} from "@/lib/domain";
import type { ID, PaymentMethodType, Timestamp } from "./identity";
import type { Turnaround } from "./service";

/** Mutable until submission; Guests persist through anonymous sign-in (D-024). */
export type DraftConfiguration = {
  id: ID;
  serviceId: ID;
  clientUserId: ID;
  selection: Selection;
  answers: Answers;
  /** Service.updatedAt when last validated, to detect material changes (CFG-007). */
  validatedAgainstServiceAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Snapshots: captured at submission and never edited (SRV-008, D-009)
// ---------------------------------------------------------------------------

export type ServiceSnapshot = {
  serviceId: ID;
  name: string;
  slug: string;
  shortDescription: string;
  pricingMode: PricingMode;
  currency: Currency;
  creative: { userId: ID; username: string; displayName: string; professionalTitle: string };
};

export type ScopeSnapshot = {
  selection: Selection;
  packageName: string | null;
  deliverables: { name: string; description: string | null }[];
  turnaround: Turnaround;
  revisions: RevisionPolicy;
};

/** Structure, choices, answers and the conditional path the Client actually saw (BRF-008). */
export type BriefSnapshot = {
  brief: Brief;
  answers: Answers;
  visibleQuestionIds: ID[];
};

export type TermsSnapshot = { content: string; version: number };

export type CommitmentSnapshot = { bps: BasisPoints | null; amountMinor: bigint | null };

export type RequestSnapshot = {
  service: ServiceSnapshot;
  scope: ScopeSnapshot;
  brief: BriefSnapshot;
  price: PriceBreakdown;
  terms: TermsSnapshot;
  commitment: CommitmentSnapshot;
};

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

/** The domain state (status and payment facts) plus identity and the submission snapshot. */
export type Request = RequestState & {
  id: ID;
  /** Human reference shown in the UI and emails. */
  reference: string;
  serviceId: ID;
  creativeId: ID;
  clientId: ID;
  /** Short name for lists, e.g. the Client's brand or project name. */
  title: string;
  snapshot: RequestSnapshot;
  /** Prevents accidental duplicate submissions (CFG-006). */
  idempotencyKey: string;
  submittedAt: Timestamp;
  updatedAt: Timestamp;
  closedAt: Timestamp | null;
  /** Optional reason for a decline or withdrawal (docs/01 §13.4, docs/05 §44). */
  closureReason: string | null;
  projectId: ID | null;
};

// ---------------------------------------------------------------------------
// Negotiation (D-008)
// ---------------------------------------------------------------------------

export type CommercialProposal = {
  id: ID;
  requestId: ID;
  version: number;
  /** CHANGES = "Request Changes"; QUOTE = final price for Starting From or Custom Quote. */
  kind: "CHANGES" | "QUOTE";
  proposedByUserId: ID;
  scope: ScopeSnapshot;
  currency: Currency;
  subtotalMinor: bigint;
  discount: Discount | null;
  charges: ChargeConfig[];
  totalMinor: bigint;
  commitmentBps: BasisPoints | null;
  commitmentAmountMinor: bigint | null;
  turnaround: Turnaround;
  /** Required for CHANGES (D-008). */
  note: string | null;
  /** Quote validity (D-017). */
  validUntil: Timestamp | null;
  status: ProposalStatus;
  createdAt: Timestamp;
  respondedAt: Timestamp | null;
};

/** The agreed scope and price. `proposalId` is null when the Creative accepted the submitted price. */
export type CommercialAgreement = {
  id: ID;
  requestId: ID;
  proposalId: ID | null;
  scope: ScopeSnapshot;
  currency: Currency;
  agreedPriceMinor: bigint;
  turnaround: Turnaround;
  commitmentBps: BasisPoints | null;
  commitmentAmountMinor: bigint | null;
  agreedAt: Timestamp;
};

/** SUBMISSION is the acknowledgement at submit; FINAL is the explicit acceptance (D-002). */
export type TermsAcceptance = {
  id: ID;
  requestId: ID;
  clientId: ID;
  kind: "SUBMISSION" | "FINAL";
  terms: TermsSnapshot;
  acceptedAt: Timestamp;
};

export type RequestResponseType =
  | "CHANGE_REQUEST_NOTE"
  | "CLIENT_CLARIFICATION"
  | "CREATIVE_CLARIFICATION"
  | "PROPOSAL_NOTE"
  | "PROPOSAL_RESPONSE";

/** Structured clarification during negotiation only, never Project chat (docs/03 §43). */
export type RequestResponse = {
  id: ID;
  requestId: ID;
  proposalId: ID | null;
  authorUserId: ID;
  authorRole: "CREATIVE" | "CLIENT";
  type: RequestResponseType;
  message: string;
  /** Private attachments (D-009). */
  attachmentIds: ID[];
  createdAt: Timestamp;
};

// ---------------------------------------------------------------------------
// External Project payment (docs/03 §44–46, D-028, D-030). Never Paystack.
// ---------------------------------------------------------------------------

export type DeclarationResolution = "PENDING" | "CONFIRMED" | "NOT_RECEIVED";

export type PaymentDeclaration = {
  id: ID;
  requestId: ID;
  clientId: ID;
  paymentMethod: { id: ID; type: PaymentMethodType; label: string };
  declaredAmountMinor: bigint;
  currency: Currency;
  /** Calendar date the Client says they paid (YYYY-MM-DD). */
  paidOn: string;
  reference: string | null;
  evidenceAssetId: ID | null;
  resolution: DeclarationResolution;
  /** Required note when the Creative marks Not received (D-028). */
  resolutionNote: string | null;
  declaredAt: Timestamp;
  resolvedAt: Timestamp | null;
};

/** Amount actually received, entered by the Creative after checking their account (PAY-005). */
export type PaymentConfirmation = {
  id: ID;
  requestId: ID;
  declarationId: ID | null;
  creativeId: ID;
  confirmedAmountMinor: bigint;
  currency: Currency;
  confirmedAt: Timestamp;
};

/** Reversing correction; confirmations are never edited (D-030). Amount is negative. */
export type PaymentAdjustment = {
  id: ID;
  requestId: ID;
  creativeId: ID;
  amountMinor: bigint;
  currency: Currency;
  reason: string;
  createdAt: Timestamp;
};

/** Everything a Request detail screen needs, loaded together. */
export type RequestDetail = {
  request: Request;
  proposals: CommercialProposal[];
  agreement: CommercialAgreement | null;
  termsAcceptances: TermsAcceptance[];
  responses: RequestResponse[];
  declarations: PaymentDeclaration[];
  confirmations: PaymentConfirmation[];
  adjustments: PaymentAdjustment[];
};
