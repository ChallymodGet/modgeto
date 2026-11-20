"use client";

/**
 * Creative Settings (docs/04 §16): Account and security, Creative profile,
 * Business preferences, Payment methods and Notifications. Private account
 * configuration; Client-visible content lives in Public Profile.
 * Saves are SIMULATED in this browser until Phases 8 and 9.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, CircleAlert, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Panel } from "@/components/layout/page";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { TextLink } from "@/components/ui/text-link";
import { toast } from "@/components/ui/toast";
import { type Currency, percentToBps } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { resetPasswordSchema } from "@/lib/schemas";
import { percentInput } from "@/lib/schemas/common";
import type { CreativeProfile, PaymentMethod, Service, User } from "@/types";
import { useMergedServices } from "@/features/services/simulated-services";
import { ShareLink } from "./share-link";
import { CurrencySelect, METHOD_TYPES, PaymentMethodForm, SaveRow } from "./profile-fields";
import { useMounted } from "@/lib/use-mounted";
import { useCreativeProfile } from "./simulated-profile";

const saved = (ok: boolean, message: string) =>
  ok ? toast.success(message) : toast.error("Couldn't save. Check your connection and try again.");

function Verified({ at }: { at: string | null }) {
  return at ? (
    <Badge tone="success">
      <CircleCheck aria-hidden="true" />
      Verified
    </Badge>
  ) : (
    <Badge tone="warning">
      <CircleAlert aria-hidden="true" />
      Not verified
    </Badge>
  );
}

// ------------------------------------------------------------- account and security

const changePasswordSchema = z
  .object({ current: z.string().min(1, { error: "Enter your current password." }) })
  .and(resetPasswordSchema);

export function AccountSecurity({ user }: { user: User }) {
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", password: "", confirm: "" },
  });
  const rows = [
    {
      label: "Email",
      value: user.email,
      verifiedAt: user.emailVerifiedAt,
      verify: "/auth/verify-email",
    },
    {
      label: "Phone",
      value: user.phone ?? "Not added",
      verifiedAt: user.phoneVerifiedAt,
      verify: "/auth/verify-phone",
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Sign-in and contact details"
        description="Private. Clients and other Creatives never see your email or phone."
      >
        <dl className="flex flex-col divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
              <dt className="w-24 text-label text-foreground-secondary">{r.label}</dt>
              <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <span className="text-body break-all text-foreground">{r.value}</span>
                <Verified at={r.verifiedAt} />
                {!r.verifiedAt && (
                  <TextLink href={`${r.verify}?next=/app/creative/settings`}>Verify now</TextLink>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Change password" description="Use at least 8 characters.">
        <form
          noValidate
          className="flex max-w-md flex-col gap-5"
          onSubmit={form.handleSubmit(() => {
            form.reset();
            toast.success("Password changed", {
              description: "Other devices will be asked to sign in again.",
            });
          })}
        >
          <Controller
            control={form.control}
            name="current"
            render={({ field, fieldState }) => (
              <FormField label="Current password" required error={fieldState.error?.message}>
                <PasswordInput {...field} autoComplete="current-password" />
              </FormField>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormField label="New password" required error={fieldState.error?.message}>
                <PasswordInput {...field} autoComplete="new-password" />
              </FormField>
            )}
          />
          <Controller
            control={form.control}
            name="confirm"
            render={({ field, fieldState }) => (
              <FormField label="Confirm new password" required error={fieldState.error?.message}>
                <PasswordInput {...field} autoComplete="new-password" />
              </FormField>
            )}
          />
          <Button type="submit" className="self-start">
            Change password
          </Button>
        </form>
      </Panel>
    </div>
  );
}

// ------------------------------------------------------------- creative profile

export function CreativeProfileSettings({
  creative,
  siteUrl,
}: {
  creative: CreativeProfile;
  siteUrl: string;
}) {
  const url = `${siteUrl}/${creative.username}`;
  return (
    <div className="flex flex-col gap-6">
      <Panel title="Username and link" description="Your username is the address of your profile.">
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <dt className="text-label text-foreground-secondary">Username</dt>
            <dd className="text-body text-foreground">{creative.username}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label text-foreground-secondary">Your link</dt>
            <dd className="text-body break-all text-foreground">
              {url.replace(/^https?:\/\//, "")}
            </dd>
          </div>
        </dl>
        <ShareLink url={url} size="sm" />
        <p className="text-body-sm text-foreground-secondary">
          Changing your username isn&apos;t available yet, because links you&apos;ve already shared
          need to keep working.
        </p>
      </Panel>
      <Panel
        title="What Clients see"
        description="Your name, title, introduction, availability and links are managed on your Public Profile."
      >
        <ButtonLink href="/app/creative/profile" variant="secondary" className="self-start">
          Manage Public Profile
        </ButtonLink>
      </Panel>
    </div>
  );
}

// ------------------------------------------------------------- business preferences

const businessSchema = z
  .object({
    defaultCurrency: z.enum(["NGN", "USD", "GBP", "EUR"]),
    commitment: z.enum(["NONE", "PERCENT"]),
    commitmentPercent: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.commitment !== "PERCENT") return;
    const parsed = percentInput({ min: 1 }).safeParse(v.commitmentPercent ?? "");
    if (!parsed.success)
      ctx.addIssue({
        code: "custom",
        path: ["commitmentPercent"],
        message: parsed.error.issues[0].message,
      });
  });

export function BusinessPreferences(props: {
  creative: CreativeProfile;
  paymentMethods: PaymentMethod[];
  services: Service[];
}) {
  // The form starts from saved preferences, which only exist in the browser for now.
  return useMounted() ? (
    <BusinessPreferencesForm {...props} />
  ) : (
    <div
      aria-busy="true"
      aria-label="Loading your preferences"
      className="h-80 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
    />
  );
}

function BusinessPreferencesForm({
  creative: base,
  paymentMethods,
  services: baseServices,
}: {
  creative: CreativeProfile;
  paymentMethods: PaymentMethod[];
  services: Service[];
}) {
  const { creative, saveProfile } = useCreativeProfile(base, paymentMethods);
  const { services } = useMergedServices(baseServices, base.userId);
  const usingDefault = services.filter(
    (s) => s.lifecycle !== "ARCHIVED" && s.commitment.mode === "CREATIVE_DEFAULT",
  );
  const form = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      defaultCurrency: creative.defaultCurrency,
      commitment: creative.defaultCommitmentBps === null ? ("NONE" as const) : ("PERCENT" as const),
      commitmentPercent:
        creative.defaultCommitmentBps === null ? "50" : String(creative.defaultCommitmentBps / 100),
    },
  });
  const commitment = useWatch({ control: form.control, name: "commitment" });

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Defaults for your Services"
        description="You can change both for any single Service in the Service Builder."
      >
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit((v) => {
            form.reset(form.getValues());
            saved(
              saveProfile({
                defaultCurrency: v.defaultCurrency as Currency,
                defaultCommitmentBps:
                  v.commitment === "PERCENT" ? percentToBps(v.commitmentPercent ?? "") : null,
              }),
              "Business preferences saved",
            );
          })}
        >
          <Controller
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <CurrencySelect
                value={field.value}
                onChange={field.onChange}
                description="Used for new Services. Existing Services keep their currency."
              />
            )}
          />
          <Controller
            control={form.control}
            name="commitment"
            render={({ field }) => (
              <FormFieldset
                legend="Default commitment"
                description="A share of the agreed price that Clients pay you directly before you start. Modgeto does not collect it."
              >
                <RadioGroup value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <RadioItem value="PERCENT" label="Ask for a commitment" />
                  <RadioItem
                    value="NONE"
                    label="No commitment"
                    description="You can start once terms are agreed."
                  />
                </RadioGroup>
              </FormFieldset>
            )}
          />
          {commitment === "PERCENT" && (
            <Controller
              control={form.control}
              name="commitmentPercent"
              render={({ field, fieldState }) => (
                <FormField
                  label="Commitment percentage"
                  required
                  error={fieldState.error?.message}
                  className="max-w-48"
                >
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value ?? ""}
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
            />
          )}
          {usingDefault.length > 0 && (
            <p className="text-body-sm text-foreground-secondary">
              {usingDefault.length === 1 ? "1 Service uses" : `${usingDefault.length} Services use`}{" "}
              your default commitment
              {creative.defaultCommitmentBps !== null
                ? ` (now ${formatPercent(creative.defaultCommitmentBps)})`
                : ""}
              . A change applies to new Requests. Requests already submitted keep their terms.
            </p>
          )}
          <SaveRow dirty={form.formState.isDirty}>Save preferences</SaveRow>
        </form>
      </Panel>
      <Panel
        title="Availability"
        description="Whether you're taking new Projects is shown to Clients, so it's set on your Public Profile."
      >
        <ButtonLink
          href="/app/creative/profile#availability"
          variant="secondary"
          className="self-start"
        >
          Change availability
        </ButtonLink>
      </Panel>
    </div>
  );
}

// ------------------------------------------------------------- payment methods

export function PaymentMethodsSettings({
  creative: base,
  paymentMethods: baseMethods,
  services: baseServices,
}: {
  creative: CreativeProfile;
  paymentMethods: PaymentMethod[];
  services: Service[];
}) {
  const { paymentMethods: methods, savePaymentMethods } = useCreativeProfile(base, baseMethods);
  const { services } = useMergedServices(baseServices, base.userId);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PaymentMethod | null>(null);
  const usedBy = (id: string) =>
    services.filter((s) => s.lifecycle !== "ARCHIVED" && s.paymentMethodIds.includes(id));
  const typeLabel = (t: string) => METHOD_TYPES.find((m) => m.value === t)?.label ?? "Other method";
  const save = (next: PaymentMethod[], message: string) => saved(savePaymentMethods(next), message);

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="How Clients pay you"
        description="Clients pay you directly. Modgeto doesn't collect Client Project payments. These details are only shown to a Client when their Request reaches the payment stage."
        actions={
          !adding && (
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" />
              Add method
            </Button>
          )
        }
      >
        {adding && (
          <PaymentMethodForm
            title="Add a payment method"
            onSave={(v) => {
              save(
                [
                  ...methods,
                  {
                    id: `pm-${crypto.randomUUID().slice(0, 8)}`,
                    creativeId: base.userId,
                    active: true,
                    ...v,
                  },
                ],
                `${v.label} added. Select it in each Service that should offer it.`,
              );
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
        {methods.length === 0 && !adding ? (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border-strong p-5">
            <p className="text-body-sm text-foreground-secondary">
              No payment methods yet. You&apos;ll need one before a Service that asks for a
              commitment can reach the payment stage.
            </p>
            <Button className="self-start" onClick={() => setAdding(true)}>
              <Plus aria-hidden="true" />
              Add a payment method
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {methods.map((m) =>
              editing === m.id ? (
                <li key={m.id}>
                  <PaymentMethodForm
                    title={`Edit ${m.label}`}
                    submitLabel="Save changes"
                    initial={{ type: m.type, label: m.label, instructions: m.instructions }}
                    onSave={(v) => {
                      save(
                        methods.map((x) => (x.id === m.id ? { ...x, ...v } : x)),
                        "Payment method saved",
                      );
                      setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                </li>
              ) : (
                <li key={m.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Landmark
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-foreground-muted"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="flex flex-wrap items-center gap-2 text-label text-foreground">
                        {m.label}
                        <Badge tone="neutral">{typeLabel(m.type)}</Badge>
                        {!m.active && <Badge tone="warning">Paused</Badge>}
                      </p>
                      <p className="text-body-sm whitespace-pre-line text-foreground-secondary">
                        {m.instructions}
                      </p>
                      <p className="text-caption text-foreground-secondary">
                        {usedBy(m.id).length
                          ? `Offered with ${usedBy(m.id)
                              .map((s) => s.name)
                              .join(", ")}`
                          : "Not selected in any Service yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
                    <FormField label="Offer to Clients" orientation="horizontal">
                      <Switch
                        checked={m.active}
                        onCheckedChange={(on) =>
                          save(
                            methods.map((x) => (x.id === m.id ? { ...x, active: on } : x)),
                            on
                              ? `${m.label} is offered again`
                              : `${m.label} is paused. Clients won't see it.`,
                          )
                        }
                      />
                    </FormField>
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(m.id)}>
                        <Pencil aria-hidden="true" />
                        Edit<span className="sr-only"> {m.label}</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRemoving(m)}>
                        <Trash2 aria-hidden="true" />
                        Remove<span className="sr-only"> {m.label}</span>
                      </Button>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </Panel>

      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Remove {removing?.label}?</DialogTitle>
            <DialogDescription>
              {removing && usedBy(removing.id).length > 0
                ? `It's offered with ${usedBy(removing.id)
                    .map((s) => s.name)
                    .join(
                      ", ",
                    )}. Those Services need another method before Clients reach the payment stage. Payment instructions already sent to Clients don't change.`
                : "Payment instructions already sent to Clients don't change."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Keep method</Button>} />
            <Button
              variant="destructive"
              onClick={() => {
                if (removing)
                  save(
                    methods.filter((x) => x.id !== removing.id),
                    `${removing.label} removed`,
                  );
                setRemoving(null);
              }}
            >
              Remove method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------- notifications

/** What reaches a Creative, from PRD NOT-002. */
const CREATIVE_EVENTS = [
  { id: "REQUEST_SUBMITTED", label: "A Client submits a Request" },
  { id: "CLIENT_RESPONDED", label: "A Client replies or answers a question" },
  { id: "PROPOSAL_ACCEPTED", label: "A Client accepts your quote or proposal" },
  { id: "REQUEST_WITHDRAWN", label: "A Client withdraws a Request" },
  { id: "PAYMENT_DECLARED", label: "A Client says they've paid" },
  { id: "READY_TO_START", label: "A Request is Ready to Start" },
  { id: "SUBSCRIPTION_ACTION", label: "Your subscription needs attention" },
];

/**
 * In-app notifications are always on, so nothing is missed. Email can be
 * turned off per event (D-043). Changes save straight away.
 */
export function NotificationSettings({
  email,
  creative,
  paymentMethods,
}: {
  email: string;
  creative: CreativeProfile;
  paymentMethods: PaymentMethod[];
}) {
  const { emailPreferences, saveEmailPreference } = useCreativeProfile(creative, paymentMethods);
  const mounted = useMounted();
  const [status, setStatus] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Email notifications"
        description={`Choose what we also send to ${email}. Everything always appears in your notifications here.`}
      >
        <ul className="flex flex-col divide-y divide-border">
          {CREATIVE_EVENTS.map((e) => {
            const on = emailPreferences[e.id] ?? true;
            return (
              <li key={e.id} className="flex items-center gap-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-sm text-foreground">{e.label}</span>
                  <span className="text-caption text-foreground-secondary">
                    In-app always · Email {on ? "on" : "off"}
                  </span>
                </div>
                <Switch
                  aria-label={`Email when ${e.label.charAt(0).toLowerCase()}${e.label.slice(1)}`}
                  checked={on}
                  disabled={!mounted}
                  onCheckedChange={(next) => {
                    const ok = saveEmailPreference(e.id, next);
                    if (!ok) toast.error("Couldn't save. Check your connection and try again.");
                    setStatus(ok ? `Email ${next ? "on" : "off"}: ${e.label}.` : "");
                  }}
                />
              </li>
            );
          })}
        </ul>
        <p role="status" className="sr-only">
          {status}
        </p>
        <p className="text-body-sm text-foreground-secondary">
          Your phone is only used for sign-in codes. We never send routine updates by SMS.
        </p>
      </Panel>
    </div>
  );
}
