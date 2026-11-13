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
