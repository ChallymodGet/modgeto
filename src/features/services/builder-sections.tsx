"use client";

/**
 * Service Builder form sections (PRD SRV-016–025, PRC-001–006, docs/06 §56).
 * Each section edits the working copy through `update`; the Builder autosaves.
 * Problems come from the domain's publish rules, so the Builder and Publish
 * never disagree about what's missing.
 */
import { ImagePlus, Info, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormFieldset } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectionCard, SelectionCardGroup } from "@/components/ui/selection-card";
import { Switch } from "@/components/ui/switch";
import { TextLink } from "@/components/ui/text-link";
import { Textarea } from "@/components/ui/textarea";
import {
  type Currency,
  type DependencyConfig,
  type PricingMode,
  type PublishBlocker,
  type RevisionPolicy,
  validateUsername,
} from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import type {
  AddOn,
  CreativeProfile,
  PaymentMethod,
  Service,
  ServiceCategory,
  ServicePackage,
} from "@/types";
import { moveItem, slugify, uniqueSlug } from "./builder-model";
import {
  BuilderBlock,
  ListItem,
  ModifierField,
  MoneyField,
  PercentField,
  TurnaroundField,
  errorFor,
  newItemId,
} from "./builder-fields";

export type Update = (fn: (s: Service) => Service) => void;

export type BuilderContext = {
  creative: CreativeProfile;
  categories: ServiceCategory[];
  paymentMethods: PaymentMethod[];
  /** Slugs of the Creative's other Services. */
  takenSlugs: string[];
  siteHost: string;
};

export type SectionProps = {
  service: Service;
  update: Update;
  /** Problems in this section only. */
  blockers: PublishBlocker[];
  ctx: BuilderContext;
};

const codeError = (blockers: readonly PublishBlocker[], code: string) =>
  blockers.find((b) => b.code === code)?.message ?? null;

const reorder = <T extends { displayOrder: number }>(list: T[]) =>
  list.map((item, i) => ({ ...item, displayOrder: i + 1 }));

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick} className="self-start">
      <Plus aria-hidden="true" />
      {children}
    </Button>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg bg-surface-subtle p-4 text-body-sm text-foreground-secondary">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground-muted" />
      <span>{children}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Basics (SRV-016)
// ---------------------------------------------------------------------------

/** Simulated cover upload: stored as a small data URL until R2 arrives (Phase 10). */
function CoverField({
  value,
  onChange,
  label = "Cover image",
  description = "A wide image of your work, at least 1600 × 1000 pixels. JPG, PNG or WebP.",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
  description?: string;
}) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  return (
    <FormField label={label} optional description={description} error={error}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg bg-surface-subtle sm:w-56">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview; R2 images get next/image in Phase 10
            <img src={value} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <ImagePlus aria-hidden="true" className="size-8 text-foreground-disabled" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border-strong bg-surface px-3 text-label text-foreground hover:bg-surface-subtle has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            {value ? "Replace image" : "Choose image"}
            <input
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
                  setError("Choose a JPG, PNG or WebP image.");
                  return;
                }
                if (file.size > 2 * 1024 * 1024) {
                  setError("For now, choose an image under 2 MB.");
                  return;
                }
                setError(null);
                const reader = new FileReader();
                reader.onload = () => onChange(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {value && (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove image
            </Button>
          )}
        </div>
      </div>
    </FormField>
  );
}

export function BasicsSection({ service, update, blockers, ctx }: SectionProps) {
  const live = service.lifecycle !== "DRAFT" && service.lifecycle !== "ARCHIVED";
  const autoSlug = (name: string) => uniqueSlug(slugify(name), ctx.takenSlugs);
  const slugProblem = !service.slug
    ? null
    : ctx.takenSlugs.includes(service.slug)
      ? "You already use this link for another Service."
      : validateUsername(service.slug) === "CHARACTERS" || service.slug.length > 60
        ? "Use lowercase letters, numbers and hyphens."
        : null;
  const categories = ctx.categories.filter((c) => c.active);

  return (
    <BuilderBlock title="About this Service">
      <FormField label="Service name" required error={codeError(blockers, "NAME_REQUIRED")}>
        <Input
          value={service.name}
          maxLength={80}
          placeholder="For example, Brand Identity"
          onChange={(e) => {
            const name = e.target.value;
            update((s) => ({
              ...s,
              name,
              // Follow the name until the Creative edits the link, and never once it's live.
              slug: !live && (!s.slug || s.slug === autoSlug(s.name)) ? autoSlug(name) : s.slug,
            }));
          }}
        />
      </FormField>
      <FormField
        label="Link"
        description={
          live
            ? "Changing the link of a live Service breaks links you've already shared."
            : "Fills in from the name. You can change it until you publish."
        }
        error={slugProblem}
      >
        <div className="flex min-w-0 items-stretch overflow-hidden rounded-md border border-border-control bg-surface has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-primary/20">
          <span className="flex shrink-0 items-center border-r border-border bg-surface-subtle px-3 text-body-sm text-foreground-muted">
            <span className="hidden sm:inline">{ctx.siteHost}</span>/{ctx.creative.username}/
          </span>
          <input
            value={service.slug}
            maxLength={60}
            autoCapitalize="none"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-body text-foreground outline-none md:h-10"
            onChange={(e) =>
              update((s) => ({ ...s, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))
            }
          />
        </div>
      </FormField>
      <FormField
        label="Short description"
        required
        description="One sentence on what the Client gets. Shown on your profile and Service cards."
        error={codeError(blockers, "DESCRIPTION_REQUIRED")}
      >
        <Textarea
          rows={2}
          maxLength={160}
          showCount
          value={service.shortDescription}
          onChange={(e) => update((s) => ({ ...s, shortDescription: e.target.value }))}
        />
      </FormField>
      <FormField label="Category" required error={codeError(blockers, "CATEGORY_REQUIRED")}>
        <Select
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={service.categoryId}
          onValueChange={(v) => update((s) => ({ ...s, categoryId: v as string }))}
        >
          <SelectTrigger className="sm:max-w-sm">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField
        label="Detailed description"
        optional
        description="How you work, what's included and who it's for."
      >
        <Textarea
          rows={6}
          maxLength={3000}
          value={service.detailedDescription ?? ""}
          onChange={(e) => update((s) => ({ ...s, detailedDescription: e.target.value || null }))}
        />
      </FormField>
      <CoverField
        value={service.coverImageUrl}
        onChange={(coverImageUrl) => update((s) => ({ ...s, coverImageUrl }))}
      />
    </BuilderBlock>
  );
}

// ---------------------------------------------------------------------------
// Pricing (PRC-001–006, SRV-020)
// ---------------------------------------------------------------------------

const PRICING_MODES: { value: PricingMode; title: string; description: string }[] = [
  { value: "FIXED", title: "Fixed price", description: "One exact price for the whole Service." },
  {
    value: "STARTING_FROM",
    title: "Starting from",
    description: "A minimum price. You agree the final price before the Project starts.",
  },
  {
    value: "QUANTITY",
    title: "Priced per unit",
    description: "Clients choose how many, such as posts, pages or screens.",
  },
  {
    value: "PACKAGE",
    title: "Packages",
    description: "Two or three levels, each with its own price and scope.",
  },
  {
    value: "CUSTOM_QUOTE",
    title: "Custom quote",
    description: "No price up front. You send a quote after reading the Brief.",
  },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "NGN", label: "Nigerian naira (₦)" },
  { value: "USD", label: "US dollar ($)" },
  { value: "GBP", label: "British pound (£)" },
  { value: "EUR", label: "Euro (€)" },
];

const REVISION_KINDS = [
  { value: "NONE", label: "No revisions" },
  { value: "FIXED", label: "A set number" },
  { value: "UNLIMITED", label: "Unlimited" },
];

function RevisionsField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: RevisionPolicy;
  onChange: (p: RevisionPolicy) => void;
  error?: string | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:max-w-md">
      <FormField label={label}>
        <Select
          items={REVISION_KINDS}
          value={value.kind}
          onValueChange={(v) =>
            onChange(
              v === "FIXED" ? { kind: "FIXED", count: 2 } : { kind: v as "NONE" | "UNLIMITED" },
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVISION_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {value.kind === "FIXED" && (
        <FormField label="Revision rounds" error={error}>
          <NumberInput
            min={1}
            max={20}
            value={value.count || null}
            onValueChange={(v) => onChange({ kind: "FIXED", count: v ?? 0 })}
            unitLabel="rounds"
          />
        </FormField>
      )}
    </div>
  );
}

function PackagesEditor({ service, update, blockers }: SectionProps) {
  const packages = service.packages;
  const setPackages = (fn: (list: ServicePackage[]) => ServicePackage[]) =>
    update((s) => ({ ...s, packages: reorder(fn(s.packages)) }));
  const patch = (id: string, change: Partial<ServicePackage>) =>
    setPackages((list) => list.map((p) => (p.id === id ? { ...p, ...change } : p)));

  return (
    <BuilderBlock
      title="Packages"
      description="Most Creatives offer two or three. Mark one as recommended to guide the Client."
    >
      {packages.length > 0 && (
        <ol className="flex flex-col gap-4">
          {packages.map((p, i) => (
            <ListItem
              key={p.id}
              title={p.name}
              index={i}
              count={packages.length}
              onMove={(d) => setPackages((list) => moveItem(list, i, d))}
              onRemove={() =>
                update((s) => ({
                  ...s,
                  packages: reorder(s.packages.filter((x) => x.id !== p.id)),
                  // Package-only deliverables and dependencies go with the package.
                  deliverables: s.deliverables.filter((d) => d.packageId !== p.id),
                  dependencies: s.dependencies.filter(
                    (d) => !(d.prerequisite.type === "PACKAGE" && d.prerequisite.id === p.id),
                  ),
                }))
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Package name" required>
                  <Input
                    value={p.name}
                    maxLength={40}
                    onChange={(e) => patch(p.id, { name: e.target.value })}
                  />
                </FormField>
                <MoneyField
                  label="Price"
                  currency={service.currency}
                  value={p.amountMinor || null}
                  onChange={(v) => patch(p.id, { amountMinor: v ?? 0n })}
                  error={errorFor(blockers, p.id)}
                />
              </div>
              <FormField label="What's included" optional>
                <Textarea
                  rows={2}
                  maxLength={240}
                  value={p.description ?? ""}
                  onChange={(e) => patch(p.id, { description: e.target.value || null })}
                />
              </FormField>
              <TurnaroundField
                label="Turnaround"
                value={p.turnaround}
                onChange={(turnaround) => patch(p.id, { turnaround })}
              />
              <RevisionsField
                label="Revisions"
                value={p.revisions}
                onChange={(revisions) => patch(p.id, { revisions })}
              />
              {service.addOns.length > 0 && (
                <FormFieldset
                  legend="Add-ons offered with this package"
                  description="Clients choosing this package only see the add-ons you tick."
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {service.addOns.map((a) => {
                      const checked = !p.eligibleAddOnIds || p.eligibleAddOnIds.includes(a.id);
                      return (
                        <FormField
                          key={a.id}
                          label={a.name || "Untitled add-on"}
                          orientation="horizontal"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(on) => {
                              const current = p.eligibleAddOnIds ?? service.addOns.map((x) => x.id);
                              const next = on
                                ? [...current, a.id]
                                : current.filter((id) => id !== a.id);
                              patch(p.id, {
                                eligibleAddOnIds:
                                  next.length === service.addOns.length ? undefined : next,
                              });
                            }}
                          />
                        </FormField>
                      );
                    })}
                  </div>
                </FormFieldset>
              )}
              <FormField
                label="Recommended package"
                description="Highlighted to Clients. Only one package can be recommended."
                orientation="horizontal"
              >
                <Switch
                  checked={p.recommended}
                  onCheckedChange={(on) =>
                    setPackages((list) =>
                      list.map((x) => ({
                        ...x,
                        recommended: x.id === p.id ? on : on ? false : x.recommended,
                      })),
                    )
                  }
                />
              </FormField>
            </ListItem>
          ))}
        </ol>
      )}
      <AddButton
        onClick={() =>
          setPackages((list) => [
            ...list,
            {
              id: newItemId("pkg"),
              name:
                ["Essential", "Standard", "Complete"][list.length] ?? `Package ${list.length + 1}`,
              description: null,
              amountMinor: 0n,
              recommended: false,
              turnaround: { value: 2, unit: "WEEKS" },
              revisions: { kind: "FIXED", count: 2 },
              displayOrder: list.length + 1,
            },
          ])
        }
      >
        Add package
      </AddButton>
    </BuilderBlock>
  );
}

function UnitsEditor({ service, update, blockers }: SectionProps) {
  const required = service.pricingMode === "QUANTITY";
  const rules = service.quantityRules;
  const patch = (id: string, change: Partial<(typeof rules)[number]>) =>
    update((s) => ({
      ...s,
      quantityRules: s.quantityRules.map((r) => (r.id === id ? { ...r, ...change } : r)),
    }));
  return (
    <BuilderBlock
      title={required ? "Units" : "Extra units"}
      description={
        required
          ? "What the Client is choosing a number of, and the price for each."
          : "Optional. Let Clients add more of something, such as extra logo concepts."
      }
    >
      {rules.length > 0 && (
        <ol className="flex flex-col gap-4">
          {rules.map((r, i) => (
            <ListItem
              key={r.id}
              title={r.unitName}
              index={i}
              count={rules.length}
              onMove={(d) =>
                update((s) => ({ ...s, quantityRules: moveItem(s.quantityRules, i, d) }))
              }
              onRemove={() =>
                update((s) => ({
                  ...s,
                  quantityRules: s.quantityRules.filter((x) => x.id !== r.id),
                }))
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Unit name" required description="For example, social post.">
                  <Input
                    value={r.unitName}
                    maxLength={40}
                    onChange={(e) => patch(r.id, { unitName: e.target.value })}
                  />
                </FormField>
                <MoneyField
                  label="Price per unit"
                  currency={service.currency}
                  value={r.unitAmountMinor || null}
                  onChange={(v) => patch(r.id, { unitAmountMinor: v ?? 0n })}
                  error={errorFor(blockers, r.id)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Minimum">
                  <NumberInput
                    min={0}
                    value={r.minimum}
                    onValueChange={(v) => patch(r.id, { minimum: v ?? 0 })}
                  />
                </FormField>
                <FormField label="Maximum" optional>
                  <NumberInput
                    min={0}
                    value={r.maximum ?? null}
                    onValueChange={(v) => patch(r.id, { maximum: v ?? undefined })}
                  />
                </FormField>
                <FormField label="Starts at">
                  <NumberInput
                    min={0}
                    value={r.defaultQuantity}
                    onValueChange={(v) => patch(r.id, { defaultQuantity: v ?? 0 })}
                  />
                </FormField>
              </div>
            </ListItem>
          ))}
        </ol>
      )}
      <AddButton
        onClick={() =>
          update((s) => ({
            ...s,
            quantityRules: [
              ...s.quantityRules,
              {
                id: newItemId("qr"),
                unitName: "",
                unitAmountMinor: 0n,
                minimum: required ? 1 : 0,
                defaultQuantity: required ? 1 : 0,
              },
            ],
          }))
        }
      >
        {required ? "Add unit" : "Add extra unit"}
      </AddButton>
    </BuilderBlock>
  );
}

function ChargesEditor({ service, update, blockers }: SectionProps) {
  return (
    <BuilderBlock
      title="Additional charges"
      description="Optional. Charges such as VAT, shown separately in the Client's price."
    >
      {service.charges.length > 0 && (
        <ul className="flex flex-col gap-4">
          {service.charges.map((c) => (
            <li key={c.id} className="flex flex-col gap-4 rounded-lg border border-border p-4">
              <div className="flex items-end gap-2">
                <FormField label="Charge name" className="flex-1">
                  <Input
                    value={c.label}
                    maxLength={40}
                    placeholder="For example, VAT"
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        charges: s.charges.map((x) =>
                          x.id === c.id ? { ...x, label: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </FormField>
                <IconButton
                  variant="ghost"
                  label={`Remove ${c.label || "charge"}`}
                  icon={<Trash2 />}
                  onClick={() =>
                    update((s) => ({ ...s, charges: s.charges.filter((x) => x.id !== c.id) }))
                  }
                />
              </div>
              <ModifierField
                label="Amount"
                currency={service.currency}
                value={c.modifier}
                error={errorFor(blockers, c.id)}
                onChange={(m) =>
                  update((s) => ({
                    ...s,
                    charges: s.charges.map((x) =>
                      x.id === c.id
                        ? { ...x, modifier: m ?? { kind: "FIXED", amountMinor: 0n } }
                        : x,
                    ),
                  }))
                }
              />
            </li>
          ))}
        </ul>
      )}
      <AddButton
        onClick={() =>
          update((s) => ({
            ...s,
            charges: [
              ...s.charges,
              { id: newItemId("ch"), label: "", modifier: { kind: "PERCENT", bps: 0 } },
            ],
          }))
        }
      >
        Add charge
      </AddButton>
    </BuilderBlock>
  );
}

export function PricingSection(props: SectionProps) {
  const { service, update, blockers } = props;
  return (
    <>
      <BuilderBlock title="Pricing model">
        <FormField
          label="Currency"
          description="One currency per Service. Prices aren't converted if you change it."
        >
          <Select
            items={CURRENCIES}
            value={service.currency}
            onValueChange={(v) => update((s) => ({ ...s, currency: v as Currency }))}
          >
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
        <SelectionCardGroup
          legend="How is this Service priced?"
          columns={2}
          value={service.pricingMode}
          onValueChange={(v) => update((s) => ({ ...s, pricingMode: v as PricingMode }))}
        >
          {PRICING_MODES.map((m) => (
            <SelectionCard
              key={m.value}
              value={m.value}
              title={m.title}
              description={m.description}
            />
          ))}
        </SelectionCardGroup>
        {service.pricingMode === "FIXED" && (
          <MoneyField
            label="Price"
            className="sm:max-w-sm"
            currency={service.currency}
            value={service.baseAmountMinor}
            onChange={(v) => update((s) => ({ ...s, baseAmountMinor: v }))}
            error={codeError(blockers, "BASE_PRICE_REQUIRED")}
          />
        )}
        {service.pricingMode === "STARTING_FROM" && (
          <MoneyField
            label="Starting price"
            className="sm:max-w-sm"
            description={'Clients see "Starting from" until you both agree the final price.'}
            currency={service.currency}
            value={service.baseAmountMinor}
            onChange={(v) => update((s) => ({ ...s, baseAmountMinor: v }))}
            error={codeError(blockers, "MINIMUM_PRICE_REQUIRED")}
          />
        )}
        {service.pricingMode === "CUSTOM_QUOTE" && (
          <Note>
            Clients send a Request with their Brief, and you reply with a quote. Nothing is agreed
            until the Client accepts it.
          </Note>
        )}
        {codeError(blockers, "PACKAGE_REQUIRED") && (
          <p className="text-body-sm font-medium text-danger">
            {codeError(blockers, "PACKAGE_REQUIRED")}
          </p>
        )}
        {codeError(blockers, "QUANTITY_RULE_REQUIRED") && (
          <p className="text-body-sm font-medium text-danger">
            {codeError(blockers, "QUANTITY_RULE_REQUIRED")}
          </p>
        )}
      </BuilderBlock>
      {service.pricingMode === "PACKAGE" && <PackagesEditor {...props} />}
      {service.pricingMode !== "CUSTOM_QUOTE" && <UnitsEditor {...props} />}
      {service.pricingMode !== "CUSTOM_QUOTE" && <ChargesEditor {...props} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Scope (SRV-017, D-036)
// ---------------------------------------------------------------------------

export function ScopeSection({ service, update, blockers }: SectionProps) {
  const items = service.deliverables;
  const packages = service.packages;
  const patch = (id: string, change: Partial<(typeof items)[number]>) =>
    update((s) => ({
      ...s,
      deliverables: s.deliverables.map((d) => (d.id === id ? { ...d, ...change } : d)),
    }));
  const packageItems = [
    { value: "ALL", label: "Every package" },
    ...packages.map((p) => ({ value: p.id, label: p.name || "Untitled package" })),
  ];

  return (
    <BuilderBlock
      title="Deliverables"
      description={
        service.pricingMode === "CUSTOM_QUOTE"
          ? "Optional for a custom quote: you'll set the scope in your proposal. Listing typical deliverables helps Clients."
          : "What the Client receives. Be specific: these become the agreed scope."
      }
    >
      {codeError(blockers, "DELIVERABLES_REQUIRED") && (
        <p className="text-body-sm font-medium text-danger">
          {codeError(blockers, "DELIVERABLES_REQUIRED")}
        </p>
      )}
      {items.length > 0 && (
        <ol className="flex flex-col gap-4">
          {items.map((d, i) => (
            <ListItem
              key={d.id}
              title={d.name}
              index={i}
              count={items.length}
              onMove={(delta) =>
                update((s) => ({ ...s, deliverables: reorder(moveItem(s.deliverables, i, delta)) }))
              }
              onRemove={() =>
                update((s) => ({
                  ...s,
                  deliverables: reorder(s.deliverables.filter((x) => x.id !== d.id)),
                }))
              }
            >
              <FormField label="Deliverable" required>
                <Input
                  value={d.name}
                  maxLength={80}
                  placeholder="For example, primary logo and variations"
                  onChange={(e) => patch(d.id, { name: e.target.value })}
                />
              </FormField>
              <FormField label="Details" optional>
                <Textarea
                  rows={2}
                  maxLength={240}
                  value={d.description ?? ""}
                  onChange={(e) => patch(d.id, { description: e.target.value || null })}
                />
              </FormField>
              {service.pricingMode === "PACKAGE" && packages.length > 0 && (
                <FormField label="Included in">
                  <Select
                    items={packageItems}
                    value={d.packageId ?? "ALL"}
                    onValueChange={(v) =>
                      patch(d.id, { packageId: v === "ALL" ? null : (v as string) })
                    }
                  >
                    <SelectTrigger className="sm:max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {packageItems.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            </ListItem>
          ))}
        </ol>
      )}
      <AddButton
        onClick={() =>
          update((s) => ({
            ...s,
            deliverables: [
              ...s.deliverables,
              {
                id: newItemId("d"),
                packageId: null,
                name: "",
                description: null,
                displayOrder: s.deliverables.length + 1,
              },
            ],
          }))
        }
      >
        Add deliverable
      </AddButton>
    </BuilderBlock>
  );
}

// ---------------------------------------------------------------------------
// Add-ons and Options (SRV-018, SRV-019, SRV-021)
// ---------------------------------------------------------------------------

function requirementOf(service: Service, addOnId: string): string {
  const dep = service.dependencies.find(
    (d) => d.dependent.type === "ADDON" && d.dependent.id === addOnId,
  );
  return dep ? `${dep.prerequisite.type}:${dep.prerequisite.id}` : "NONE";
}

export function AddOnsOptionsSection({ service, update, blockers }: SectionProps) {
  const patchAddOn = (id: string, change: Partial<AddOn>) =>
    update((s) => ({ ...s, addOns: s.addOns.map((a) => (a.id === id ? { ...a, ...change } : a)) }));
  const setRequirement = (addOnId: string, value: string) =>
    update((s) => {
      const others = s.dependencies.filter(
        (d) => !(d.dependent.type === "ADDON" && d.dependent.id === addOnId),
      );
      if (value === "NONE") return { ...s, dependencies: others };
      const [type, id] = value.split(":") as ["ADDON" | "PACKAGE", string];
      const dep: DependencyConfig = {
        prerequisite: { type, id },
        dependent: { type: "ADDON", id: addOnId },
      };
      return { ...s, dependencies: [...others, dep] };
    });

  return (
    <>
      <BuilderBlock
        title="Add-ons"
        description="Optional extras with their own price. Clients see the price before they add one."
      >
        {codeError(blockers, "BROKEN_DEPENDENCY") && (
          <p className="text-body-sm font-medium text-danger">
            {codeError(blockers, "BROKEN_DEPENDENCY")}
          </p>
        )}
        {service.addOns.length > 0 && (
          <ol className="flex flex-col gap-4">
            {service.addOns.map((a, i) => {
              const requirementItems = [
                { value: "NONE", label: "Nothing" },
                ...service.addOns
                  .filter((x) => x.id !== a.id)
                  .map((x) => ({ value: `ADDON:${x.id}`, label: x.name || "Untitled add-on" })),
                ...(service.pricingMode === "PACKAGE"
                  ? service.packages.map((p) => ({
                      value: `PACKAGE:${p.id}`,
                      label: `${p.name || "Untitled"} package`,
                    }))
                  : []),
              ];
              return (
                <ListItem
                  key={a.id}
                  title={a.name}
                  index={i}
                  count={service.addOns.length}
                  onMove={(d) =>
                    update((s) => ({ ...s, addOns: reorder(moveItem(s.addOns, i, d)) }))
                  }
                  onRemove={() =>
                    update((s) => ({
                      ...s,
                      addOns: reorder(s.addOns.filter((x) => x.id !== a.id)),
                      dependencies: s.dependencies.filter(
                        (d) => d.prerequisite.id !== a.id && d.dependent.id !== a.id,
                      ),
                      packages: s.packages.map((p) =>
                        p.eligibleAddOnIds
                          ? {
                              ...p,
                              eligibleAddOnIds: p.eligibleAddOnIds.filter((id) => id !== a.id),
                            }
                          : p,
                      ),
                    }))
                  }
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Add-on name" required>
                      <Input
                        value={a.name}
                        maxLength={60}
                        onChange={(e) => patchAddOn(a.id, { name: e.target.value })}
                      />
                    </FormField>
                    <MoneyField
                      label={a.allowsQuantity ? "Price each" : "Price"}
                      currency={service.currency}
                      value={a.amountMinor || null}
                      onChange={(v) => patchAddOn(a.id, { amountMinor: v ?? 0n })}
                      error={errorFor(blockers, a.id)}
                    />
                  </div>
                  <FormField label="Description" optional>
                    <Textarea
                      rows={2}
                      maxLength={200}
                      value={a.description ?? ""}
                      onChange={(e) => patchAddOn(a.id, { description: e.target.value || null })}
                    />
                  </FormField>
                  <FormField
                    label="Clients choose a quantity"
                    description="For example, a number of extra templates."
                    orientation="horizontal"
                  >
                    <Switch
                      checked={a.allowsQuantity}
                      onCheckedChange={(on) =>
                        patchAddOn(a.id, {
                          allowsQuantity: on,
                          minimumQuantity: on ? 1 : undefined,
                          maximumQuantity: undefined,
                        })
                      }
                    />
                  </FormField>
                  {a.allowsQuantity && (
                    <div className="grid grid-cols-2 gap-4 sm:max-w-md">
                      <FormField label="Minimum">
                        <NumberInput
                          min={1}
                          value={a.minimumQuantity ?? 1}
                          onValueChange={(v) => patchAddOn(a.id, { minimumQuantity: v ?? 1 })}
                        />
                      </FormField>
                      <FormField label="Maximum" optional>
                        <NumberInput
                          min={1}
                          value={a.maximumQuantity ?? null}
                          onValueChange={(v) =>
                            patchAddOn(a.id, { maximumQuantity: v ?? undefined })
                          }
                        />
                      </FormField>
                    </div>
                  )}
                  {requirementItems.length > 1 && (
                    <FormField
                      label="Requires"
                      description="Clients must choose this first. For example, social templates require brand guidelines."
                    >
                      <Select
                        items={requirementItems}
                        value={requirementOf(service, a.id)}
                        onValueChange={(v) => setRequirement(a.id, v as string)}
                      >
                        <SelectTrigger className="sm:max-w-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {requirementItems.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}
                  <FormField
                    label="Offer this add-on"
                    description="Turn off to hide it from new Requests without deleting it."
                    orientation="horizontal"
                  >
                    <Switch
                      checked={a.active}
                      onCheckedChange={(on) => patchAddOn(a.id, { active: on })}
                    />
                  </FormField>
                </ListItem>
              );
            })}
          </ol>
        )}
        <AddButton
          onClick={() =>
            update((s) => ({
              ...s,
              addOns: [
                ...s.addOns,
                {
                  id: newItemId("ao"),
                  name: "",
                  description: null,
                  amountMinor: 0n,
                  allowsQuantity: false,
                  active: true,
                  displayOrder: s.addOns.length + 1,
                },
              ],
            }))
          }
        >
          Add add-on
        </AddButton>
      </BuilderBlock>
      <OptionsEditor service={service} update={update} blockers={blockers} />
    </>
  );
}

function OptionsEditor({
  service,
  update,
  blockers,
}: Pick<SectionProps, "service" | "update" | "blockers">) {
  type Group = Service["optionGroups"][number];
  const patchGroup = (id: string, fn: (g: Group) => Group) =>
    update((s) => ({ ...s, optionGroups: s.optionGroups.map((g) => (g.id === id ? fn(g) : g)) }));

  return (
    <BuilderBlock
      title="Options"
      description="Choices the Client makes, such as which platform to build on. An option can be free or add to the price."
    >
      {service.optionGroups.length > 0 && (
        <ol className="flex flex-col gap-4">
          {service.optionGroups.map((g, i) => (
            <ListItem
              key={g.id}
              title={g.label}
              index={i}
              count={service.optionGroups.length}
              removeLabel="Remove choice"
              onMove={(d) =>
                update((s) => ({ ...s, optionGroups: moveItem(s.optionGroups, i, d) }))
              }
              onRemove={() =>
                update((s) => ({
                  ...s,
                  optionGroups: s.optionGroups.filter((x) => x.id !== g.id),
                  dependencies: s.dependencies.filter(
                    (d) =>
                      !g.options.some((o) => o.id === d.prerequisite.id || o.id === d.dependent.id),
                  ),
                }))
              }
            >
              <FormField label="Question for the Client" required>
                <Input
                  value={g.label}
                  maxLength={80}
                  placeholder="For example, Website platform"
                  onChange={(e) => patchGroup(g.id, (x) => ({ ...x, label: e.target.value }))}
                />
              </FormField>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                <FormFieldset legend="Clients can choose">
                  <RadioGroup
                    value={g.selectionMode}
                    onValueChange={(v) =>
                      patchGroup(g.id, (x) => ({ ...x, selectionMode: v as "SINGLE" | "MULTIPLE" }))
                    }
                  >
                    <RadioItem value="SINGLE" label="One option" />
                    <RadioItem value="MULTIPLE" label="Several options" />
                  </RadioGroup>
                </FormFieldset>
                <FormField label="Clients must answer" orientation="horizontal">
                  <Switch
                    checked={g.required}
                    onCheckedChange={(on) => patchGroup(g.id, (x) => ({ ...x, required: on }))}
                  />
                </FormField>
              </div>
              <FormFieldset
                legend="Options"
                description="Leave the extra cost empty for a free option."
                error={errorFor(blockers, g.id)}
              >
                <ul className="flex flex-col gap-3">
                  {g.options.map((o, oi) => (
                    <li
                      key={o.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
                    >
                      <FormField label={`Option ${oi + 1}`}>
                        <Input
                          value={o.label}
                          maxLength={60}
                          onChange={(e) =>
                            patchGroup(g.id, (x) => ({
                              ...x,
                              options: x.options.map((y) =>
                                y.id === o.id ? { ...y, label: e.target.value } : y,
                              ),
                            }))
                          }
                        />
                      </FormField>
                      <MoneyField
                        label={`Extra cost for option ${oi + 1}`}
                        className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto"
                        currency={service.currency}
                        value={o.priceModifierMinor || null}
                        optional
                        onChange={(v) =>
                          patchGroup(g.id, (x) => ({
                            ...x,
                            options: x.options.map((y) =>
                              y.id === o.id ? { ...y, priceModifierMinor: v ?? 0n } : y,
                            ),
                          }))
                        }
                      />
                      <IconButton
                        variant="ghost"
                        label={`Remove ${o.label || `option ${oi + 1}`}`}
                        icon={<Trash2 />}
                        className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto"
                        onClick={() =>
                          patchGroup(g.id, (x) => ({
                            ...x,
                            options: x.options.filter((y) => y.id !== o.id),
                          }))
                        }
                      />
                    </li>
                  ))}
                </ul>
                <AddButton
                  onClick={() =>
                    patchGroup(g.id, (x) => ({
                      ...x,
                      options: [
                        ...x.options,
                        { id: newItemId("opt"), label: "", priceModifierMinor: 0n },
                      ],
                    }))
                  }
                >
                  Add option
                </AddButton>
              </FormFieldset>
            </ListItem>
          ))}
        </ol>
      )}
      <AddButton
        onClick={() =>
          update((s) => ({
            ...s,
            optionGroups: [
              ...s.optionGroups,
              {
                id: newItemId("og"),
                label: "",
                selectionMode: "SINGLE",
                required: true,
                options: [],
              },
            ],
          }))
        }
      >
        Add choice
      </AddButton>
    </BuilderBlock>
  );
}

// ---------------------------------------------------------------------------
// Delivery and Revisions (SRV-022, SRV-023)
// ---------------------------------------------------------------------------

export function DeliveryRevisionsSection({ service, update, blockers }: SectionProps) {
  const standard = service.deliveryOptions.find((d) => d.isStandard);
  const faster = service.deliveryOptions.filter((d) => !d.isStandard);
  type Option = Service["deliveryOptions"][number];
  const patchOption = (id: string, change: Partial<Option>) =>
    update((s) => ({
      ...s,
      deliveryOptions: s.deliveryOptions.map((d) => (d.id === id ? { ...d, ...change } : d)),
    }));

  return (
    <>
      <BuilderBlock
        title="Delivery"
        description={
          service.pricingMode === "PACKAGE"
            ? "Your usual turnaround. Each package also has its own, set in Pricing."
            : "Your usual turnaround, and faster options Clients can pay more for."
        }
      >
        {standard ? (
          <TurnaroundField
            label="Standard turnaround"
            value={standard.turnaround}
            onChange={(turnaround) => patchOption(standard.id, { turnaround })}
            error={codeError(blockers, "TURNAROUND_REQUIRED")}
          />
        ) : (
          <Button
            variant="secondary"
            className="self-start"
            onClick={() =>
              update((s) => ({
                ...s,
                deliveryOptions: [
                  {
                    id: newItemId("dl"),
                    label: "Standard",
                    isStandard: true,
                    modifier: null,
                    turnaround: { value: 0, unit: "BUSINESS_DAYS" },
                  },
                  ...s.deliveryOptions,
                ],
              }))
            }
          >
            Set a standard turnaround
          </Button>
        )}
        {faster.length > 0 && (
          <ol className="flex flex-col gap-4">
            {faster.map((d, i) => (
              <ListItem
                key={d.id}
                title={d.label}
                index={i}
                count={faster.length}
                onMove={(delta) =>
                  update((s) => {
                    const std = s.deliveryOptions.filter((x) => x.isStandard);
                    const rest = s.deliveryOptions.filter((x) => !x.isStandard);
                    return { ...s, deliveryOptions: [...std, ...moveItem(rest, i, delta)] };
                  })
                }
                onRemove={() =>
                  update((s) => ({
                    ...s,
                    deliveryOptions: s.deliveryOptions.filter((x) => x.id !== d.id),
                  }))
                }
              >
                <FormField label="Option name" required>
                  <Input
                    value={d.label}
                    maxLength={30}
                    onChange={(e) => patchOption(d.id, { label: e.target.value })}
                  />
                </FormField>
                <TurnaroundField
                  label="Turnaround"
                  value={d.turnaround}
                  onChange={(turnaround) => patchOption(d.id, { turnaround })}
                />
                <ModifierField
                  label="Extra cost"
                  currency={service.currency}
                  value={d.modifier}
                  error={errorFor(blockers, d.id)}
                  onChange={(modifier) => patchOption(d.id, { modifier })}
                />
              </ListItem>
            ))}
          </ol>
        )}
        {faster.length < 2 && (
          <AddButton
            onClick={() =>
              update((s) => ({
                ...s,
                deliveryOptions: [
                  ...s.deliveryOptions,
                  {
                    id: newItemId("dl"),
                    label: faster.some((f) => f.label === "Priority") ? "Rush" : "Priority",
                    isStandard: false,
                    modifier: { kind: "PERCENT", bps: 2_500 },
                    turnaround: { value: 1, unit: "WEEKS" },
                  },
                ],
              }))
            }
          >
            Add faster option
          </AddButton>
        )}
      </BuilderBlock>
      <BuilderBlock
        title="Revisions"
        description="How many rounds of changes are included. Shown to Clients before they submit."
      >
        <RevisionsField
          label="Included revisions"
          value={service.revisions.policy}
          error={codeError(blockers, "INVALID_REVISIONS")}
          onChange={(policy) => update((s) => ({ ...s, revisions: { ...s.revisions, policy } }))}
        />
        {service.revisions.policy.kind !== "UNLIMITED" && (
          <MoneyField
            label="Price per extra revision"
            optional
            className="sm:max-w-sm"
            description="Leave empty to agree extra revisions case by case."
            currency={service.currency}
            value={service.revisions.additionalRevisionAmountMinor}
            onChange={(v) =>
              update((s) => ({
                ...s,
                revisions: { ...s.revisions, additionalRevisionAmountMinor: v },
              }))
            }
          />
        )}
      </BuilderBlock>
    </>
  );
}

// ---------------------------------------------------------------------------
// Terms (SRV-024)
// ---------------------------------------------------------------------------

const TERMS_TEMPLATE = [
  "Work starts once the commitment payment is confirmed and the Project is started on Modgeto.",
  "Revision rounds are counted per Deliverable. Extra rounds are quoted separately.",
  "Final files are delivered after the full Project total is paid.",
  "Either party can end the Project with written notice. Work completed so far is billed.",
].join("\n\n");

export function TermsSection({ service, update, blockers }: SectionProps) {
  const live = service.publishedAt !== null;
  return (
    <BuilderBlock
      title="Your terms"
      description="Plain language works best. Clients review these before they submit a Request."
    >
      <FormField
        label="Terms"
        required
        error={codeError(blockers, "TERMS_REQUIRED")}
        description={
          live
            ? `Version ${service.terms.version}. Publishing changed terms creates a new version. Submitted Requests keep the version the Client reviewed.`
            : undefined
        }
      >
        <Textarea
          rows={12}
          maxLength={6000}
          showCount
          value={service.terms.content}
          onChange={(e) =>
            update((s) => ({ ...s, terms: { ...s.terms, content: e.target.value } }))
          }
        />
      </FormField>
      {!service.terms.content.trim() && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => update((s) => ({ ...s, terms: { ...s.terms, content: TERMS_TEMPLATE } }))}
        >
          Start from a template
        </Button>
      )}
    </BuilderBlock>
  );
}

// ---------------------------------------------------------------------------
// Commitment and Payment (SRV-025)
// ---------------------------------------------------------------------------

export function CommitmentPaymentSection({ service, update, blockers, ctx }: SectionProps) {
  const defaultBps = ctx.creative.defaultCommitmentBps;
  const active = ctx.paymentMethods.filter((m) => m.active);
  const needsMethod = service.commitment.mode !== "NONE";

  return (
    <>
      <BuilderBlock
        title="Commitment"
        description="The share of the price the Client pays before you start the Project."
      >
        <RadioGroup
          aria-label="Commitment"
          value={service.commitment.mode}
          onValueChange={(v) =>
            update((s) => ({
              ...s,
              commitment:
                v === "NONE"
                  ? { mode: "NONE" }
                  : v === "CUSTOM"
                    ? { mode: "CUSTOM", bps: defaultBps ?? 5_000 }
                    : { mode: "CREATIVE_DEFAULT", defaultBps: null },
            }))
          }
        >
          <RadioItem
            value="CREATIVE_DEFAULT"
            label={
              defaultBps !== null
                ? `Use my default (${formatPercent(defaultBps)})`
                : "Use my default"
            }
            description={
              defaultBps !== null
                ? "Changes if you update your default in Business Preferences."
                : "You haven't set a default yet."
            }
          />
          <RadioItem value="CUSTOM" label="A different percentage for this Service" />
          <RadioItem
            value="NONE"
            label="No commitment"
            description="Start without a payment first."
          />
        </RadioGroup>
        {codeError(blockers, "DEFAULT_COMMITMENT_MISSING") && (
          <p className="text-body-sm font-medium text-danger">
            Set a default in{" "}
            <TextLink href="/app/creative/settings/business">Business Preferences</TextLink>, or
            choose a different percentage.
          </p>
        )}
        {service.commitment.mode === "CUSTOM" && (
          <PercentField
            label="Commitment percentage"
            className="sm:max-w-xs"
            value={service.commitment.bps}
            error={codeError(blockers, "INVALID_COMMITMENT")}
            onChange={(bps) =>
              update((s) => ({ ...s, commitment: { mode: "CUSTOM", bps: bps ?? 0 } }))
            }
          />
        )}
      </BuilderBlock>
      <BuilderBlock
        title="Payment methods"
        description="Where Clients pay you. Modgeto doesn't collect Client Project payments: Clients pay you directly, and you confirm what arrives."
      >
        {active.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-foreground-secondary">
              You haven&apos;t added a payment method yet.
            </p>
            <ButtonLink
              href="/app/creative/settings/payment-methods"
              variant="secondary"
              size="sm"
              className="self-start"
            >
              Add a payment method
            </ButtonLink>
          </div>
        ) : (
          <FormFieldset
            legend="Show these methods to Clients"
            hideLegend
            optional={!needsMethod}
            error={codeError(blockers, "PAYMENT_METHOD_REQUIRED")}
          >
            <div className="flex flex-col gap-3">
              {active.map((m) => (
                <FormField key={m.id} label={m.label} orientation="horizontal">
                  <Checkbox
                    checked={service.paymentMethodIds.includes(m.id)}
                    onCheckedChange={(on) =>
                      update((s) => ({
                        ...s,
                        paymentMethodIds: on
                          ? [...s.paymentMethodIds, m.id]
                          : s.paymentMethodIds.filter((id) => id !== m.id),
                      }))
                    }
                  />
                </FormField>
              ))}
            </div>
          </FormFieldset>
        )}
      </BuilderBlock>
    </>
  );
}

// ---------------------------------------------------------------------------
// Work Samples (optional)
// ---------------------------------------------------------------------------

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function WorkSamplesSection({ service, update }: SectionProps) {
  type Sample = Service["workSamples"][number];
  const patch = (id: string, change: Partial<Sample>) =>
    update((s) => ({
      ...s,
      workSamples: s.workSamples.map((w) => (w.id === id ? { ...w, ...change } : w)),
    }));
  return (
    <BuilderBlock
      title="Work samples"
      description="Optional. Two to four strong examples help Clients decide."
    >
      {service.workSamples.length > 0 && (
        <ol className="flex flex-col gap-4">
          {service.workSamples.map((w, i) => (
            <ListItem
              key={w.id}
              title={w.title}
              index={i}
              count={service.workSamples.length}
              onMove={(d) =>
                update((s) => ({ ...s, workSamples: reorder(moveItem(s.workSamples, i, d)) }))
              }
              onRemove={() =>
                update((s) => ({
                  ...s,
                  workSamples: reorder(s.workSamples.filter((x) => x.id !== w.id)),
                }))
              }
            >
              <FormField label="Title" required>
                <Input
                  value={w.title}
                  maxLength={80}
                  onChange={(e) => patch(w.id, { title: e.target.value })}
                />
              </FormField>
              <FormField label="Description" optional>
                <Textarea
                  rows={2}
                  maxLength={240}
                  value={w.description ?? ""}
                  onChange={(e) => patch(w.id, { description: e.target.value || null })}
                />
              </FormField>
              <FormField
                label="Link to the work"
                optional
                error={
                  w.externalUrl && !isHttpUrl(w.externalUrl)
                    ? "Enter a full link starting with https://."
                    : null
                }
              >
                <Input
                  type="url"
                  inputMode="url"
                  value={w.externalUrl ?? ""}
                  placeholder="https://"
                  onChange={(e) => patch(w.id, { externalUrl: e.target.value || null })}
                />
              </FormField>
              <CoverField
                label="Image"
                description="JPG, PNG or WebP."
                value={w.imageUrl}
                onChange={(imageUrl) => patch(w.id, { imageUrl })}
              />
            </ListItem>
          ))}
        </ol>
      )}
      <AddButton
        onClick={() =>
          update((s) => ({
            ...s,
            workSamples: [
              ...s.workSamples,
              {
                id: newItemId("ws"),
                title: "",
                description: null,
                imageUrl: null,
                externalUrl: null,
                displayOrder: s.workSamples.length + 1,
              },
            ],
          }))
        }
      >
        Add work sample
      </AddButton>
    </BuilderBlock>
  );
}
