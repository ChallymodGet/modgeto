import { describe, expect, it } from "vitest";
import { formatMoney, major, money } from "./money";
import {
  type PricingConfig,
  calculatePrice,
  calculateProposalTotals,
  priceDifference,
  validatePricingConfig,
  validateSelection,
} from "./pricing";
import { unwrap } from "./result";

const NGN = (n: number) => major(n, "NGN").amountMinor;

/** A package-priced Brand Identity Service with every kind of priced item. */
const brandIdentity: PricingConfig = {
  currency: "NGN",
  mode: "PACKAGE",
  packages: [
    {
      id: "essential",
      name: "Essential",
      amountMinor: NGN(250_000),
      eligibleAddOnIds: ["guidelines"],
    },
    { id: "standard", name: "Standard", amountMinor: NGN(450_000) },
  ],
  quantityRules: [
    {
      id: "concepts",
      unitName: "Extra logo concept",
      unitAmountMinor: NGN(25_000),
      minimum: 0,
      maximum: 5,
      defaultQuantity: 0,
    },
  ],
  addOns: [
    {
      id: "guidelines",
      name: "Brand guidelines",
      amountMinor: NGN(80_000),
      allowsQuantity: false,
      active: true,
    },
    {
      id: "social",
      name: "Social templates",
      amountMinor: NGN(15_000),
      allowsQuantity: true,
      minimumQuantity: 1,
      maximumQuantity: 10,
      active: true,
    },
    {
      id: "retired",
      name: "Retired add-on",
      amountMinor: NGN(1_000),
      allowsQuantity: false,
      active: false,
    },
  ],
  optionGroups: [
    {
      id: "tool",
      label: "Website Platform / Tool",
      selectionMode: "SINGLE",
      required: true,
      options: [
        { id: "figma", label: "Figma", priceModifierMinor: 0n },
        { id: "webflow", label: "Webflow", priceModifierMinor: NGN(60_000) },
        { id: "unsure", label: "I'm not sure", priceModifierMinor: 0n },
      ],
    },
  ],
  deliveryOptions: [
    { id: "standard", label: "Standard (3 weeks)", isStandard: true, modifier: null },
    {
      id: "rush",
      label: "Rush (1 week)",
      isStandard: false,
      modifier: { kind: "PERCENT", bps: 2_500 },
    },
    {
      id: "priority",
      label: "Priority (2 weeks)",
      isStandard: false,
      modifier: { kind: "FIXED", amountMinor: NGN(50_000) },
    },
  ],
  dependencies: [
    {
      prerequisite: { type: "ADDON", id: "guidelines" },
      dependent: { type: "ADDON", id: "social" },
    },
  ],
  charges: [],
};

describe("calculatePrice: package mode", () => {
  it("prices the landing-page example: Standard + Brand guidelines = ₦530,000", () => {
    const result = unwrap(
      calculatePrice(brandIdentity, {
        packageId: "standard",
        addOns: { guidelines: 1 },
        options: { tool: ["figma"] },
      }),
    );
    expect(result.priceState).toBe("CALCULATED");
    expect(result.total).toEqual(major(530_000, "NGN"));
    expect(result.lines.map((l) => l.kind)).toEqual(["PACKAGE", "ADDON", "OPTION"]);
    expect(result.commitment).toBeNull();
  });

  it("adds quantity items, add-on quantities and paid options", () => {
    const result = unwrap(
      calculatePrice(brandIdentity, {
        packageId: "standard",
        quantities: { concepts: 2 },
        addOns: { guidelines: 1, social: 3 },
        options: { tool: ["webflow"] },
      }),
    );
    // 450,000 + 2×25,000 + 80,000 + 3×15,000 + 60,000
    expect(result.total).toEqual(major(685_000, "NGN"));
  });

  it("applies a percentage delivery modifier to the subtotal before delivery (D-010)", () => {
    const result = unwrap(
      calculatePrice(brandIdentity, {
        packageId: "standard",
        addOns: { guidelines: 1 },
        options: { tool: ["figma"] },
        deliveryOptionId: "rush",
      }),
    );
    const delivery = result.lines.find((l) => l.kind === "DELIVERY")!;
    expect(delivery.amount).toEqual(major(132_500, "NGN")); // 25% of 530,000
    expect(result.total).toEqual(major(662_500, "NGN"));
  });

  it("applies a fixed delivery modifier", () => {
    const result = unwrap(
      calculatePrice(brandIdentity, {
        packageId: "essential",
        options: { tool: ["figma"] },
        deliveryOptionId: "priority",
      }),
    );
    expect(result.total).toEqual(major(300_000, "NGN"));
  });

  it("calculates commitment from the final total", () => {
    const result = unwrap(
      calculatePrice(brandIdentity, { packageId: "standard", options: { tool: ["figma"] } }, 5_000),
    );
    expect(result.commitment).toEqual(major(225_000, "NGN"));
  });
});

describe("selection validation", () => {
  it("requires a package and a required option", () => {
    const codes = validateSelection(brandIdentity, {}).map((i) => i.code);
    expect(codes).toEqual(["PACKAGE_REQUIRED", "OPTION_REQUIRED"]);
  });

  it("explains a missing prerequisite (SRV-021)", () => {
    const issues = validateSelection(brandIdentity, {
      packageId: "standard",
      addOns: { social: 2 },
      options: { tool: ["figma"] },
    });
    expect(issues).toEqual([
      {
        code: "MISSING_PREREQUISITE",
        message: "Social templates requires Brand guidelines.",
        target: "ADDON:guidelines",
      },
    ]);
  });

  it("enforces package eligibility, quantity ranges and single selection", () => {
    const codes = validateSelection(brandIdentity, {
      packageId: "essential",
      quantities: { concepts: 6 },
      addOns: { guidelines: 2, social: 11, retired: 1 },
      options: { tool: ["figma", "webflow"] },
    }).map((i) => i.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "QUANTITY_OUT_OF_RANGE",
        "QUANTITY_NOT_ALLOWED",
        "ADDON_NOT_IN_PACKAGE",
        "UNKNOWN_ADDON",
        "TOO_MANY_OPTIONS",
      ]),
    );
  });

  it("rejects unknown items and a package on a non-package Service", () => {
    const fixed: PricingConfig = { ...brandIdentity, mode: "FIXED", baseAmountMinor: NGN(100_000) };
    const codes = validateSelection(fixed, {
      packageId: "standard",
      options: { tool: ["nope"], ghost: ["x"] },
      deliveryOptionId: "teleport",
    }).map((i) => i.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "PACKAGE_NOT_APPLICABLE",
        "UNKNOWN_OPTION",
        "UNKNOWN_OPTION_GROUP",
        "UNKNOWN_DELIVERY_OPTION",
      ]),
    );
  });

  it("calculatePrice refuses an invalid selection", () => {
    const result = calculatePrice(brandIdentity, { packageId: "standard" });
    expect(result.ok).toBe(false);
  });
});

describe("other pricing modes", () => {
  const base: PricingConfig = {
    currency: "USD",
    mode: "FIXED",
    baseAmountMinor: major(1_200, "USD").amountMinor,
    packages: [],
    quantityRules: [],
    addOns: [],
    optionGroups: [],
    deliveryOptions: [{ id: "std", label: "Standard", isStandard: true, modifier: null }],
    dependencies: [],
    charges: [],
  };

  it("FIXED is an exact price", () => {
    const result = unwrap(calculatePrice(base, {}));
    expect(result.priceState).toBe("CALCULATED");
    expect(formatMoney(result.total!)).toBe("$1,200");
  });

  it("STARTING_FROM is an estimate (PRC-003)", () => {
    const result = unwrap(calculatePrice({ ...base, mode: "STARTING_FROM" }, {}));
    expect(result.priceState).toBe("ESTIMATED");
    expect(result.total).toEqual(major(1_200, "USD"));
  });

  it("QUANTITY multiplies unit price by quantity and uses the default", () => {
    const config: PricingConfig = {
      ...base,
      mode: "QUANTITY",
      baseAmountMinor: undefined,
      quantityRules: [
        {
          id: "pages",
          unitName: "Page",
          unitAmountMinor: major(150, "USD").amountMinor,
          minimum: 1,
          maximum: 20,
          defaultQuantity: 3,
        },
      ],
    };
    expect(unwrap(calculatePrice(config, {})).total).toEqual(major(450, "USD"));
    expect(unwrap(calculatePrice(config, { quantities: { pages: 5 } })).total).toEqual(
      major(750, "USD"),
    );
    expect(calculatePrice(config, { quantities: { pages: 0 } }).ok).toBe(false);
  });

  it("CUSTOM_QUOTE never fabricates a total (PRC-006)", () => {
    const result = unwrap(calculatePrice({ ...base, mode: "CUSTOM_QUOTE" }, {}, 5_000));
    expect(result.priceState).toBe("QUOTE_REQUIRED");
    expect(result.total).toBeNull();
    expect(result.commitment).toBeNull();
  });

  it("adds Service-level charges such as VAT to the live price (D-011)", () => {
    const config: PricingConfig = {
      ...base,
      charges: [{ id: "vat", label: "VAT 7.5%", modifier: { kind: "PERCENT", bps: 750 } }],
    };
    const result = unwrap(calculatePrice(config, {}));
    expect(result.charges).toEqual(major(90, "USD"));
    expect(result.total).toEqual(major(1_290, "USD"));
  });
});

describe("proposal totals", () => {
  it("applies charges after the discount, without compounding (D-029)", () => {
    const totals = unwrap(
      calculateProposalTotals({
        currency: "NGN",
        subtotalMinor: NGN(400_000),
        discount: { label: "Returning Client", modifier: { kind: "PERCENT", bps: 1_000 } },
        charges: [
          { id: "vat", label: "VAT 7.5%", modifier: { kind: "PERCENT", bps: 750 } },
          { id: "fee", label: "Service fee 2%", modifier: { kind: "PERCENT", bps: 200 } },
        ],
        commitmentBps: 5_000,
      }),
    );
    // 400,000 − 40,000 = 360,000; VAT 27,000; fee 7,200 (on 360,000, not on VAT)
    expect(totals.discount).toEqual(major(40_000, "NGN"));
    expect(totals.charges).toEqual(major(34_200, "NGN"));
    expect(totals.total).toEqual(major(394_200, "NGN"));
    expect(totals.commitment).toEqual(major(197_100, "NGN"));
    expect(totals.lines.map((l) => [l.kind, l.amount.amountMinor])).toEqual([
      ["DISCOUNT", -NGN(40_000)],
      ["CHARGE", NGN(27_000)],
      ["CHARGE", NGN(7_200)],
    ]);
  });

  it("rounds each percentage line half-up (D-012)", () => {
    const totals = unwrap(
      calculateProposalTotals({
        currency: "USD",
        subtotalMinor: 333n, // $3.33
        charges: [{ id: "vat", label: "VAT", modifier: { kind: "PERCENT", bps: 750 } }],
        commitmentBps: 3_333,
      }),
    );
    expect(totals.charges.amountMinor).toBe(25n); // 24.975 → 25
    expect(totals.total.amountMinor).toBe(358n);
    expect(totals.commitment!.amountMinor).toBe(119n); // 119.3214 → 119
  });

  it("allows a discount equal to the subtotal but never a negative total (PRC-008)", () => {
    const free = calculateProposalTotals({
      currency: "NGN",
      subtotalMinor: NGN(100),
      discount: { label: "Waived", modifier: { kind: "FIXED", amountMinor: NGN(100) } },
      commitmentBps: null,
    });
    expect(unwrap(free).total.amountMinor).toBe(0n);

    const negative = calculateProposalTotals({
      currency: "NGN",
      subtotalMinor: NGN(100),
      discount: { label: "Too much", modifier: { kind: "FIXED", amountMinor: NGN(101) } },
      commitmentBps: null,
    });
    expect(negative.ok).toBe(false);
    if (!negative.ok) expect(negative.error.code).toBe("NEGATIVE_TOTAL");
  });

  it("rejects zero prices and impossible commitment percentages", () => {
    expect(
      calculateProposalTotals({ currency: "NGN", subtotalMinor: 0n, commitmentBps: null }).ok,
    ).toBe(false);
    expect(
      calculateProposalTotals({ currency: "NGN", subtotalMinor: 1n, commitmentBps: 10_001 }).ok,
    ).toBe(false);
  });

  it("shows previous, proposed and difference (QTE-002)", () => {
    const diff = priceDifference(major(300_000, "NGN"), major(375_000, "NGN"));
    expect(formatMoney(diff, { signed: true })).toBe("+₦75,000");
    expect(priceDifference(money(5, "USD"), money(2, "USD")).amountMinor).toBe(-3n);
  });
});

describe("publish validation of pricing", () => {
  it("accepts a well-formed Service", () => {
    expect(validatePricingConfig(brandIdentity)).toEqual([]);
  });

  it("flags each mode's missing amount", () => {
    const empty: PricingConfig = {
      ...brandIdentity,
      packages: [],
      quantityRules: [],
      addOns: [],
      optionGroups: [],
      dependencies: [],
    };
    expect(validatePricingConfig({ ...empty, mode: "FIXED" }).map((i) => i.code)).toContain(
      "BASE_PRICE_REQUIRED",
    );
    expect(validatePricingConfig({ ...empty, mode: "STARTING_FROM" }).map((i) => i.code)).toContain(
      "MINIMUM_PRICE_REQUIRED",
    );
    expect(validatePricingConfig({ ...empty, mode: "QUANTITY" }).map((i) => i.code)).toContain(
      "QUANTITY_RULE_REQUIRED",
    );
    expect(validatePricingConfig({ ...empty, mode: "PACKAGE" }).map((i) => i.code)).toContain(
      "PACKAGE_REQUIRED",
    );
    expect(validatePricingConfig({ ...empty, mode: "CUSTOM_QUOTE" })).toEqual([]);
  });

  it("requires exactly one standard turnaround without a price change", () => {
    const none = validatePricingConfig({ ...brandIdentity, deliveryOptions: [] }).map(
      (i) => i.code,
    );
    expect(none).toContain("STANDARD_DELIVERY_REQUIRED");
    const priced = validatePricingConfig({
      ...brandIdentity,
      deliveryOptions: [
        {
          id: "s",
          label: "Standard",
          isStandard: true,
          modifier: { kind: "FIXED", amountMinor: 1n },
        },
      ],
    }).map((i) => i.code);
    expect(priced).toContain("STANDARD_DELIVERY_MODIFIER");
  });

  it("rejects negative option modifiers: no public discounts in V1 (D-011)", () => {
    const config: PricingConfig = {
      ...brandIdentity,
      optionGroups: [
        {
          id: "g",
          label: "Tool",
          selectionMode: "SINGLE",
          required: false,
          options: [{ id: "o", label: "Cheap", priceModifierMinor: -1n }],
        },
      ],
    };
    expect(validatePricingConfig(config).map((i) => i.code)).toContain("NEGATIVE_MODIFIER");
  });

  it("detects a dependency on a removed item (PRD §29)", () => {
    const config: PricingConfig = {
      ...brandIdentity,
      addOns: brandIdentity.addOns.filter((a) => a.id !== "guidelines"),
      packages: [{ id: "standard", name: "Standard", amountMinor: NGN(450_000) }],
    };
    expect(validatePricingConfig(config).map((i) => i.code)).toContain("BROKEN_DEPENDENCY");
  });

  it("checks quantity ranges and percentages", () => {
    const config: PricingConfig = {
      ...brandIdentity,
      quantityRules: [
        {
          id: "q",
          unitName: "Page",
          unitAmountMinor: 1n,
          minimum: 5,
          maximum: 2,
          defaultQuantity: 1,
        },
      ],
      charges: [{ id: "c", label: "Bad", modifier: { kind: "PERCENT", bps: 20_000 } }],
    };
    const codes = validatePricingConfig(config).map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(["INVALID_QUANTITY_RANGE", "INVALID_MODIFIER"]));
  });
});
