/** The fixtures must obey every business rule, since screens are built against them. */
import { describe, expect, it } from "vitest";
import {
  QUESTION_TYPES,
  REQUEST_STATUSES,
  calculatePrice,
  capacityPrice,
  effectiveCapacity,
  publishBlockers,
  usedCapacity,
  validateUsername,
} from "@/lib/domain";
import {
  serviceCommitmentBps,
  toPricingConfig,
  toServiceForPublish,
} from "@/features/services/model";
import {
  capacityPrices,
  creatives,
  notifications,
  projects,
  requestDetails,
  services,
  subscriptions,
  users,
} from "./index";

const creativeOf = (userId: string) => creatives.find((c) => c.userId === userId)!;
const requests = requestDetails.map((d) => d.request);

describe("people", () => {
  it("covers every availability state with valid, unique usernames", () => {
    expect(new Set(creatives.map((c) => c.availability))).toEqual(
      new Set(["AVAILABLE", "LIMITED", "UNAVAILABLE"]),
    );
    for (const c of creatives) expect(validateUsername(c.username)).toBeNull();
    expect(new Set(creatives.map((c) => c.username)).size).toBe(creatives.length);
  });

  it("uses example.com emails and E.164 phones only", () => {
    for (const u of users) {
      expect(u.email).toMatch(/@example\.com$/);
      expect(u.phone).toMatch(/^\+[1-9]\d{7,14}$/);
    }
  });
});

describe("services", () => {
  it("covers every pricing mode and lifecycle state", () => {
    expect(new Set(services.map((s) => s.pricingMode))).toEqual(
      new Set(["FIXED", "STARTING_FROM", "QUANTITY", "PACKAGE", "CUSTOM_QUOTE"]),
    );
    expect(new Set(services.map((s) => s.lifecycle))).toEqual(
      new Set(["DRAFT", "PUBLISHED", "UNAVAILABLE", "SUBSCRIPTION_INACTIVE", "ARCHIVED"]),
    );
    expect(services.some((s) => s.moderation === "PLATFORM_DISABLED")).toBe(true);
    expect(new Set(services.map((s) => s.currency))).toEqual(new Set(["NGN", "USD", "GBP", "EUR"]));
  });

  it("every live Service passes publish validation", () => {
    for (const s of services.filter((s) => s.lifecycle !== "DRAFT" && s.lifecycle !== "ARCHIVED")) {
      expect(publishBlockers(toServiceForPublish(s, creativeOf(s.creativeId))), s.slug).toEqual([]);
    }
  });

  it("the unfinished Draft has a terms blocker", () => {
    const draft = services.find((s) => s.id === "svc-logo-refresh")!;
    expect(
      publishBlockers(toServiceForPublish(draft, creativeOf(draft.creativeId))).map((b) => b.code),
    ).toEqual(["TERMS_REQUIRED"]);
  });

  it("has unique slugs per Creative", () => {
    for (const c of creatives) {
      const slugs = services.filter((s) => s.creativeId === c.userId).map((s) => s.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("includes a Brief with every question type, a visual selection and a condition", () => {
    const brief = services.find((s) => s.id === "svc-brand-identity")!.brief;
    const questions = brief.sections.flatMap((s) => s.questions);
    expect(new Set(questions.map((q) => q.type))).toEqual(new Set(QUESTION_TYPES));
    expect(questions.some((q) => q.condition)).toBe(true);
  });
});

describe("capacity and subscriptions", () => {
  it("never exceeds a Creative's effective capacity", () => {
    for (const sub of subscriptions) {
      const used = usedCapacity(services.filter((s) => s.creativeId === sub.creativeId));
      expect(used, sub.creativeId).toBeLessThanOrEqual(
        effectiveCapacity(sub.status, sub.publishedServiceLimit),
      );
    }
  });

  it("covers every subscription status", () => {
    expect(new Set(subscriptions.map((s) => s.status))).toEqual(
      new Set(["FREE", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELLED"]),
    );
  });

  it("stores the D-001 price table exactly", () => {
    expect(capacityPrices).toHaveLength(20);
    for (const row of capacityPrices) {
      expect(row.amountMinor).toBe(
        capacityPrice(row.publishedServiceLimit, row.market).amountMinor,
      );
    }
  });
});

describe("requests", () => {
  it("covers every reachable status and every awaiting-client reason", () => {
    const reachable = REQUEST_STATUSES.filter((s) => s !== "ACCEPTED" && s !== "EXPIRED");
    expect(new Set(requests.map((r) => r.status))).toEqual(new Set(reachable));
    expect(new Set(requests.map((r) => r.awaitingClientReason).filter(Boolean))).toEqual(
      new Set(["CHANGES_PROPOSED", "QUOTE_PROPOSED", "CLARIFICATION_REQUESTED"]),
    );
  });

  it("snapshots reproduce their price exactly", () => {
    for (const r of requests) {
      const service = services.find((s) => s.id === r.serviceId)!;
      const again = calculatePrice(
        toPricingConfig(service),
        r.snapshot.scope.selection,
        serviceCommitmentBps(service, creativeOf(service.creativeId)),
      );
      expect(again.ok && again.value.total, r.reference).toEqual(r.snapshot.price.total);
    }
  });

  it("has unique references and no self-commissioning", () => {
    expect(new Set(requests.map((r) => r.reference)).size).toBe(requests.length);
    for (const r of requests) expect(r.clientId).not.toBe(r.creativeId);
  });

  it("keeps payment facts consistent with the records", () => {
    for (const d of requestDetails) {
      const confirmed =
        d.confirmations.reduce((sum, c) => sum + c.confirmedAmountMinor, 0n) +
        d.adjustments.reduce((sum, a) => sum + a.amountMinor, 0n);
      expect(d.request.confirmedMinor, d.request.reference).toBe(confirmed);
      expect(d.request.pendingDeclarations).toBe(
        d.declarations.filter((x) => x.resolution === "PENDING").length,
      );
    }
    const resolutions = requestDetails.flatMap((d) => d.declarations.map((x) => x.resolution));
    expect(new Set(resolutions)).toEqual(new Set(["PENDING", "CONFIRMED", "NOT_RECEIVED"]));
  });

  it("has proposal history with superseded and rejected versions, and one open proposal at most", () => {
    const statuses = requestDetails.flatMap((d) => d.proposals.map((p) => p.status));
    expect(statuses).toEqual(
      expect.arrayContaining(["PROPOSED", "ACCEPTED", "SUPERSEDED", "REJECTED"]),
    );
    for (const d of requestDetails) {
      expect(d.proposals.filter((p) => p.status === "PROPOSED").length).toBeLessThanOrEqual(1);
      if (d.agreement?.proposalId) {
        const accepted = d.proposals.find((p) => p.id === d.agreement!.proposalId)!;
        expect(accepted.status).toBe("ACCEPTED");
        expect(d.agreement.agreedPriceMinor).toBe(accepted.totalMinor);
      }
    }
  });

  it("records the submission terms acknowledgement on every Request (D-002)", () => {
    for (const d of requestDetails) expect(d.termsAcceptances[0].kind).toBe("SUBMISSION");
  });
});

describe("projects", () => {
  it("has one Active and one Completed Project, each linked to a converted Request", () => {
    expect(new Set(projects.map((p) => p.status))).toEqual(new Set(["ACTIVE", "COMPLETED"]));
    for (const p of projects) {
      const request = requests.find((r) => r.id === p.requestId)!;
      expect(request.status).toBe("CONVERTED_TO_PROJECT");
      expect(request.projectId).toBe(p.id);
      expect(p.paymentSummary.outstandingBalanceMinor).toBe(
        p.paymentSummary.projectTotalMinor - p.paymentSummary.totalConfirmedMinor,
      );
    }
  });
});

describe("notifications", () => {
  it("avoid banned terminology (CLAUDE.md §12)", () => {
    for (const n of notifications) {
      expect(`${n.title} ${n.body}`).not.toMatch(
        /\b(gig|order|checkout|paid|job|payment successful)\b/i,
      );
    }
  });
});
