/** Service aggregate (docs/03 §12–35, PRD SRV-016–025, PRC-005). */
import type {
  AddOnConfig,
  Brief,
  ChargeConfig,
  CommitmentConfig,
  Currency,
  DeliveryOptionConfig,
  DependencyConfig,
  ModerationStatus,
  OptionGroupConfig,
  PackageConfig,
  PricingMode,
  QuantityRuleConfig,
  RevisionPolicy,
  ServiceLifecycle,
} from "@/lib/domain";
import type { ID, Timestamp } from "./identity";

export type TurnaroundUnit = "BUSINESS_DAYS" | "CALENDAR_DAYS" | "WEEKS";
export type Turnaround = { value: number; unit: TurnaroundUnit };

export type ServiceCategory = { id: ID; name: string; displayOrder: number; active: boolean };

export type Deliverable = {
  id: ID;
  /** Set when the deliverable belongs to one package only. */
  packageId: ID | null;
  name: string;
  description: string | null;
  displayOrder: number;
};

/** A package is a priced scope option (PRC-005). */
export type ServicePackage = PackageConfig & {
  description: string | null;
  recommended: boolean;
  turnaround: Turnaround;
  revisions: RevisionPolicy;
  displayOrder: number;
};

export type AddOn = AddOnConfig & { description: string | null; displayOrder: number };

export type DeliveryOption = DeliveryOptionConfig & { turnaround: Turnaround };

export type RevisionTerms = {
  policy: RevisionPolicy;
  /** Optional price per additional revision (SRV-023). */
  additionalRevisionAmountMinor: bigint | null;
};

export type ServiceTerms = {
  content: string;
  /** Bumped on every material change so snapshots can show which version was accepted. */
  version: number;
  updatedAt: Timestamp;
};

export type WorkSample = {
  id: ID;
  title: string;
  description: string | null;
  imageUrl: string | null;
  externalUrl: string | null;
  displayOrder: number;
};

export type Service = {
  id: ID;
  creativeId: ID;
  categoryId: ID | null;
  name: string;
  /** Unique within the Creative's profile (SRV-013). */
  slug: string;
  shortDescription: string;
  detailedDescription: string | null;
  coverImageUrl: string | null;
  currency: Currency;
  pricingMode: PricingMode;
  /** FIXED base or STARTING_FROM minimum. */
  baseAmountMinor: bigint | null;
  packages: ServicePackage[];
  deliverables: Deliverable[];
  quantityRules: QuantityRuleConfig[];
  addOns: AddOn[];
  optionGroups: OptionGroupConfig[];
  deliveryOptions: DeliveryOption[];
  dependencies: DependencyConfig[];
  charges: ChargeConfig[];
  revisions: RevisionTerms;
  terms: ServiceTerms;
  brief: Brief;
  commitment: CommitmentConfig;
  paymentMethodIds: ID[];
  workSamples: WorkSample[];
  lifecycle: ServiceLifecycle;
  moderation: ModerationStatus;
  displayOrder: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt: Timestamp | null;
};
