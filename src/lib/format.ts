/**
 * Display formatting shared by product components. Pure functions, no React.
 * Money formatting itself lives in `lib/domain/money` (`formatMoney`).
 */
import {
  type Currency,
  type Modifier,
  type RevisionPolicy,
  formatMoney,
  money,
} from "@/lib/domain";
import type { Turnaround, TurnaroundUnit } from "@/types";

const UNIT_WORDS: Record<TurnaroundUnit, [string, string]> = {
  BUSINESS_DAYS: ["business day", "business days"],
  CALENDAR_DAYS: ["day", "days"],
  WEEKS: ["week", "weeks"],
};

/** "3 weeks", "1 business day". */
export function formatTurnaround(t: Turnaround): string {
  const [one, many] = UNIT_WORDS[t.unit];
  return `${t.value} ${t.value === 1 ? one : many}`;
}

/** "2 revision rounds", "Unlimited revisions", "No revisions included". */
export function formatRevisions(policy: RevisionPolicy): string {
  switch (policy.kind) {
    case "NONE":
      return "No revisions included";
    case "UNLIMITED":
      return "Unlimited revisions";
    case "FIXED":
      return `${policy.count} revision ${policy.count === 1 ? "round" : "rounds"}`;
  }
}

/** Basis points to a percentage label: 1250 → "12.5%". */
export function formatPercent(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = bps % 100;
  if (fraction === 0) return `${whole}%`;
  return `${whole}.${String(fraction).padStart(2, "0").replace(/0$/, "")}%`;
}

/**
 * A price effect shown before selection (CLAUDE.md §13, docs/08 §10):
 * "+₦80,000", "+25%", or "Included" when it adds nothing.
 */
export function formatModifier(modifier: Modifier | null, currency: Currency): string {
  if (!modifier) return "Included";
  if (modifier.kind === "PERCENT")
    return modifier.bps === 0 ? "Included" : `+${formatPercent(modifier.bps)}`;
  if (modifier.amountMinor === 0n) return "Included";
  return formatMoney(money(modifier.amountMinor, currency), { signed: true });
}

/** A signed amount in minor units: "+₦80,000", "−₦20,000". */
export function formatSignedAmount(amountMinor: bigint, currency: Currency): string {
  return formatMoney(money(amountMinor, currency), { signed: true });
}

const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** "9 Nov 2026". Accepts an ISO timestamp or a YYYY-MM-DD date. */
export function formatDate(iso: string): string {
  return DATE.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * "2 hours ago", "yesterday", "3 days ago". Falls back to the date after a week.
 * `now` is injectable so server and client render the same text.
 */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3_600) return RELATIVE.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return RELATIVE.format(Math.round(seconds / 3_600), "hour");
  if (abs < 7 * 86_400) return RELATIVE.format(Math.round(seconds / 86_400), "day");
  return formatDate(iso);
}

/** "2.4 MB", "820 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
