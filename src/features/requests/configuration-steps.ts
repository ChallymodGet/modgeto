/**
 * Adaptive configuration steps (docs/06 §25): Package or scope, Customise,
 * Delivery. Steps with nothing to choose are omitted. Pure, for testing.
 */
import type { DomainError, Selection } from "@/lib/domain";
import type { Service } from "@/types";

export type ConfigStepId = "scope" | "customise" | "delivery";
export type ConfigStep = { id: ConfigStepId; label: string };

type StepService = Pick<
  Service,
  "pricingMode" | "optionGroups" | "addOns" | "deliveryOptions" | "quantityRules"
>;

export function configurationSteps(service: StepService): ConfigStep[] {
  const steps: ConfigStep[] = [
    {
      id: "scope",
      label:
        service.pricingMode === "PACKAGE"
          ? "Package"
          : service.pricingMode === "QUANTITY"
            ? "Quantity"
            : "Scope",
    },
  ];
  if (service.optionGroups.length > 0 || service.addOns.some((a) => a.active)) {
    steps.push({ id: "customise", label: "Customise" });
  }
  if (service.deliveryOptions.length > 1) steps.push({ id: "delivery", label: "Delivery" });
  return steps;
}

const SCOPE_CODES = new Set([
  "PACKAGE_REQUIRED",
  "UNKNOWN_PACKAGE",
  "PACKAGE_NOT_APPLICABLE",
  "UNKNOWN_QUANTITY_RULE",
]);
const DELIVERY_CODES = new Set(["UNKNOWN_DELIVERY_OPTION"]);

/** Which step a selection problem belongs to, so Continue only checks the current step. */
export function stepForIssue(issue: DomainError, service: StepService): ConfigStepId {
  if (SCOPE_CODES.has(issue.code)) return "scope";
  if (DELIVERY_CODES.has(issue.code)) return "delivery";
  if (
    issue.code === "QUANTITY_OUT_OF_RANGE" &&
    service.quantityRules.some((r) => r.id === issue.target)
  ) {
    return "scope";
  }
  return "customise";
}

/** A sensible starting selection: default quantities and standard delivery. Never a paid choice. */
export function initialSelection(
  service: Pick<Service, "quantityRules" | "deliveryOptions">,
): Selection {
  return {
    quantities: Object.fromEntries(service.quantityRules.map((r) => [r.id, r.defaultQuantity])),
    deliveryOptionId: service.deliveryOptions.find((d) => d.isStandard)?.id,
  };
}
