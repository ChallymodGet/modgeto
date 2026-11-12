import { describe, expect, it } from "vitest";
import {
  type AllocatableService,
  allocateCapacity,
  capacityPrice,
  cheaperLargerOffer,
  classifyCapacityChange,
  consumesCapacity,
  effectiveCapacity,
  graceEndsAt,
  hasFreeSlot,
  usedCapacity,
  validateKeepChoice,
} from "./capacity";
import { compare, formatMoney, major } from "./money";

describe("capacity pricing matches D-001 exactly", () => {
  const table: [number, number, number][] = [
    [1, 0, 0],
    [2, 2_000, 2],
    [3, 4_000, 4],
    [4, 6_000, 6],
    [5, 5_000, 5],
    [6, 7_000, 7],
    [7, 9_000, 9],
    [8, 11_000, 11],
    [9, 13_000, 13],
    [10, 12_000, 12],
  ];

  it.each(table)("%i Services: ₦%i / $%i", (limit, ngn, usd) => {
    expect(capacityPrice(limit, "NG")).toEqual(major(ngn, "NGN"));
    expect(capacityPrice(limit, "INTL")).toEqual(major(usd, "USD"));
  });

  it("keeps both intentional discounts: 5 < 4 and 10 < 9 (never flatten the curve)", () => {
    for (const market of ["NG", "INTL"] as const) {
      expect(compare(capacityPrice(5, market), capacityPrice(4, market))).toBe(-1);
      expect(compare(capacityPrice(10, market), capacityPrice(9, market))).toBe(-1);
    }
  });

  it("NGN mirrors USD at ₦1,000 per $1 as fixed prices, not FX", () => {
    for (let limit = 1; limit <= 10; limit++) {
      expect(capacityPrice(limit, "NG").amountMinor).toBe(
        capacityPrice(limit, "INTL").amountMinor * 1_000n,
      );
    }
  });

  it("rejects capacities outside 1–10", () => {
    for (const bad of [0, 11, 2.5, -1]) expect(() => capacityPrice(bad, "NG")).toThrow(RangeError);
  });
});

describe("discount offers for the capacity selector", () => {
  it("offers 5 to someone choosing 4, and 10 to someone choosing 9", () => {
    const five = cheaperLargerOffer(4, "NG")!;
    expect(five.limit).toBe(5);
    expect(formatMoney(five.price)).toBe("₦5,000");
    expect(formatMoney(five.monthlySaving)).toBe("₦1,000");

    const ten = cheaperLargerOffer(9, "INTL")!;
    expect(ten.limit).toBe(10);
    expect(formatMoney(ten.monthlySaving)).toBe("$1");
  });

  it("offers nothing elsewhere", () => {
    for (const limit of [1, 2, 3, 5, 6, 7, 8, 10])
      expect(cheaperLargerOffer(limit, "NG")).toBeNull();
  });
});

describe("capacity consumption (docs/03 §59)", () => {
  it("counts Published and Unavailable only", () => {
    expect(consumesCapacity("PUBLISHED")).toBe(true);
    expect(consumesCapacity("UNAVAILABLE")).toBe(true);
    expect(consumesCapacity("DRAFT")).toBe(false);
    expect(consumesCapacity("SUBSCRIPTION_INACTIVE")).toBe(false);
    expect(consumesCapacity("ARCHIVED")).toBe(false);
  });

  it("knows when a slot is free", () => {
    const services = [{ lifecycle: "PUBLISHED" as const }, { lifecycle: "DRAFT" as const }];
    expect(usedCapacity(services)).toBe(1);
    expect(hasFreeSlot(services, 1)).toBe(false);
    expect(hasFreeSlot(services, 2)).toBe(true);
  });
});

describe("subscription capacity (D-015)", () => {
  it("grants paid capacity while active and during the grace period only", () => {
    expect(effectiveCapacity("ACTIVE", 5)).toBe(5);
    expect(effectiveCapacity("PAST_DUE", 5)).toBe(5);
    expect(effectiveCapacity("EXPIRED", 5)).toBe(1);
    expect(effectiveCapacity("CANCELLED", 5)).toBe(1);
    expect(effectiveCapacity("FREE", 1)).toBe(1);
  });

  it("gives a 7-day grace period", () => {
    expect(graceEndsAt(new Date("2026-11-01T00:00:00Z")).toISOString()).toBe(
      "2026-11-08T00:00:00.000Z",
    );
  });

  it("classifies upgrades and downgrades", () => {
    expect(classifyCapacityChange(3, 5)).toBe("UPGRADE");
    expect(classifyCapacityChange(5, 3)).toBe("DOWNGRADE");
    expect(classifyCapacityChange(4, 4)).toBe("NONE");
  });
});

describe("allocation when capacity drops (D-016)", () => {
  const day = (n: number) => new Date(Date.UTC(2026, 0, n));
  const services: AllocatableService[] = [
    { id: "logo", lifecycle: "PUBLISHED", publishedAt: day(1) },
    { id: "web", lifecycle: "PUBLISHED", publishedAt: day(5) },
    { id: "uiux", lifecycle: "UNAVAILABLE", publishedAt: day(3) },
    { id: "draft", lifecycle: "DRAFT", publishedAt: null },
    { id: "old", lifecycle: "ARCHIVED", publishedAt: day(0) },
  ];

  it("keeps the designated free Service when falling to 1", () => {
    expect(allocateCapacity({ services, limit: 1, freeServiceId: "web" })).toEqual({
      freeServiceId: "web",
      keep: ["web"],
      deactivate: ["logo", "uiux"],
    });
  });

  it("falls back to the earliest-published Service when none is designated", () => {
    expect(allocateCapacity({ services, limit: 1 })).toEqual({
      freeServiceId: "logo",
      keep: ["logo"],
      deactivate: ["uiux", "web"],
    });
  });

  it("deactivates the most recently published first on a downgrade", () => {
    expect(allocateCapacity({ services, limit: 2 }).deactivate).toEqual(["web"]);
  });

  it("ignores a designated free Service that is no longer active", () => {
    expect(allocateCapacity({ services, limit: 1, freeServiceId: "draft" }).freeServiceId).toBe(
      "logo",
    );
  });

  it("applies the Creative's own valid choice", () => {
    expect(
      allocateCapacity({
        services,
        limit: 2,
        freeServiceId: "uiux",
        keepServiceIds: ["web", "uiux"],
      }),
    ).toEqual({ freeServiceId: "uiux", keep: ["uiux", "web"], deactivate: ["logo"] });
  });

  it("rejects invalid choices and falls back deterministically", () => {
    expect(validateKeepChoice({ services, limit: 1, keepServiceIds: ["web", "logo"] })).toBe(
      "TOO_MANY_KEPT",
    );
    expect(validateKeepChoice({ services, limit: 2, keepServiceIds: ["draft"] })).toBe(
      "UNKNOWN_SERVICE",
    );
    expect(
      validateKeepChoice({ services, limit: 2, freeServiceId: "logo", keepServiceIds: ["web"] }),
    ).toBe("FREE_SERVICE_NOT_KEPT");
    expect(allocateCapacity({ services, limit: 1, keepServiceIds: ["web", "logo"] }).keep).toEqual([
      "logo",
    ]);
  });

  it("never touches Drafts or Archived Services", () => {
    const { keep, deactivate } = allocateCapacity({ services, limit: 1 });
    expect([...keep, ...deactivate]).not.toContain("draft");
    expect([...keep, ...deactivate]).not.toContain("old");
  });
});
