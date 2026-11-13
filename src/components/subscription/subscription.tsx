"use client";

/**
 * Platform subscription components (docs/03 §53–61, D-001, D-014–D-016).
 * Creative-to-Modgeto billing only; never mixed with Client Project payments.
 */
import { Lock, Sparkles, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldset } from "@/components/ui/form-field";
import { SelectionCard, SelectionCardGroup } from "@/components/ui/selection-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  MAX_CAPACITY,
  type Market,
  type StatusLabel,
  type SubscriptionStatus as Status,
  capacityPrice,
  cheaperLargerOffer,
  formatMoney,
  isZero,
} from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ CapacityPrice

/** "₦5,000 a month", or "Free" for the one free Published Service. */
export function capacityPriceLabel(limit: number, market: Market) {
  const price = capacityPrice(limit, market);
  return isZero(price) ? "Free" : `${formatMoney(price)} a month`;
}

export function CapacityPrice({
  limit,
  market,
  className,
}: {
  limit: number;
  market: Market;
  className?: string;
}) {
  const price = capacityPrice(limit, market);
  return (
    <span className={cn("flex items-baseline gap-1", className)}>
      <span className="text-h3 text-foreground tabular-nums">
        {isZero(price) ? "Free" : formatMoney(price)}
      </span>
      {!isZero(price) && <span className="text-body-sm text-foreground-secondary">a month</span>}
    </span>
  );
}

// ------------------------------------------------------------------ CapacitySelector

/**
 * Choose 1–10 Published Services. Every price is shown, and both discount
 * points (5 cost less than 4; 10 cost less than 9) are called out on the card
 * and when the Creative picks 4 or 9 (D-001). Never smooth this curve.
 */
export function CapacitySelector({
  market,
  value,
  current,
  onValueChange,
}: {
  market: Market;
  value: number;
  /** The Creative's current capacity, marked on its card. */
  current: number;
  onValueChange: (limit: number) => void;
}) {
  const limits = Array.from({ length: MAX_CAPACITY }, (_, i) => i + 1);
  const offer = cheaperLargerOffer(value, market);

  return (
    <div className="flex flex-col gap-4">
      <SelectionCardGroup
        legend="How many Published Services do you need?"
        description="Draft and archived Services never count. Your first Published Service is free."
        value={String(value)}
        onValueChange={(v) => onValueChange(Number(v))}
        columns={5}
      >
        {limits.map((limit) => {
          const cheaperThanPrevious =
            limit > 1 && cheaperLargerOffer(limit - 1, market)?.limit === limit;
          return (
            <SelectionCard
              key={limit}
              value={String(limit)}
              title={`${limit} ${limit === 1 ? "Service" : "Services"}`}
              description={capacityPriceLabel(limit, market)}
            >
              {(cheaperThanPrevious || limit === current) && (
                <span className="flex flex-wrap gap-1.5">
                  {limit === current && <Badge tone="outline">Current</Badge>}
                  {cheaperThanPrevious && (
                    <Badge tone="success">
                      <TrendingDown aria-hidden="true" />
                      <span aria-hidden="true">Less than {limit - 1}</span>
                      <span className="sr-only">Costs less than {limit - 1} Services</span>
                    </Badge>
                  )}
                </span>
              )}
            </SelectionCard>
          );
        })}
      </SelectionCardGroup>

      {offer && (
        <div className="flex flex-col gap-3 rounded-lg border border-success-border bg-success-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-body-sm text-foreground">
            <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-text" />
            Get one more Service and save {formatMoney(offer.monthlySaving)} each month.{" "}
            {offer.limit} Services cost {formatMoney(offer.price)} a month.
          </p>
          <Button variant="secondary" size="sm" onClick={() => onValueChange(offer.limit)}>
            Choose {offer.limit} Services
          </Button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ CapacityUsage

/** "3 of 5 Published Services in use", with one slot per Service. */
export function CapacityUsage({ used, limit }: { used: number; limit: number }) {
  const over = used > limit;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body-sm text-foreground">
        <span className="font-semibold tabular-nums">{used}</span> of{" "}
        <span className="tabular-nums">{limit}</span> Published{" "}
        {limit === 1 ? "Service" : "Services"} in use
      </p>
      <ul aria-hidden="true" className="flex flex-wrap gap-1.5">
        {Array.from({ length: Math.max(limit, used) }, (_, i) => (
          <li
            key={i}
            className={cn(
              "h-2 w-6 rounded-full",
              i < Math.min(used, limit)
                ? "bg-primary"
                : i < limit
                  ? "bg-surface-subtle ring-1 ring-border-control ring-inset"
                  : "bg-warning",
            )}
          />
        ))}
      </ul>
      {over && (
        <p className="text-body-sm text-warning-text">{used - limit} more than your capacity.</p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ ServiceAllocation

type AllocationService = { id: string; name: string; publishedAt: string | null };

/**
 * Choose which Services stay published when capacity drops (docs/05 §52).
 * The rest become Subscription inactive; nothing is deleted (D-016).
 */
export function ServiceAllocation({
  services,
  limit,
  freeServiceId,
  value,
  onValueChange,
}: {
  services: AllocationService[];
  limit: number;
  freeServiceId: string | null;
  value: string[];
  onValueChange: (keepIds: string[]) => void;
}) {
  const full = value.length >= limit;
  return (
    <FormFieldset
      legend={`Choose up to ${limit} ${limit === 1 ? "Service" : "Services"} to keep published`}
      description="The others become inactive. They keep their content and come back when you add capacity."
    >
      <p className="text-body-sm text-foreground-secondary" aria-live="polite">
        {value.length} of {limit} chosen
      </p>
      <ul className="flex flex-col gap-2">
        {services.map((s) => {
          const isFree = s.id === freeServiceId;
          const checked = value.includes(s.id);
          const disabled = isFree || (!checked && full);
          return (
            <li key={s.id}>
              <label
                className={cn(
                  "flex items-center gap-3 rounded-md border border-border bg-surface p-3",
                  disabled ? "cursor-not-allowed" : "cursor-pointer hover:border-border-strong",
                  checked && "border-primary bg-primary-subtle/50",
                )}
              >
                <Checkbox
                  checked={checked || isFree}
                  disabled={disabled}
                  onCheckedChange={(v) =>
                    onValueChange(v ? [...value, s.id] : value.filter((id) => id !== s.id))
                  }
                />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-body-sm font-medium text-foreground">{s.name}</span>
                  <span className="text-caption text-foreground-muted">
                    {s.publishedAt ? `Published ${formatDate(s.publishedAt)}` : "Not published yet"}
                  </span>
                </span>
                {isFree && (
                  <Badge tone="info">
                    <Lock aria-hidden="true" />
                    Free Service, always kept
                  </Badge>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </FormFieldset>
  );
}

// ------------------------------------------------------------------ SubscriptionStatus

const STATUS: Record<Status, StatusLabel> = {
  FREE: { label: "Free", intent: "neutral" },
  ACTIVE: { label: "Active", intent: "success" },
  PAST_DUE: { label: "Payment overdue", intent: "warning" },
  EXPIRED: { label: "Expired", intent: "danger" },
  CANCELLED: { label: "Cancelled", intent: "neutral" },
};

/** Status, capacity and what happens next. Only ever shown to the Creative (CLAUDE.md §12). */
export function SubscriptionStatus({
  status,
  limit,
  scheduledLimit,
  periodEnd,
  graceEndsAt,
  cancelAtPeriodEnd,
}: {
  status: Status;
  limit: number;
  scheduledLimit: number | null;
  periodEnd: string | null;
  graceEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
}) {
  let message: string;
  switch (status) {
    case "FREE":
      message = "You can publish one Service for free. Add capacity to publish more.";
      break;
    case "ACTIVE":
      message =
        cancelAtPeriodEnd && periodEnd
          ? `Your subscription ends on ${formatDate(periodEnd)}. After that you keep one free Published Service.`
          : periodEnd
            ? `Renews on ${formatDate(periodEnd)}.`
            : "Your subscription is active.";
      break;
    case "PAST_DUE":
      message = graceEndsAt
        ? `We couldn't take your last payment. Update your card by ${formatDate(graceEndsAt)} to keep your Services published.`
        : "We couldn't take your last payment. Update your card to keep your Services published.";
      break;
    case "EXPIRED":
      message =
        "Your subscription has ended. One free Service stays published; the rest are inactive until you renew.";
      break;
    case "CANCELLED":
      message = "Your subscription is cancelled. One free Service stays published.";
      break;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={STATUS[status]} size="md" />
        <p className="text-body-sm text-foreground">
          {limit} Published {limit === 1 ? "Service" : "Services"}
        </p>
      </div>
      <p className="text-body-sm text-foreground-secondary">{message}</p>
      {scheduledLimit !== null && periodEnd && (
        <p className="rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground">
          Changing to {scheduledLimit} {scheduledLimit === 1 ? "Service" : "Services"} on{" "}
          {formatDate(periodEnd)}.
        </p>
      )}
    </div>
  );
}
