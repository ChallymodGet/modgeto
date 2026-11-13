"use client";

/**
 * External Project payment (docs/03 §44–46, PAY-001–008, D-028, D-030).
 * Client Project money never passes through Modgeto: every surface that shows
 * payment instructions says so (CLAUDE.md §12). A declaration is not a
 * confirmation; only the Creative confirms what arrived (PAY-005).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, CircleCheck, Copy, Landmark, ShieldCheck, Undo2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { MoneyDisplay } from "@/components/service/price";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SelectionCard, SelectionCardGroup } from "@/components/ui/selection-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { type Currency, formatMoney, money, toDecimalString } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import {
  notReceivedSchema,
  paymentConfirmationSchema,
  paymentDeclarationSchema,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type {
  PaymentAdjustment,
  PaymentConfirmation,
  PaymentDeclaration,
  PaymentMethod,
} from "@/types";

const fmt = (amountMinor: bigint, currency: Currency) => formatMoney(money(amountMinor, currency));

/** The one sentence every payment surface carries. */
export function ExternalPaymentNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-body-sm text-foreground-secondary", className)}>
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground-muted" />
      Modgeto does not collect Client Project payments. You pay the Creative directly.
    </p>
  );
}

// ------------------------------------------------------------------ PaymentInstructions

/** How to pay the Creative. Shown only to the relevant Client at the payment stage (PAY-003). */
export function PaymentInstructions({
  methods,
  amountDueMinor,
  currency,
  reference,
  creativeName,
}: {
  methods: PaymentMethod[];
  amountDueMinor: bigint;
  currency: Currency;
  /** Request reference the Client should include with the transfer. */
  reference: string;
  creativeName: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success(`${what} copied`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-label text-foreground-secondary">Amount to pay {creativeName}</p>
        <MoneyDisplay amountMinor={amountDueMinor} currency={currency} size="xl" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-caption text-foreground-secondary">Include this reference</p>
          <p className="font-mono text-body font-semibold tracking-wide text-foreground">
            {reference}
          </p>
        </div>
        <IconButton
          size="sm"
          variant="secondary"
          label={`Copy reference ${reference}`}
          icon={copied === "ref" ? <Check /> : <Copy />}
          onClick={() => copy("ref", reference, "Reference")}
        />
      </div>
      <ul className="flex flex-col gap-3">
        {methods.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-label text-foreground">
                <Landmark aria-hidden="true" className="size-4 text-foreground-muted" />
                {m.label}
              </p>
              <IconButton
                size="sm"
                label={`Copy ${m.label} details`}
                icon={copied === m.id ? <Check /> : <Copy />}
                onClick={() => copy(m.id, m.instructions, `${m.label} details`)}
              />
            </div>
            <p className="text-body-sm whitespace-pre-line text-foreground">{m.instructions}</p>
          </li>
        ))}
      </ul>
      <ExternalPaymentNote />
    </div>
  );
}

// ------------------------------------------------------------------ PaymentDeclarationForm

type DeclarationValues = {
  paymentMethodId: string;
  amount: bigint;
  paidOn: string;
  reference: string | null;
};

/**
 * The Client says they've paid (PAY-004). Wording is "Payment declared", never
 * "Payment successful": the Creative still has to confirm it arrived.
 */
export function PaymentDeclarationForm({
  methods,
  currency,
  defaultAmount,
  today,
  onSubmit,
}: {
  methods: PaymentMethod[];
  currency: Currency;
  /** Pre-filled with the amount due, as a decimal string. */
  defaultAmount?: string;
  /** YYYY-MM-DD, the latest date allowed. */
  today: string;
  onSubmit: (values: DeclarationValues) => Promise<void> | void;
}) {
  const form = useForm({
    resolver: zodResolver(paymentDeclarationSchema(currency)),
    defaultValues: {
      paymentMethodId: methods.length === 1 ? methods[0].id : "",
      amount: defaultAmount ?? "",
      paidOn: today,
      reference: "",
    },
  });
  const [busy, setBusy] = useState(false);

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        setBusy(true);
        try {
          await onSubmit(values);
        } finally {
          setBusy(false);
        }
      })}
    >
      <Controller
        control={form.control}
        name="paymentMethodId"
        render={({ field, fieldState }) => (
          <SelectionCardGroup
            legend="How did you pay?"
            value={field.value || null}
            onValueChange={field.onChange}
            error={fieldState.error?.message}
            columns={2}
          >
            {methods.map((m) => (
              <SelectionCard key={m.id} value={m.id} title={m.label} />
            ))}
          </SelectionCardGroup>
        )}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <FormField
              label={`Amount paid (${currency})`}
              error={fieldState.error?.message}
              required
            >
              <Input
                {...field}
                value={String(field.value ?? "")}
                inputMode="decimal"
                autoComplete="off"
              />
            </FormField>
          )}
        />
        <Controller
          control={form.control}
          name="paidOn"
          render={({ field, fieldState }) => (
            <FormField label="Date paid" error={fieldState.error?.message} required>
              <Input {...field} type="date" max={today} />
            </FormField>
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="reference"
        render={({ field, fieldState }) => (
          <FormField
            label="Transfer reference"
            description="From your bank or payment app. It helps the Creative find your payment."
            error={fieldState.error?.message}
            optional
          >
            <Input {...field} value={field.value ?? ""} autoComplete="off" />
          </FormField>
        )}
      />
      <ExternalPaymentNote />
      <Button type="submit" loading={busy} className="self-start">
        Declare payment
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------ PaymentConfirmationForm

/**
 * The Creative confirms the amount that actually arrived (PAY-005), or marks a
 * declaration as not received with a note for the Client (D-028).
 */
export function PaymentConfirmationForm({
  declaration,
  onConfirm,
  onNotReceived,
}: {
  declaration: PaymentDeclaration;
  onConfirm: (amountReceived: bigint) => Promise<void> | void;
  onNotReceived: (note: string) => Promise<void> | void;
}) {
  const { currency } = declaration;
  const [mode, setMode] = useState<"confirm" | "not-received">("confirm");
  const [busy, setBusy] = useState(false);
  const confirmForm = useForm({
    resolver: zodResolver(paymentConfirmationSchema(currency)),
    // Pre-filled with the declared amount (exact decimal, no floats); edit it if less arrived.
    defaultValues: {
      amountReceived: toDecimalString(money(declaration.declaredAmountMinor, currency)).replace(
        /\.00$/,
        "",
      ),
    },
  });
  const noteForm = useForm({
    resolver: zodResolver(notReceivedSchema),
    defaultValues: { note: "" },
  });

  const run = async (fn: () => Promise<void> | void) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-3 rounded-md bg-surface-subtle p-4 text-body-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-foreground-secondary">Declared</dt>
          <dd className="font-semibold text-foreground tabular-nums">
            {fmt(declaration.declaredAmountMinor, currency)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-foreground-secondary">Paid on · method</dt>
          <dd className="text-foreground">
            {formatDate(declaration.paidOn)} · {declaration.paymentMethod.label}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-foreground-secondary">Reference</dt>
          <dd className="font-mono text-foreground">{declaration.reference ?? "None given"}</dd>
        </div>
      </dl>

      {mode === "confirm" ? (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={confirmForm.handleSubmit((v) => run(() => onConfirm(v.amountReceived)))}
        >
          <Controller
            control={confirmForm.control}
            name="amountReceived"
            render={({ field, fieldState }) => (
              <FormField
                label={`Amount received (${currency})`}
                description="Check your account first. Enter what actually arrived, even if it's less than declared."
                error={fieldState.error?.message}
                required
              >
                <Input
                  {...field}
                  value={String(field.value ?? "")}
                  inputMode="decimal"
                  autoComplete="off"
                />
              </FormField>
            )}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" loading={busy}>
              <CircleCheck aria-hidden="true" />
              Confirm payment
            </Button>
            <Button type="button" variant="secondary" onClick={() => setMode("not-received")}>
              Not received yet
            </Button>
          </div>
        </form>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={noteForm.handleSubmit((v) => run(() => onNotReceived(v.note)))}
        >
          <Controller
            control={noteForm.control}
            name="note"
            render={({ field, fieldState }) => (
              <FormField
                label="Note for the Client"
                description="Tell them what you checked, so they can follow up with their bank."
                error={fieldState.error?.message}
                required
              >
                <Textarea {...field} maxLength={500} rows={3} />
              </FormField>
            )}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" variant="destructive-outline" loading={busy}>
              Mark as not received
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("confirm")}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ PaymentRecord

const DECLARATION_STATUS = {
  PENDING: { label: "Payment declared", intent: "warning" },
  CONFIRMED: { label: "Payment confirmed", intent: "success" },
  NOT_RECEIVED: { label: "Not received", intent: "danger" },
} as const;

type RecordEntry =
  | { at: string; kind: "declaration"; item: PaymentDeclaration }
  | { at: string; kind: "confirmation"; item: PaymentConfirmation }
  | { at: string; kind: "adjustment"; item: PaymentAdjustment };

/** Every declaration, confirmation and correction, newest first. Nothing is ever edited (D-030). */
export function PaymentRecord({
  declarations,
  confirmations,
  adjustments,
}: {
  declarations: PaymentDeclaration[];
  confirmations: PaymentConfirmation[];
  adjustments: PaymentAdjustment[];
}) {
  const entries: RecordEntry[] = [
    ...declarations.map((item) => ({ at: item.declaredAt, kind: "declaration" as const, item })),
    ...confirmations.map((item) => ({ at: item.confirmedAt, kind: "confirmation" as const, item })),
    ...adjustments.map((item) => ({ at: item.createdAt, kind: "adjustment" as const, item })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  if (entries.length === 0) {
    return <p className="text-body-sm text-foreground-muted">No payments recorded yet.</p>;
  }

  return (
    <ol className="flex flex-col divide-y divide-border">
      {entries.map((e) => (
        <li
          key={`${e.kind}-${e.item.id}`}
          className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          {e.kind === "declaration" && (
            <>
              <div className="flex flex-col gap-1">
                <StatusBadge status={DECLARATION_STATUS[e.item.resolution]} />
                <p className="text-body-sm text-foreground-secondary">
                  {e.item.paymentMethod.label} on {formatDate(e.item.paidOn)}
                  {e.item.reference ? ` · Ref ${e.item.reference}` : ""}
                </p>
                {e.item.resolutionNote && (
                  <p className="flex items-start gap-1.5 text-body-sm text-foreground">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-danger"
                    />
                    {e.item.resolutionNote}
                  </p>
                )}
              </div>
              <p className="text-body-sm font-medium text-foreground tabular-nums">
                {fmt(e.item.declaredAmountMinor, e.item.currency)} declared
              </p>
            </>
          )}
          {e.kind === "confirmation" && (
            <>
              <div className="flex flex-col gap-1">
                <StatusBadge status={{ label: "Payment confirmed", intent: "success" }} />
                <p className="text-body-sm text-foreground-secondary">
                  Confirmed by the Creative on {formatDate(e.item.confirmedAt)}
                </p>
              </div>
              <p className="text-body-sm font-medium text-foreground tabular-nums">
                {fmt(e.item.confirmedAmountMinor, e.item.currency)} received
              </p>
            </>
          )}
          {e.kind === "adjustment" && (
            <>
              <div className="flex flex-col gap-1">
                <p className="flex items-center gap-1.5 text-label text-foreground">
                  <Undo2 aria-hidden="true" className="size-4 text-foreground-muted" />
                  Correction
                </p>
                <p className="text-body-sm text-foreground-secondary">{e.item.reason}</p>
              </div>
              <p className="text-body-sm font-medium text-foreground tabular-nums">
                {formatMoney(money(e.item.amountMinor, e.item.currency), { signed: true })}
              </p>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

// ------------------------------------------------------------------ CommitmentProgress

/**
 * Confirmed commitment against what's required (PAY-006). Text carries the
 * meaning; the bar is a supporting visual, exposed as a meter.
 */
export function CommitmentProgress({
  requiredMinor,
  confirmedMinor,
  currency,
}: {
  requiredMinor: bigint;
  confirmedMinor: bigint;
  currency: Currency;
}) {
  const required = requiredMinor > 0n ? requiredMinor : 1n;
  const percent = Number((confirmedMinor * 100n) / required);
  const clamped = Math.min(100, Math.max(0, percent));
  const remaining = requiredMinor - confirmedMinor;
  const met = remaining <= 0n;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-body-sm text-foreground">
          <span className="font-semibold tabular-nums">{fmt(confirmedMinor, currency)}</span> of{" "}
          <span className="tabular-nums">{fmt(requiredMinor, currency)}</span> commitment confirmed
        </p>
        <p
          className={cn(
            "text-body-sm",
            met ? "font-medium text-success-text" : "text-foreground-secondary",
          )}
        >
          {met ? "Commitment met" : `${fmt(remaining, currency)} to go`}
        </p>
      </div>
      <div
        role="meter"
        aria-label="Commitment confirmed"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-valuetext={`${fmt(confirmedMinor, currency)} of ${fmt(requiredMinor, currency)}`}
        className="h-2 overflow-hidden rounded-full bg-surface-subtle"
      >
        <div
          className={cn("h-full rounded-full", met ? "bg-success" : "bg-primary")}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
