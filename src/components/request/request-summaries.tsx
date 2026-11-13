/** Request list and summary presentation (docs/07 §27). */
import { ChevronRight } from "lucide-react";
import NextLink from "next/link";
import { MoneyDisplay } from "@/components/service/price";
import { DeliverableList, RevisionSummary, TurnaroundSummary } from "@/components/service/scope";
import { StatusBadge } from "@/components/ui/status-badge";
import { type Currency, type PriceBreakdown, type PriceLine, formatMoney } from "@/lib/domain";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Request, ScopeSnapshot } from "@/types";
import { type RequestActor, nextStep, requestLabel } from "./request-status";

/** Total in the right language: exact, "Estimated", or "Quote required" (PRC-006). */
export function RequestPrice({
  price,
  agreedMinor,
  className,
}: {
  price: PriceBreakdown;
  /** The agreed price, once there is one. It replaces the submitted estimate. */
  agreedMinor?: bigint | null;
  className?: string;
}) {
  if (agreedMinor !== undefined && agreedMinor !== null) {
    return (
      <span className={cn("flex flex-col items-end gap-0.5", className)}>
        <MoneyDisplay amountMinor={agreedMinor} currency={price.currency} />
        <span className="text-caption text-foreground-muted">Agreed</span>
      </span>
    );
  }
  if (!price.total) {
    return (
      <span className={cn("text-body-sm font-medium text-foreground-secondary", className)}>
        Quote required
      </span>
    );
  }
  return (
    <span className={cn("flex flex-col items-end gap-0.5", className)}>
      <MoneyDisplay amountMinor={price.total.amountMinor} currency={price.currency} />
      {price.priceState === "ESTIMATED" && (
        <span className="text-caption text-foreground-muted">Estimated</span>
      )}
    </span>
  );
}

type RequestCardProps = {
  request: Request;
  actor: RequestActor;
  /** The other person: the Client for a Creative, the Creative for a Client. */
  counterpart: string;
  href: string;
  agreedMinor?: bigint | null;
  /** Fixed "now" so server and client render the same relative time. */
  now?: Date;
  headingLevel?: "h2" | "h3";
};

/**
 * One Request in a list. A single link target named by its title; the next
 * step is visible so the list doubles as a to-do list.
 */
export function RequestCard({
  request,
  actor,
  counterpart,
  href,
  agreedMinor,
  now,
  headingLevel: Heading = "h3",
}: RequestCardProps) {
  const view = {
    status: request.status,
    awaitingClientReason: request.awaitingClientReason,
  };
  return (
    <article className="group/card relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-caption text-foreground-muted">
            {request.reference} · {request.snapshot.service.name}
          </p>
          <Heading className="text-h4 text-foreground">
            <NextLink
              href={href}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {request.title}
            </NextLink>
          </Heading>
          <p className="text-body-sm text-foreground-secondary">
            {actor === "CREATIVE" ? "From" : "With"} {counterpart}
          </p>
        </div>
        <RequestPrice
          price={request.snapshot.price}
          agreedMinor={agreedMinor}
          className="shrink-0 text-right"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3">
        <div className="flex min-w-0 flex-col gap-1">
          <StatusBadge status={requestLabel(view, actor)} />
          <p className="text-body-sm text-foreground-secondary">
            {nextStep(view, actor, counterpart)}
          </p>
        </div>
        <span className="flex items-center gap-1 text-caption text-foreground-muted">
          Updated {formatRelative(request.updatedAt, now)}
          <ChevronRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover/card:translate-x-0.5"
          />
        </span>
      </div>
    </article>
  );
}

/** Key facts for a Request detail header (docs/04 §10, §22). */
export function RequestSummary({
  request,
  actor,
  counterpart,
}: {
  request: Request;
  actor: RequestActor;
  counterpart: string;
}) {
  const rows: [string, string][] = [
    ["Service", request.snapshot.service.name],
    [actor === "CREATIVE" ? "Client" : "Creative", counterpart],
    ["Reference", request.reference],
    ["Submitted", formatDate(request.submittedAt)],
  ];
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <dt className="text-caption text-foreground-muted">{k}</dt>
          <dd className="text-body-sm font-medium text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const SCOPE_LINE_KINDS: PriceLine["kind"][] = ["QUANTITY", "ADDON", "OPTION", "DELIVERY"];

/**
 * The scope as submitted or agreed: package, chosen extras, deliverables,
 * timeline and revisions. Read from a snapshot, never the live Service (SRV-008).
 */
export function ScopeSummary({
  scope,
  currency,
  lines = [],
}: {
  scope: ScopeSnapshot;
  currency: Currency;
  /** Price lines from the same snapshot, to list chosen extras. */
  lines?: PriceLine[];
}) {
  const extras = lines.filter((l) => SCOPE_LINE_KINDS.includes(l.kind));
  return (
    <div className="flex flex-col gap-5">
      {scope.packageName && (
        <div className="flex flex-col gap-0.5">
          <p className="text-caption text-foreground-muted">Package</p>
          <p className="text-body font-semibold text-foreground">{scope.packageName}</p>
        </div>
      )}
      {extras.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-foreground-muted">Chosen options</p>
          <ul className="flex flex-col gap-1.5">
            {extras.map((l, i) => (
              <li
                key={`${l.kind}-${l.refId ?? i}`}
                className="flex items-baseline justify-between gap-4 text-body-sm"
              >
                <span className="text-foreground">
                  {l.label}
                  {l.quantity && l.quantity > 1 ? ` × ${l.quantity}` : ""}
                </span>
                <span className="text-foreground-secondary tabular-nums">
                  {l.amount.amountMinor === 0n
                    ? "Included"
                    : formatMoney(l.amount, { signed: true })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {scope.deliverables.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-foreground-muted">Deliverables</p>
          <DeliverableList deliverables={scope.deliverables} />
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <TurnaroundSummary turnaround={scope.turnaround} label="Timeline" />
        <RevisionSummary policy={scope.revisions} currency={currency} />
      </div>
    </div>
  );
}
