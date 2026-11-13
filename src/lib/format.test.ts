import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatFileSize,
  formatModifier,
  formatPercent,
  formatRelative,
  formatRevisions,
  formatSignedAmount,
  formatTurnaround,
} from "./format";

describe("format", () => {
  it("formats turnarounds with singular and plural units", () => {
    expect(formatTurnaround({ value: 3, unit: "WEEKS" })).toBe("3 weeks");
    expect(formatTurnaround({ value: 1, unit: "BUSINESS_DAYS" })).toBe("1 business day");
    expect(formatTurnaround({ value: 5, unit: "CALENDAR_DAYS" })).toBe("5 days");
  });

  it("formats revision policies", () => {
    expect(formatRevisions({ kind: "FIXED", count: 2 })).toBe("2 revision rounds");
    expect(formatRevisions({ kind: "FIXED", count: 1 })).toBe("1 revision round");
    expect(formatRevisions({ kind: "UNLIMITED" })).toBe("Unlimited revisions");
    expect(formatRevisions({ kind: "NONE" })).toBe("No revisions included");
  });

  it("formats basis points as percentages without floats", () => {
    expect(formatPercent(5_000)).toBe("50%");
    expect(formatPercent(1_250)).toBe("12.5%");
    expect(formatPercent(750)).toBe("7.5%");
    expect(formatPercent(1_234)).toBe("12.34%");
  });

  it("shows price effects before selection (docs/08 §10)", () => {
    expect(formatModifier({ kind: "FIXED", amountMinor: 8_000_000n }, "NGN")).toBe("+₦80,000");
    expect(formatModifier({ kind: "PERCENT", bps: 2_500 }, "NGN")).toBe("+25%");
    expect(formatModifier({ kind: "FIXED", amountMinor: 0n }, "NGN")).toBe("Included");
    expect(formatModifier(null, "USD")).toBe("Included");
  });

  it("signs amounts", () => {
    expect(formatSignedAmount(7_500_000n, "NGN")).toBe("+₦75,000");
    expect(formatSignedAmount(-2_000_000n, "NGN")).toMatch(/^-₦20,000$/);
  });

  it("formats dates and relative times deterministically", () => {
    expect(formatDate("2026-11-09")).toBe("9 Nov 2026");
    const now = new Date("2026-11-10T09:00:00Z");
    expect(formatRelative("2026-11-10T07:00:00Z", now)).toBe("2 hours ago");
    expect(formatRelative("2026-11-09T09:00:00Z", now)).toBe("yesterday");
    expect(formatRelative("2026-10-01T09:00:00Z", now)).toBe("1 Oct 2026");
  });

  it("formats file sizes", () => {
    expect(formatFileSize(820 * 1024)).toBe("820 KB");
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });
});
