/**
 * Cross-cutting business policies (docs/03 §7, §11, §15, §49, PRD SRV-004, PROF-003,
 * D-002, D-018, D-021).
 */
import { type Brief, validateBriefDefinition } from "./brief";
import type { ServiceLifecycle } from "./capacity";
import type { ModerationStatus } from "./lifecycles";
import { type BasisPoints, PERCENT_100 } from "./money";
import { type PricingConfig, validatePricingConfig } from "./pricing";
import type { DomainError } from "./result";

export type Availability = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";

// ---------------------------------------------------------------------------
// New Requests (docs/03 §15)
// ---------------------------------------------------------------------------

export type RequestBlockReason =
  | "ACCOUNT_NOT_OPERATIONAL"
  | "CREATIVE_UNAVAILABLE"
  | "SERVICE_NOT_PUBLISHED"
  | "OUTSIDE_CAPACITY"
  | "PLATFORM_DISABLED";

export type RequestEligibilityInput = {
  creativeAccountOperational: boolean;
  availability: Availability;
  lifecycle: ServiceLifecycle;
  withinSubscriptionCapacity: boolean;
  moderation: ModerationStatus;
};

/**
 * Whether a Service can take a new Request, with the internal reason when not.
 * Never show the reason publicly; public pages say the Service isn't available
 * right now (CLAUDE.md §12). LIMITED availability does not block.
 */
export function newRequestBlock(input: RequestEligibilityInput): RequestBlockReason | null {
  if (!input.creativeAccountOperational) return "ACCOUNT_NOT_OPERATIONAL";
  if (input.moderation !== "NORMAL") return "PLATFORM_DISABLED";
  if (input.availability === "UNAVAILABLE") return "CREATIVE_UNAVAILABLE";
  if (input.lifecycle !== "PUBLISHED") return "SERVICE_NOT_PUBLISHED";
  if (!input.withinSubscriptionCapacity) return "OUTSIDE_CAPACITY";
  return null;
}

export function canAcceptNewRequest(input: RequestEligibilityInput): boolean {
  return newRequestBlock(input) === null;
}

/** A Creative cannot commission their own Service (docs/03 invariant 5). */
export function canCommissionService(clientUserId: string, creativeUserId: string): boolean {
  return clientUserId !== creativeUserId;
}

// ---------------------------------------------------------------------------
// Public eligibility (docs/03 §11, PROF-002)
// ---------------------------------------------------------------------------

export type ProfileForPublic = {
  emailVerified: boolean;
  phoneVerified: boolean;
  accountStatus: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DELETION_PENDING";
  displayName: string;
  username: string;
  professionalTitle: string;
  introduction: string;
};

export function canGoPublic(profile: ProfileForPublic): boolean {
  return (
    profile.emailVerified &&
    profile.phoneVerified &&
    profile.accountStatus === "ACTIVE" &&
    [profile.displayName, profile.username, profile.professionalTitle, profile.introduction].every(
      (field) => field.trim().length > 0,
    )
  );
}

// ---------------------------------------------------------------------------
// Ready to Start and terms (docs/03 §49, D-002)
// ---------------------------------------------------------------------------

export type ReadinessInput = {
  scopeAgreed: boolean;
  priceAgreed: boolean;
  briefComplete: boolean;
  termsAccepted: boolean;
  commitmentRequired: boolean;
  commitmentSatisfied: boolean;
};

export function isReadyToStart(input: ReadinessInput): boolean {
  return (
    input.scopeAgreed &&
    input.priceAgreed &&
    input.briefComplete &&
    input.termsAccepted &&
    (!input.commitmentRequired || input.commitmentSatisfied)
  );
}

/** The submission acknowledgement is final unless terms changed or a proposal was accepted (D-002). */
export function requiresExplicitTermsAcceptance(input: {
  termsChangedSinceSubmission: boolean;
  proposalAccepted: boolean;
}): boolean {
  return input.termsChangedSinceSubmission || input.proposalAccepted;
}

// ---------------------------------------------------------------------------
// Publish validation (PRD SRV-004), grouped by Service Builder section (docs/04 §12)
// ---------------------------------------------------------------------------

export const BUILDER_SECTIONS = [
  "basics",
  "pricing",
  "scope",
  "addons-options",
  "delivery-revisions",
  "brief",
  "terms",
  "commitment-payment",
  "work-samples",
  "preview-publish",
] as const;
export type BuilderSection = (typeof BUILDER_SECTIONS)[number];

export type CommitmentConfig =
  | { mode: "NONE" }
  | { mode: "CREATIVE_DEFAULT"; defaultBps: BasisPoints | null }
  | { mode: "CUSTOM"; bps: BasisPoints };

export type RevisionPolicy =
  { kind: "NONE" } | { kind: "FIXED"; count: number } | { kind: "UNLIMITED" };

export type ServiceForPublish = {
  name: string;
  shortDescription: string;
  categoryId: string | null;
  pricing: PricingConfig;
  deliverableCount: number;
  standardTurnaroundValue: number | null;
  revisions: RevisionPolicy | null;
  terms: string;
  brief: Brief;
  commitment: CommitmentConfig;
  selectedPaymentMethodCount: number;
};

export type PublishBlocker = DomainError & { section: BuilderSection };

/** The commitment percentage a Service resolves to, or null if none (SRV-025). */
export function resolveCommitmentBps(config: CommitmentConfig): BasisPoints | null {
  switch (config.mode) {
    case "NONE":
      return null;
    case "CREATIVE_DEFAULT":
      return config.defaultBps;
    case "CUSTOM":
      return config.bps;
  }
}

const PRICING_SECTION: Record<string, BuilderSection> = {
  UNKNOWN_ADDON: "addons-options",
  OPTIONS_REQUIRED: "addons-options",
  NEGATIVE_MODIFIER: "addons-options",
  BROKEN_DEPENDENCY: "addons-options",
  SELF_DEPENDENCY: "addons-options",
  STANDARD_DELIVERY_REQUIRED: "delivery-revisions",
  STANDARD_DELIVERY_MODIFIER: "delivery-revisions",
};

/**
 * Every reason a Service cannot be published, each linked to the Builder section
 * that fixes it (docs/06 §58). Capacity and account verification are checked at
 * the Publish action, not here.
 */
export function publishBlockers(service: ServiceForPublish): PublishBlocker[] {
  const blockers: PublishBlocker[] = [];
  const add = (section: BuilderSection, code: string, message: string, target?: string) =>
    blockers.push({ section, code, message, ...(target ? { target } : {}) });

  if (!service.name.trim()) add("basics", "NAME_REQUIRED", "Add a Service name.");
  if (!service.shortDescription.trim())
    add("basics", "DESCRIPTION_REQUIRED", "Add a short description.");
  if (!service.categoryId) add("basics", "CATEGORY_REQUIRED", "Choose a category.");

  for (const issue of validatePricingConfig(service.pricing)) {
    add(PRICING_SECTION[issue.code] ?? "pricing", issue.code, issue.message, issue.target);
  }

  if (service.deliverableCount === 0 && service.pricing.mode !== "CUSTOM_QUOTE") {
    add("scope", "DELIVERABLES_REQUIRED", "List at least one deliverable.");
  }

  if (!service.standardTurnaroundValue || service.standardTurnaroundValue <= 0) {
    add("delivery-revisions", "TURNAROUND_REQUIRED", "Set a standard turnaround.");
  }
  if (!service.revisions) {
    add("delivery-revisions", "REVISIONS_REQUIRED", "Choose a revision policy.");
  } else if (
    service.revisions.kind === "FIXED" &&
    !(Number.isInteger(service.revisions.count) && service.revisions.count > 0)
  ) {
    add("delivery-revisions", "INVALID_REVISIONS", "Set how many revisions are included.");
  }

  for (const issue of validateBriefDefinition(service.brief)) {
    add("brief", issue.code, issue.message, issue.target);
  }

  if (!service.terms.trim()) add("terms", "TERMS_REQUIRED", "Add your terms.");

  const bps = resolveCommitmentBps(service.commitment);
  if (service.commitment.mode === "CREATIVE_DEFAULT" && bps === null) {
    add(
      "commitment-payment",
      "DEFAULT_COMMITMENT_MISSING",
      "Set a default commitment in Business Preferences, or choose a custom one.",
    );
  }
  if (bps !== null && !(Number.isInteger(bps) && bps > 0 && bps <= PERCENT_100)) {
    add("commitment-payment", "INVALID_COMMITMENT", "Commitment must be between 1% and 100%.");
  }
  if (bps !== null && service.selectedPaymentMethodCount === 0) {
    add(
      "commitment-payment",
      "PAYMENT_METHOD_REQUIRED",
      "Select at least one payment method for the commitment.",
    );
  }

  return blockers;
}

// ---------------------------------------------------------------------------
// Usernames (PROF-003, D-021)
// ---------------------------------------------------------------------------

/** Route prefixes plus platform, legal and common system names (D-021). Extend, never shrink. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // Route prefixes
  "app",
  "admin",
  "auth",
  "dev",
  "api",
  // D-021 named words
  "modgeto",
  "www",
  "help",
  "support",
  "settings",
  "pricing",
  "about",
  "terms",
  "privacy",
  "blog",
  "login",
  "signup",
  // Common system and marketing names
  "account",
  "accounts",
  "billing",
  "checkout",
  "contact",
  "dashboard",
  "docs",
  "download",
  "explore",
  "faq",
  "features",
  "home",
  "legal",
  "logout",
  "mail",
  "new",
  "notifications",
  "null",
  "onboarding",
  "refunds",
  "register",
  "reset",
  "root",
  "search",
  "security",
  "signin",
  "sign-in",
  "sign-up",
  "static",
  "status",
  "subscription",
  "subscriptions",
  "system",
  "undefined",
  "user",
  "users",
  "verify",
  "assets",
  "images",
  "favicon",
  "robots",
  "sitemap",
  "icon",
  "_next",
]);

export type UsernameProblem = "LENGTH" | "CHARACTERS" | "HYPHEN_EDGE" | "RESERVED";

/** Lowercases and trims; usernames are case-insensitive. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(input: string): UsernameProblem | null {
  const username = normalizeUsername(input);
  if (username.length < 3 || username.length > 30) return "LENGTH";
  if (!/^[a-z0-9-]+$/.test(username)) return "CHARACTERS";
  if (username.startsWith("-") || username.endsWith("-")) return "HYPHEN_EDGE";
  if (RESERVED_USERNAMES.has(username)) return "RESERVED";
  return null;
}

// ---------------------------------------------------------------------------
// Files (D-018)
// ---------------------------------------------------------------------------

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

export type FileProblem = "TOO_LARGE" | "EMPTY" | "TYPE_NOT_ALLOWED";

/**
 * SVG is allowed only for Creative-owned public assets, never Client uploads,
 * because SVG can carry scripts (D-018).
 */
export function validateFile(
  file: { mimeType: string; sizeBytes: number },
  purpose: "CREATIVE_PUBLIC" | "PRIVATE",
): FileProblem | null {
  if (file.sizeBytes <= 0) return "EMPTY";
  if (file.sizeBytes > MAX_FILE_BYTES) return "TOO_LARGE";
  const mime = file.mimeType.toLowerCase();
  if (mime === "image/svg+xml") return purpose === "CREATIVE_PUBLIC" ? null : "TYPE_NOT_ALLOWED";
  return ALLOWED_MIME.has(mime) ? null : "TYPE_NOT_ALLOWED";
}
