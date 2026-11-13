/**
 * Pricing components (docs/07 §25, docs/08 §10). Amounts are integer minor
 * units formatted by the domain Money utility; nothing here does arithmetic
 * on floats. Exact, estimated and quote prices are always labelled differently
 * (CLAUDE.md §13).
 */
import { ArrowDown, ArrowUp, Equal, Info } from "lucide-react";
import type { ReactNode } from "react";
import { servicePriceSummary } from "@/features/services/model";
import {
  type Currency,
  type Modifier,
  type PriceBreakdown as Breakdown,
  type PriceLine,
  formatMoney,
  money,
} from "@/lib/domain";
import { formatModifier, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

// ------------------------------------------------------------------ MoneyDisplay

const moneySizes = {
  sm: "text-body-sm font-medium",
  md: "text-body font-semibold",
  lg: "text-h3",
  /** Large light numerals for headline prices (D-031). */
  xl: "text-[2.25rem] leading-none text-numeral md:text-[2.75rem]",
};

type MoneyDisplayProps = {
  amountMinor: bigint;
  currency: Currency;
  size?: keyof typeof moneySizes;
  /** "+₦80,000" for modifiers. */
  signed?: boolean;
  className?: string;
};

export function MoneyDisplay({
  amountMinor,
  currency,
  size = "md",
  signed,
  className,
}: MoneyDisplayProps) {
  return (
    <span className={cn("text-foreground tabular-nums", moneySizes[size], className)}>
      {formatMoney(money(amountMinor, currency), { signed })}
    </span>
  );
}

// ------------------------------------------------------------------ PriceModifier

/** A price effect shown before selection: "+₦80,000", "+25%" or "Included". */
export function PriceModifier({
  modifier,
  currency,
  className,
}: {
  modifier: Modifier | null;
  currency: Currency;
  className?: string;
}) {
  const label = formatModifier(modifier, currency);
  return (
    <span
      className={cn(
        "text-body-sm font-medium whitespace-nowrap tabular-nums",
        label === "Included" ? "text-foreground-muted" : "text-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}

// ------------------------------------------------------------------ ServicePrice

type ServicePriceProps = {
  service: Pick<
    Service,
    "pricingMode" | "baseAmountMinor" | "packages" | "quantityRules" | "currency"
  >;
  /** `card` for Service cards, `hero` for the Service detail summary. */
  variant?: "card" | "hero";
  className?: string;
};

/** The headline price for a Service, in the right language for its pricing mode (docs/06 §23). */
export function ServicePrice({ service, variant = "card", className }: ServicePriceProps) {
  const summary = servicePriceSummary(service);
  const hero = variant === "hero";
  const amountSize = hero ? "xl" : "md";

  let qualifier: string | null = null;
  let amount: ReactNode = null;
  let suffix: string | null = null;
  let note: string | null = null;

  switch (summary.kind) {
    case "EXACT":
      amount = (
        <MoneyDisplay
          amountMinor={summary.amountMinor}
          currency={service.currency}
          size={amountSize}
        />
      );
      note = hero ? "Fixed price" : null;
      break;
    case "STARTING_FROM":
      qualifier = "Starting from";
      amount = (
        <MoneyDisplay
          amountMinor={summary.amountMinor}
          currency={service.currency}
          size={amountSize}
        />
      );
      note = hero
        ? "An estimate. The Creative confirms the final price after reviewing your Brief."
        : null;
      break;
    case "PACKAGES_FROM":
      qualifier = "From";
      amount = (
        <MoneyDisplay
          amountMinor={summary.amountMinor}
          currency={service.currency}
          size={amountSize}
        />
      );
      note = hero ? "Choose a package to see its exact price." : null;
      break;
    case "PER_UNIT":
      amount = (
        <MoneyDisplay
          amountMinor={summary.amountMinor}
          currency={service.currency}
          size={amountSize}
        />
      );
      suffix = `per ${summary.unitName.toLowerCase()}`;
      note = hero && summary.minimum > 1 ? `Minimum ${summary.minimum}.` : null;
      break;
    case "QUOTE":
      return (
        <div className={cn("flex flex-col gap-1", className)}>
          <span className={cn("text-foreground", hero ? "text-h3" : "text-body font-semibold")}>
            Custom quote
          </span>
          {hero && (
            <span className="text-body-sm text-foreground-secondary">
              Share your Brief and the Creative will send you a price.
            </span>
          )}
        </div>
      );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "flex flex-wrap items-baseline gap-x-1.5",
          hero && "flex-col items-start gap-1",
        )}
      >
        {qualifier && (
          <span className={cn("text-foreground-secondary", hero ? "text-label" : "text-body-sm")}>
            {qualifier}
          </span>
        )}
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          {amount}
          {suffix && <span className="text-body-sm text-foreground-secondary">{suffix}</span>}
        </span>
      </span>
      {note && <span className="text-body-sm text-foreground-secondary">{note}</span>}
    </div>
  );
}

// ------------------------------------------------------------------ EstimatedPrice

/** An amount that isn't final yet: always says so in words (docs/06 §30). */
export function EstimatedPrice({
  amountMinor,
  currency,
  label = "Estimated total",
  note = "The Creative confirms the final price after reviewing your Brief.",
}: {
  amountMinor: bigint;
  currency: Currency;
  label?: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-foreground-secondary">{label}</span>
      <MoneyDisplay amountMinor={amountMinor} currency={currency} size="lg" />
      <span className="flex items-start gap-1.5 text-body-sm text-foreground-secondary">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
        {note}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------ PriceBreakdown

function lineLabel(line: PriceLine) {
  return line.quantity && line.quantity > 1 && line.unitAmount ? (
    <>
      {line.label}
      <span className="text-foreground-muted">
        {" "}
        × {line.quantity} at {formatMoney(line.unitAmount)}
      </span>
    </>
  ) : (
    line.label
  );
}

type PriceBreakdownProps = {
  breakdown: Breakdown;
  /** Hide the commitment line, e.g. when a CommitmentSummary sits beside it. */
  hideCommitment?: boolean;
  className?: string;
};

/**
 * Line items, subtotal, discount, charges and total as a description list, so
 * each label is read with its amount. Custom Quote shows no numbers (PRC-006);
 * Starting From totals are labelled as estimates.
 */
export function PriceBreakdown({ breakdown, hideCommitment, className }: PriceBreakdownProps) {
  const { currency } = breakdown;
  const estimated = breakdown.priceState === "ESTIMATED";
  const items = breakdown.lines.filter((l) => l.kind !== "DISCOUNT" && l.kind !== "CHARGE");
  const adjustments = breakdown.lines.filter((l) => l.kind === "DISCOUNT" || l.kind === "CHARGE");

  if (breakdown.priceState === "QUOTE_REQUIRED") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <p className="text-label text-foreground">Quote required</p>
        <p className="text-body-sm text-foreground-secondary">
          This Service is priced after the Creative reviews your Brief. You&apos;ll see the price
          before you agree to anything.
        </p>
      </div>
    );
  }

  const row = "flex items-baseline justify-between gap-4";
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <dl className="flex flex-col gap-2 text-body-sm">
        {items.map((line, i) => (
          <div key={`${line.kind}-${line.refId ?? i}`} className={row}>
            <dt className="text-foreground-secondary">{lineLabel(line)}</dt>
            <dd
              className={cn(
                "tabular-nums",
                line.amount.amountMinor === 0n ? "text-foreground-muted" : "text-foreground",
              )}
            >
              {line.amount.amountMinor === 0n
                ? "Included"
                : formatMoney(line.amount, {
                    signed:
                      line.kind !== "BASE" && line.kind !== "PACKAGE" && line.kind !== "QUANTITY",
                  })}
            </dd>
          </div>
        ))}
      </dl>
      {breakdown.subtotal && adjustments.length > 0 && (
        <dl className="flex flex-col gap-2 border-t border-border pt-3 text-body-sm">
          <div className={row}>
            <dt className="text-foreground-secondary">Subtotal</dt>
            <dd className="text-foreground tabular-nums">{formatMoney(breakdown.subtotal)}</dd>
          </div>
          {adjustments.map((line, i) => (
            <div key={`${line.kind}-${line.refId ?? i}`} className={row}>
              <dt className="text-foreground-secondary">
                {line.label}
                {line.kind === "DISCOUNT" && <span className="sr-only"> (discount)</span>}
              </dt>
              <dd className="text-foreground tabular-nums">
                {formatMoney(line.amount, { signed: true })}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {breakdown.total && (
        <dl className="flex flex-col gap-2 border-t border-border pt-3">
          <div className={row}>
            <dt className="text-label text-foreground">
              {estimated ? "Estimated total" : "Total"}
            </dt>
            <dd>
              <MoneyDisplay
                amountMinor={breakdown.total.amountMinor}
                currency={currency}
                size="lg"
              />
            </dd>
          </div>
          {!hideCommitment && breakdown.commitment && (
            <div className={cn(row, "text-body-sm")}>
              <dt className="text-foreground-secondary">
                Commitment due before the Project starts
              </dt>
              <dd className="text-foreground tabular-nums">{formatMoney(breakdown.commitment)}</dd>
            </div>
          )}
        </dl>
      )}
      {estimated && (
        <p className="flex items-start gap-1.5 text-body-sm text-foreground-secondary">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
          An estimate. The Creative confirms the final price after reviewing your Brief.
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ PriceDifference

/**
 * Previous, proposed and the difference (docs/08 §10). Direction is shown with
 * a word and an icon as well as the sign, never colour alone.
 */
export function PriceDifference({
  previousMinor,
  proposedMinor,
  currency,
  previousLabel = "Previous",
  proposedLabel = "Proposed",
}: {
  previousMinor: bigint;
  proposedMinor: bigint;
  currency: Currency;
  previousLabel?: string;
  proposedLabel?: string;
}) {
  const diff = proposedMinor - previousMinor;
  const Icon = diff > 0n ? ArrowUp : diff < 0n ? ArrowDown : Equal;
  const word = diff > 0n ? "Increase" : diff < 0n ? "Decrease" : "No change";
  const row = "flex items-baseline justify-between gap-4";
  return (
    <dl className="flex flex-col gap-2 text-body-sm">
      <div className={row}>
        <dt className="text-foreground-secondary">{previousLabel}</dt>
        <dd className="text-foreground-secondary tabular-nums line-through decoration-foreground-muted">
          {formatMoney(money(previousMinor, currency))}
        </dd>
      </div>
      <div className={row}>
        <dt className="text-foreground-secondary">{proposedLabel}</dt>
        <dd className="font-semibold text-foreground tabular-nums">
          {formatMoney(money(proposedMinor, currency))}
        </dd>
      </div>
      <div className={cn(row, "border-t border-border pt-2")}>
        <dt className="flex items-center gap-1.5 text-foreground">
          <Icon aria-hidden="true" className="size-4 text-foreground-muted" />
          Difference
        </dt>
        <dd className="text-foreground tabular-nums">
          {diff === 0n
            ? "No change"
            : `${word}: ${formatMoney(money(diff, currency), { signed: true })}`}
        </dd>
      </div>
    </dl>
  );
}

// ------------------------------------------------------------------ CommitmentSummary

/**
 * The commitment paid directly to the Creative before the Project starts
 * (SRV-025, PAY-001). Modgeto never collects it (CLAUDE.md §12).
 */
export function CommitmentSummary({
  bps,
  amountMinor,
  currency,
  className,
}: {
  bps: number | null;
  amountMinor: bigint | null;
  currency: Currency;
  className?: string;
}) {
  if (bps === null || amountMinor === null) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <p className="text-label text-foreground">No commitment required</p>
        <p className="text-body-sm text-foreground-secondary">
          Once terms are agreed, the Creative can start the Project.
        </p>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-label text-foreground">Commitment ({formatPercent(bps)})</p>
        <MoneyDisplay amountMinor={amountMinor} currency={currency} />
      </div>
      <p className="text-body-sm text-foreground-secondary">
        Paid directly to the Creative before the Project starts. Modgeto does not collect Client
        Project payments.
      </p>
    </div>
  );
}
