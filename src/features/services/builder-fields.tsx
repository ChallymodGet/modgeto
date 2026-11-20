"use client";

/**
 * Small editors shared by the Service Builder sections: money, percentage,
 * price modifiers, turnaround, and reorderable lists with Move up / Move down
 * instead of drag-and-drop (docs/04 §38).
 */
import { ArrowDown, ArrowUp, CircleAlert, Trash2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Panel } from "@/components/layout/page";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type BasisPoints,
  type Currency,
  type Modifier,
  type PublishBlocker,
  MINOR_DIGITS,
  money,
  parseMoney,
  percentToBps,
  toDecimalString,
} from "@/lib/domain";
import type { Turnaround, TurnaroundUnit } from "@/types";

const SYMBOL: Record<Currency, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

/** 25000000n NGN → "250,000"; keeps kobo/cents only when present. */
export function toAmountInput(minor: bigint | null | undefined, currency: Currency): string {
  if (minor === null || minor === undefined) return "";
  const [whole, fraction] = toDecimalString(money(minor, currency)).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return /^0+$/.test(fraction ?? "") ? grouped : `${grouped}.${fraction}`;
}

function bpsToInput(bps: BasisPoints | null | undefined): string {
  if (bps === null || bps === undefined) return "";
  const whole = Math.trunc(bps / 100);
  const rest = bps % 100;
  return rest === 0 ? String(whole) : `${whole}.${String(rest).padStart(2, "0").replace(/0$/, "")}`;
}

/**
 * Money input. Keeps the typed text while it's being edited and reports a
 * bigint only when the text parses, so there's no float anywhere (CLAUDE.md §4).
 */
export function MoneyField({
  label,
  description,
  value,
  currency,
  onChange,
  error,
  optional,
  hideLabel,
  className,
}: {
  label: string;
  description?: ReactNode;
  value: bigint | null | undefined;
  currency: Currency;
  onChange: (minor: bigint | null) => void;
  error?: string | null;
  optional?: boolean;
  hideLabel?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(() => toAmountInput(value, currency));
  const [invalid, setInvalid] = useState(false);

  // Follow outside changes (e.g. Discard changes) without fighting the typist:
  // adjust during render when the stored value differs from what the text means.
  const [seen, setSeen] = useState(value ?? null);
  if ((value ?? null) !== seen) {
    setSeen(value ?? null);
    if ((parseMoney(text, currency)?.amountMinor ?? null) !== (value ?? null)) {
      setText(toAmountInput(value, currency));
      setInvalid(false);
    }
  }

  return (
    <FormField
      label={label}
      description={description}
      optional={optional}
      hideLabel={hideLabel}
      className={className}
      error={
        invalid
          ? `Enter an amount, like 150,000${MINOR_DIGITS[currency] ? " or 150,000.50" : ""}.`
          : error
      }
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-body text-foreground-muted"
        >
          {SYMBOL[currency]}
        </span>
        <Input
          inputMode="decimal"
          autoComplete="off"
          value={text}
          className="pl-8 tabular-nums"
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (!next.trim()) {
              setInvalid(false);
              onChange(null);
              return;
            }
            const parsed = parseMoney(next, currency);
            setInvalid(parsed === null);
            if (parsed) onChange(parsed.amountMinor);
          }}
          onBlur={() => {
            const parsed = parseMoney(text, currency);
            if (parsed) setText(toAmountInput(parsed.amountMinor, currency));
          }}
        />
      </div>
    </FormField>
  );
}

/** Percentage input in basis points (12.5% → 1250). */
export function PercentField({
  label,
  description,
  value,
  onChange,
  error,
  className,
}: {
  label: string;
  description?: ReactNode;
  value: BasisPoints | null | undefined;
  onChange: (bps: BasisPoints | null) => void;
  error?: string | null;
  className?: string;
}) {
  const [text, setText] = useState(() => bpsToInput(value));
  const [invalid, setInvalid] = useState(false);
  return (
    <FormField
      label={label}
      description={description}
      className={className}
      error={invalid ? "Enter a percentage from 0 to 100, like 50 or 12.5." : error}
    >
      <div className="relative">
        <Input
          inputMode="decimal"
          autoComplete="off"
          value={text}
          className="pr-8 tabular-nums"
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (!next.trim()) {
              setInvalid(false);
              onChange(null);
              return;
            }
            const bps = percentToBps(next);
            setInvalid(bps === null);
            if (bps !== null) onChange(bps);
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-body text-foreground-muted"
        >
          %
        </span>
      </div>
    </FormField>
  );
}

/** A price change that is either a fixed amount or a percentage (D-010). */
export function ModifierField({
  label,
  value,
  currency,
  onChange,
  error,
}: {
  label: string;
  value: Modifier | null;
  currency: Currency;
  onChange: (modifier: Modifier | null) => void;
  error?: string | null;
}) {
  const kind = value?.kind ?? "FIXED";
  const kinds = [
    { value: "FIXED", label: "Fixed amount" },
    { value: "PERCENT", label: "Percentage of the price" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <FormField label={`${label} type`}>
        <Select
          items={kinds}
          value={kind}
          onValueChange={(v) =>
            onChange(
              v === "PERCENT" ? { kind: "PERCENT", bps: 0 } : { kind: "FIXED", amountMinor: 0n },
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {kind === "PERCENT" ? (
        <PercentField
          key="percent"
          label={label}
          value={value?.kind === "PERCENT" ? value.bps : null}
          onChange={(bps) => onChange(bps === null ? null : { kind: "PERCENT", bps })}
          error={error}
        />
      ) : (
        <MoneyField
          key="fixed"
          label={label}
          currency={currency}
          value={value?.kind === "FIXED" ? value.amountMinor : null}
          onChange={(minor) =>
            onChange(minor === null ? null : { kind: "FIXED", amountMinor: minor })
          }
          error={error}
        />
      )}
    </div>
  );
}

export const TURNAROUND_UNITS: { value: TurnaroundUnit; label: string }[] = [
  { value: "BUSINESS_DAYS", label: "Business days" },
  { value: "CALENDAR_DAYS", label: "Calendar days" },
  { value: "WEEKS", label: "Weeks" },
];

export function TurnaroundField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: Turnaround;
  onChange: (t: Turnaround) => void;
  error?: string | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:max-w-md">
      <FormField label={label} error={error}>
        <NumberInput
          min={0}
          max={365}
          value={value.value || null}
          onValueChange={(v) => onChange({ ...value, value: v ?? 0 })}
          unitLabel={value.unit === "WEEKS" ? "weeks" : "days"}
        />
      </FormField>
      <FormField label="Unit">
        <Select
          items={TURNAROUND_UNITS}
          value={value.unit}
          onValueChange={(v) => onChange({ ...value, unit: v as TurnaroundUnit })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TURNAROUND_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
}

/** A titled block inside a Builder section. */
export const BuilderBlock = Panel;

/**
 * One item in a reorderable list: a header with its name and Move up / Move
 * down / Remove, then its fields. Focus follows a moved item (BRF-009).
 */
export function ListItem({
  title,
  index,
  count,
  onMove,
  onRemove,
  removeLabel = "Remove",
  children,
}: {
  title: string;
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  removeLabel?: string;
  children: ReactNode;
}) {
  const name = title || `Item ${index + 1}`;
  const id = useId();
  const moveAndFocus = (delta: -1 | 1, from: HTMLElement) => {
    onMove(delta);
    // The list re-renders with this item elsewhere: keep focus on the same control,
    // or its partner if that control is now disabled.
    const which = from.dataset.move;
    requestAnimationFrame(() => {
      const root = document.getElementById(id);
      const target = root?.querySelector<HTMLButtonElement>(`[data-move="${which}"]`);
      if (target && !target.disabled) target.focus();
      else root?.querySelector<HTMLButtonElement>(`[data-move]:not(:disabled)`)?.focus();
    });
  };
  return (
    <li id={id} className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-label text-foreground">{name}</span>
        <IconButton
          size="sm"
          variant="ghost"
          label={`Move ${name} up`}
          icon={<ArrowUp />}
          data-move="up"
          disabled={index === 0}
          onClick={(e) => moveAndFocus(-1, e.currentTarget)}
        />
        <IconButton
          size="sm"
          variant="ghost"
          label={`Move ${name} down`}
          icon={<ArrowDown />}
          data-move="down"
          disabled={index === count - 1}
          onClick={(e) => moveAndFocus(1, e.currentTarget)}
        />
        <IconButton
          size="sm"
          variant="ghost"
          label={`${removeLabel} ${name}`}
          icon={<Trash2 />}
          onClick={onRemove}
        />
      </div>
      {children}
    </li>
  );
}

/** "To publish, fix:" list for the current section. Not an alert: it's guidance. */
export function SectionBlockers({ blockers }: { blockers: readonly PublishBlocker[] }) {
  if (blockers.length === 0) return null;
  return (
    <div className="flex gap-3 rounded-lg border border-warning-border bg-warning-subtle p-4">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning-text" />
      <div className="flex flex-col gap-1">
        <p className="text-label text-foreground">Before you can publish</p>
        <ul className="list-disc pl-5 text-body-sm text-foreground-secondary">
          {blockers.map((b, i) => (
            <li key={`${b.code}-${b.target ?? i}`}>{b.message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** First error message for an item, by its id. */
export function errorFor(blockers: readonly PublishBlocker[], target: string): string | null {
  return blockers.find((b) => b.target === target)?.message ?? null;
}

/**
 * After a move, the pressed button may now be disabled (top or bottom of the
 * list), which drops focus to the page. Keep it on the item's other move button.
 */
export function keepFocusIn(item: Element | null) {
  requestAnimationFrame(() => {
    const active = document.activeElement as HTMLButtonElement | null;
    if (active && active !== document.body && !active.disabled) return;
    item?.querySelector<HTMLButtonElement>("button[data-move]:not(:disabled)")?.focus();
  });
}

export const newItemId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
