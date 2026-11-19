"use client";

/**
 * Creative Onboarding (docs/06 §5, docs/05 §4, PROF-001–006, PAY-002).
 * Introduction → Public identity → Professional profile → Business
 * preferences → Payment setup (skippable) → First Service entry.
 * Progress saves after every step so it can be resumed (PROF-006).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Landmark,
  Link2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button, ButtonLink } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createLocalStore } from "@/lib/local-store";
import {
  businessPreferencesSchema,
  creativeLinkSchema,
  creativeProfileSchema,
  paymentMethodSchema,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { type UsernameCheck, checkUsername } from "./actions";

// ------------------------------------------------------------------ draft

type Draft = {
  identity?: { displayName: string; username: string; professionalTitle: string };
  profile?: {
    introduction: string;
    location: string;
    disciplines: string[];
    links: { type: string; url: string }[];
  };
  business?: {
    availability: "AVAILABLE" | "LIMITED" | "UNAVAILABLE";
    availabilityNote: string;
    defaultCurrency: "NGN" | "USD" | "GBP" | "EUR";
    commitment: "NONE" | "PERCENT";
    commitmentPercent: string;
  };
  paymentMethods?: { type: string; label: string; instructions: string }[];
  paymentSkipped?: boolean;
  completedAt?: string;
};

const STEPS = [
  { id: "identity", label: "Public identity" },
  { id: "profile", label: "Professional profile" },
  { id: "business", label: "Business preferences" },
  { id: "payment", label: "Payment setup" },
] as const;
type StepId = "intro" | (typeof STEPS)[number]["id"] | "done";

const DISCIPLINES = [
  { id: "DESIGN", label: "Design" },
  { id: "DEVELOPMENT", label: "Development" },
  { id: "WRITING", label: "Writing" },
  { id: "MOTION_MEDIA", label: "Motion and Media" },
];

const LINK_TYPES = [
  { value: "PORTFOLIO", label: "Portfolio" },
  { value: "BEHANCE", label: "Behance" },
  { value: "DRIBBBLE", label: "Dribbble" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GITHUB", label: "GitHub" },
  { value: "OTHER", label: "Other" },
];

const METHOD_TYPES = [
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

const CURRENCIES = [
  { value: "NGN", label: "Nigerian naira (₦)" },
  { value: "USD", label: "US dollar ($)" },
  { value: "GBP", label: "British pound (£)" },
  { value: "EUR", label: "Euro (€)" },
];

// ------------------------------------------------------------------ shared

function StepHeader({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-caption text-foreground-secondary">
          Step {index + 1} of {STEPS.length} ·{" "}
          <span className="font-semibold text-foreground">{STEPS[index].label}</span>
        </p>
        <span aria-hidden="true" className="flex gap-1">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= index ? "bg-primary" : "bg-border-strong",
              )}
            />
          ))}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 tabIndex={-1} className="text-h2 text-foreground">
          {title}
        </h1>
        {description && <p className="text-body text-foreground-secondary">{description}</p>}
      </div>
    </div>
  );
}

function Actions({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        Back
      </Button>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
    </div>
  );
}

// ------------------------------------------------------------------ flow

export function OnboardingFlow({ userId, fullName }: { userId: string; fullName: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const store = useMemo(() => createLocalStore<Draft>(`mg-onboarding:${userId}`), [userId]);
  const draft = store.useValue() ?? {};
  const step = (params.get("step") as StepId | null) ?? "intro";
  const index = STEPS.findIndex((s) => s.id === step);
  const headingRef = useRef<HTMLDivElement>(null);

  const go = (id: StepId) => {
    router.push(id === "intro" ? "/app/onboarding" : `/app/onboarding?step=${id}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0 });
  };
  const save = (patch: Partial<Draft>) => store.write({ ...store.read(), ...patch });

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    headingRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [step]);

  const content = (() => {
    switch (step) {
      case "identity":
        return (
          <IdentityStep
            draft={draft}
            fullName={fullName}
            onBack={() => go("intro")}
            onDone={(v) => (save({ identity: v }), go("profile"))}
          />
        );
      case "profile":
        return (
          <ProfileStep
            draft={draft}
            onBack={() => go("identity")}
            onDone={(v) => (save({ profile: v }), go("business"))}
          />
        );
      case "business":
        return (
          <BusinessStep
            draft={draft}
            onBack={() => go("profile")}
            onDone={(v) => (save({ business: v }), go("payment"))}
          />
        );
      case "payment":
        return (
          <PaymentStep
            draft={draft}
            onBack={() => go("business")}
            onChange={(methods) => save({ paymentMethods: methods })}
            onDone={(skipped) => (
              save({ paymentSkipped: skipped, completedAt: new Date().toISOString() }),
              go("done")
            )}
          />
        );
      case "done":
        return <DoneStep draft={draft} />;
      default:
        return (
          <IntroStep
            resuming={Boolean(draft.identity)}
            onStart={() => go(draft.identity ? nextIncomplete(draft) : "identity")}
          />
        );
    }
  })();

  return (
    <div ref={headingRef} className="[&_h1]:outline-none" data-step-index={index}>
      {content}
    </div>
  );
}

function nextIncomplete(d: Draft): StepId {
  if (!d.identity) return "identity";
  if (!d.profile) return "profile";
  if (!d.business) return "business";
  if (!d.completedAt) return "payment";
  return "done";
}

// ------------------------------------------------------------------ intro

function IntroStep({ resuming, onStart }: { resuming: boolean; onStart: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-primary-subtle text-primary-text"
      >
        <Sparkles className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 tabIndex={-1} className="text-h2 text-foreground">
          Set up your Creative profile
        </h1>
        <p className="text-body text-foreground-secondary">
          Give Clients one link to start working with you. It takes about five minutes, and you can
          stop and come back any time.
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {[
          ["Public identity", "Your name, title and link."],
          ["Professional profile", "A short introduction and where to see your work."],
          ["Business preferences", "Availability, currency and commitment."],
          ["Payment setup", "How Clients pay you directly. You can skip this for now."],
        ].map(([title, body], i) => (
          <li key={title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-caption font-semibold text-primary-text"
            >
              {i + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-label text-foreground">{title}</span>
              <span className="text-body-sm text-foreground-secondary">{body}</span>
            </span>
          </li>
        ))}
      </ol>
      <Button size="lg" fullWidth onClick={onStart}>
        {resuming ? "Continue where you left off" : "Get started"}
        <ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}

// ------------------------------------------------------------------ identity

const identitySchema = creativeProfileSchema.pick({
  displayName: true,
  username: true,
  professionalTitle: true,
});

function IdentityStep({
  draft,
  fullName,
  onBack,
  onDone,
}: {
  draft: Draft;
  fullName: string;
  onBack: () => void;
  onDone: (v: NonNullable<Draft["identity"]>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(identitySchema),
    defaultValues: draft.identity ?? { displayName: fullName, username: "", professionalTitle: "" },
  });
  const [check, setCheck] = useState<UsernameCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const username = useWatch({ control: form.control, name: "username" });

  // Debounced availability check via a Server Action (PROF-003).
  useEffect(() => {
    if (!username || username.trim().length < 3) return;
    const t = setTimeout(async () => {
      setChecking(true);
      const result = await checkUsername(username);
      setCheck(result);
      setChecking(false);
    }, 400);
    return () => clearTimeout(t);
  }, [username]);
  const current = check && check.username === username.trim().toLowerCase() ? check : null;

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async (values) => {
        const result = await checkUsername(values.username);
        setCheck(result);
        if (result.status !== "available") {
          form.setError("username", { message: result.message });
          return;
        }
        onDone(values);
      })}
    >
      <StepHeader
        index={0}
        title="Your public identity"
        description="This is what Clients see first on your link."
      />
      <Controller
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <FormField
            label="Display name"
            description="Your name or studio name."
            error={fieldState.error?.message}
            required
          >
            <Input {...field} autoComplete="name" />
          </FormField>
        )}
      />
      <Controller
        control={form.control}
        name="username"
        render={({ field, fieldState }) => (
          <FormField
            label="Username"
            description="3 to 30 characters: letters, numbers and hyphens. This becomes your link."
            error={
              fieldState.error?.message ??
              (current && current.status !== "available" ? current.message : null)
            }
            required
          >
            <div className="flex items-stretch overflow-hidden rounded-md border border-border-control focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
              <span
                aria-hidden="true"
                className="flex items-center bg-surface-subtle px-3 text-body-sm text-foreground-secondary"
              >
                modgeto.com/
              </span>
              <Input
                {...field}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="rounded-none border-0 focus-visible:ring-0"
              />
            </div>
          </FormField>
        )}
      />
      <p aria-live="polite" className="-mt-4 flex min-h-5 items-center gap-1.5 text-body-sm">
        {checking ? (
          <>
            <Spinner className="text-foreground-muted" />{" "}
            <span className="text-foreground-secondary">Checking…</span>
          </>
        ) : current?.status === "available" ? (
          <>
            <CircleCheck aria-hidden="true" className="size-4 text-success-text" />
            <span className="text-success-text">modgeto.com/{current.username} is available</span>
          </>
        ) : null}
      </p>
      <Controller
        control={form.control}
        name="professionalTitle"
        render={({ field, fieldState }) => (
          <FormField
            label="Professional title"
            description="For example: Brand and UI Designer."
            error={fieldState.error?.message}
            required
          >
            <Input {...field} />
          </FormField>
        )}
      />
      <Actions onBack={onBack}>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </Actions>
    </form>
  );
}

// ------------------------------------------------------------------ profile

const profileSchema = z.object({
  introduction: creativeProfileSchema.shape.introduction,
  location: z.string().max(80, { error: "Use 80 characters or fewer." }),
  disciplines: z.array(z.string()),
  links: z.array(creativeLinkSchema.pick({ type: true, url: true })).max(5),
});

function ProfileStep({
  draft,
  onBack,
  onDone,
}: {
  draft: Draft;
  onBack: () => void;
  onDone: (v: NonNullable<Draft["profile"]>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: (draft.profile ?? {
      introduction: "",
      location: "",
      disciplines: [],
      links: [],
    }) as z.input<typeof profileSchema>,
  });
  const links = useFieldArray({ control: form.control, name: "links" });

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit((v) => onDone(v as NonNullable<Draft["profile"]>))}
    >
      <StepHeader
        index={1}
        title="Your professional profile"
        description="A short introduction and where Clients can see your work."
      />
      <Controller
        control={form.control}
        name="introduction"
        render={({ field, fieldState }) => (
          <FormField
            label="Short introduction"
            description="One or two sentences about who you help and how."
            error={fieldState.error?.message}
            required
          >
            <Textarea {...field} maxLength={160} showCount rows={3} />
          </FormField>
        )}
      />
      <Controller
        control={form.control}
        name="location"
        render={({ field, fieldState }) => (
          <FormField
            label="Location"
            description="City and country."
            error={fieldState.error?.message}
            optional
          >
            <Input {...field} autoComplete="address-level2" />
          </FormField>
        )}
      />
      <Controller
        control={form.control}
        name="disciplines"
        render={({ field }) => (
          <FormFieldset legend="What do you do?" description="Choose all that apply." optional>
            <div className="grid gap-3 sm:grid-cols-2">
              {DISCIPLINES.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={field.value.includes(d.id)}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked ? [...field.value, d.id] : field.value.filter((x) => x !== d.id),
                      )
                    }
                  />
                  <span className="text-body-sm text-foreground">{d.label}</span>
                </label>
              ))}
            </div>
          </FormFieldset>
        )}
      />
      <FormFieldset legend="Portfolio and professional links" description="Up to five." optional>
        <div className="flex flex-col gap-3">
          {links.fields.map((item, i) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-start"
            >
              <Controller
                control={form.control}
                name={`links.${i}.type`}
                render={({ field }) => (
                  <FormField label={`Link ${i + 1} type`} className="sm:w-40" hideLabel>
                    <Select
                      items={LINK_TYPES}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              <Controller
                control={form.control}
                name={`links.${i}.url`}
                render={({ field, fieldState }) => (
                  <FormField
                    label={`Link ${i + 1} address`}
                    hideLabel
                    error={fieldState.error?.message}
                    className="flex-1"
                  >
                    <Input {...field} type="url" inputMode="url" placeholder="https://" />
                  </FormField>
                )}
              />
              <IconButton
                label={`Remove link ${i + 1}`}
                icon={<Trash2 />}
                variant="ghost"
                onClick={() => links.remove(i)}
              />
            </div>
          ))}
          {links.fields.length < 5 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => links.append({ type: "PORTFOLIO", url: "" })}
            >
              <Plus aria-hidden="true" />
              Add a link
            </Button>
          )}
        </div>
      </FormFieldset>
      <Actions onBack={onBack}>
        <Button type="submit">
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </Actions>
    </form>
  );
}

// ------------------------------------------------------------------ business

function BusinessStep({
  draft,
  onBack,
  onDone,
}: {
  draft: Draft;
  onBack: () => void;
  onDone: (v: NonNullable<Draft["business"]>) => void;
}) {
  const form = useForm({
    resolver: zodResolver(businessPreferencesSchema),
    defaultValues: (draft.business ?? {
      availability: "AVAILABLE",
      availabilityNote: "",
      defaultCurrency: "NGN",
      commitment: "PERCENT",
      commitmentPercent: "50",
    }) as z.input<typeof businessPreferencesSchema>,
  });
  const availability = useWatch({ control: form.control, name: "availability" });
  const commitment = useWatch({ control: form.control, name: "commitment" });

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(() => onDone(form.getValues() as NonNullable<Draft["business"]>))}
    >
      <StepHeader
        index={2}
        title="Business preferences"
        description="Defaults for every Service. You can change them per Service later."
      />
      <Controller
        control={form.control}
        name="availability"
        render={({ field }) => (
          <FormFieldset legend="Are you taking new Projects?">
            <RadioGroup value={field.value} onValueChange={(v) => field.onChange(v)}>
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
                description="Your profile stays visible, but new Requests are paused."
              />
            </RadioGroup>
          </FormFieldset>
        )}
      />
      {availability === "LIMITED" && (
        <Controller
          control={form.control}
          name="availabilityNote"
          render={({ field, fieldState }) => (
            <FormField
              label="Note for Clients"
              description="For example: Booking projects that start from December."
              error={fieldState.error?.message}
              optional
            >
              <Input {...field} value={field.value ?? ""} maxLength={120} />
            </FormField>
          )}
        />
      )}
      <Controller
        control={form.control}
        name="defaultCurrency"
        render={({ field }) => (
          <FormField label="Default currency" description="Used for new Services.">
            <Select items={CURRENCIES} value={field.value} onValueChange={(v) => field.onChange(v)}>
              <SelectTrigger>
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
        )}
      />
      <Controller
        control={form.control}
        name="commitment"
        render={({ field }) => (
          <FormFieldset
            legend="Commitment before a Project starts"
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
              error={fieldState.error?.message}
              required
              className="max-w-48"
            >
              <div className="relative">
                <Input {...field} value={field.value ?? ""} inputMode="decimal" className="pr-9" />
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
      <Actions onBack={onBack}>
        <Button type="submit">
          Continue
          <ArrowRight aria-hidden="true" />
        </Button>
      </Actions>
    </form>
  );
}

// ------------------------------------------------------------------ payment

function PaymentStep({
  draft,
  onBack,
  onChange,
  onDone,
}: {
  draft: Draft;
  onBack: () => void;
  onChange: (methods: NonNullable<Draft["paymentMethods"]>) => void;
  onDone: (skipped: boolean) => void;
}) {
  const methods = draft.paymentMethods ?? [];
  const [adding, setAdding] = useState(methods.length === 0);
  const form = useForm({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: { type: "BANK_TRANSFER" as const, label: "", instructions: "" },
  });
  const type = useWatch({ control: form.control, name: "type" });
  const hint = METHOD_TYPES.find((m) => m.value === type)?.hint;

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        index={3}
        title="How Clients pay you"
        description="Clients pay you directly. These details are only shown to a Client when their Request reaches the payment stage. Modgeto does not collect Client Project payments."
      />

      {methods.length > 0 && (
        <ul className="flex flex-col gap-2">
          {methods.map((m, i) => (
            <li
              key={`${m.label}-${i}`}
              className="flex items-start gap-3 rounded-md border border-border p-4"
            >
              <Landmark
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-foreground-muted"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-label text-foreground">{m.label}</p>
                <p className="text-body-sm whitespace-pre-line text-foreground-secondary">
                  {m.instructions}
                </p>
              </div>
              <IconButton
                size="sm"
                label={`Remove ${m.label}`}
                icon={<Trash2 />}
                onClick={() => onChange(methods.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          noValidate
          className="flex flex-col gap-5 rounded-lg border border-border p-4 md:p-5"
          onSubmit={form.handleSubmit((v) => {
            onChange([...methods, v]);
            form.reset({ type: "BANK_TRANSFER", label: "", instructions: "" });
            setAdding(false);
          })}
        >
          <p className="text-label text-foreground">Add a payment method</p>
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
              Save method
            </Button>
            {methods.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => setAdding(true)}
        >
          <Plus aria-hidden="true" />
          Add another method
        </Button>
      )}

      <Actions onBack={onBack}>
        {methods.length === 0 && (
          <Button type="button" variant="ghost" onClick={() => onDone(true)}>
            Skip for now
          </Button>
        )}
        <Button type="button" disabled={methods.length === 0} onClick={() => onDone(false)}>
          Finish setup
          <ArrowRight aria-hidden="true" />
        </Button>
      </Actions>
      {methods.length === 0 && (
        <p className="-mt-3 text-body-sm text-foreground-secondary">
          You can skip this now. You&apos;ll need a payment method before a Service that asks for a
          commitment can reach the payment stage.
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ done

function DoneStep({ draft }: { draft: Draft }) {
  const username = draft.identity?.username ?? "your-name";
  return (
    <div className="flex flex-col gap-6">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-success-subtle text-success-text"
      >
        <CircleCheck className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 tabIndex={-1} className="text-h2 text-foreground">
          Your profile is ready
        </h1>
        <p className="text-body text-foreground-secondary">
          Next, create your first Service. Your first Published Service is free.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-3">
        <Link2 aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
        <span className="truncate text-body-sm text-foreground-secondary">
          modgeto.com/<span className="font-semibold text-foreground">{username}</span>
        </span>
      </div>
      {draft.paymentSkipped && (
        <p className="rounded-md bg-surface-subtle px-4 py-3 text-body-sm text-foreground-secondary">
          You skipped payment setup. Add a payment method in Settings before you ask Clients for a
          commitment.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/app/creative/services/new" size="lg">
          Create your first Service
        </ButtonLink>
        <ButtonLink href="/app/creative" variant="secondary" size="lg">
          Go to your Dashboard
        </ButtonLink>
      </div>
      <div className="flex flex-col gap-1 rounded-md border border-dashed border-border-strong px-4 py-3 text-caption text-foreground-secondary">
        <p className="font-semibold tracking-wide uppercase">Simulated until Phase 9</p>
        <p>
          Your answers are saved on this device only. Phase 9 creates the Creative profile on the
          server.
        </p>
      </div>
    </div>
  );
}
