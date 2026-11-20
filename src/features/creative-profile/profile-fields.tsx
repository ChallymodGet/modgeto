"use client";

/**
 * Creative profile fields shared by Onboarding, Public Profile management and
 * Settings (PROF-002–004, PUB-003–004, PAY-002), so each rule and its wording
 * lives in one place.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Availability } from "@/lib/domain";
import { paymentMethodSchema } from "@/lib/schemas";
import type { PaymentMethodType } from "@/types";

export const DISCIPLINES = [
  { id: "DESIGN", label: "Design" },
  { id: "DEVELOPMENT", label: "Development" },
  { id: "WRITING", label: "Writing" },
  { id: "MOTION_MEDIA", label: "Motion and Media" },
];

export const LINK_TYPES = [
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BEHANCE", label: "Behance" },
  { value: "DRIBBBLE", label: "Dribbble" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GITHUB", label: "GitHub" },
  { value: "OTHER", label: "Other" },
];

export const METHOD_TYPES: { value: PaymentMethodType; label: string; hint: string }[] = [
  {
    value: "BANK_TRANSFER",
    label: "Bank transfer",
    hint: "Account name, bank and account number.",
  },
  {
    value: "PAYPAL",
    label: "PayPal",
    hint: "Your PayPal email or link, and anything Clients should add to the note.",
  },
  { value: "MOBILE_MONEY", label: "Mobile money", hint: "Provider, account name and number." },
  { value: "CUSTOM", label: "Other method", hint: "Exactly how Clients should pay you." },
];

export const CURRENCIES = [
  { value: "NGN", label: "Nigerian naira (₦)" },
  { value: "USD", label: "US dollar ($)" },
  { value: "GBP", label: "British pound (£)" },
  { value: "EUR", label: "Euro (€)" },
];

/** PUB-004: Limited still accepts Requests; Unavailable pauses new ones only. */
export function AvailabilityRadio({
  value,
  onChange,
  legend = "Are you taking new Projects?",
}: {
  value: Availability;
  onChange: (v: Availability) => void;
  legend?: string;
}) {
  return (
    <FormFieldset legend={legend}>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as Availability)}>
        <RadioItem
          value="AVAILABLE"
          label="Available"
          description="Clients can send you Requests."
        />
        <RadioItem
          value="LIMITED"
          label="Limited availability"
          description="Clients can still send Requests; you can add a note."
        />
        <RadioItem
          value="UNAVAILABLE"
          label="Unavailable"
          description="Your profile stays visible, but new Requests are paused. Existing Requests carry on."
        />
      </RadioGroup>
    </FormFieldset>
  );
}

export function DisciplineCheckboxes({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <FormFieldset legend="What do you do?" description="Choose all that apply." optional>
      <div className="grid gap-3 sm:grid-cols-2">
        {DISCIPLINES.map((d) => (
          <label key={d.id} className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={value.includes(d.id)}
              onCheckedChange={(checked) =>
                onChange(checked ? [...value, d.id] : value.filter((x) => x !== d.id))
              }
            />
            <span className="text-body-sm text-foreground">{d.label}</span>
          </label>
        ))}
      </div>
    </FormFieldset>
  );
}

export function CurrencySelect({
  value,
  onChange,
  description = "Used for new Services.",
}: {
  value: string;
  onChange: (v: string) => void;
  description?: string;
}) {
  return (
    <FormField label="Default currency" description={description}>
      <Select items={CURRENCIES} value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger className="sm:max-w-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

/** A form's Save button, with "Unsaved changes" beside it while edits are pending. */
export function SaveRow({ dirty, children }: { dirty: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit">{children}</Button>
      <span role="status" className="text-body-sm text-foreground-secondary">
        {dirty ? "Unsaved changes" : ""}
      </span>
    </div>
  );
}

export type PaymentMethodInput = { type: PaymentMethodType; label: string; instructions: string };

/**
 * Add or edit an external payment method (PAY-002). Until Q7 settles the
 * fields per type, details are free text with a type-specific hint.
 */
export function PaymentMethodForm({
  initial,
  title,
  submitLabel = "Save method",
  onSave,
  onCancel,
}: {
  initial?: PaymentMethodInput;
  title: string;
  submitLabel?: string;
  onSave: (v: PaymentMethodInput) => void;
  onCancel?: () => void;
}) {
  const form = useForm({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: initial ?? { type: "BANK_TRANSFER" as const, label: "", instructions: "" },
  });
  const type = useWatch({ control: form.control, name: "type" });
  const hint = METHOD_TYPES.find((m) => m.value === type)?.hint;

  return (
    <form
      noValidate
      className="flex flex-col gap-5 rounded-lg border border-border p-4 md:p-5"
      onSubmit={form.handleSubmit((v) => {
        onSave(v);
        form.reset({ type: "BANK_TRANSFER", label: "", instructions: "" });
      })}
    >
      <p className="text-label text-foreground">{title}</p>
      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormField label="Type">
            <Select
              items={METHOD_TYPES}
              value={field.value}
              onValueChange={(v) => field.onChange(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_TYPES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />
      <Controller
        control={form.control}
        name="label"
        render={({ field, fieldState }) => (
          <FormField
            label="Name Clients see"
            description="For example: Bank transfer (Naira)."
            error={fieldState.error?.message}
            required
          >
            <Input {...field} />
          </FormField>
        )}
      />
      <Controller
        control={form.control}
        name="instructions"
        render={({ field, fieldState }) => (
          <FormField
            label="Payment details"
            description={hint}
            error={fieldState.error?.message}
            required
          >
            <Textarea {...field} rows={4} maxLength={500} />
          </FormField>
        )}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" variant="secondary">
          <Check aria-hidden="true" />
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
