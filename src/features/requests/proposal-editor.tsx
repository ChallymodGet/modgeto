"use client";

/**
 * Proposal Editor (docs/06 §60–61, D-008, D-011, D-017, D-029). One editor
 * for Request Changes and quotes: scope, price, discount, charges, delivery,
 * commitment and a note. Totals and the comparison with the current terms
 * update as the Creative types, using the domain pricing engine.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { PriceBreakdown as PriceLines } from "@/components/service/price";
import { ProposalComparison } from "@/components/request/proposals";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  type ChargeConfig,
  type Currency,
  type Discount,
  calculateProposalTotals,
  money,
  parseMoney,
  percentToBps,
  toDecimalString,
} from "@/lib/domain";
import { formatModifier } from "@/lib/format";
import { proposalSchema } from "@/lib/schemas";
import type { RequestDetail, TurnaroundUnit } from "@/types";
import { keepFocusIn } from "@/features/services/builder-fields";
import type { ProposalDraft } from "./request-actions";
import { currentTerms } from "./request-actions";

const UNITS: { value: TurnaroundUnit; label: string }[] = [
  { value: "BUSINESS_DAYS", label: "Business days" },
  { value: "CALENDAR_DAYS", label: "Calendar days" },
  { value: "WEEKS", label: "Weeks" },
];

const editorSchema = (currency: Currency) =>
  z.intersection(
    proposalSchema(currency),
    z.object({
      deliverables: z
        .array(z.object({ name: z.string().trim().min(1, { error: "Name the deliverable." }) }))
        .min(1, { error: "List at least one deliverable." }),
      discountKind: z.enum(["NONE", "FIXED", "PERCENT"]),
      chargeIds: z.array(z.string()),
    }),
  );

/** "25000000n NGN" → "250000" for an editable field. */
const asInput = (minor: bigint | null | undefined, currency: Currency) =>
  minor === null || minor === undefined
    ? ""
    : toDecimalString(money(minor, currency)).replace(/\.00$/, "");

export function ProposalEditor({
  detail,
  kind,
  charges: availableCharges,
  onSubmit,
  onClose,
}: {
  detail: RequestDetail;
  kind: "CHANGES" | "QUOTE";
  /** Charges the Service applies (e.g. VAT), offered in the proposal (D-011). */
  charges: ChargeConfig[];
  onSubmit: (draft: ProposalDraft) => boolean;
  onClose: () => void;
}) {
  const currency = detail.request.snapshot.service.currency;
  const current = currentTerms(detail);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(editorSchema(currency)),
    defaultValues: {
      kind,
      price: asInput(current.totalMinor, currency),
      discount: null,
      discountKind: "NONE" as const,
      chargeIds: availableCharges.map((c) => c.id),
      commitmentPercent:
        current.commitmentBps === null ? null : String(current.commitmentBps / 100),
      turnaround: { value: current.turnaround.value, unit: current.turnaround.unit },
      note: "",
      validUntil: null,
      deliverables: current.scope.deliverables.map((d) => ({ name: d.name })),
    } as unknown as z.input<ReturnType<typeof editorSchema>>,
  });
  const deliverables = useFieldArray({ control: form.control, name: "deliverables" });
  const watched = useWatch({ control: form.control });

  // Live totals from the raw inputs, through the same engine the server uses.
  const subtotal = parseMoney(String(watched.price ?? ""), currency);
  const discountKind = watched.discountKind ?? "NONE";
  const rawDiscount = watched.discount as
    { label?: string; amount?: string; percent?: string } | null | undefined;
  const discount: Discount | null =
    discountKind === "FIXED"
      ? (() => {
          const m = parseMoney(rawDiscount?.amount ?? "", currency);
          return m
            ? {
                label: rawDiscount?.label || "Discount",
                modifier: { kind: "FIXED", amountMinor: m.amountMinor },
              }
            : null;
        })()
      : discountKind === "PERCENT"
        ? (() => {
            const bps = percentToBps(rawDiscount?.percent ?? "");
            return bps !== null
              ? { label: rawDiscount?.label || "Discount", modifier: { kind: "PERCENT", bps } }
              : null;
          })()
        : null;
  const charges = availableCharges.filter((c) => (watched.chargeIds ?? []).includes(c.id));
  const commitmentBps =
    watched.commitmentPercent === null || watched.commitmentPercent === undefined
      ? null
      : percentToBps(String(watched.commitmentPercent));
  const totals = subtotal
    ? calculateProposalTotals({
        currency,
        subtotalMinor: subtotal.amountMinor,
        discount,
        charges,
        commitmentBps,
      })
    : null;
  const turnaroundValue = Number(watched.turnaround?.value) || 0;

  const save = form.handleSubmit((v) => {
    const values = v as unknown as {
      price: bigint;
      discount:
        | null
        | { kind: "FIXED"; label: string; amount: bigint }
        | { kind: "PERCENT"; label: string; percent: number };
      commitmentPercent: number | null;
      turnaround: { value: number; unit: TurnaroundUnit };
      note: string | null;
      validUntil: string | null;
      deliverables: { name: string }[];
    };
    const d = values.discount;
    const ok = onSubmit({
      kind,
      scope: {
        ...current.scope,
        deliverables: values.deliverables.map((x) => ({
          name: x.name,
          description:
            current.scope.deliverables.find((o) => o.name === x.name)?.description ?? null,
        })),
      },
      subtotalMinor: values.price,
      discount: !d
        ? null
        : d.kind === "FIXED"
          ? { label: d.label, modifier: { kind: "FIXED", amountMinor: d.amount } }
          : { label: d.label, modifier: { kind: "PERCENT", bps: d.percent } },
      charges,
      commitmentBps: values.commitmentPercent,
      turnaround: values.turnaround,
      note: values.note,
      validUntil: kind === "QUOTE" ? values.validUntil : null,
    });
    if (!ok) setSubmitError("Check the price and try again.");
  });

  const title = kind === "QUOTE" ? "Send Quote" : "Request Changes";

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {kind === "QUOTE"
              ? "Set the final price and scope. Nothing is agreed until the Client accepts."
              : "Propose changes to scope, price, timeline or commitment. The Client must accept them."}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <form id="proposal-form" noValidate className="flex flex-col gap-6" onSubmit={save}>
            <FormFieldset
              legend="Deliverables"
              error={
                form.formState.errors.deliverables?.root?.message ??
                form.formState.errors.deliverables?.message
              }
            >
              <ol className="flex flex-col gap-2">
                {deliverables.fields.map((f, i) => (
                  <li key={f.id} className="flex items-end gap-1">
                    <Controller
                      control={form.control}
                      name={`deliverables.${i}.name`}
                      render={({ field, fieldState }) => (
                        <FormField
                          label={`Deliverable ${i + 1}`}
                          error={fieldState.error?.message}
                          className="min-w-0 flex-1"
                        >
                          <Input {...field} maxLength={80} />
                        </FormField>
                      )}
                    />
                    <IconButton
                      size="sm"
                      label={`Move deliverable ${i + 1} up`}
                      icon={<ArrowUp />}
                      disabled={i === 0}
                      data-move="up"
                      onClick={(ev) => {
                        deliverables.move(i, i - 1);
                        keepFocusIn(ev.currentTarget.closest("li"));
                      }}
                      className="mb-1"
                    />
                    <IconButton
                      size="sm"
                      label={`Move deliverable ${i + 1} down`}
                      icon={<ArrowDown />}
                      disabled={i === deliverables.fields.length - 1}
                      data-move="down"
                      onClick={(ev) => {
                        deliverables.move(i, i + 1);
                        keepFocusIn(ev.currentTarget.closest("li"));
                      }}
                      className="mb-1"
                    />
                    <IconButton
                      size="sm"
                      label={`Remove deliverable ${i + 1}`}
                      icon={<Trash2 />}
                      onClick={() => deliverables.remove(i)}
                      className="mb-1"
                    />
                  </li>
                ))}
              </ol>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => deliverables.append({ name: "" })}
              >
                <Plus aria-hidden="true" />
                Add deliverable
              </Button>
            </FormFieldset>

            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <FormField
                  label={`Price (${currency})`}
                  required
                  description="For the whole scope above, before any discount or charges."
                  error={fieldState.error?.message}
                  className="sm:max-w-sm"
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

            <FormFieldset legend="Discount" optional>
              <Controller
                control={form.control}
                name="discountKind"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue(
                        "discount",
                        (v === "NONE"
                          ? null
                          : v === "FIXED"
                            ? { kind: "FIXED", label: "Discount", amount: "" }
                            : { kind: "PERCENT", label: "Discount", percent: "" }) as never,
                      );
                    }}
                    className="sm:grid-cols-3"
                  >
                    <RadioItem value="NONE" label="No discount" />
                    <RadioItem value="FIXED" label="Fixed amount" />
                    <RadioItem value="PERCENT" label="Percentage" />
                  </RadioGroup>
                )}
              />
              {discountKind !== "NONE" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name={"discount.label" as never}
                    render={({ field, fieldState }) => (
                      <FormField
                        label="Discount label"
                        description="Shown to the Client, e.g. Returning client."
                        error={fieldState.error?.message}
                      >
                        <Input
                          {...(field as object)}
                          value={String((field as { value?: unknown }).value ?? "")}
                          maxLength={60}
                        />
                      </FormField>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={
                      (discountKind === "FIXED" ? "discount.amount" : "discount.percent") as never
                    }
                    render={({ field, fieldState }) => (
                      <FormField
                        label={
                          discountKind === "FIXED"
                            ? `Discount amount (${currency})`
                            : "Discount percentage"
                        }
                        error={fieldState.error?.message}
                      >
                        <Input
                          {...(field as object)}
                          value={String((field as { value?: unknown }).value ?? "")}
                          inputMode="decimal"
                        />
                      </FormField>
                    )}
                  />
                </div>
              )}
            </FormFieldset>

            {availableCharges.length > 0 && (
              <Controller
                control={form.control}
                name="chargeIds"
                render={({ field }) => (
                  <FormFieldset legend="Charges" description="Applied after any discount.">
                    {availableCharges.map((c) => (
                      <FormField
                        key={c.id}
                        label={`${c.label} (${formatModifier(c.modifier, currency)})`}
                        orientation="horizontal"
                      >
                        <Checkbox
                          checked={field.value.includes(c.id)}
                          onCheckedChange={(on) =>
                            field.onChange(
                              on
                                ? [...field.value, c.id]
                                : field.value.filter((x: string) => x !== c.id),
                            )
                          }
                        />
                      </FormField>
                    ))}
                  </FormFieldset>
                )}
              />
            )}

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:max-w-md">
              <Controller
                control={form.control}
                name="turnaround.value"
                render={({ field, fieldState }) => (
                  <FormField label="Delivery" error={fieldState.error?.message}>
                    <Input {...field} value={String(field.value ?? "")} inputMode="numeric" />
                  </FormField>
                )}
              />
              <Controller
                control={form.control}
                name="turnaround.unit"
                render={({ field }) => (
                  <FormField label="Unit">
                    <Select
                      items={UNITS}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
            </div>

            <FormFieldset legend="Commitment before the Project starts">
              <Controller
                control={form.control}
                name="commitmentPercent"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-3">
                    <RadioGroup
                      value={field.value === null ? "NONE" : "PERCENT"}
                      onValueChange={(v) => field.onChange(v === "NONE" ? null : "50")}
                      className="sm:grid-cols-2"
                    >
                      <RadioItem value="PERCENT" label="Ask for a commitment" />
                      <RadioItem value="NONE" label="No commitment" />
                    </RadioGroup>
                    {field.value !== null && (
                      <FormField
                        label="Commitment percentage"
                        error={fieldState.error?.message}
                        className="max-w-48"
                      >
                        <div className="relative">
                          <Input
                            {...field}
                            value={String(field.value ?? "")}
                            inputMode="decimal"
                            className="pr-9"
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-body-sm text-foreground-secondary"
                          >
                            %
                          </span>
                        </div>
                      </FormField>
                    )}
                  </div>
                )}
              />
            </FormFieldset>

            <Controller
              control={form.control}
              name="note"
              render={({ field, fieldState }) => (
                <FormField
                  label="Note for the Client"
                  required={kind === "CHANGES"}
                  optional={kind === "QUOTE"}
                  description={
                    kind === "CHANGES"
                      ? "Explain what changed and why."
                      : "Anything the Client should know about this quote."
                  }
                  error={fieldState.error?.message}
                >
                  <Textarea {...field} value={field.value ?? ""} rows={4} maxLength={2000} />
                </FormField>
              )}
            />

            {kind === "QUOTE" && (
              <Controller
                control={form.control}
                name="validUntil"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Valid until"
                    optional
                    description="After this date the Client can't accept the quote until you renew it."
                    error={fieldState.error?.message}
                    className="sm:max-w-xs"
                  >
                    <Input
                      type="date"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormField>
                )}
              />
            )}

            {/* Live result (QTE-002) */}
            <section
              aria-labelledby="proposal-result"
              className="flex flex-col gap-4 rounded-xl border border-border p-4"
            >
              <h3 id="proposal-result" className="text-label text-foreground">
                What the Client will see
              </h3>
              {totals?.ok ? (
                <>
                  <PriceLines
                    breakdown={{
                      currency,
                      priceState: "CALCULATED",
                      lines: totals.value.lines,
                      subtotal: totals.value.subtotal,
                      discount: totals.value.discount,
                      charges: totals.value.charges,
                      total: totals.value.total,
                      commitment: totals.value.commitment,
                    }}
                  />
                  {current.totalMinor !== null && (
                    <ProposalComparison
                      currency={currency}
                      previous={{
                        totalMinor: current.totalMinor,
                        turnaround: current.turnaround,
                        commitmentBps: current.commitmentBps,
                        commitmentAmountMinor: current.commitmentAmountMinor,
                        deliverables: current.scope.deliverables.map((d) => d.name),
                      }}
                      proposed={{
                        totalMinor: totals.value.total.amountMinor,
                        turnaround: {
                          value: turnaroundValue,
                          unit: (watched.turnaround?.unit ??
                            current.turnaround.unit) as TurnaroundUnit,
                        },
                        commitmentBps,
                        commitmentAmountMinor: totals.value.commitment?.amountMinor ?? null,
                        deliverables: (watched.deliverables ?? [])
                          .map((d) => d?.name ?? "")
                          .filter(Boolean),
                      }}
                    />
                  )}
                </>
              ) : (
                <p className="text-body-sm text-foreground-secondary">
                  {totals && !totals.ok ? totals.error.message : "Enter a price to see the total."}
                </p>
              )}
            </section>
            {submitError && (
              <p role="alert" className="text-body-sm font-medium text-danger">
                {submitError}
              </p>
            )}
          </form>
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="proposal-form">
            {kind === "QUOTE" ? "Send Quote" : "Send Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
