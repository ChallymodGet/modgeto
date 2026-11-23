/** Pieces both sides of a Request share: payment figures and the history timeline. */
import { formatMoney, money } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import type { RequestDetail } from "@/types";
import type { HistoryEntry } from "./model";

/** Project total, commitment, confirmed and still due, all from records (PAY-005). */
export function PaymentFacts({ detail }: { detail: RequestDetail }) {
  const r = detail.request;
  const currency = r.snapshot.service.currency;
  const fmt = (minor: bigint) => formatMoney(money(minor, currency));
  const due =
    r.requiredCommitmentMinor && r.requiredCommitmentMinor > r.confirmedMinor
      ? r.requiredCommitmentMinor - r.confirmedMinor
      : 0n;
  const facts: [string, string][] = [
    ["Project total", detail.agreement ? fmt(detail.agreement.agreedPriceMinor) : "Not agreed yet"],
    ["Commitment", r.requiredCommitmentMinor ? fmt(r.requiredCommitmentMinor) : "None"],
    ["Confirmed", fmt(r.confirmedMinor)],
    ["Still due", fmt(due)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {facts.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <dt className="text-caption text-foreground-muted">{k}</dt>
          <dd className="text-body-sm font-medium text-foreground tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="flex flex-col gap-3 border-l border-border pl-4">
      {entries.map((h, i) => (
        <li key={`${h.at}-${i}`} className="relative flex flex-col gap-0.5">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border-strong"
          />
          <span className="text-body-sm text-foreground">{h.text}</span>
          <time dateTime={h.at} className="text-caption text-foreground-secondary">
            {formatDateTime(h.at)}
          </time>
        </li>
      ))}
    </ol>
  );
}
