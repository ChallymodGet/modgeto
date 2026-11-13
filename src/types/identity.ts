/** Identity, Creative profile and external payment methods (docs/03 §5–11, PRD PROF-*, PAY-002). */
import type { AccountStatus, Availability, BasisPoints, Currency } from "@/lib/domain";

export type ID = string;
/** ISO-8601 timestamp string. Dates cross the server/client boundary as strings. */
export type Timestamp = string;

/** Platform user. Supabase Auth owns credentials; this is the profile row (docs/03 §5). */
export type User = {
  id: ID;
  fullName: string;
  email: string;
  /** E.164, private by default (NFR-006). */
  phone: string | null;
  emailVerifiedAt: Timestamp | null;
  phoneVerifiedAt: Timestamp | null;
  accountStatus: AccountStatus;
  avatarUrl: string | null;
  createdAt: Timestamp;
};

export type CreativeLinkType =
  "PORTFOLIO" | "LINKEDIN" | "BEHANCE" | "DRIBBBLE" | "GITHUB" | "OTHER";

export type CreativeLink = {
  id: ID;
  type: CreativeLinkType;
  label: string | null;
  url: string;
  displayOrder: number;
};

export type Discipline = "DESIGN" | "DEVELOPMENT" | "WRITING" | "MOTION_MEDIA";

/** Creative capability exists when a User has a CreativeProfile (docs/03 §6). */
export type CreativeProfile = {
  userId: ID;
  username: string;
  displayName: string;
  professionalTitle: string;
  introduction: string;
  about: string | null;
  location: string | null;
  avatarUrl: string | null;
  disciplines: Discipline[];
  availability: Availability;
  /** Optional public note shown with Limited availability (PUB-004). */
  availabilityNote: string | null;
  defaultCurrency: Currency;
  /** Default commitment for new Services; null means none (PROF-004). */
  defaultCommitmentBps: BasisPoints | null;
  selectedFreeServiceId: ID | null;
  links: CreativeLink[];
  createdAt: Timestamp;
};

export type PaymentMethodType = "BANK_TRANSFER" | "PAYPAL" | "MOBILE_MONEY" | "CUSTOM";

/**
 * A Creative's external payment method (PAY-002). Revealed only to the relevant
 * Client at the payment stage (PAY-003). Field structure per type is roadmap Q7;
 * until then, details are free-form instructions.
 */
export type PaymentMethod = {
  id: ID;
  creativeId: ID;
  type: PaymentMethodType;
  label: string;
  instructions: string;
  active: boolean;
};
