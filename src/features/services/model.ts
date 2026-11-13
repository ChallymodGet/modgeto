/** Adapters from the stored Service to the domain engine's inputs. */
import {
  type BasisPoints,
  type PricingConfig,
  type ServiceForPublish,
  resolveCommitmentBps,
} from "@/lib/domain";
import type { CreativeProfile, Service, Turnaround } from "@/types";

export function toPricingConfig(service: Service): PricingConfig {
  return {
    currency: service.currency,
    mode: service.pricingMode,
    baseAmountMinor: service.baseAmountMinor ?? undefined,
    packages: service.packages,
    quantityRules: service.quantityRules,
    addOns: service.addOns,
    optionGroups: service.optionGroups,
    deliveryOptions: service.deliveryOptions,
    dependencies: service.dependencies,
    charges: service.charges,
  };
}

/** The commitment percentage a Service uses, resolving "Creative default" (SRV-025). */
export function serviceCommitmentBps(
  service: Service,
  creative: CreativeProfile,
): BasisPoints | null {
  return resolveCommitmentBps(
    service.commitment.mode === "CREATIVE_DEFAULT"
      ? { mode: "CREATIVE_DEFAULT", defaultBps: creative.defaultCommitmentBps }
      : service.commitment,
  );
}

export function standardTurnaround(service: Service): Turnaround | null {
  return service.deliveryOptions.find((d) => d.isStandard)?.turnaround ?? null;
}

export function toServiceForPublish(
  service: Service,
  creative: CreativeProfile,
): ServiceForPublish {
  return {
    name: service.name,
    shortDescription: service.shortDescription,
    categoryId: service.categoryId,
    pricing: toPricingConfig(service),
    deliverableCount: service.deliverables.length,
    standardTurnaroundValue: standardTurnaround(service)?.value ?? null,
    revisions: service.revisions.policy,
    terms: service.terms.content,
    brief: service.brief,
    commitment:
      service.commitment.mode === "CREATIVE_DEFAULT"
        ? { mode: "CREATIVE_DEFAULT", defaultBps: creative.defaultCommitmentBps }
        : service.commitment,
    selectedPaymentMethodCount: service.paymentMethodIds.length,
  };
}

/**
 * The headline price a Service shows before configuration (docs/06 §23):
 * exact for Fixed, an estimate for Starting From, the lowest package for
 * Packages, a unit price for Quantity, and no number for Custom Quote (PRC-006).
 */
export type ServicePriceSummary =
  | { kind: "EXACT"; amountMinor: bigint }
  | { kind: "STARTING_FROM"; amountMinor: bigint }
  | { kind: "PACKAGES_FROM"; amountMinor: bigint }
  | { kind: "PER_UNIT"; amountMinor: bigint; unitName: string; minimum: number }
  | { kind: "QUOTE" };

export function servicePriceSummary(
  service: Pick<Service, "pricingMode" | "baseAmountMinor" | "packages" | "quantityRules">,
): ServicePriceSummary {
  switch (service.pricingMode) {
    case "FIXED":
      return service.baseAmountMinor === null
        ? { kind: "QUOTE" }
        : { kind: "EXACT", amountMinor: service.baseAmountMinor };
    case "STARTING_FROM":
      return service.baseAmountMinor === null
        ? { kind: "QUOTE" }
        : { kind: "STARTING_FROM", amountMinor: service.baseAmountMinor };
    case "PACKAGE": {
      const lowest = service.packages.reduce<bigint | null>(
        (min, p) => (min === null || p.amountMinor < min ? p.amountMinor : min),
        null,
      );
      return lowest === null ? { kind: "QUOTE" } : { kind: "PACKAGES_FROM", amountMinor: lowest };
    }
    case "QUANTITY": {
      const rule = service.quantityRules[0];
      return rule
        ? {
            kind: "PER_UNIT",
            amountMinor: rule.unitAmountMinor,
            unitName: rule.unitName,
            minimum: rule.minimum,
          }
        : { kind: "QUOTE" };
    }
    case "CUSTOM_QUOTE":
      return { kind: "QUOTE" };
  }
}
