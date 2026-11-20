/**
 * Service Builder read model (docs/04 §12, docs/06 §53–58, PRD SRV-016–025).
 * Pure, so section states, slugs and defaults are unit-tested.
 */
import {
  BUILDER_SECTIONS,
  type BuilderSection,
  type PublishBlocker,
  publishBlockers,
} from "@/lib/domain";
import type { SectionProgress } from "@/components/ui/section-navigation";
import type { CreativeProfile, Service } from "@/types";
import { toServiceForPublish } from "./model";

export const SECTION_META: Record<BuilderSection, { label: string; description: string }> = {
  basics: {
    label: "Basics",
    description: "Name, description, category and cover. This is what Clients see first.",
  },
  pricing: {
    label: "Pricing",
    description: "Choose how this Service is priced. Clients see the price before they choose.",
  },
  scope: {
    label: "Scope",
    description: "List what the Client receives. Deliverables become the agreed scope.",
  },
  "addons-options": {
    label: "Add-ons and Options",
    description: "Extras the Client can add, and choices they make while configuring.",
  },
  "delivery-revisions": {
    label: "Delivery and Revisions",
    description: "Your standard turnaround, faster options, and how many revisions are included.",
  },
  brief: {
    label: "Client Brief",
    description:
      "The questions a Client answers before submitting a Request. Answers don't change the price.",
  },
  terms: {
    label: "Terms",
    description: "Your commercial and working terms. Clients review them before submitting.",
  },
  "commitment-payment": {
    label: "Commitment and Payment",
    description:
      "How much the Client pays before you start, and where. Modgeto doesn't collect Client Project payments.",
  },
  "work-samples": {
    label: "Work Samples",
    description: "Show relevant work on this Service's page.",
  },
  "preview-publish": {
    label: "Preview and Publish",
    description: "Check what Clients will see, then publish.",
  },
};

/** Sections a Service can publish without filling in. */
const OPTIONAL_SECTIONS: readonly BuilderSection[] = ["addons-options", "brief", "work-samples"];

export function isBuilderSection(value: string | null | undefined): value is BuilderSection {
  return (BUILDER_SECTIONS as readonly string[]).includes(value ?? "");
}

/**
 * Publish problems. Pass the Creative's offered payment method ids so a
 * removed or paused method no longer counts towards SRV-025.
 */
export function blockersFor(
  service: Service,
  creative: CreativeProfile,
  offeredMethodIds?: readonly string[],
): PublishBlocker[] {
  const input = toServiceForPublish(service, creative);
  if (offeredMethodIds) {
    input.selectedPaymentMethodCount = service.paymentMethodIds.filter((id) =>
      offeredMethodIds.includes(id),
    ).length;
  }
  return publishBlockers(input);
}

/** Whether an optional section has any content yet. */
function hasContent(service: Service, section: BuilderSection): boolean {
  if (section === "addons-options") {
    return service.addOns.length > 0 || service.optionGroups.length > 0;
  }
  if (section === "brief") return service.brief.sections.length > 0;
  if (section === "work-samples") return service.workSamples.length > 0;
  return true;
}

/**
 * Builder states (docs/06 §55): a section with problems shows "Needs attention"
 * once the Creative has opened it, and "Incomplete" before that, so a new
 * draft isn't covered in warnings.
 */
export function sectionProgress(
  service: Service,
  blockers: readonly PublishBlocker[],
  visited: readonly string[],
): Record<Exclude<BuilderSection, "preview-publish">, SectionProgress> {
  const result = {} as Record<Exclude<BuilderSection, "preview-publish">, SectionProgress>;
  for (const section of BUILDER_SECTIONS) {
    if (section === "preview-publish") continue;
    const problems = blockers.some((b) => b.section === section);
    if (problems) result[section] = visited.includes(section) ? "attention" : "incomplete";
    else if (OPTIONAL_SECTIONS.includes(section) && !hasContent(service, section)) {
      result[section] = "optional";
    } else result[section] = "complete";
  }
  return result;
}

/** "Brand Identity & Logo!" → "brand-identity-logo". */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Unique within the Creative's profile (SRV-013): adds -2, -3… when taken. */
export function uniqueSlug(base: string, taken: readonly string[]): string {
  const root = base || "service";
  if (!taken.includes(root)) return root;
  let n = 2;
  while (taken.includes(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

/** A blank Draft. Drafts need no paid capacity (SRV-002). */
export function newServiceDraft({
  id,
  creative,
  now,
  displayOrder,
}: {
  id: string;
  creative: CreativeProfile;
  now: string;
  displayOrder: number;
}): Service {
  return {
    id,
    creativeId: creative.userId,
    categoryId: null,
    name: "",
    slug: "",
    shortDescription: "",
    detailedDescription: null,
    coverImageUrl: null,
    currency: creative.defaultCurrency,
    pricingMode: "FIXED",
    baseAmountMinor: null,
    packages: [],
    deliverables: [],
    quantityRules: [],
    addOns: [],
    optionGroups: [],
    deliveryOptions: [
      {
        id: "dl-standard",
        label: "Standard",
        isStandard: true,
        modifier: null,
        turnaround: { value: 0, unit: "BUSINESS_DAYS" },
      },
    ],
    dependencies: [],
    charges: [],
    revisions: { policy: { kind: "FIXED", count: 2 }, additionalRevisionAmountMinor: null },
    terms: { content: "", version: 1, updatedAt: now },
    brief: { sections: [] },
    commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
    paymentMethodIds: [],
    workSamples: [],
    lifecycle: "DRAFT",
    moderation: "NORMAL",
    displayOrder,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}

/**
 * Duplicate as a new Draft (SRV-015). Configuration is copied; Clients,
 * Requests, Projects and work samples are not.
 */
export function duplicateService(
  source: Service,
  { id, now, takenSlugs }: { id: string; now: string; takenSlugs: readonly string[] },
): Service {
  return {
    ...source,
    id,
    name: `${source.name} (copy)`,
    slug: uniqueSlug(`${source.slug}-copy`, takenSlugs),
    lifecycle: "DRAFT",
    moderation: "NORMAL",
    workSamples: [],
    terms: { ...source.terms, version: 1, updatedAt: now },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}

/** Moves an item one place up or down; out-of-range moves return the list unchanged. */
export function moveItem<T>(list: readonly T[], index: number, delta: -1 | 1): T[] {
  const next = [...list];
  const target = index + delta;
  if (index < 0 || index >= next.length || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** True when the edited Service differs from the live one (bigint-safe). */
export function hasChanges(a: Service, b: Service): boolean {
  const key = (s: Service) =>
    JSON.stringify({ ...s, updatedAt: null }, (_, v) => (typeof v === "bigint" ? `${v}n` : v));
  return key(a) !== key(b);
}

/** Services created in this browser before Phase 8 have "local-" ids. */
export const isLocalId = (id: string) => id.startsWith("local-");
export const newLocalId = () => `local-${crypto.randomUUID()}`;
