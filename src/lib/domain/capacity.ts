/**
 * Published-Service capacity and platform subscription pricing
 * (docs/03 §53–61, D-001, D-014, D-015, D-016).
 *
 * Platform subscription money only. Client Project payments never pass through here.
 */
import { type Currency, type Money, compare, major, subtract } from "./money";

export const MIN_CAPACITY = 1;
export const MAX_CAPACITY = 10;

/** Billing market, chosen once at first upgrade from the billing country (D-014). */
export type Market = "NG" | "INTL";

export const MARKET_CURRENCY: Record<Market, Extract<Currency, "NGN" | "USD">> = {
  NG: "NGN",
  INTL: "USD",
};

/**
 * Approved monthly prices in whole major units (D-001). Do not "fix" this curve:
 * 5 Services cost less than 4, and 10 cost less than 9, on purpose.
 */
const CAPACITY_PRICES: Record<Market, readonly number[]> = {
  //        1  2      3      4      5      6      7      8       9       10
  NG: [0, 2_000, 4_000, 6_000, 5_000, 7_000, 9_000, 11_000, 13_000, 12_000],
  INTL: [0, 2, 4, 6, 5, 7, 9, 11, 13, 12],
};

export function isValidCapacity(limit: number): boolean {
  return Number.isInteger(limit) && limit >= MIN_CAPACITY && limit <= MAX_CAPACITY;
}

export function capacityPrice(limit: number, market: Market): Money {
  if (!isValidCapacity(limit)) {
    throw new RangeError(`Capacity must be a whole number from 1 to 10, got ${limit}`);
  }
  return major(CAPACITY_PRICES[market][limit - 1], MARKET_CURRENCY[market]);
}

export type CapacityOffer = {
  /** The cheaper, larger capacity to suggest. */
  limit: number;
  price: Money;
  /** How much less it costs per month than the capacity being considered. */
  monthlySaving: Money;
};

/**
 * If one more Service is cheaper, return that offer (D-001: the selector must make
 * both discount points visible, e.g. "Get one more Service and save ₦1,000 each month").
 */
export function cheaperLargerOffer(limit: number, market: Market): CapacityOffer | null {
  if (!isValidCapacity(limit) || limit === MAX_CAPACITY) return null;
  const current = capacityPrice(limit, market);
  const next = capacityPrice(limit + 1, market);
  if (compare(next, current) >= 0) return null;
  return { limit: limit + 1, price: next, monthlySaving: subtract(current, next) };
}

// ---------------------------------------------------------------------------
// Consumption
// ---------------------------------------------------------------------------

export type ServiceLifecycle =
  "DRAFT" | "PUBLISHED" | "UNAVAILABLE" | "SUBSCRIPTION_INACTIVE" | "ARCHIVED";

/** Published and Unavailable Services use a slot; the rest do not (docs/03 §59). */
export function consumesCapacity(lifecycle: ServiceLifecycle): boolean {
  return lifecycle === "PUBLISHED" || lifecycle === "UNAVAILABLE";
}

export function usedCapacity(services: readonly { lifecycle: ServiceLifecycle }[]): number {
  return services.filter((s) => consumesCapacity(s.lifecycle)).length;
}

export function hasFreeSlot(
  services: readonly { lifecycle: ServiceLifecycle }[],
  limit: number,
): boolean {
  return usedCapacity(services) < limit;
}

// ---------------------------------------------------------------------------
// Subscription capacity (D-015)
// ---------------------------------------------------------------------------

export type SubscriptionStatus = "FREE" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED";

export const PAST_DUE_GRACE_DAYS = 7;

/**
 * Capacity actually granted right now. Paid capacity holds while ACTIVE and during
 * the PAST_DUE grace period; otherwise the Creative has the free single slot.
 */
export function effectiveCapacity(status: SubscriptionStatus, purchasedLimit: number): number {
  return status === "ACTIVE" || status === "PAST_DUE" ? purchasedLimit : MIN_CAPACITY;
}

export function graceEndsAt(pastDueSince: Date): Date {
  return new Date(pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

export type CapacityChange = "UPGRADE" | "DOWNGRADE" | "NONE";

/** Upgrades apply immediately at full price; downgrades wait for period end (D-015). */
export function classifyCapacityChange(current: number, next: number): CapacityChange {
  if (next > current) return "UPGRADE";
  if (next < current) return "DOWNGRADE";
  return "NONE";
}

// ---------------------------------------------------------------------------
// Allocation when capacity drops (docs/03 §60–61, D-016)
// ---------------------------------------------------------------------------

export type AllocatableService = {
  id: string;
  lifecycle: ServiceLifecycle;
  publishedAt: Date | null;
};

export type AllocationInput = {
  services: readonly AllocatableService[];
  limit: number;
  /** The Creative's designated free Service, if any (docs/03 §60). */
  freeServiceId?: string | null;
  /** Services the Creative chose to keep active, if they chose (docs/05 §52). */
  keepServiceIds?: readonly string[] | null;
};

export type Allocation = {
  freeServiceId: string | null;
  /** Stay PUBLISHED / UNAVAILABLE. */
  keep: string[];
  /** Become SUBSCRIPTION_INACTIVE. Never deleted. */
  deactivate: string[];
};

export type AllocationProblem = "TOO_MANY_KEPT" | "UNKNOWN_SERVICE" | "FREE_SERVICE_NOT_KEPT";

function byPublishedAt(a: AllocatableService, b: AllocatableService): number {
  const at = a.publishedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bt = b.publishedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return at - bt || a.id.localeCompare(b.id);
}

/** Checks a Creative's own choice before applying it. */
export function validateKeepChoice(input: AllocationInput): AllocationProblem | null {
  const keep = input.keepServiceIds ?? [];
  const active = new Set(
    input.services.filter((s) => consumesCapacity(s.lifecycle)).map((s) => s.id),
  );
  if (keep.some((id) => !active.has(id))) return "UNKNOWN_SERVICE";
  if (keep.length > input.limit) return "TOO_MANY_KEPT";
  if (
    input.freeServiceId &&
    active.has(input.freeServiceId) &&
    !keep.includes(input.freeServiceId)
  ) {
    return "FREE_SERVICE_NOT_KEPT";
  }
  return null;
}

/**
 * Decides which capacity-consuming Services stay active.
 *
 * - With a valid Creative choice, that choice wins.
 * - Otherwise (D-016): the designated free Service keeps a slot if still active,
 *   else the earliest-published one does; remaining slots go to the earliest
 *   published, so the most recently published become inactive first.
 */
export function allocateCapacity(input: AllocationInput): Allocation {
  const active = input.services.filter((s) => consumesCapacity(s.lifecycle)).sort(byPublishedAt);

  if (input.keepServiceIds && validateKeepChoice(input) === null) {
    const keep = active.filter((s) => input.keepServiceIds!.includes(s.id)).map((s) => s.id);
    return {
      freeServiceId:
        input.freeServiceId && keep.includes(input.freeServiceId)
          ? input.freeServiceId
          : (keep[0] ?? null),
      keep,
      deactivate: active.filter((s) => !keep.includes(s.id)).map((s) => s.id),
    };
  }

  const designated = active.find((s) => s.id === input.freeServiceId);
  const free = designated ?? active[0] ?? null;
  const ordered = free ? [free, ...active.filter((s) => s.id !== free.id)] : active;
  const keep = ordered.slice(0, Math.max(input.limit, 0)).map((s) => s.id);

  return {
    freeServiceId: free?.id ?? null,
    keep,
    deactivate: ordered.filter((s) => !keep.includes(s.id)).map((s) => s.id),
  };
}
