/**
 * Fixture Services. Ada's Services cover every pricing mode and lifecycle state;
 * the others add USD, GBP and EUR, a VAT charge, no-commitment pricing and
 * Platform Disabled moderation.
 */
import { type Brief, type Currency, major } from "@/lib/domain";
import type { Service, ServiceTerms } from "@/types";
import { daysAgo } from "./time";

const amount = (n: number, currency: Currency) => major(n, currency).amountMinor;
const NGN = (n: number) => amount(n, "NGN");

function terms(content: string, version = 1): ServiceTerms {
  return { content, version, updatedAt: daysAgo(60) };
}

const STANDARD_TERMS = terms(
  [
    "Work starts once the commitment payment is confirmed and the Project is started on Modgeto.",
    "Revision rounds are counted per Deliverable. Extra rounds are quoted separately.",
    "Final files are delivered after the full Project total is paid outside Modgeto.",
    "Either party can end the Project with written notice. Work completed so far is billed.",
  ].join("\n\n"),
);

/** Every question type, a visual selection and a one-level condition (BRF-002–005). */
const brandBrief: Brief = {
  sections: [
    {
      id: "bs-business",
      title: "Your business",
      questions: [
        { id: "q-name", type: "SHORT_TEXT", label: "Business or brand name", required: true },
        {
          id: "q-about",
          type: "LONG_TEXT",
          label: "What does your business do, and for whom?",
          required: true,
        },
        { id: "q-site", type: "URL", label: "Current website or social page", required: false },
        {
          id: "q-stage",
          type: "DROPDOWN",
          label: "Where is the business today?",
          required: true,
          choices: [
            { id: "idea", label: "Still an idea" },
            { id: "launching", label: "Launching in the next 3 months" },
            { id: "trading", label: "Already trading" },
          ],
        },
        {
          id: "q-team",
          type: "NUMBER",
          label: "How many people work on the brand?",
          required: false,
        },
      ],
    },
    {
      id: "bs-identity",
      title: "Current identity",
      questions: [
        {
          id: "q-has-logo",
          type: "SINGLE_CHOICE",
          label: "Do you have an existing logo?",
          required: true,
          choices: [
            { id: "yes", label: "Yes" },
            { id: "no", label: "No" },
          ],
        },
        {
          id: "q-logo-file",
          type: "FILE",
          label: "Upload your current logo",
          required: true,
          condition: { sourceQuestionId: "q-has-logo", equals: "yes" },
        },
        {
          id: "q-assets",
          type: "MULTIPLE_FILE",
          label: "Any other brand material",
          required: false,
        },
      ],
    },
    {
      id: "bs-direction",
      title: "Direction",
      questions: [
        {
          id: "q-directions",
          type: "VISUAL_SELECTION",
          label: "Which logo directions resonate with you?",
          required: true,
          allowMultiple: true,
          visualExamples: [
            { id: "wordmark", label: "Wordmark: the name set in a distinctive typeface" },
            { id: "lettermark", label: "Lettermark: initials as a compact symbol" },
            { id: "emblem", label: "Emblem: name enclosed in a badge or crest" },
            { id: "abstract", label: "Abstract mark: a geometric symbol beside the name" },
          ],
        },
        {
          id: "q-why",
          type: "LONG_TEXT",
          label: "What do you like about the directions you chose?",
          required: false,
        },
        {
          id: "q-values",
          type: "MULTIPLE_CHOICE",
          label: "Which words should people associate with the brand?",
          required: true,
          choices: [
            { id: "trustworthy", label: "Trustworthy" },
            { id: "playful", label: "Playful" },
            { id: "premium", label: "Premium" },
            { id: "bold", label: "Bold" },
            { id: "calm", label: "Calm" },
          ],
        },
      ],
    },
  ],
};

const simpleBrief = (prefix: string): Brief => ({
  sections: [
    {
      id: `${prefix}-s1`,
      title: "About the Project",
      questions: [
        {
          id: `${prefix}-goal`,
          type: "LONG_TEXT",
          label: "What should this Project achieve?",
          required: true,
        },
        { id: `${prefix}-link`, type: "URL", label: "Link to anything relevant", required: false },
      ],
    },
  ],
});

type ServiceSeed = Omit<Service, "createdAt" | "updatedAt" | "displayOrder" | "moderation"> &
  Partial<Pick<Service, "moderation">>;

function service(seed: ServiceSeed, displayOrder: number, createdDaysAgo: number): Service {
  return {
    moderation: "NORMAL",
    ...seed,
    displayOrder,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(Math.max(createdDaysAgo - 10, 1)),
  };
}

const empty = {
  packages: [],
  deliverables: [],
  quantityRules: [],
  addOns: [],
  optionGroups: [],
  dependencies: [],
  charges: [],
  workSamples: [],
};

export const services: Service[] = [
  // ---------------------------------------------------------------- Ada (NGN)
  service(
    {
      id: "svc-brand-identity",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Brand Identity",
      slug: "brand-identity",
      shortDescription: "A complete identity system: logo, colour, type and the rules to use them.",
      detailedDescription:
        "We start with a short discovery call, explore three directions, then refine one into a system your team can use everywhere.",
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "PACKAGE",
      baseAmountMinor: null,
      packages: [
        {
          id: "pkg-essential",
          name: "Essential",
          description: "A logo and colour palette to launch with.",
          amountMinor: NGN(250_000),
          recommended: false,
          turnaround: { value: 2, unit: "WEEKS" },
          revisions: { kind: "FIXED", count: 1 },
          eligibleAddOnIds: ["ao-guidelines", "ao-stationery"],
          displayOrder: 1,
        },
        {
          id: "pkg-standard",
          name: "Standard",
          description: "The full identity with typography and core applications.",
          amountMinor: NGN(450_000),
          recommended: true,
          turnaround: { value: 3, unit: "WEEKS" },
          revisions: { kind: "FIXED", count: 2 },
          displayOrder: 2,
        },
        {
          id: "pkg-complete",
          name: "Complete",
          description: "Identity, guidelines and a launch kit for social and print.",
          amountMinor: NGN(700_000),
          recommended: false,
          turnaround: { value: 5, unit: "WEEKS" },
          revisions: { kind: "FIXED", count: 3 },
          displayOrder: 3,
        },
      ],
      deliverables: [
        {
          id: "d-logo",
          packageId: null,
          name: "Primary logo and variations",
          description: null,
          displayOrder: 1,
        },
        {
          id: "d-colour",
          packageId: null,
          name: "Colour palette",
          description: null,
          displayOrder: 2,
        },
        {
          id: "d-type",
          packageId: "pkg-standard",
          name: "Typography system",
          description: null,
          displayOrder: 3,
        },
        {
          id: "d-type-c",
          packageId: "pkg-complete",
          name: "Typography system",
          description: null,
          displayOrder: 3,
        },
        {
          id: "d-launch",
          packageId: "pkg-complete",
          name: "Launch kit",
          description: "Social and print templates.",
          displayOrder: 4,
        },
      ],
      quantityRules: [
        {
          id: "qr-concepts",
          unitName: "Extra logo concept",
          unitAmountMinor: NGN(25_000),
          minimum: 0,
          maximum: 5,
          defaultQuantity: 0,
        },
      ],
      addOns: [
        {
          id: "ao-guidelines",
          name: "Brand guidelines",
          description: "A 20-page PDF guide.",
          amountMinor: NGN(80_000),
          allowsQuantity: false,
          active: true,
          displayOrder: 1,
        },
        {
          id: "ao-social",
          name: "Social templates",
          description: "Editable templates, priced per template.",
          amountMinor: NGN(15_000),
          allowsQuantity: true,
          minimumQuantity: 1,
          maximumQuantity: 10,
          active: true,
          displayOrder: 2,
        },
        {
          id: "ao-stationery",
          name: "Stationery set",
          description: "Business card, letterhead and email signature.",
          amountMinor: NGN(40_000),
          allowsQuantity: false,
          active: true,
          displayOrder: 3,
        },
      ],
      optionGroups: [
        {
          id: "og-use",
          label: "Primary use",
          selectionMode: "SINGLE",
          required: true,
          options: [
            { id: "opt-digital", label: "Digital first", priceModifierMinor: 0n },
            { id: "opt-print", label: "Print and digital", priceModifierMinor: NGN(50_000) },
          ],
        },
      ],
      deliveryOptions: [
        {
          id: "dl-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 3, unit: "WEEKS" },
        },
        {
          id: "dl-priority",
          label: "Priority",
          isStandard: false,
          modifier: { kind: "FIXED", amountMinor: NGN(50_000) },
          turnaround: { value: 2, unit: "WEEKS" },
        },
        {
          id: "dl-rush",
          label: "Rush",
          isStandard: false,
          modifier: { kind: "PERCENT", bps: 2_500 },
          turnaround: { value: 1, unit: "WEEKS" },
        },
      ],
      dependencies: [
        {
          prerequisite: { type: "ADDON", id: "ao-guidelines" },
          dependent: { type: "ADDON", id: "ao-social" },
        },
      ],
      charges: [],
      revisions: {
        policy: { kind: "FIXED", count: 2 },
        additionalRevisionAmountMinor: NGN(30_000),
      },
      terms: STANDARD_TERMS,
      brief: brandBrief,
      commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
      paymentMethodIds: ["pm-ada-bank", "pm-ada-paypal"],
      workSamples: [
        {
          id: "ws-1",
          title: "Okra Market identity",
          description: "Logo and packaging system.",
          imageUrl: null,
          externalUrl: null,
          displayOrder: 1,
        },
        {
          id: "ws-2",
          title: "Harbor Coffee rebrand",
          description: null,
          imageUrl: null,
          externalUrl: null,
          displayOrder: 2,
        },
      ],
      lifecycle: "PUBLISHED",
      publishedAt: daysAgo(100),
    },
    1,
    110,
  ),
  service(
    {
      ...empty,
      id: "svc-landing-page",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Landing Page Design",
      slug: "landing-page-design",
      shortDescription: "A conversion-focused landing page, designed and ready to build.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "STARTING_FROM",
      baseAmountMinor: NGN(300_000),
      deliverables: [
        {
          id: "d-lp-design",
          packageId: null,
          name: "Responsive page design",
          description: "Mobile, tablet and desktop.",
          displayOrder: 1,
        },
        {
          id: "d-lp-handoff",
          packageId: null,
          name: "Developer handoff",
          description: null,
          displayOrder: 2,
        },
      ],
      addOns: [
        {
          id: "ao-copy",
          name: "Copywriting",
          description: null,
          amountMinor: NGN(60_000),
          allowsQuantity: false,
          active: true,
          displayOrder: 1,
        },
        {
          id: "ao-page",
          name: "Extra page",
          description: "Priced per page.",
          amountMinor: NGN(40_000),
          allowsQuantity: true,
          minimumQuantity: 1,
          maximumQuantity: 5,
          active: true,
          displayOrder: 2,
        },
      ],
      optionGroups: [
        {
          // docs/03 §19 example
          id: "og-platform",
          label: "Website platform or tool",
          selectionMode: "SINGLE",
          required: true,
          options: [
            { id: "opt-figma", label: "Figma", priceModifierMinor: 0n },
            { id: "opt-webflow", label: "Webflow", priceModifierMinor: NGN(150_000) },
            { id: "opt-framer", label: "Framer", priceModifierMinor: NGN(120_000) },
            { id: "opt-wordpress", label: "WordPress", priceModifierMinor: NGN(180_000) },
            { id: "opt-unsure", label: "I'm not sure, recommend one", priceModifierMinor: 0n },
          ],
        },
      ],
      deliveryOptions: [
        {
          id: "dl-lp-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 2, unit: "WEEKS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 2 }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("lp"),
      commitment: { mode: "CUSTOM", bps: 4_000 },
      paymentMethodIds: ["pm-ada-bank"],
      lifecycle: "PUBLISHED",
      publishedAt: daysAgo(80),
    },
    2,
    85,
  ),
  service(
    {
      ...empty,
      id: "svc-design-retainer",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Design Retainer",
      slug: "design-retainer",
      shortDescription: "Ongoing design support, scoped and priced to your roadmap.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "CUSTOM_QUOTE",
      baseAmountMinor: null,
      deliveryOptions: [
        {
          id: "dl-rt-standard",
          label: "Monthly",
          isStandard: true,
          modifier: null,
          turnaround: { value: 4, unit: "WEEKS" },
        },
      ],
      revisions: { policy: { kind: "UNLIMITED" }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("rt"),
      commitment: { mode: "CUSTOM", bps: 3_000 },
      paymentMethodIds: ["pm-ada-bank", "pm-ada-paypal"],
      lifecycle: "PUBLISHED",
      publishedAt: daysAgo(60),
    },
    3,
    65,
  ),
  service(
    {
      ...empty,
      id: "svc-social-kit",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Social Media Kit",
      slug: "social-media-kit",
      shortDescription: "On-brand post designs, priced per post.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "QUANTITY",
      baseAmountMinor: null,
      deliverables: [
        {
          id: "d-posts",
          packageId: null,
          name: "Post designs",
          description: null,
          displayOrder: 1,
        },
      ],
      quantityRules: [
        {
          id: "qr-posts",
          unitName: "Post design",
          unitAmountMinor: NGN(15_000),
          minimum: 5,
          maximum: 30,
          defaultQuantity: 10,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-sk-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 10, unit: "BUSINESS_DAYS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 1 }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("sk"),
      commitment: { mode: "NONE" },
      paymentMethodIds: [],
      // Publicly visible but not taking Requests; still uses a slot (SRV-010).
      lifecycle: "UNAVAILABLE",
      publishedAt: daysAgo(50),
    },
    4,
    55,
  ),
  service(
    {
      ...empty,
      id: "svc-logo-refresh",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Logo Refresh",
      slug: "logo-refresh",
      shortDescription: "Modernise your existing logo without losing recognition.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "FIXED",
      baseAmountMinor: NGN(180_000),
      deliverables: [
        {
          id: "d-refresh",
          packageId: null,
          name: "Refreshed logo",
          description: null,
          displayOrder: 1,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-lr-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 10, unit: "BUSINESS_DAYS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 2 }, additionalRevisionAmountMinor: null },
      // Draft still being set up: no terms yet, so it has a publish blocker.
      terms: terms(""),
      brief: { sections: [] },
      commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
      paymentMethodIds: ["pm-ada-bank"],
      lifecycle: "DRAFT",
      publishedAt: null,
    },
    5,
    5,
  ),
  service(
    {
      ...empty,
      id: "svc-pitch-deck",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Pitch Deck Design",
      slug: "pitch-deck-design",
      shortDescription: "An investor deck that tells your story in twelve slides.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "FIXED",
      baseAmountMinor: NGN(220_000),
      deliverables: [
        {
          id: "d-deck",
          packageId: null,
          name: "12-slide deck",
          description: null,
          displayOrder: 1,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-pd-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 2, unit: "WEEKS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 2 }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("pd"),
      commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
      paymentMethodIds: ["pm-ada-bank"],
      // Lost its slot in an earlier downgrade; configuration kept (SRV-011).
      lifecycle: "SUBSCRIPTION_INACTIVE",
      publishedAt: daysAgo(90),
    },
    6,
    95,
  ),
  service(
    {
      ...empty,
      id: "svc-business-cards",
      creativeId: "u-ada",
      categoryId: "cat-design",
      name: "Business Cards",
      slug: "business-cards",
      shortDescription: "Retired Service kept for its Request history.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "NGN",
      pricingMode: "FIXED",
      baseAmountMinor: NGN(40_000),
      deliverables: [
        { id: "d-cards", packageId: null, name: "Card design", description: null, displayOrder: 1 },
      ],
      deliveryOptions: [
        {
          id: "dl-bc-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 5, unit: "BUSINESS_DAYS" },
        },
      ],
      revisions: { policy: { kind: "NONE" }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: { sections: [] },
      commitment: { mode: "NONE" },
      paymentMethodIds: [],
      lifecycle: "ARCHIVED",
      publishedAt: daysAgo(115),
    },
    7,
    116,
  ),

  // ---------------------------------------------------------------- Tunde (USD, Limited)
  service(
    {
      ...empty,
      id: "svc-webflow-build",
      creativeId: "u-tunde",
      categoryId: "cat-development",
      name: "Webflow Build",
      slug: "webflow-build",
      shortDescription: "Your approved design, built in Webflow with a CMS your team can edit.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "USD",
      pricingMode: "FIXED",
      baseAmountMinor: amount(1_800, "USD"),
      deliverables: [
        {
          id: "d-wf-site",
          packageId: null,
          name: "Webflow site",
          description: null,
          displayOrder: 1,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-wf-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 15, unit: "BUSINESS_DAYS" },
        },
      ],
      // Additional charge shown in the live price (D-011).
      charges: [{ id: "ch-vat", label: "VAT 7.5%", modifier: { kind: "PERCENT", bps: 750 } }],
      revisions: { policy: { kind: "FIXED", count: 1 }, additionalRevisionAmountMinor: null },
      terms: terms("Payment is due on delivery. No commitment payment is needed to start."),
      brief: simpleBrief("wf"),
      commitment: { mode: "NONE" },
      paymentMethodIds: [],
      lifecycle: "PUBLISHED",
      publishedAt: daysAgo(80),
    },
    1,
    85,
  ),

  // ---------------------------------------------------------------- Mira (GBP, Unavailable)
  service(
    {
      ...empty,
      id: "svc-website-copy",
      creativeId: "u-mira",
      categoryId: "cat-writing",
      name: "Website Copy",
      slug: "website-copy",
      shortDescription: "Homepage and core page copy written from a short interview.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "GBP",
      pricingMode: "FIXED",
      baseAmountMinor: amount(900, "GBP"),
      deliverables: [
        {
          id: "d-wc",
          packageId: null,
          name: "Copy for five pages",
          description: null,
          displayOrder: 1,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-wc-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 10, unit: "BUSINESS_DAYS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 2 }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("wc"),
      commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
      paymentMethodIds: ["pm-mira-bank"],
      lifecycle: "PUBLISHED",
      publishedAt: daysAgo(180),
    },
    1,
    190,
  ),
  service(
    {
      ...empty,
      id: "svc-case-study",
      creativeId: "u-mira",
      categoryId: "cat-writing",
      name: "Case Study",
      slug: "case-study",
      shortDescription: "A customer story written from one interview.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "GBP",
      pricingMode: "FIXED",
      baseAmountMinor: amount(450, "GBP"),
      deliverables: [
        {
          id: "d-cs",
          packageId: null,
          name: "Case study article",
          description: null,
          displayOrder: 1,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-cs-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 7, unit: "BUSINESS_DAYS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 1 }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("cs"),
      commitment: { mode: "CREATIVE_DEFAULT", defaultBps: null },
      paymentMethodIds: ["pm-mira-bank"],
      lifecycle: "PUBLISHED",
      moderation: "PLATFORM_DISABLED",
      publishedAt: daysAgo(170),
    },
    2,
    175,
  ),

  // ---------------------------------------------------------------- Sola (EUR) and Leo
  service(
    {
      ...empty,
      id: "svc-logo-animation",
      creativeId: "u-sola",
      categoryId: "cat-motion",
      name: "Logo Animation",
      slug: "logo-animation",
      shortDescription: "A five-second animated logo for intros and social.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "EUR",
      pricingMode: "FIXED",
      baseAmountMinor: amount(600, "EUR"),
      deliverables: [
        {
          id: "d-la",
          packageId: null,
          name: "Animated logo files",
          description: null,
          displayOrder: 1,
        },
      ],
      deliveryOptions: [
        {
          id: "dl-la-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 1, unit: "WEEKS" },
        },
      ],
      revisions: { policy: { kind: "FIXED", count: 2 }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("la"),
      commitment: { mode: "NONE" },
      paymentMethodIds: [],
      lifecycle: "PUBLISHED",
      publishedAt: daysAgo(140),
    },
    1,
    145,
  ),
  service(
    {
      ...empty,
      id: "svc-ux-audit",
      creativeId: "u-leo",
      categoryId: "cat-design",
      name: "UX Audit",
      slug: "ux-audit",
      shortDescription: "A prioritised review of your product's key flows.",
      detailedDescription: null,
      coverImageUrl: null,
      currency: "USD",
      pricingMode: "FIXED",
      baseAmountMinor: amount(1_200, "USD"),
      deliverables: [
        { id: "d-ux", packageId: null, name: "Audit report", description: null, displayOrder: 1 },
      ],
      deliveryOptions: [
        {
          id: "dl-ux-standard",
          label: "Standard",
          isStandard: true,
          modifier: null,
          turnaround: { value: 2, unit: "WEEKS" },
        },
      ],
      revisions: { policy: { kind: "NONE" }, additionalRevisionAmountMinor: null },
      terms: STANDARD_TERMS,
      brief: simpleBrief("ux"),
      commitment: { mode: "NONE" },
      paymentMethodIds: [],
      lifecycle: "DRAFT",
      publishedAt: null,
    },
    1,
    20,
  ),
];
