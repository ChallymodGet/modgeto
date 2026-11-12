import { describe, expect, it } from "vitest";
import { major } from "./money";
import {
  type RequestEligibilityInput,
  type ServiceForPublish,
  canAcceptNewRequest,
  canCommissionService,
  canGoPublic,
  isReadyToStart,
  newRequestBlock,
  publishBlockers,
  requiresExplicitTermsAcceptance,
  resolveCommitmentBps,
  validateFile,
  validateUsername,
} from "./policies";

describe("new Requests (docs/03 §15)", () => {
  const open: RequestEligibilityInput = {
    creativeAccountOperational: true,
    availability: "AVAILABLE",
    lifecycle: "PUBLISHED",
    withinSubscriptionCapacity: true,
    moderation: "NORMAL",
  };

  it("Limited availability still accepts Requests", () => {
    expect(canAcceptNewRequest({ ...open, availability: "LIMITED" })).toBe(true);
  });

  it("blocks for each documented reason", () => {
    expect(newRequestBlock({ ...open, availability: "UNAVAILABLE" })).toBe("CREATIVE_UNAVAILABLE");
    expect(newRequestBlock({ ...open, lifecycle: "UNAVAILABLE" })).toBe("SERVICE_NOT_PUBLISHED");
    expect(newRequestBlock({ ...open, lifecycle: "SUBSCRIPTION_INACTIVE" })).toBe(
      "SERVICE_NOT_PUBLISHED",
    );
    expect(newRequestBlock({ ...open, withinSubscriptionCapacity: false })).toBe(
      "OUTSIDE_CAPACITY",
    );
    expect(newRequestBlock({ ...open, moderation: "PLATFORM_DISABLED" })).toBe("PLATFORM_DISABLED");
    expect(newRequestBlock({ ...open, creativeAccountOperational: false })).toBe(
      "ACCOUNT_NOT_OPERATIONAL",
    );
    expect(newRequestBlock(open)).toBeNull();
  });

  it("a Creative cannot commission their own Service", () => {
    expect(canCommissionService("u1", "u1")).toBe(false);
    expect(canCommissionService("u2", "u1")).toBe(true);
  });
});

describe("public eligibility (docs/03 §11)", () => {
  const profile = {
    emailVerified: true,
    phoneVerified: true,
    accountStatus: "ACTIVE" as const,
    displayName: "Ada Okafor",
    username: "ada",
    professionalTitle: "Brand designer",
    introduction: "I design brands.",
  };

  it("needs both verifications, an active account and the required fields", () => {
    expect(canGoPublic(profile)).toBe(true);
    expect(canGoPublic({ ...profile, phoneVerified: false })).toBe(false);
    expect(canGoPublic({ ...profile, accountStatus: "SUSPENDED" })).toBe(false);
    expect(canGoPublic({ ...profile, introduction: "  " })).toBe(false);
  });
});

describe("Ready to Start and terms", () => {
  const all = {
    scopeAgreed: true,
    priceAgreed: true,
    briefComplete: true,
    termsAccepted: true,
    commitmentRequired: true,
    commitmentSatisfied: true,
  };

  it("requires every condition (docs/03 §49)", () => {
    expect(isReadyToStart(all)).toBe(true);
    for (const key of [
      "scopeAgreed",
      "priceAgreed",
      "briefComplete",
      "termsAccepted",
      "commitmentSatisfied",
    ] as const) {
      expect(isReadyToStart({ ...all, [key]: false })).toBe(false);
    }
    expect(isReadyToStart({ ...all, commitmentRequired: false, commitmentSatisfied: false })).toBe(
      true,
    );
  });

  it("asks for explicit terms only after a change or accepted proposal (D-002)", () => {
    expect(
      requiresExplicitTermsAcceptance({
        termsChangedSinceSubmission: false,
        proposalAccepted: false,
      }),
    ).toBe(false);
    expect(
      requiresExplicitTermsAcceptance({
        termsChangedSinceSubmission: true,
        proposalAccepted: false,
      }),
    ).toBe(true);
    expect(
      requiresExplicitTermsAcceptance({
        termsChangedSinceSubmission: false,
        proposalAccepted: true,
      }),
    ).toBe(true);
  });
});

describe("publish blockers (SRV-004)", () => {
  const ready: ServiceForPublish = {
    name: "Brand Identity",
    shortDescription: "A complete brand identity.",
    categoryId: "design",
    pricing: {
      currency: "NGN",
      mode: "FIXED",
      baseAmountMinor: major(450_000, "NGN").amountMinor,
      packages: [],
      quantityRules: [],
      addOns: [],
      optionGroups: [],
      deliveryOptions: [{ id: "std", label: "Standard", isStandard: true, modifier: null }],
      dependencies: [],
      charges: [],
    },
    deliverableCount: 3,
    standardTurnaroundValue: 21,
    revisions: { kind: "FIXED", count: 2 },
    terms: "50% to start. Two revision rounds.",
    brief: { sections: [] },
    commitment: { mode: "CUSTOM", bps: 5_000 },
    selectedPaymentMethodCount: 1,
  };

  it("passes a complete Service", () => {
    expect(publishBlockers(ready)).toEqual([]);
  });

  it("links each problem to the Builder section that fixes it (docs/06 §58)", () => {
    const blockers = publishBlockers({
      ...ready,
      name: "",
      categoryId: null,
      pricing: { ...ready.pricing, baseAmountMinor: 0n, deliveryOptions: [] },
      deliverableCount: 0,
      standardTurnaroundValue: null,
      revisions: null,
      terms: " ",
      brief: { sections: [{ id: "s", title: "S", questions: [] }] },
      selectedPaymentMethodCount: 0,
    }).map((b) => [b.section, b.code]);
    expect(blockers).toEqual([
      ["basics", "NAME_REQUIRED"],
      ["basics", "CATEGORY_REQUIRED"],
      ["pricing", "BASE_PRICE_REQUIRED"],
      ["delivery-revisions", "STANDARD_DELIVERY_REQUIRED"],
      ["scope", "DELIVERABLES_REQUIRED"],
      ["delivery-revisions", "TURNAROUND_REQUIRED"],
      ["delivery-revisions", "REVISIONS_REQUIRED"],
      ["brief", "EMPTY_SECTION"],
      ["terms", "TERMS_REQUIRED"],
      ["commitment-payment", "PAYMENT_METHOD_REQUIRED"],
    ]);
  });

  it("needs no payment method when no commitment is required (SRV-025)", () => {
    expect(
      publishBlockers({ ...ready, commitment: { mode: "NONE" }, selectedPaymentMethodCount: 0 }),
    ).toEqual([]);
  });

  it("resolves the commitment source", () => {
    expect(resolveCommitmentBps({ mode: "NONE" })).toBeNull();
    expect(resolveCommitmentBps({ mode: "CREATIVE_DEFAULT", defaultBps: 3_000 })).toBe(3_000);
    expect(resolveCommitmentBps({ mode: "CUSTOM", bps: 5_000 })).toBe(5_000);
    const codes = publishBlockers({
      ...ready,
      commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
    }).map((b) => b.code);
    expect(codes).toEqual(["DEFAULT_COMMITMENT_MISSING"]);
    expect(
      publishBlockers({ ...ready, commitment: { mode: "CUSTOM", bps: 0 } }).map((b) => b.code),
    ).toEqual(["INVALID_COMMITMENT"]);
  });

  it("does not require deliverables for a Custom Quote", () => {
    expect(
      publishBlockers({
        ...ready,
        pricing: { ...ready.pricing, mode: "CUSTOM_QUOTE" },
        deliverableCount: 0,
      }),
    ).toEqual([]);
  });
});

describe("usernames (PROF-003, D-021)", () => {
  it("accepts valid usernames case-insensitively", () => {
    expect(validateUsername("Ada-Okafor")).toBeNull();
    expect(validateUsername("ada123")).toBeNull();
  });

  it("rejects each rule", () => {
    expect(validateUsername("ab")).toBe("LENGTH");
    expect(validateUsername("a".repeat(31))).toBe("LENGTH");
    expect(validateUsername("ada okafor")).toBe("CHARACTERS");
    expect(validateUsername("ada_okafor")).toBe("CHARACTERS");
    expect(validateUsername("-ada")).toBe("HYPHEN_EDGE");
    expect(validateUsername("ada-")).toBe("HYPHEN_EDGE");
  });

  it("blocks every route prefix and named reserved word", () => {
    for (const word of [
      "app",
      "admin",
      "auth",
      "dev",
      "api",
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
      "Pricing",
    ]) {
      expect(validateUsername(word)).toBe("RESERVED");
    }
  });
});

describe("files (D-018)", () => {
  it("allows the listed types up to 25 MB", () => {
    expect(
      validateFile({ mimeType: "application/pdf", sizeBytes: 25 * 1024 * 1024 }, "PRIVATE"),
    ).toBeNull();
    expect(
      validateFile({ mimeType: "application/pdf", sizeBytes: 25 * 1024 * 1024 + 1 }, "PRIVATE"),
    ).toBe("TOO_LARGE");
    expect(validateFile({ mimeType: "application/zip", sizeBytes: 10 }, "PRIVATE")).toBeNull();
    expect(validateFile({ mimeType: "video/mp4", sizeBytes: 10 }, "PRIVATE")).toBe(
      "TYPE_NOT_ALLOWED",
    );
    expect(validateFile({ mimeType: "image/png", sizeBytes: 0 }, "PRIVATE")).toBe("EMPTY");
  });

  it("allows SVG only for Creative-owned public assets", () => {
    expect(
      validateFile({ mimeType: "image/svg+xml", sizeBytes: 10 }, "CREATIVE_PUBLIC"),
    ).toBeNull();
    expect(validateFile({ mimeType: "image/svg+xml", sizeBytes: 10 }, "PRIVATE")).toBe(
      "TYPE_NOT_ALLOWED",
    );
  });
});
