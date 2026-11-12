/**
 * Pricing engine (docs/03 §22–29, PRD PRC-001–010, D-010, D-011, D-012, D-029).
 *
 * Calculation order:
 *   Base or Package + Quantity items + Add-ons + Paid options + Delivery modifier
 *   = Configured subtotal
 *   − Discount (proposals only) + Additional charges (after discount, non-compounding)
 *   = Final total
 *   × Commitment percentage = Required commitment
 */
import {
  type BasisPoints,
  type Currency,
  type Money,
  PERCENT_100,
  add,
  compare,
  money,
  multiply,
  percentOf,
  subtract,
  sum,
  zero,
} from "./money";
import { type DomainError, type Result, err, ok } from "./result";

export const PRICING_MODES = [
  "FIXED",
  "STARTING_FROM",
  "QUANTITY",
  "PACKAGE",
  "CUSTOM_QUOTE",
] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

/** Exact, estimated ("Starting from"), or no price until a quote (docs/06 §23). */
export type PriceState = "CALCULATED" | "ESTIMATED" | "QUOTE_REQUIRED";

/** A price change that is either a fixed amount or a percentage (D-010, PRC-008). */
export type Modifier =
  { kind: "FIXED"; amountMinor: bigint } | { kind: "PERCENT"; bps: BasisPoints };

export type ItemType = "PACKAGE" | "ADDON" | "OPTION";
export type ItemRef = { type: ItemType; id: string };

export type PackageConfig = {
  id: string;
  name: string;
  amountMinor: bigint;
  /** Add-ons offered with this package. Omitted means every active add-on is eligible. */
  eligibleAddOnIds?: readonly string[];
};

export type QuantityRuleConfig = {
  id: string;
  unitName: string;
  unitAmountMinor: bigint;
  minimum: number;
  maximum?: number;
  defaultQuantity: number;
};

export type AddOnConfig = {
  id: string;
  name: string;
  amountMinor: bigint;
  allowsQuantity: boolean;
  minimumQuantity?: number;
  maximumQuantity?: number;
  active: boolean;
};

export type OptionConfig = { id: string; label: string; priceModifierMinor: bigint };

export type OptionGroupConfig = {
  id: string;
  label: string;
  selectionMode: "SINGLE" | "MULTIPLE";
  required: boolean;
  options: readonly OptionConfig[];
};

export type DeliveryOptionConfig = {
  id: string;
  label: string;
  /** The standard turnaround has no modifier. Priority/Rush options may add one (SRV-022). */
  isStandard: boolean;
  modifier: Modifier | null;
};

export type DependencyConfig = { prerequisite: ItemRef; dependent: ItemRef };

export type ChargeConfig = { id: string; label: string; modifier: Modifier };

/** The price-relevant part of a Service. */
export type PricingConfig = {
  currency: Currency;
  mode: PricingMode;
  /** FIXED: the base price. STARTING_FROM: the indicative minimum. Unused otherwise. */
  baseAmountMinor?: bigint;
  packages: readonly PackageConfig[];
  quantityRules: readonly QuantityRuleConfig[];
  addOns: readonly AddOnConfig[];
  optionGroups: readonly OptionGroupConfig[];
  deliveryOptions: readonly DeliveryOptionConfig[];
  dependencies: readonly DependencyConfig[];
  /** Service-level additional charges such as VAT, shown in the live price (D-011). */
  charges: readonly ChargeConfig[];
};

/** What a Client has chosen. */
export type Selection = {
  packageId?: string;
  /** Quantity per quantity rule. A missing rule uses its default quantity. */
  quantities?: Readonly<Record<string, number>>;
  /** Add-on id → quantity. Add-ons without quantity use 1. */
  addOns?: Readonly<Record<string, number>>;
  /** Option group id → selected option ids. */
  options?: Readonly<Record<string, readonly string[]>>;
  /** Missing means the standard delivery option. */
  deliveryOptionId?: string;
};

export type LineKind =
  "BASE" | "PACKAGE" | "QUANTITY" | "ADDON" | "OPTION" | "DELIVERY" | "DISCOUNT" | "CHARGE";

export type PriceLine = {
  kind: LineKind;
  label: string;
  refId?: string;
  quantity?: number;
  unitAmount?: Money;
  /** Signed: discounts are negative. */
  amount: Money;
};

export type PriceBreakdown = {
  currency: Currency;
  priceState: PriceState;
  lines: PriceLine[];
  /** Null for Custom Quote: no number is fabricated before the Creative's proposal (PRC-006). */
  subtotal: Money | null;
  discount: Money | null;
  charges: Money | null;
  total: Money | null;
  /** Null when no commitment is required or there is no total yet. */
  commitment: Money | null;
};

export type Discount = { label: string; modifier: Modifier };

// ---------------------------------------------------------------------------
// Adjustments shared by live pricing and CommercialProposals
// ---------------------------------------------------------------------------

function applyModifier(base: Money, modifier: Modifier): Money {
  return modifier.kind === "FIXED"
    ? money(modifier.amountMinor, base.currency)
    : percentOf(base, modifier.bps);
}

export type AdjustedTotals = {
  lines: PriceLine[];
  discount: Money;
  charges: Money;
  total: Money;
};

/**
 * Subtotal − discount + charges. Charges apply to the post-discount amount and do
 * not compound on each other (D-029). The total can never be negative (PRC-008).
 */
export function applyAdjustments(
  subtotal: Money,
  discount: Discount | null | undefined,
  charges: readonly ChargeConfig[],
): Result<AdjustedTotals> {
  const lines: PriceLine[] = [];
  let discountAmount = zero(subtotal.currency);

  if (discount) {
    discountAmount = applyModifier(subtotal, discount.modifier);
    if (compare(discountAmount, subtotal) > 0) {
      return err("NEGATIVE_TOTAL", "Discount is larger than the subtotal.", "discount");
    }
    lines.push({ kind: "DISCOUNT", label: discount.label, amount: multiply(discountAmount, -1) });
  }

  const afterDiscount = subtract(subtotal, discountAmount);
  const chargeAmounts = charges.map((charge) => {
    const amount = applyModifier(afterDiscount, charge.modifier);
    lines.push({ kind: "CHARGE", label: charge.label, refId: charge.id, amount });
    return amount;
  });
  const chargeTotal = sum(chargeAmounts, subtotal.currency);

  return ok({
    lines,
    discount: discountAmount,
    charges: chargeTotal,
    total: add(afterDiscount, chargeTotal),
  });
}

export function commitmentFor(total: Money, commitmentBps: BasisPoints | null): Money | null {
  if (commitmentBps === null || commitmentBps === 0) return null;
  return percentOf(total, commitmentBps);
}

// ---------------------------------------------------------------------------
// Selection validation
// ---------------------------------------------------------------------------

function isSelected(config: PricingConfig, selection: Selection, ref: ItemRef): boolean {
  switch (ref.type) {
    case "PACKAGE":
      return selection.packageId === ref.id;
    case "ADDON":
      return (selection.addOns?.[ref.id] ?? 0) > 0;
    case "OPTION":
      return config.optionGroups.some((group) =>
        (selection.options?.[group.id] ?? []).includes(ref.id),
      );
  }
}

function itemName(config: PricingConfig, ref: ItemRef): string {
  switch (ref.type) {
    case "PACKAGE":
      return config.packages.find((p) => p.id === ref.id)?.name ?? ref.id;
    case "ADDON":
      return config.addOns.find((a) => a.id === ref.id)?.name ?? ref.id;
    case "OPTION":
      for (const group of config.optionGroups) {
        const option = group.options.find((o) => o.id === ref.id);
        if (option) return option.label;
      }
      return ref.id;
  }
}

function within(value: number, min?: number, maxValue?: number): boolean {
  return (min === undefined || value >= min) && (maxValue === undefined || value <= maxValue);
}

/** Every problem with a Client's selection, so the UI can show them all at once. */
export function validateSelection(config: PricingConfig, selection: Selection): DomainError[] {
  const issues: DomainError[] = [];
  const issue = (code: string, message: string, target?: string) =>
    issues.push({ code, message, ...(target ? { target } : {}) });

  // Package
  if (config.mode === "PACKAGE") {
    if (!selection.packageId) issue("PACKAGE_REQUIRED", "Choose a package.", "package");
    else if (!config.packages.some((p) => p.id === selection.packageId)) {
      issue("UNKNOWN_PACKAGE", "That package is not offered.", selection.packageId);
    }
  } else if (selection.packageId) {
    issue("PACKAGE_NOT_APPLICABLE", "This Service is not package-priced.", selection.packageId);
  }

  // Quantities
  for (const [ruleId, quantity] of Object.entries(selection.quantities ?? {})) {
    const rule = config.quantityRules.find((r) => r.id === ruleId);
    if (!rule) issue("UNKNOWN_QUANTITY_RULE", "That quantity item is not offered.", ruleId);
    else if (!Number.isInteger(quantity) || !within(quantity, rule.minimum, rule.maximum)) {
      issue(
        "QUANTITY_OUT_OF_RANGE",
        `${rule.unitName} must be between ${rule.minimum} and ${rule.maximum ?? "any number"}.`,
        ruleId,
      );
    }
  }

  // Add-ons
  const selectedPackage = config.packages.find((p) => p.id === selection.packageId);
  for (const [addOnId, quantity] of Object.entries(selection.addOns ?? {})) {
    if (quantity === 0) continue;
    const addOn = config.addOns.find((a) => a.id === addOnId);
    if (!addOn || !addOn.active) {
      issue("UNKNOWN_ADDON", "That add-on is not available.", addOnId);
      continue;
    }
    if (selectedPackage?.eligibleAddOnIds && !selectedPackage.eligibleAddOnIds.includes(addOnId)) {
      issue("ADDON_NOT_IN_PACKAGE", `${addOn.name} is not available with this package.`, addOnId);
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      issue("QUANTITY_OUT_OF_RANGE", `${addOn.name} quantity must be a whole number.`, addOnId);
    } else if (!addOn.allowsQuantity && quantity !== 1) {
      issue("QUANTITY_NOT_ALLOWED", `${addOn.name} can only be added once.`, addOnId);
    } else if (
      addOn.allowsQuantity &&
      !within(quantity, addOn.minimumQuantity ?? 1, addOn.maximumQuantity)
    ) {
      issue(
        "QUANTITY_OUT_OF_RANGE",
        `${addOn.name} quantity must be between ${addOn.minimumQuantity ?? 1} and ${addOn.maximumQuantity ?? "any number"}.`,
        addOnId,
      );
    }
  }

  // Options
  for (const group of config.optionGroups) {
    const chosen = selection.options?.[group.id] ?? [];
    if (group.required && chosen.length === 0) {
      issue("OPTION_REQUIRED", `Choose an option for ${group.label}.`, group.id);
    }
    if (group.selectionMode === "SINGLE" && chosen.length > 1) {
      issue("TOO_MANY_OPTIONS", `Choose one option for ${group.label}.`, group.id);
    }
    for (const optionId of chosen) {
      if (!group.options.some((o) => o.id === optionId)) {
        issue("UNKNOWN_OPTION", "That option is not offered.", optionId);
      }
    }
  }
  for (const groupId of Object.keys(selection.options ?? {})) {
    if (!config.optionGroups.some((g) => g.id === groupId)) {
      issue("UNKNOWN_OPTION_GROUP", "That option group is not offered.", groupId);
    }
  }

  // Delivery
  if (
    selection.deliveryOptionId &&
    !config.deliveryOptions.some((d) => d.id === selection.deliveryOptionId)
  ) {
    issue(
      "UNKNOWN_DELIVERY_OPTION",
      "That delivery option is not offered.",
      selection.deliveryOptionId,
    );
  }

  // Simple prerequisites: "B requires A" (SRV-021)
  for (const { prerequisite, dependent } of config.dependencies) {
    if (isSelected(config, selection, dependent) && !isSelected(config, selection, prerequisite)) {
      issue(
        "MISSING_PREREQUISITE",
        `${itemName(config, dependent)} requires ${itemName(config, prerequisite)}.`,
        `${prerequisite.type}:${prerequisite.id}`,
      );
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Live price for a configuration
// ---------------------------------------------------------------------------

function priceStateFor(mode: PricingMode): PriceState {
  if (mode === "CUSTOM_QUOTE") return "QUOTE_REQUIRED";
  if (mode === "STARTING_FROM") return "ESTIMATED";
  return "CALCULATED";
}

/**
 * Prices a valid selection. Returns the first validation error otherwise; use
 * validateSelection() to show all of them.
 */
export function calculatePrice(
  config: PricingConfig,
  selection: Selection,
  commitmentBps: BasisPoints | null = null,
): Result<PriceBreakdown> {
  const issues = validateSelection(config, selection);
  if (issues.length > 0) return { ok: false, error: issues[0] };

  const { currency } = config;
  const m = (amountMinor: bigint) => money(amountMinor, currency);
  const lines: PriceLine[] = [];

  // Base or package
  if (config.mode === "FIXED" || config.mode === "STARTING_FROM") {
    lines.push({ kind: "BASE", label: "Base price", amount: m(config.baseAmountMinor ?? 0n) });
  }
  if (config.mode === "PACKAGE") {
    const pkg = config.packages.find((p) => p.id === selection.packageId)!;
    lines.push({ kind: "PACKAGE", label: pkg.name, refId: pkg.id, amount: m(pkg.amountMinor) });
  }

  // Quantity items
  for (const rule of config.quantityRules) {
    const quantity = selection.quantities?.[rule.id] ?? rule.defaultQuantity;
    if (quantity === 0) continue;
    lines.push({
      kind: "QUANTITY",
      label: rule.unitName,
      refId: rule.id,
      quantity,
      unitAmount: m(rule.unitAmountMinor),
      amount: multiply(m(rule.unitAmountMinor), quantity),
    });
  }

  // Add-ons
  for (const addOn of config.addOns) {
    const quantity = selection.addOns?.[addOn.id] ?? 0;
    if (quantity === 0) continue;
    lines.push({
      kind: "ADDON",
      label: addOn.name,
      refId: addOn.id,
      quantity,
      unitAmount: m(addOn.amountMinor),
      amount: multiply(m(addOn.amountMinor), quantity),
    });
  }

  // Options (free options are listed too so the scope summary is complete)
  for (const group of config.optionGroups) {
    for (const optionId of selection.options?.[group.id] ?? []) {
      const option = group.options.find((o) => o.id === optionId)!;
      lines.push({
        kind: "OPTION",
        label: `${group.label}: ${option.label}`,
        refId: option.id,
        amount: m(option.priceModifierMinor),
      });
    }
  }

  // Delivery: a percentage applies to everything above it (D-010)
  const beforeDelivery = sum(
    lines.map((line) => line.amount),
    currency,
  );
  const delivery = selection.deliveryOptionId
    ? config.deliveryOptions.find((d) => d.id === selection.deliveryOptionId)
    : config.deliveryOptions.find((d) => d.isStandard);
  if (delivery?.modifier) {
    lines.push({
      kind: "DELIVERY",
      label: delivery.label,
      refId: delivery.id,
      amount: applyModifier(beforeDelivery, delivery.modifier),
    });
  }

  const priceState = priceStateFor(config.mode);
  if (priceState === "QUOTE_REQUIRED") {
    return ok({
      currency,
      priceState,
      lines,
      subtotal: null,
      discount: null,
      charges: null,
      total: null,
      commitment: null,
    });
  }

  const subtotal = sum(
    lines.map((line) => line.amount),
    currency,
  );
  const adjusted = applyAdjustments(subtotal, null, config.charges);
  if (!adjusted.ok) return adjusted;

  return ok({
    currency,
    priceState,
    lines: [...lines, ...adjusted.value.lines],
    subtotal,
    discount: adjusted.value.discount,
    charges: adjusted.value.charges,
    total: adjusted.value.total,
    commitment: commitmentFor(adjusted.value.total, commitmentBps),
  });
}

// ---------------------------------------------------------------------------
// CommercialProposal totals (D-008, D-011, QTE-001)
// ---------------------------------------------------------------------------

export type ProposalPricingInput = {
  currency: Currency;
  /** The Creative's proposed price for the agreed scope, before discount and charges. */
  subtotalMinor: bigint;
  discount?: Discount | null;
  charges?: readonly ChargeConfig[];
  commitmentBps: BasisPoints | null;
};

export type ProposalTotals = {
  subtotal: Money;
  discount: Money;
  charges: Money;
  total: Money;
  commitment: Money | null;
  lines: PriceLine[];
};

export function calculateProposalTotals(input: ProposalPricingInput): Result<ProposalTotals> {
  if (input.subtotalMinor <= 0n) {
    return err("INVALID_AMOUNT", "The proposed price must be more than zero.", "subtotal");
  }
  if (input.commitmentBps !== null && !isValidBps(input.commitmentBps)) {
    return err("INVALID_PERCENTAGE", "Commitment must be between 0% and 100%.", "commitment");
  }
  const subtotal = money(input.subtotalMinor, input.currency);
  const adjusted = applyAdjustments(subtotal, input.discount, input.charges ?? []);
  if (!adjusted.ok) return adjusted;
  return ok({
    subtotal,
    discount: adjusted.value.discount,
    charges: adjusted.value.charges,
    total: adjusted.value.total,
    commitment: commitmentFor(adjusted.value.total, input.commitmentBps),
    lines: adjusted.value.lines,
  });
}

/** Previous / Proposed / Difference for ProposalComparison (QTE-002, docs/08 §10). */
export function priceDifference(previous: Money, proposed: Money): Money {
  return subtract(proposed, previous);
}

// ---------------------------------------------------------------------------
// Service-level pricing validation (part of publish validation, SRV-004)
// ---------------------------------------------------------------------------

function isValidBps(bps: number): boolean {
  return Number.isInteger(bps) && bps >= 0 && bps <= PERCENT_100;
}

function validModifier(modifier: Modifier): boolean {
  return modifier.kind === "FIXED" ? modifier.amountMinor >= 0n : isValidBps(modifier.bps);
}

/** Problems that block publishing a Service's pricing. */
export function validatePricingConfig(config: PricingConfig): DomainError[] {
  const issues: DomainError[] = [];
  const issue = (code: string, message: string, target?: string) =>
    issues.push({ code, message, ...(target ? { target } : {}) });

  switch (config.mode) {
    case "FIXED":
      if (!config.baseAmountMinor || config.baseAmountMinor <= 0n) {
        issue("BASE_PRICE_REQUIRED", "Fixed price needs an amount above zero.", "baseAmount");
      }
      break;
    case "STARTING_FROM":
      if (!config.baseAmountMinor || config.baseAmountMinor <= 0n) {
        issue(
          "MINIMUM_PRICE_REQUIRED",
          "Starting from needs a minimum amount above zero.",
          "baseAmount",
        );
      }
      break;
    case "QUANTITY":
      if (config.quantityRules.length === 0) {
        issue(
          "QUANTITY_RULE_REQUIRED",
          "Quantity pricing needs at least one unit.",
          "quantityRules",
        );
      }
      break;
    case "PACKAGE":
      if (config.packages.length === 0) {
        issue("PACKAGE_REQUIRED", "Package pricing needs at least one package.", "packages");
      }
      break;
    case "CUSTOM_QUOTE":
      break;
  }

  for (const pkg of config.packages) {
    if (pkg.amountMinor <= 0n)
      issue("INVALID_AMOUNT", `${pkg.name} needs a price above zero.`, pkg.id);
    for (const addOnId of pkg.eligibleAddOnIds ?? []) {
      if (!config.addOns.some((a) => a.id === addOnId)) {
        issue("UNKNOWN_ADDON", `${pkg.name} lists an add-on that does not exist.`, pkg.id);
      }
    }
  }

  for (const rule of config.quantityRules) {
    const validRange =
      Number.isInteger(rule.minimum) &&
      rule.minimum >= 0 &&
      (rule.maximum === undefined ||
        (Number.isInteger(rule.maximum) && rule.maximum >= rule.minimum)) &&
      Number.isInteger(rule.defaultQuantity) &&
      within(rule.defaultQuantity, rule.minimum, rule.maximum);
    if (rule.unitAmountMinor <= 0n) {
      issue("INVALID_AMOUNT", `${rule.unitName} needs a unit price above zero.`, rule.id);
    }
    if (!validRange) {
      issue(
        "INVALID_QUANTITY_RANGE",
        `${rule.unitName} has an invalid minimum, maximum or default.`,
        rule.id,
      );
    }
  }

  for (const addOn of config.addOns) {
    if (addOn.amountMinor <= 0n) {
      issue("INVALID_AMOUNT", `${addOn.name} needs a price above zero.`, addOn.id);
    }
    if (
      addOn.allowsQuantity &&
      addOn.maximumQuantity !== undefined &&
      addOn.maximumQuantity < (addOn.minimumQuantity ?? 1)
    ) {
      issue("INVALID_QUANTITY_RANGE", `${addOn.name} has an invalid quantity range.`, addOn.id);
    }
  }

  for (const group of config.optionGroups) {
    if (group.options.length === 0) {
      issue("OPTIONS_REQUIRED", `${group.label} needs at least one option.`, group.id);
    }
    for (const option of group.options) {
      if (option.priceModifierMinor < 0n) {
        // No public discounts in V1 (D-011)
        issue("NEGATIVE_MODIFIER", `${option.label} cannot reduce the price.`, option.id);
      }
    }
  }

  const standard = config.deliveryOptions.filter((d) => d.isStandard);
  if (standard.length !== 1) {
    issue("STANDARD_DELIVERY_REQUIRED", "Set exactly one standard turnaround.", "delivery");
  }
  for (const delivery of config.deliveryOptions) {
    if (delivery.isStandard && delivery.modifier) {
      issue(
        "STANDARD_DELIVERY_MODIFIER",
        "The standard turnaround cannot change the price.",
        delivery.id,
      );
    }
    if (delivery.modifier && !validModifier(delivery.modifier)) {
      issue("INVALID_MODIFIER", `${delivery.label} has an invalid price change.`, delivery.id);
    }
  }

  for (const charge of config.charges) {
    if (!validModifier(charge.modifier)) {
      issue("INVALID_MODIFIER", `${charge.label} has an invalid amount.`, charge.id);
    }
  }

  const exists = (ref: ItemRef) =>
    ref.type === "PACKAGE"
      ? config.packages.some((p) => p.id === ref.id)
      : ref.type === "ADDON"
        ? config.addOns.some((a) => a.id === ref.id)
        : config.optionGroups.some((g) => g.options.some((o) => o.id === ref.id));
  for (const dependency of config.dependencies) {
    if (!exists(dependency.prerequisite) || !exists(dependency.dependent)) {
      // e.g. a published Service whose prerequisite was removed (PRD §29)
      issue(
        "BROKEN_DEPENDENCY",
        "A dependency refers to an item that no longer exists.",
        "dependencies",
      );
    } else if (
      dependency.prerequisite.type === dependency.dependent.type &&
      dependency.prerequisite.id === dependency.dependent.id
    ) {
      issue("SELF_DEPENDENCY", "An item cannot require itself.", "dependencies");
    }
  }

  return issues;
}
