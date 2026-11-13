/**
 * One Request per reachable status, plus negotiation and payment variety.
 * ACCEPTED is never a resting status, and EXPIRED has no V1 timer (D-017), so
 * neither appears.
 */
import { type Answers, type Selection, major } from "@/lib/domain";
import type { CreativeProfile, Project, RequestDetail, Service } from "@/types";
import { type RequestSeed, type Step, buildRequest } from "./build-request";
import { creatives } from "./people";
import { services } from "./services";

const NGN = (n: number) => major(n, "NGN").amountMinor;
const svc = (id: string): Service => services.find((s) => s.id === id)!;
const creative = (userId: string): CreativeProfile => creatives.find((c) => c.userId === userId)!;

const brandAnswers = (name: string, about: string, hasLogo = false): Answers => ({
  "q-name": name,
  "q-about": about,
  "q-stage": hasLogo ? "trading" : "launching",
  "q-has-logo": hasLogo ? "yes" : "no",
  ...(hasLogo ? { "q-logo-file": ["asset-logo-" + name.toLowerCase().replace(/\W+/g, "-")] } : {}),
  "q-directions": ["wordmark", "abstract"],
  "q-why": "Clean, confident and easy to recognise at small sizes.",
  "q-values": ["trustworthy", "bold"],
});

const goal = (prefix: string, text: string): Answers => ({ [`${prefix}-goal`]: text });

type Seed = {
  id: string;
  title: string;
  serviceId: string;
  clientId: string;
  selection: Selection;
  answers: Answers;
  submittedDaysAgo: number;
  steps?: Step[];
};

const seeds: Seed[] = [
  // SUBMITTED: a new Request
  {
    id: "req-bloom",
    title: "Bloom & Co",
    serviceId: "svc-brand-identity",
    clientId: "u-kemi",
    selection: {
      packageId: "pkg-standard",
      options: { "og-use": ["opt-digital"] },
      addOns: { "ao-guidelines": 1 },
    },
    answers: brandAnswers("Bloom & Co", "A florist delivering same-day arrangements across Lagos."),
    submittedDaysAgo: 0.2,
  },
  // SUBMITTED after a clarification loop: "Client responded" (D-027)
  {
    id: "req-northwind",
    title: "Northwind Labs",
    serviceId: "svc-brand-identity",
    clientId: "u-daniel",
    selection: { packageId: "pkg-complete", options: { "og-use": ["opt-print"] } },
    answers: brandAnswers(
      "Northwind Labs",
      "A climate data startup selling to logistics companies.",
      true,
    ),
    submittedDaysAgo: 3,
    steps: [
      {
        do: "clarify",
        message: "Should the new identity keep any part of the current logo, or start fresh?",
      },
      { do: "clientNote", message: "Start fresh, but keep the navy blue. Our customers know it." },
    ],
  },
  // AWAITING_CLIENT / QUOTE_PROPOSED with a superseded version and an open Client question
  {
    id: "req-fieldnote",
    title: "Fieldnote",
    serviceId: "svc-landing-page",
    clientId: "u-priya",
    selection: { options: { "og-platform": ["opt-framer"] }, addOns: { "ao-copy": 1 } },
    answers: goal("lp", "A waitlist page for our note-taking app ahead of launch."),
    submittedDaysAgo: 5,
    steps: [
      {
        do: "propose",
        kind: "QUOTE",
        subtotal: NGN(520_000),
        commitmentBps: 4_000,
        note: "Includes the Framer build and copy.",
        validForDays: -1,
      },
      {
        do: "propose",
        kind: "QUOTE",
        subtotal: NGN(520_000),
        commitmentBps: 4_000,
        discount: { label: "Returning Client", modifier: { kind: "PERCENT", bps: 500 } },
        note: "Renewed with a returning Client discount.",
        validForDays: 7,
      },
      { do: "clientNote", message: "Does the price include setting up the Framer CMS?" },
    ],
  },
  // AWAITING_CLIENT / CHANGES_PROPOSED
  {
    id: "req-kitchen",
    title: "Kemi's Kitchen",
    serviceId: "svc-brand-identity",
    clientId: "u-kemi",
    selection: { packageId: "pkg-standard", options: { "og-use": ["opt-digital"] } },
    answers: brandAnswers("Kemi's Kitchen", "Home-cooked meals delivered weekly in Lekki."),
    submittedDaysAgo: 4,
    steps: [
      {
        do: "propose",
        kind: "CHANGES",
        subtotal: NGN(520_000),
        commitmentBps: 5_000,
        note: "Your Brief mentions food packaging. I've added packaging labels to the scope, which adds ₦70,000.",
      },
    ],
  },
  // AWAITING_CLIENT / CLARIFICATION_REQUESTED
  {
    id: "req-atlas",
    title: "Atlas Fitness",
    serviceId: "svc-landing-page",
    clientId: "u-daniel",
    selection: { options: { "og-platform": ["opt-unsure"] } },
    answers: goal("lp", "A class booking page for our new gym in Accra."),
    submittedDaysAgo: 2,
    steps: [
      {
        do: "clarify",
        message: "Do you already have a booking system the page should connect to?",
      },
    ],
  },
  // AWAITING_TERMS after an accepted quote (D-002)
  {
    id: "req-fieldnote-retainer",
    title: "Fieldnote retainer",
    serviceId: "svc-design-retainer",
    clientId: "u-priya",
    selection: {},
    answers: goal("rt", "Ongoing product and marketing design for the next quarter."),
    submittedDaysAgo: 8,
    steps: [
      {
        do: "propose",
        kind: "QUOTE",
        subtotal: NGN(600_000),
        commitmentBps: 3_000,
        note: "Monthly, up to 40 design hours.",
        validForDays: 14,
      },
      { do: "acceptProposal" },
    ],
  },
  // AWAITING_COMMITMENT
  {
    id: "req-harbor",
    title: "Harbor Coffee",
    serviceId: "svc-brand-identity",
    clientId: "u-daniel",
    selection: { packageId: "pkg-standard", options: { "og-use": ["opt-digital"] } },
    answers: brandAnswers("Harbor Coffee", "A specialty coffee roaster with two cafés.", true),
    submittedDaysAgo: 6,
    steps: [{ do: "accept" }],
  },
  // AWAITING_PAYMENT_CONFIRMATION
  {
    id: "req-lumen",
    title: "Lumen Studio",
    serviceId: "svc-brand-identity",
    clientId: "u-kemi",
    selection: {
      packageId: "pkg-essential",
      options: { "og-use": ["opt-print"] },
      addOns: { "ao-guidelines": 1 },
    },
    answers: brandAnswers("Lumen Studio", "A photography studio for product shoots."),
    submittedDaysAgo: 7,
    steps: [
      { do: "accept" },
      { do: "declare", amount: NGN(190_000), methodId: "pm-ada-bank", reference: "TRF-88213" },
    ],
  },
  // PARTIALLY_CONFIRMED, with an earlier declaration marked Not received (D-028)
  {
    id: "req-okra",
    title: "Okra Market",
    serviceId: "svc-landing-page",
    clientId: "u-kemi",
    selection: { options: { "og-platform": ["opt-webflow"] } },
    answers: goal("lp", "A launch page for our farm-to-table grocery delivery."),
    submittedDaysAgo: 12,
    steps: [
      {
        do: "propose",
        kind: "QUOTE",
        subtotal: NGN(450_000),
        commitmentBps: 4_000,
        validForDays: 10,
      },
      { do: "acceptProposal" },
      { do: "acceptTerms" },
      { do: "declare", amount: NGN(100_000), methodId: "pm-ada-bank", reference: "TRF-10021" },
      {
        do: "notReceived",
        note: "I haven't received this transfer yet. Could you check the account number?",
      },
      { do: "declare", amount: NGN(100_000), methodId: "pm-ada-bank", reference: "TRF-10044" },
      { do: "confirm", amount: NGN(100_000), ofDeclaration: true },
    ],
  },
  // READY_TO_START
  {
    id: "req-tidewater",
    title: "Tidewater",
    serviceId: "svc-brand-identity",
    clientId: "u-priya",
    selection: {
      packageId: "pkg-standard",
      options: { "og-use": ["opt-digital"] },
      addOns: { "ao-guidelines": 1, "ao-social": 2 },
    },
    answers: brandAnswers("Tidewater", "A sailing school on the south coast."),
    submittedDaysAgo: 10,
    steps: [
      { do: "accept" },
      { do: "declare", amount: NGN(280_000), methodId: "pm-ada-paypal", reference: "PP-5521-AX" },
      { do: "confirm", amount: NGN(280_000), ofDeclaration: true },
    ],
  },
  // CONVERTED_TO_PROJECT → Active Project
  {
    id: "req-brightpath",
    title: "Brightpath",
    serviceId: "svc-landing-page",
    clientId: "u-daniel",
    selection: { options: { "og-platform": ["opt-figma"] } },
    answers: goal("lp", "A landing page for our tutoring marketplace."),
    submittedDaysAgo: 20,
    steps: [
      {
        do: "propose",
        kind: "QUOTE",
        subtotal: NGN(420_000),
        commitmentBps: 4_000,
        validForDays: 10,
      },
      { do: "acceptProposal" },
      { do: "acceptTerms" },
      { do: "declare", amount: NGN(168_000), methodId: "pm-ada-bank" },
      { do: "confirm", amount: NGN(168_000), ofDeclaration: true },
      { do: "start" },
    ],
  },
  // CONVERTED_TO_PROJECT → Completed Project
  {
    id: "req-sunrise",
    title: "Sunrise Bakery",
    serviceId: "svc-brand-identity",
    clientId: "u-kemi",
    selection: { packageId: "pkg-complete", options: { "og-use": ["opt-digital"] } },
    answers: brandAnswers("Sunrise Bakery", "A neighbourhood bakery opening a second branch."),
    submittedDaysAgo: 60,
    steps: [
      { do: "accept" },
      { do: "declare", amount: NGN(350_000), methodId: "pm-ada-bank" },
      { do: "confirm", amount: NGN(350_000), ofDeclaration: true },
      { do: "start" },
      { do: "close" },
    ],
  },
  // DECLINED after a rejected quote (D-035)
  {
    id: "req-volt",
    title: "Volt Energy",
    serviceId: "svc-design-retainer",
    clientId: "u-daniel",
    selection: {},
    answers: goal("rt", "Design support for an energy startup's investor materials."),
    submittedDaysAgo: 15,
    steps: [
      {
        do: "propose",
        kind: "QUOTE",
        subtotal: NGN(900_000),
        commitmentBps: 3_000,
        validForDays: 7,
      },
      { do: "rejectProposal" },
      { do: "decline", reason: "The scope needed is larger than I can take on this quarter." },
    ],
  },
  // WITHDRAWN
  {
    id: "req-fieldnote-social",
    title: "Fieldnote social",
    serviceId: "svc-social-kit",
    clientId: "u-priya",
    selection: { quantities: { "qr-posts": 12 } },
    answers: goal("sk", "Launch posts for Instagram and LinkedIn."),
    submittedDaysAgo: 45,
    steps: [{ do: "withdraw", reason: "We're handling social in-house for now." }],
  },
  // Ada as a Client: no-commitment Service goes straight to READY_TO_START (PAY-008)
  {
    id: "req-ada-site",
    title: "Ada Okafor Studio site",
    serviceId: "svc-webflow-build",
    clientId: "u-ada",
    selection: {},
    answers: goal("wf", "Build my studio portfolio site from the approved Figma file."),
    submittedDaysAgo: 3,
    steps: [{ do: "accept" }],
  },
];

let refNumber = 1040;
const built = seeds.map((seed) => {
  const service = svc(seed.serviceId);
  const full: RequestSeed = {
    id: seed.id,
    reference: `MG-${++refNumber}`,
    title: seed.title,
    service,
    creative: creative(service.creativeId),
    clientId: seed.clientId,
    selection: seed.selection,
    answers: seed.answers,
    submittedDaysAgo: seed.submittedDaysAgo,
    steps: seed.steps ?? [],
  };
  return buildRequest(full);
});

export const requestDetails: RequestDetail[] = built.map((b) => b.detail);
export const projects: Project[] = built.flatMap((b) => (b.project ? [b.project] : []));
