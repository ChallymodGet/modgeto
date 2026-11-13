"use client";

/**
 * Configuration controls (docs/06 §28, docs/07 §24). Every control sits on a
 * real radio or checkbox group, and every price effect is visible before
 * selection (CLAUDE.md §13). Controlled: the parent owns the `Selection`.
 */
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/ui/form-field";
import { NumberInput } from "@/components/ui/number-input";
import { SelectionCard, SelectionCardGroup } from "@/components/ui/selection-card";
import { type Currency, formatMoney, money } from "@/lib/domain";
import { formatTurnaround } from "@/lib/format";
import type { AddOn, Deliverable, DeliveryOption, ServicePackage } from "@/types";
import type { OptionGroupConfig, QuantityRuleConfig } from "@/lib/domain";
import { MoneyDisplay, PriceModifier } from "./price";
import { DeliverableList, RevisionSummary, TurnaroundSummary } from "./scope";

// ------------------------------------------------------------------ Packages

export function PackageSelector({
  packages,
  deliverables,
  currency,
  value,
  onValueChange,
  error,
}: {
  packages: ServicePackage[];
  deliverables: Deliverable[];
  currency: Currency;
  value: string | null;
  onValueChange: (packageId: string) => void;
  error?: string | null;
}) {
  return (
    <SelectionCardGroup
      legend="Choose a package"
      description="You can add extras next."
      value={value}
      onValueChange={onValueChange}
      error={error}
      columns={packages.length >= 3 ? 3 : 2}
    >
      {packages.map((pkg) => (
        <SelectionCard
          key={pkg.id}
          value={pkg.id}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {pkg.name}
              {pkg.recommended && (
                <Badge tone="primary">
                  <Star aria-hidden="true" />
                  Recommended
                </Badge>
              )}
            </span>
          }
          meta={formatMoney(money(pkg.amountMinor, currency))}
          description={pkg.description}
        >
          <DeliverableList
            compact
            deliverables={deliverables.filter(
              (d) => d.packageId === null || d.packageId === pkg.id,
            )}
          />
          <span className="flex flex-col gap-1.5 border-t border-border pt-3">
            <TurnaroundSummary turnaround={pkg.turnaround} />
            <RevisionSummary policy={pkg.revisions} currency={currency} />
          </span>
        </SelectionCard>
      ))}
    </SelectionCardGroup>
  );
}

// ------------------------------------------------------------------ Quantity

/** Stepper with unit price, limits and the item subtotal (docs/06 §28). */
export function QuantityControl({
  rule,
  currency,
  value,
  onValueChange,
  error,
}: {
  rule: QuantityRuleConfig;
  currency: Currency;
  value: number;
  onValueChange: (quantity: number) => void;
  error?: string | null;
}) {
  const limits =
    rule.maximum !== undefined ? `${rule.minimum} to ${rule.maximum}` : `At least ${rule.minimum}`;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <FormField
        label={rule.unitName}
        description={`${formatMoney(money(rule.unitAmountMinor, currency))} each. ${limits}.`}
        error={error}
        className="sm:max-w-xs"
      >
        <NumberInput
          value={value}
          onValueChange={(v) => v !== null && onValueChange(v)}
          min={rule.minimum}
          max={rule.maximum}
          unitLabel={rule.unitName.toLowerCase()}
        />
      </FormField>
      <p className="flex items-baseline gap-2 sm:pb-2.5" aria-live="polite">
        <span className="text-body-sm text-foreground-secondary">Subtotal</span>
        <MoneyDisplay amountMinor={rule.unitAmountMinor * BigInt(value)} currency={currency} />
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Add-ons

/** Optional paid extras. Add-ons that allow quantity show a stepper once chosen. */
export function AddOnSelector({
  addOns,
  currency,
  value,
  onValueChange,
  unavailable = {},
}: {
  addOns: AddOn[];
  currency: Currency;
  /** Add-on id → quantity. */
  value: Record<string, number>;
  onValueChange: (value: Record<string, number>) => void;
  /** Add-on id → why it can't be chosen yet, e.g. a missing prerequisite (docs/06 §29). */
  unavailable?: Record<string, string>;
}) {
  const active = addOns.filter((a) => a.active);
  const selected = Object.keys(value);
  return (
    <SelectionCardGroup
      type="multiple"
      legend="Add-ons"
      optional
      value={selected}
      onValueChange={(ids) => {
        const next: Record<string, number> = {};
        for (const id of ids) {
          const addOn = active.find((a) => a.id === id);
          next[id] = value[id] ?? addOn?.minimumQuantity ?? 1;
        }
        onValueChange(next);
      }}
      columns={2}
    >
      {active.map((addOn) => (
        <AddOnCard
          key={addOn.id}
          addOn={addOn}
          currency={currency}
          quantity={value[addOn.id]}
          unavailableReason={unavailable[addOn.id]}
          onQuantityChange={(q) => onValueChange({ ...value, [addOn.id]: q })}
        />
      ))}
    </SelectionCardGroup>
  );
}

export function AddOnCard({
  addOn,
  currency,
  quantity,
  unavailableReason,
  onQuantityChange,
}: {
  addOn: AddOn;
  currency: Currency;
  quantity: number | undefined;
  unavailableReason?: string;
  onQuantityChange: (quantity: number) => void;
}) {
  const price = formatMoney(money(addOn.amountMinor, currency), { signed: true });
  return (
    <div className="flex flex-col gap-2">
      <SelectionCard
        value={addOn.id}
        title={addOn.name}
        meta={addOn.allowsQuantity ? `${price} each` : price}
        description={unavailableReason ?? addOn.description}
        disabled={Boolean(unavailableReason)}
      />
      {/* Outside the card's <label> so the stepper's buttons stay valid, separate controls. */}
      {addOn.allowsQuantity && quantity !== undefined && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle p-2 pl-4">
          <span className="text-body-sm text-foreground-secondary">Quantity</span>
          <NumberInput
            aria-label={`${addOn.name} quantity`}
            value={quantity}
            onValueChange={(v) => v !== null && onQuantityChange(v)}
            min={addOn.minimumQuantity ?? 1}
            max={addOn.maximumQuantity}
            unitLabel={addOn.name.toLowerCase()}
            className="max-w-44"
          />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Options

/** Single- or multi-select option group, e.g. Website platform (docs/06 §28). */
export function OptionGroup({
  group,
  currency,
  value,
  onValueChange,
  error,
}: {
  group: OptionGroupConfig;
  currency: Currency;
  value: readonly string[];
  onValueChange: (optionIds: string[]) => void;
  error?: string | null;
}) {
  const cards = group.options.map((option) => (
    <OptionCard
      key={option.id}
      value={option.id}
      label={option.label}
      priceModifierMinor={option.priceModifierMinor}
      currency={currency}
    />
  ));
  return group.selectionMode === "SINGLE" ? (
    <SelectionCardGroup
      legend={group.label}
      optional={!group.required}
      value={value[0] ?? null}
      onValueChange={(id) => onValueChange([id])}
      error={error}
      columns={2}
    >
      {cards}
    </SelectionCardGroup>
  ) : (
    <SelectionCardGroup
      type="multiple"
      legend={group.label}
      description="Choose all that apply."
      optional={!group.required}
      value={[...value]}
      onValueChange={onValueChange}
      error={error}
      columns={2}
    >
      {cards}
    </SelectionCardGroup>
  );
}

export function OptionCard({
  value,
  label,
  priceModifierMinor,
  currency,
}: {
  value: string;
  label: string;
  priceModifierMinor: bigint;
  currency: Currency;
}) {
  return (
    <SelectionCard
      value={value}
      title={label}
      meta={
        <PriceModifier
          modifier={{ kind: "FIXED", amountMinor: priceModifierMinor }}
          currency={currency}
        />
      }
    />
  );
}

// ------------------------------------------------------------------ Delivery

/** Delivery choices with turnaround and price effect (docs/06 §28). */
export function DeliveryOptionSelector({
  options,
  currency,
  value,
  onValueChange,
}: {
  options: DeliveryOption[];
  currency: Currency;
  value: string | null;
  onValueChange: (deliveryOptionId: string) => void;
}) {
  const standard = options.find((o) => o.isStandard);
  return (
    <SelectionCardGroup
      legend="Delivery"
      value={value ?? standard?.id ?? null}
      onValueChange={onValueChange}
      columns={options.length > 2 ? 3 : 2}
    >
      {options.map((option) => (
        <DeliveryOptionCard key={option.id} option={option} currency={currency} />
      ))}
    </SelectionCardGroup>
  );
}

export function DeliveryOptionCard({
  option,
  currency,
}: {
  option: DeliveryOption;
  currency: Currency;
}) {
  return (
    <SelectionCard
      value={option.id}
      title={option.label}
      meta={<PriceModifier modifier={option.modifier} currency={currency} />}
      description={`${formatTurnaround(option.turnaround)}${option.isStandard ? " · Standard" : ""}`}
    />
  );
}
