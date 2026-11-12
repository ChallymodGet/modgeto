import { describe, expect, it } from "vitest";
import {
  FREE_SUBSCRIPTION,
  applySubscriptionEvent,
  canDeleteService,
  closeProject,
  scheduleDowngrade,
  transitionAccount,
  transitionModeration,
  transitionProposal,
  transitionService,
} from "./lifecycles";
import { unwrap } from "./result";

const code = (r: { ok: boolean; error?: { code: string } }) => (r.ok ? "ok" : r.error!.code);

describe("Service lifecycle (docs/03 §72)", () => {
  it("publishes only when valid and a slot is free", () => {
    expect(unwrap(transitionService("DRAFT", "PUBLISH", "CREATIVE", { hasFreeSlot: true }))).toBe(
      "PUBLISHED",
    );
    expect(code(transitionService("DRAFT", "PUBLISH", "CREATIVE", { hasFreeSlot: false }))).toBe(
      "NO_CAPACITY",
    );
    expect(
      code(
        transitionService("DRAFT", "PUBLISH", "CREATIVE", {
          hasFreeSlot: true,
          publishBlockerCount: 2,
        }),
      ),
    ).toBe("NOT_PUBLISHABLE");
  });

  it("unpublishing returns to Draft (D-005)", () => {
    expect(unwrap(transitionService("PUBLISHED", "UNPUBLISH", "CREATIVE"))).toBe("DRAFT");
    expect(unwrap(transitionService("UNAVAILABLE", "UNPUBLISH", "CREATIVE"))).toBe("DRAFT");
  });

  it("toggles Unavailable, archives, and restores to Draft", () => {
    expect(unwrap(transitionService("PUBLISHED", "MAKE_UNAVAILABLE", "CREATIVE"))).toBe(
      "UNAVAILABLE",
    );
    expect(unwrap(transitionService("UNAVAILABLE", "RESTORE_AVAILABILITY", "CREATIVE"))).toBe(
      "PUBLISHED",
    );
    expect(unwrap(transitionService("PUBLISHED", "ARCHIVE", "CREATIVE"))).toBe("ARCHIVED");
    expect(unwrap(transitionService("ARCHIVED", "RESTORE_TO_DRAFT", "CREATIVE"))).toBe("DRAFT");
  });

  it("only the system deactivates for capacity; reactivation needs a slot", () => {
    expect(code(transitionService("PUBLISHED", "DEACTIVATE_FOR_CAPACITY", "CREATIVE"))).toBe(
      "WRONG_ACTOR",
    );
    expect(unwrap(transitionService("PUBLISHED", "DEACTIVATE_FOR_CAPACITY", "SYSTEM"))).toBe(
      "SUBSCRIPTION_INACTIVE",
    );
    expect(code(transitionService("SUBSCRIPTION_INACTIVE", "REACTIVATE", "SYSTEM"))).toBe(
      "NO_CAPACITY",
    );
    expect(
      unwrap(
        transitionService("SUBSCRIPTION_INACTIVE", "REACTIVATE", "SYSTEM", { hasFreeSlot: true }),
      ),
    ).toBe("PUBLISHED");
  });

  it("rejects transitions from the wrong state", () => {
    expect(code(transitionService("ARCHIVED", "PUBLISH", "CREATIVE", { hasFreeSlot: true }))).toBe(
      "INVALID_TRANSITION",
    );
    expect(code(transitionService("DRAFT", "MAKE_UNAVAILABLE", "CREATIVE"))).toBe(
      "INVALID_TRANSITION",
    );
  });

  it("deletes only Drafts with no history (SRV-012)", () => {
    expect(canDeleteService("DRAFT", false)).toBe(true);
    expect(canDeleteService("DRAFT", true)).toBe(false);
    expect(canDeleteService("ARCHIVED", false)).toBe(false);
  });
});

describe("moderation overlay (D-003)", () => {
  it("is Admin-only and needs a reason", () => {
    expect(unwrap(transitionModeration("NORMAL", "DISABLE", "ADMIN", "Spam"))).toBe(
      "PLATFORM_DISABLED",
    );
    expect(code(transitionModeration("NORMAL", "DISABLE", "CREATIVE", "x"))).toBe("WRONG_ACTOR");
    expect(code(transitionModeration("NORMAL", "DISABLE", "ADMIN", "  "))).toBe("REASON_REQUIRED");
    expect(unwrap(transitionModeration("PLATFORM_DISABLED", "RESTORE", "ADMIN", "Resolved"))).toBe(
      "NORMAL",
    );
    expect(code(transitionModeration("NORMAL", "RESTORE", "ADMIN", "x"))).toBe(
      "INVALID_TRANSITION",
    );
  });
});

describe("CommercialProposal (docs/03 §73, D-017)", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const future = new Date("2026-11-20T00:00:00Z");
  const past = new Date("2026-11-01T00:00:00Z");

  it("the Client accepts or rejects; the Creative supersedes", () => {
    expect(
      unwrap(transitionProposal("PROPOSED", "ACCEPT", "CLIENT", { validUntil: future, now })),
    ).toBe("ACCEPTED");
    expect(
      unwrap(transitionProposal("PROPOSED", "REJECT", "CLIENT", { validUntil: null, now })),
    ).toBe("REJECTED");
    expect(
      unwrap(transitionProposal("PROPOSED", "SUPERSEDE", "CREATIVE", { validUntil: null, now })),
    ).toBe("SUPERSEDED");
    expect(
      code(transitionProposal("PROPOSED", "ACCEPT", "CREATIVE", { validUntil: null, now })),
    ).toBe("WRONG_ACTOR");
  });

  it("an expired quote cannot be accepted, and only an expired one can be expired", () => {
    expect(
      code(transitionProposal("PROPOSED", "ACCEPT", "CLIENT", { validUntil: past, now })),
    ).toBe("PROPOSAL_EXPIRED");
    expect(
      unwrap(transitionProposal("PROPOSED", "EXPIRE", "SYSTEM", { validUntil: past, now })),
    ).toBe("EXPIRED");
    expect(
      code(transitionProposal("PROPOSED", "EXPIRE", "SYSTEM", { validUntil: future, now })),
    ).toBe("NOT_EXPIRED");
  });

  it("settled proposals are final", () => {
    expect(
      code(transitionProposal("ACCEPTED", "REJECT", "CLIENT", { validUntil: null, now })),
    ).toBe("INVALID_TRANSITION");
  });
});

describe("Project (docs/03 §52)", () => {
  it("only the Creative closes an Active Project", () => {
    expect(unwrap(closeProject("ACTIVE", "CREATIVE"))).toBe("COMPLETED");
    expect(code(closeProject("ACTIVE", "CLIENT"))).toBe("WRONG_ACTOR");
    expect(code(closeProject("ACTIVE", "ADMIN"))).toBe("WRONG_ACTOR");
    expect(code(closeProject("COMPLETED", "CREATIVE"))).toBe("INVALID_TRANSITION");
    expect(code(closeProject("ACTIVE", "CREATIVE", true))).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("Account (docs/03 §71)", () => {
  it("activates only after email and phone verification", () => {
    expect(
      code(
        transitionAccount("PENDING_VERIFICATION", "COMPLETE_VERIFICATION", "SYSTEM", {
          emailVerified: true,
        }),
      ),
    ).toBe("VERIFICATION_INCOMPLETE");
    expect(
      unwrap(
        transitionAccount("PENDING_VERIFICATION", "COMPLETE_VERIFICATION", "SYSTEM", {
          emailVerified: true,
          phoneVerified: true,
        }),
      ),
    ).toBe("ACTIVE");
  });

  it("Admins suspend and restore with a reason", () => {
    expect(
      unwrap(transitionAccount("ACTIVE", "SUSPEND", "ADMIN", { reason: "Fraud report" })),
    ).toBe("SUSPENDED");
    expect(code(transitionAccount("ACTIVE", "SUSPEND", "ADMIN"))).toBe("REASON_REQUIRED");
    expect(code(transitionAccount("ACTIVE", "SUSPEND", "OWNER", { reason: "x" }))).toBe(
      "WRONG_ACTOR",
    );
    expect(unwrap(transitionAccount("SUSPENDED", "RESTORE", "ADMIN", { reason: "Cleared" }))).toBe(
      "ACTIVE",
    );
  });

  it("the owner can request deletion", () => {
    expect(unwrap(transitionAccount("ACTIVE", "REQUEST_DELETION", "OWNER"))).toBe(
      "DELETION_PENDING",
    );
  });
});

describe("platform subscription (docs/03 §76, D-015)", () => {
  const active5 = unwrap(
    applySubscriptionEvent(FREE_SUBSCRIPTION, { type: "PAYMENT_VERIFIED", limit: 5 }, "SYSTEM"),
  );

  it("activates only from a server-verified payment", () => {
    expect(active5).toMatchObject({ status: "ACTIVE", publishedServiceLimit: 5 });
    expect(
      code(
        applySubscriptionEvent(
          FREE_SUBSCRIPTION,
          { type: "PAYMENT_VERIFIED", limit: 5 },
          "CREATIVE",
        ),
      ),
    ).toBe("WRONG_ACTOR");
    expect(
      code(
        applySubscriptionEvent(FREE_SUBSCRIPTION, { type: "PAYMENT_VERIFIED", limit: 1 }, "SYSTEM"),
      ),
    ).toBe("INVALID_CAPACITY");
  });

  it("upgrades immediately and clears any scheduled downgrade", () => {
    const scheduled = unwrap(scheduleDowngrade(active5, 3));
    const upgraded = unwrap(
      applySubscriptionEvent(scheduled, { type: "PAYMENT_VERIFIED", limit: 10 }, "SYSTEM"),
    );
    expect(upgraded).toMatchObject({ publishedServiceLimit: 10, scheduledServiceLimit: null });
  });

  it("downgrades at the end of the period", () => {
    const scheduled = unwrap(scheduleDowngrade(active5, 3));
    expect(scheduled.publishedServiceLimit).toBe(5);
    const ended = unwrap(applySubscriptionEvent(scheduled, { type: "PERIOD_ENDED" }, "SYSTEM"));
    expect(ended).toMatchObject({
      status: "ACTIVE",
      publishedServiceLimit: 3,
      scheduledServiceLimit: null,
    });

    const toFree = unwrap(
      applySubscriptionEvent(
        unwrap(scheduleDowngrade(active5, 1)),
        { type: "PERIOD_ENDED" },
        "SYSTEM",
      ),
    );
    expect(toFree).toEqual(FREE_SUBSCRIPTION);
    expect(code(scheduleDowngrade(active5, 6))).toBe("INVALID_CAPACITY");
  });

  it("past due keeps capacity for 7 days, then expires to 1", () => {
    const failedAt = new Date("2026-11-01T00:00:00Z");
    const pastDue = unwrap(
      applySubscriptionEvent(active5, { type: "PAYMENT_FAILED", at: failedAt }, "SYSTEM"),
    );
    expect(pastDue.status).toBe("PAST_DUE");

    const day6 = unwrap(
      applySubscriptionEvent(
        pastDue,
        { type: "GRACE_PERIOD_CHECK", now: new Date("2026-11-07T00:00:00Z") },
        "SYSTEM",
      ),
    );
    expect(day6.status).toBe("PAST_DUE");

    const day7 = unwrap(
      applySubscriptionEvent(
        pastDue,
        { type: "GRACE_PERIOD_CHECK", now: new Date("2026-11-08T00:00:00Z") },
        "SYSTEM",
      ),
    );
    expect(day7).toMatchObject({ status: "EXPIRED", publishedServiceLimit: 1 });

    const recovered = unwrap(
      applySubscriptionEvent(pastDue, { type: "PAYMENT_RECOVERED" }, "SYSTEM"),
    );
    expect(recovered).toMatchObject({
      status: "ACTIVE",
      publishedServiceLimit: 5,
      pastDueSince: null,
    });
  });

  it("renews from Expired or Cancelled", () => {
    const cancelled = unwrap(
      applySubscriptionEvent(active5, { type: "CANCELLATION_EFFECTIVE" }, "SYSTEM"),
    );
    expect(cancelled).toMatchObject({ status: "CANCELLED", publishedServiceLimit: 1 });
    expect(
      unwrap(applySubscriptionEvent(cancelled, { type: "PAYMENT_VERIFIED", limit: 4 }, "SYSTEM"))
        .status,
    ).toBe("ACTIVE");
  });
});
