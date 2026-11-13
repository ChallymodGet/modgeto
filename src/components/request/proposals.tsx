/**
 * CommercialProposals (D-008, QTE-001). Any change to scope, price, timeline
 * or commitment is a proposal the Client must accept (CLAUDE.md §4).
 */
import { CalendarClock, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { CommitmentSummary, MoneyDisplay, PriceDifference } from "@/components/service/price";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  type Currency,
  type ProposalStatus,
  type StatusLabel,
  applyAdjustments,
  formatMoney,
  money,
} from "@/lib/domain";
import { formatDate, formatPercent, formatTurnaround } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CommercialProposal, Turnaround } from "@/types";

const PROPOSAL_STATUS: Record<ProposalStatus, StatusLabel> = {
  PROPOSED: { label: "Awaiting response", intent: "info" },
  ACCEPTED: { label: "Accepted", intent: "success" },
  REJECTED: { label: "Not accepted", intent: "neutral" },
  SUPERSEDED: { label: "Replaced by a newer version", intent: "neutral" },
  EXPIRED: { label: "Expired", intent: "neutral" },
};

/** One proposal version with its price, timeline, commitment and note. */
export function ProposalCard({
  proposal,
  actions,
  headingLevel: Heading = "h3",
}: {
  proposal: CommercialProposal;
  /** Accept / Decline for the Client, Revise for the Creative. Only on the live version. */
  actions?: ReactNode;
  headingLevel?: "h3" | "h4";
}) {
  const live = proposal.status === "PROPOSED";
  const title = proposal.kind === "QUOTE" ? "Quote" : "Proposed changes";
  // Same calculation the pricing engine used, so the card can't drift from it (D-029).
  const adjusted = applyAdjustments(
    money(proposal.subtotalMinor, proposal.currency),
    proposal.discount,
    proposal.charges,
  );
  const adjustments = adjusted.ok ? adjusted.value.lines : [];
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-surface p-4 md:p-5",
        live ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Heading className="text-h4 text-foreground">
            {title}{" "}
            <span className="font-normal text-foreground-muted">· Version {proposal.version}</span>
          </Heading>
          <p className="text-caption text-foreground-muted">
            Sent {formatDate(proposal.createdAt)}
          </p>
        </div>
        <StatusBadge status={PROPOSAL_STATUS[proposal.status]} />
      </header>

      {proposal.note && (
        <blockquote className="rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground">
          {proposal.note}
        </blockquote>
      )}

      <dl className="flex flex-col gap-2 text-body-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-foreground-secondary">Subtotal</dt>
          <dd className="tabular-nums">
            {formatMoney(money(proposal.subtotalMinor, proposal.currency))}
          </dd>
        </div>
        {adjustments.map((line, i) => (
          <div
            key={`${line.kind}-${line.refId ?? i}`}
            className="flex items-baseline justify-between gap-4"
          >
            <dt className="text-foreground-secondary">
              {line.label}
              {line.kind === "DISCOUNT" && <span className="sr-only"> (discount)</span>}
            </dt>
            <dd className="tabular-nums">{formatMoney(line.amount, { signed: true })}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
          <dt className="text-label text-foreground">Total</dt>
          <dd>
            <MoneyDisplay
              amountMinor={proposal.totalMinor}
              currency={proposal.currency}
              size="lg"
            />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-foreground-secondary">Timeline</dt>
          <dd>{formatTurnaround(proposal.turnaround)}</dd>
        </div>
      </dl>

      <CommitmentSummary
        bps={proposal.commitmentBps}
        amountMinor={proposal.commitmentAmountMinor}
        currency={proposal.currency}
      />

      {proposal.validUntil && live && (
        <p className="flex items-center gap-2 text-body-sm text-foreground-secondary">
          <CalendarClock aria-hidden="true" className="size-4 text-foreground-muted" />
          Valid until {formatDate(proposal.validUntil)}
        </p>
      )}
      {live && actions && (
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          {actions}
        </div>
      )}
    </article>
  );
}

export type ComparableTerms = {
  totalMinor: bigint;
  turnaround: Turnaround;
  commitmentBps: number | null;
  commitmentAmountMinor: bigint | null;
  deliverables: string[];
};

/**
 * What changes between the current terms and a proposal (docs/07 §27). Every
 * change is described in words with + and − markers, not colour alone.
 */
export function ProposalComparison({
  previous,
  proposed,
  currency,
  previousLabel = "Current",
  proposedLabel = "Proposed",
}: {
  previous: ComparableTerms;
  proposed: ComparableTerms;
  currency: Currency;
  previousLabel?: string;
  proposedLabel?: string;
}) {
  const added = proposed.deliverables.filter((d) => !previous.deliverables.includes(d));
  const removed = previous.deliverables.filter((d) => !proposed.deliverables.includes(d));
  const timelineChanged =
    previous.turnaround.value !== proposed.turnaround.value ||
    previous.turnaround.unit !== proposed.turnaround.unit;
  const commitment = (t: ComparableTerms) =>
    t.commitmentBps === null || t.commitmentAmountMinor === null
      ? "None"
      : `${formatPercent(t.commitmentBps)} · ${formatMoney(money(t.commitmentAmountMinor, currency))}`;
  const commitmentChanged = commitment(previous) !== commitment(proposed);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Price" className="flex flex-col gap-2">
        <h4 className="text-label text-foreground">Price</h4>
        <PriceDifference
          previousMinor={previous.totalMinor}
          proposedMinor={proposed.totalMinor}
          currency={currency}
          previousLabel={previousLabel}
          proposedLabel={proposedLabel}
        />
      </section>
      <section
        aria-label="Timeline and commitment"
        className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2"
      >
        {(
          [
            [
              "Timeline",
              formatTurnaround(previous.turnaround),
              formatTurnaround(proposed.turnaround),
              timelineChanged,
            ],
            ["Commitment", commitment(previous), commitment(proposed), commitmentChanged],
          ] as const
        ).map(([label, before, after, changed]) => (
          <div key={label} className="flex flex-col gap-1">
            <h4 className="text-label text-foreground">{label}</h4>
            {changed ? (
              <p className="text-body-sm text-foreground">
                <span className="text-foreground-muted line-through">{before}</span>
                <span className="sr-only"> changes to </span>
                <span aria-hidden="true"> → </span>
                <span className="font-semibold">{after}</span>
              </p>
            ) : (
              <p className="text-body-sm text-foreground-secondary">{after} (no change)</p>
            )}
          </div>
        ))}
      </section>
      {(added.length > 0 || removed.length > 0) && (
        <section
          aria-label="Scope changes"
          className="flex flex-col gap-2 border-t border-border pt-4"
        >
          <h4 className="text-label text-foreground">Scope</h4>
          <ul className="flex flex-col gap-1.5 text-body-sm">
            {added.map((d) => (
              <li key={`+${d}`} className="flex items-start gap-2">
                <Plus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  <span className="font-medium">Added:</span> {d}
                </span>
              </li>
            ))}
            {removed.map((d) => (
              <li key={`-${d}`} className="flex items-start gap-2">
                <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
                <span>
                  <span className="font-medium">Removed:</span> {d}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
