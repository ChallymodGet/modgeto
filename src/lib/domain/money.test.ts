import { describe, expect, it } from "vitest";
import {
  add,
  compare,
  formatMoney,
  fromJSON,
  major,
  money,
  multiply,
  parseMoney,
  percentOf,
  percentToBps,
  subtract,
  sum,
  toDecimalString,
  toJSON,
} from "./money";

describe("money construction", () => {
  it("stores minor units: ₦150,000 is 15,000,000 kobo and $15 is 1,500 cents (docs/03 §23)", () => {
    expect(major(150_000, "NGN").amountMinor).toBe(15_000_000n);
    expect(major(15, "USD").amountMinor).toBe(1_500n);
  });

  it("rejects non-integer minor amounts", () => {
    expect(() => money(10.5, "USD")).toThrow(RangeError);
    expect(() => major(1.5, "USD")).toThrow(RangeError);
  });
});

describe("arithmetic", () => {
  it("adds, subtracts and sums within one currency", () => {
    const a = major(450_000, "NGN");
    const b = major(80_000, "NGN");
    expect(add(a, b)).toEqual(major(530_000, "NGN"));
    expect(subtract(a, b)).toEqual(major(370_000, "NGN"));
    expect(sum([a, b, b], "NGN")).toEqual(major(610_000, "NGN"));
    expect(sum([], "USD")).toEqual(money(0, "USD"));
  });

  it("never converts between currencies (PRC-009)", () => {
    expect(() => add(major(1, "NGN"), major(1, "USD"))).toThrow(/Currency mismatch/);
    expect(() => compare(major(1, "GBP"), major(1, "EUR"))).toThrow(/Currency mismatch/);
  });

  it("multiplies by integers only", () => {
    expect(multiply(major(25_000, "NGN"), 4)).toEqual(major(100_000, "NGN"));
    expect(() => multiply(major(1, "NGN"), 1.5)).toThrow(RangeError);
  });

  it("stays exact beyond the float-safe range", () => {
    const big = money(9_007_199_254_740_993n, "NGN");
    expect(add(big, money(1, "NGN")).amountMinor).toBe(9_007_199_254_740_994n);
  });
});

describe("percentOf rounds half-up at the line (D-012)", () => {
  it("computes exact percentages", () => {
    expect(percentOf(major(300_000, "NGN"), 5_000)).toEqual(major(150_000, "NGN"));
    expect(percentOf(major(100, "USD"), 1_250)).toEqual(money(1_250, "USD"));
  });

  it("rounds .5 of a minor unit up", () => {
    // 1 kobo × 50% = 0.5 kobo → 1 kobo
    expect(percentOf(money(1, "NGN"), 5_000).amountMinor).toBe(1n);
    // 333 × 7.5% = 24.975 → 25
    expect(percentOf(money(333, "USD"), 750).amountMinor).toBe(25n);
  });

  it("rounds below .5 down", () => {
    // 333 × 33.33% = 110.9889 → 111; 101 × 0.25% = 0.2525 → 0
    expect(percentOf(money(333, "USD"), 3_333).amountMinor).toBe(111n);
    expect(percentOf(money(101, "USD"), 25).amountMinor).toBe(0n);
  });

  it("rejects fractional or negative basis points and negative amounts", () => {
    expect(() => percentOf(major(1, "NGN"), 12.5)).toThrow(RangeError);
    expect(() => percentOf(major(1, "NGN"), -1)).toThrow(RangeError);
    expect(() => percentOf(money(-100, "NGN"), 100)).toThrow(RangeError);
  });
});

describe("formatting", () => {
  it("shows whole amounts without decimals", () => {
    expect(formatMoney(major(150_000, "NGN"))).toBe("₦150,000");
    expect(formatMoney(major(15, "USD"))).toBe("$15");
    expect(formatMoney(major(1_200, "GBP"))).toBe("£1,200");
    expect(formatMoney(major(99, "EUR"))).toBe("€99");
  });

  it("shows two decimals when there are minor units", () => {
    expect(formatMoney(money(15_000_050, "NGN"))).toBe("₦150,000.50");
  });

  it("signs modifiers (docs/08 §10)", () => {
    expect(formatMoney(major(80_000, "NGN"), { signed: true })).toBe("+₦80,000");
    expect(formatMoney(major(-75_000, "NGN"), { signed: true })).toBe("-₦75,000");
    expect(formatMoney(money(0, "NGN"), { signed: true })).toBe("₦0");
  });

  it("produces exact decimal strings", () => {
    expect(toDecimalString(money(-5, "USD"))).toBe("-0.05");
    expect(toDecimalString(money(15_000_050, "NGN"))).toBe("150000.50");
  });
});

describe("parsing user input", () => {
  it("accepts common formats", () => {
    expect(parseMoney("150000", "NGN")).toEqual(major(150_000, "NGN"));
    expect(parseMoney("₦150,000.5", "NGN")).toEqual(money(15_000_050, "NGN"));
    expect(parseMoney(" $15.05 ", "USD")).toEqual(money(1_505, "USD"));
  });

  it("rejects ambiguous input", () => {
    for (const bad of ["", "-5", "1.234", "abc", "1.2.3", "."]) {
      expect(parseMoney(bad, "USD")).toBeNull();
    }
  });

  it("converts percentages to basis points", () => {
    expect(percentToBps("50")).toBe(5_000);
    expect(percentToBps(12.5)).toBe(1_250);
    expect(percentToBps("0.25")).toBe(25);
    expect(percentToBps("100")).toBe(10_000);
    expect(percentToBps("100.01")).toBeNull();
    expect(percentToBps("1.234")).toBeNull();
    expect(percentToBps("-5")).toBeNull();
  });
});

describe("JSON round-trip", () => {
  it("preserves exact values through strings", () => {
    const value = money(9_007_199_254_740_993n, "NGN");
    expect(fromJSON(JSON.parse(JSON.stringify(toJSON(value))))).toEqual(value);
  });

  it("rejects malformed input", () => {
    expect(() => fromJSON({ amountMinor: "1.5", currency: "USD" })).toThrow(RangeError);
  });
});

describe("comparison helpers", () => {
  it("compares, detects sign and zero, and picks the larger amount", async () => {
    const { equals, isNegative, isZero, max, isCurrency } = await import("./money");
    expect(isNegative(money(-1, "NGN"))).toBe(true);
    expect(isZero(money(0, "NGN"))).toBe(true);
    expect(max(money(5, "USD"), money(7, "USD"))).toEqual(money(7, "USD"));
    expect(equals(money(5, "USD"), money(5, "USD"))).toBe(true);
    expect(equals(money(5, "USD"), money(5, "EUR"))).toBe(false);
    expect(isCurrency("NGN")).toBe(true);
    expect(isCurrency("JPY")).toBe(false);
  });
});
