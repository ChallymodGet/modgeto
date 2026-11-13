/** Scope presentation: deliverables, revisions and package summaries (docs/07 §24). */
import { Check, Clock, RefreshCw, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Currency, RevisionPolicy } from "@/lib/domain";
import { formatMoney, money } from "@/lib/domain";
import { formatRevisions, formatTurnaround } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deliverable, ServicePackage, Turnaround } from "@/types";
import { MoneyDisplay } from "./price";

type DeliverableItem = Pick<Deliverable, "name" | "description">;

/** What the Client receives. A ticked list so it reads as included scope. */
export function DeliverableList({
  deliverables,
  className,
  compact,
}: {
  deliverables: DeliverableItem[];
  className?: string;
  /** Names only, for cards. */
  compact?: boolean;
}) {
  if (deliverables.length === 0) return null;
  return (
    <ul className={cn("flex flex-col", compact ? "gap-1.5" : "gap-3", className)}>
      {deliverables.map((d) => (
        <li key={d.name} className="flex items-start gap-2.5">
          <Check
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-success"
            strokeWidth={2.5}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-body-sm text-foreground">{d.name}</span>
            {!compact && d.description && (
              <span className="text-body-sm text-foreground-muted">{d.description}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Revision allowance and the optional price per extra round (SRV-023). */
export function RevisionSummary({
  policy,
  additionalRevisionAmountMinor,
  currency,
}: {
  policy: RevisionPolicy;
  additionalRevisionAmountMinor?: bigint | null;
  currency: Currency;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <RefreshCw aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground-muted" />
      <div className="flex flex-col gap-0.5">
        <span className="text-body-sm text-foreground">{formatRevisions(policy)}</span>
        {additionalRevisionAmountMinor ? (
          <span className="text-body-sm text-foreground-muted">
            Extra rounds {formatMoney(money(additionalRevisionAmountMinor, currency))} each
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Turnaround with its icon, for summaries. */
export function TurnaroundSummary({
  turnaround,
  label,
}: {
  turnaround: Turnaround;
  label?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground-muted" />
      <span className="text-body-sm text-foreground">
        {label ? `${label}: ` : ""}
        {formatTurnaround(turnaround)}
      </span>
    </div>
  );
}

/**
 * A package's details for display (Service detail). For choosing a package,
 * `PackageSelector` puts the same content on a selection card.
 */
export function PackageCard({
  pkg,
  deliverables,
  currency,
  headingLevel: Heading = "h3",
}: {
  pkg: ServicePackage;
  deliverables: DeliverableItem[];
  currency: Currency;
  headingLevel?: "h3" | "h4";
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-surface p-5",
        pkg.recommended ? "border-primary ring-1 ring-primary" : "border-border",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Heading className="text-h4 text-foreground">{pkg.name}</Heading>
          {pkg.recommended && (
            <Badge tone="primary">
              <Star aria-hidden="true" />
              Recommended
            </Badge>
          )}
        </div>
        <MoneyDisplay amountMinor={pkg.amountMinor} currency={currency} size="lg" />
        {pkg.description && (
          <p className="text-body-sm text-foreground-secondary">{pkg.description}</p>
        )}
      </div>
      <DeliverableList deliverables={deliverables} compact />
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <TurnaroundSummary turnaround={pkg.turnaround} />
        <RevisionSummary policy={pkg.revisions} currency={currency} />
      </div>
    </article>
  );
}
