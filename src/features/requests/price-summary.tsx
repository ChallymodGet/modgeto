"use client";

/**
 * The running price summary shared by Configure, Brief and Review
 * (docs/06 §26–27, CFG-002). Prices what's chosen so far; choices still to
 * make are listed instead of hiding the total.
 */
import { ArrowRight, ChevronUp, Info } from "lucide-react";
import type { ReactNode } from "react";
import { PriceBreakdown } from "@/components/service/price";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toPricingConfig } from "@/features/services/model";
import { type Selection, calculatePrice, formatMoney, validateSelection } from "@/lib/domain";
import type { Service } from "@/types";

type SummaryInput = { service: Service; selection: Selection; commitmentBps: number | null };

export function provisionalPrice({ service, selection, commitmentBps }: SummaryInput) {
  const config = toPricingConfig(service);
  const provisional = {
    ...config,
    optionGroups: config.optionGroups.map((g) => ({ ...g, required: false })),
    dependencies: [],
  };
  const issues = validateSelection(config, selection);
  return {
    price: calculatePrice(provisional, selection, commitmentBps),
    issues,
    stillToChoose: issues.filter(
      (i) => i.code === "OPTION_REQUIRED" || i.code === "MISSING_PREREQUISITE",
    ),
  };
}

/** "Estimated ₦300,000", "₦681,250", "Quote required". */
export function totalText(input: SummaryInput) {
  const { price } = provisionalPrice(input);
  if (!price.ok)
    return input.service.pricingMode === "CUSTOM_QUOTE" ? "Quote required" : "Not priced yet";
  if (!price.value.total) return "Quote required";
  return `${price.value.priceState === "ESTIMATED" ? "Estimated " : ""}${formatMoney(price.value.total)}`;
}

export function PriceSummary({ creativeName, ...input }: SummaryInput & { creativeName: string }) {
  const { price, issues, stillToChoose } = provisionalPrice(input);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-label text-foreground">{input.service.name}</p>
        <p className="text-caption text-foreground-secondary">with {creativeName}</p>
      </div>
      {price.ok ? (
        <>
          <PriceBreakdown breakdown={price.value} />
          {stillToChoose.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-md bg-surface-subtle px-4 py-3">
              <p className="text-label text-foreground">Still to choose</p>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-body-sm text-foreground-secondary">
                {stillToChoose.map((i) => (
                  <li key={`${i.code}-${i.target}`}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="flex items-start gap-2 rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground-secondary">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          {issues.some((i) => i.code === "PACKAGE_REQUIRED")
            ? "Choose a package to see your price."
            : "Your price appears once you've made the required choices."}
        </p>
      )}
    </div>
  );
}

/** Phones and tablets: current total (opens the full summary) and the step's main action. */
export function MobilePriceBar({
  creativeName,
  onContinue,
  continueLabel = "Continue",
  action,
  ...input
}: SummaryInput & {
  creativeName: string;
  onContinue?: () => void;
  continueLabel?: string;
  /** Replaces the Continue button, e.g. a submit button. */
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Drawer>
        <DrawerTrigger className="flex min-h-11 min-w-0 flex-col items-start rounded-md px-1 text-left focus-visible:outline-2 focus-visible:outline-focus">
          <span className="flex items-center gap-1 text-caption text-foreground-secondary">
            Price summary <ChevronUp aria-hidden="true" className="size-3.5" />
          </span>
          <span
            aria-live="polite"
            className="truncate text-body font-semibold text-foreground tabular-nums"
          >
            {totalText(input)}
          </span>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Price summary</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-5 pt-2 pb-6">
            <PriceSummary creativeName={creativeName} {...input} />
          </div>
        </DrawerContent>
      </Drawer>
      {action ?? (
        <Button onClick={onContinue} className="shrink-0">
          {continueLabel}
          <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
