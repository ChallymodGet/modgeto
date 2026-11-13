/**
 * Platform subscription billing (docs/03 §53–61, D-001, D-014, D-015).
 * Kept completely separate from Client Project payments.
 */
import type { Market, SubscriptionStatus } from "@/lib/domain";
import type { ID, Timestamp } from "./identity";

export type Subscription = {
  id: ID;
  creativeId: ID;
  /** Chosen once at first upgrade; null while on the free capacity (D-014). */
  market: Market | null;
  status: SubscriptionStatus;
  publishedServiceLimit: number;
  /** Downgrade waiting for period end (D-015). */
  scheduledServiceLimit: number | null;
  pastDueSince: Timestamp | null;
  currentPeriodStart: Timestamp | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
  paystackCustomerCode: string | null;
  paystackSubscriptionCode: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Effective-dated price row; Admin changes add rows and never rewrite history (docs/06 §79). */
export type CapacityPriceRecord = {
  id: ID;
  publishedServiceLimit: number;
  market: Market;
  amountMinor: bigint;
  effectiveFrom: Timestamp;
  effectiveUntil: Timestamp | null;
};

export type BillingEventType =
  | "SUBSCRIPTION_CREATED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_UPGRADED"
  | "DOWNGRADE_SCHEDULED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_CANCELLED";

export type SubscriptionBillingEvent = {
  id: ID;
  subscriptionId: ID;
  type: BillingEventType;
  publishedServiceLimit: number;
  amountMinor: bigint | null;
  paystackReference: string | null;
  occurredAt: Timestamp;
};
