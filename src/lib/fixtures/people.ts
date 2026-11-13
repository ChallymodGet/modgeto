/**
 * Fictional people. Ada is the main Creative and also commissions Tunde, to show
 * one account acting as both Creative and Client (docs/03 §6).
 */
import type { AdminUser, CreativeProfile, PaymentMethod, ServiceCategory, User } from "@/types";
import { daysAgo } from "./time";

function user(
  id: string,
  fullName: string,
  email: string,
  phone: string,
  createdDaysAgo: number,
): User {
  return {
    id,
    fullName,
    email,
    phone,
    emailVerifiedAt: daysAgo(createdDaysAgo - 0.01),
    phoneVerifiedAt: daysAgo(createdDaysAgo - 0.02),
    accountStatus: "ACTIVE",
    avatarUrl: null,
    createdAt: daysAgo(createdDaysAgo),
  };
}

export const users: User[] = [
  // Creatives
  user("u-ada", "Ada Okafor", "ada@example.com", "+2348031234567", 120),
  user("u-tunde", "Tunde Bakare", "tunde@example.com", "+2348059876543", 90),
  user("u-mira", "Mira Patel", "mira@example.com", "+447700900123", 200),
  user("u-sola", "Sola Adeyemi", "sola@example.com", "+33612345678", 150),
  user("u-leo", "Leo Hart", "leo@example.com", "+14155550123", 60),
  // Clients
  user("u-kemi", "Kemi Adeyemi", "kemi@example.com", "+2348021112233", 40),
  user("u-daniel", "Daniel Mensah", "daniel@example.com", "+233201234567", 35),
  user("u-priya", "Priya Shah", "priya@example.com", "+447700900456", 30),
  // A Client part-way through verification, and a suspended account (Admin views)
  {
    ...user("u-new", "Femi Johnson", "femi@example.com", "+2348099990000", 1),
    phoneVerifiedAt: null,
    accountStatus: "PENDING_VERIFICATION",
  },
  {
    ...user("u-blocked", "Spam Account", "spam@example.com", "+2348000000000", 10),
    accountStatus: "SUSPENDED",
  },
  // Admin
  user("u-admin", "Modgeto Support", "admin@example.com", "+2348010000000", 300),
];

export const adminUsers: AdminUser[] = [{ userId: "u-admin", createdAt: daysAgo(300) }];

/** Launch category list is roadmap Q6; these follow the docs/01 §5 audience groups. */
export const categories: ServiceCategory[] = [
  { id: "cat-design", name: "Design", displayOrder: 1, active: true },
  { id: "cat-development", name: "Development", displayOrder: 2, active: true },
  { id: "cat-writing", name: "Writing", displayOrder: 3, active: true },
  { id: "cat-motion", name: "Motion and Media", displayOrder: 4, active: true },
];

/** One Creative per availability state: Ada AVAILABLE, Tunde LIMITED, Mira UNAVAILABLE. */
export const creatives: CreativeProfile[] = [
  {
    userId: "u-ada",
    username: "ada",
    displayName: "Ada Okafor",
    professionalTitle: "Brand and UI Designer",
    introduction: "I help early-stage brands look as good as the work behind them.",
    about:
      "Eight years designing identities and product interfaces for founders across Lagos, Accra and London. I work in focused sprints, share progress early, and hand over files your team can actually use.",
    location: "Lagos, Nigeria",
    avatarUrl: null,
    disciplines: ["DESIGN"],
    availability: "AVAILABLE",
    availabilityNote: null,
    defaultCurrency: "NGN",
    defaultCommitmentBps: 5_000,
    selectedFreeServiceId: "svc-brand-identity",
    links: [
      {
        id: "l-ada-1",
        type: "BEHANCE",
        label: null,
        url: "https://www.behance.net/example-ada",
        displayOrder: 1,
      },
      {
        id: "l-ada-2",
        type: "DRIBBBLE",
        label: null,
        url: "https://dribbble.com/example-ada",
        displayOrder: 2,
      },
      {
        id: "l-ada-3",
        type: "LINKEDIN",
        label: null,
        url: "https://www.linkedin.com/in/example-ada",
        displayOrder: 3,
      },
    ],
    createdAt: daysAgo(118),
  },
  {
    userId: "u-tunde",
    username: "tunde",
    displayName: "Tunde Bakare",
    professionalTitle: "Webflow and Frontend Developer",
    introduction: "Fast, accessible marketing sites that your team can edit without calling me.",
    about: null,
    location: "Abuja, Nigeria",
    avatarUrl: null,
    disciplines: ["DEVELOPMENT"],
    availability: "LIMITED",
    availabilityNote: "Booking projects that start from December.",
    defaultCurrency: "USD",
    defaultCommitmentBps: null,
    selectedFreeServiceId: "svc-webflow-build",
    links: [
      {
        id: "l-tunde-1",
        type: "GITHUB",
        label: null,
        url: "https://github.com/example-tunde",
        displayOrder: 1,
      },
    ],
    createdAt: daysAgo(88),
  },
  {
    userId: "u-mira",
    username: "mira",
    displayName: "Mira Patel",
    professionalTitle: "Conversion Copywriter",
    introduction: "Website and product copy that sounds like you and sells like you mean it.",
    about: null,
    location: "London, United Kingdom",
    avatarUrl: null,
    disciplines: ["WRITING"],
    availability: "UNAVAILABLE",
    availabilityNote: null,
    defaultCurrency: "GBP",
    defaultCommitmentBps: 3_000,
    selectedFreeServiceId: "svc-website-copy",
    links: [
      {
        id: "l-mira-1",
        type: "PORTFOLIO",
        label: "Portfolio",
        url: "https://mira.example.com",
        displayOrder: 1,
      },
    ],
    createdAt: daysAgo(198),
  },
  {
    userId: "u-sola",
    username: "sola",
    displayName: "Sola Adeyemi",
    professionalTitle: "Motion Designer",
    introduction: "Logo animations and launch films with a little bounce.",
    about: null,
    location: "Paris, France",
    avatarUrl: null,
    disciplines: ["MOTION_MEDIA"],
    availability: "AVAILABLE",
    availabilityNote: null,
    defaultCurrency: "EUR",
    defaultCommitmentBps: null,
    selectedFreeServiceId: null,
    links: [],
    createdAt: daysAgo(148),
  },
  {
    userId: "u-leo",
    username: "leo",
    displayName: "Leo Hart",
    professionalTitle: "Product Designer",
    introduction: "Product design for B2B tools.",
    about: null,
    location: "San Francisco, United States",
    avatarUrl: null,
    disciplines: ["DESIGN"],
    availability: "AVAILABLE",
    availabilityNote: null,
    defaultCurrency: "USD",
    defaultCommitmentBps: null,
    selectedFreeServiceId: null,
    links: [],
    createdAt: daysAgo(58),
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: "pm-ada-bank",
    creativeId: "u-ada",
    type: "BANK_TRANSFER",
    label: "Bank transfer (Naira)",
    instructions:
      "Account name: Ada Okafor Studio\nBank: Example Microfinance Bank\nAccount number: 0123456789",
    active: true,
  },
  {
    id: "pm-ada-paypal",
    creativeId: "u-ada",
    type: "PAYPAL",
    label: "PayPal",
    instructions: "Send to payments@ada.example.com and add your Request reference.",
    active: true,
  },
  {
    id: "pm-mira-bank",
    creativeId: "u-mira",
    type: "BANK_TRANSFER",
    label: "UK bank transfer",
    instructions: "Account name: Mira Patel Ltd\nSort code: 00-00-00\nAccount number: 12345678",
    active: true,
  },
];
