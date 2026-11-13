import type { CapacityPriceRecord, Subscription, SubscriptionBillingEvent } from "@/types";

export interface SubscriptionRepository {
  getForCreative(creativeId: string): Promise<Subscription | null>;
  /** Prices in effect at `at` (defaults to now). */
  listCapacityPrices(at?: Date): Promise<CapacityPriceRecord[]>;
  listBillingEvents(subscriptionId: string): Promise<SubscriptionBillingEvent[]>;
}
