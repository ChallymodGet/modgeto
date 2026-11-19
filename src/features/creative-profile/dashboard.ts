/**
 * Creative Dashboard read model (docs/06 §44–48, docs/04 §8). Pure, so the
 * attention order and wording are testable. Action-oriented, not analytics.
 */
import {
  type CreativeRequestGroup,
  type StatusIntent,
  creativeRequestGroup,
  effectiveCapacity,
  usedCapacity,
} from "@/lib/domain";
import type { RequestDetail, Service, Subscription } from "@/types";
import { clientAwaitingReply } from "@/features/requests/model";

export type AttentionKind =
  | "READY_TO_START"
  | "PAYMENT_TO_CONFIRM"
  | "NEW_REQUEST"
  | "CLIENT_RESPONSE"
  | "SERVICE_ISSUE"
  | "SUBSCRIPTION_ISSUE";

export type Attention = {
  kind: AttentionKind;
  count: number;
  title: string;
  description: string;
  action: { href: string; label: string };
  tone: StatusIntent;
};

const REQUESTS = "/app/creative/requests";
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

type Input = {
  details: RequestDetail[];
  services: Service[];
  subscription: Subscription | null;
  /** Client display names by user id. */
  clientNames: Record<string, string>;
};

/** Attention items in the docs/06 §46 priority order; only those with something to do. */
export function attentionItems({
  details,
  services,
  subscription,
  clientNames,
}: Input): Attention[] {
  const items: Attention[] = [];
  const name = (d: RequestDetail) => clientNames[d.request.clientId] ?? "The Client";
  const toOne = (list: RequestDetail[], group: string) =>
    list.length === 1 ? `${REQUESTS}/${list[0].request.id}` : `${REQUESTS}?group=${group}`;

  const ready = details.filter((d) => d.request.status === "READY_TO_START");
  if (ready.length) {
    items.push({
      kind: "READY_TO_START",
      count: ready.length,
      title: "Ready to Start",
      description:
        ready.length === 1
          ? `${ready[0].request.title} has everything it needs. Start the Project when you're ready.`
          : "These Requests have everything they need. Start each Project when you're ready.",
      action: {
        href: toOne(ready, "ready"),
        label: plural(ready.length, "Start Project", "View Requests"),
      },
      tone: "success",
    });
  }

  const payments = details.filter((d) => d.request.pendingDeclarations > 0);
  if (payments.length) {
    items.push({
      kind: "PAYMENT_TO_CONFIRM",
      count: payments.length,
      title: plural(payments.length, "Payment to confirm", "Payments to confirm"),
      description:
        payments.length === 1
          ? `${name(payments[0])} says they've paid for ${payments[0].request.title}. Check your account, then confirm what arrived.`
          : "Clients say they've paid. Check your account, then confirm what arrived.",
      action: {
        href: toOne(payments, "payment"),
        label: plural(payments.length, "Confirm Amount Received", "Review payments"),
      },
      tone: "warning",
    });
  }

  const fresh = details.filter((d) => d.request.status === "SUBMITTED" && !clientAwaitingReply(d));
  if (fresh.length) {
    items.push({
      kind: "NEW_REQUEST",
      count: fresh.length,
      title: plural(fresh.length, "New Request", "New Requests"),
      description: "Read the Brief, then accept, propose changes, send a quote or decline.",
      action: {
        href: toOne(fresh, "new"),
        label: plural(fresh.length, "Review Request", "Review Requests"),
      },
      tone: "info",
    });
  }

  const replies = details.filter((d) => clientAwaitingReply(d));
  if (replies.length) {
    items.push({
      kind: "CLIENT_RESPONSE",
      count: replies.length,
      title: plural(replies.length, "Client reply", "Client replies"),
      description:
        replies.length === 1
          ? `${name(replies[0])} replied about ${replies[0].request.title}. Respond to keep things moving.`
          : "Clients have replied. Respond to keep things moving.",
      action: {
        href: toOne(replies, "awaiting-client"),
        label: plural(replies.length, "Read reply", "Read replies"),
      },
      tone: "info",
    });
  }

  const issues = services.filter(
    (s) => s.lifecycle === "SUBSCRIPTION_INACTIVE" || s.moderation === "PLATFORM_DISABLED",
  );
  if (issues.length) {
    const disabled = issues.some((s) => s.moderation === "PLATFORM_DISABLED");
    items.push({
      kind: "SERVICE_ISSUE",
      count: issues.length,
      title: plural(issues.length, "Service not live", "Services not live"),
      description: disabled
        ? "Modgeto has disabled a Service. Check Services for the reason."
        : "Some Services are inactive because they're over your capacity. Add capacity or choose which stay live.",
      action: { href: "/app/creative/services", label: "Manage Services" },
      tone: disabled ? "danger" : "warning",
    });
  }

  if (subscription?.status === "PAST_DUE" || subscription?.status === "EXPIRED") {
    items.push({
      kind: "SUBSCRIPTION_ISSUE",
      count: 1,
      title: subscription.status === "PAST_DUE" ? "Payment overdue" : "Subscription ended",
      description:
        subscription.status === "PAST_DUE"
          ? "We couldn't take your last subscription payment. Update your card to keep your Services published."
          : "Your subscription has ended. One free Service stays published.",
      action: { href: "/app/creative/subscription", label: "Review subscription" },
      tone: subscription.status === "PAST_DUE" ? "warning" : "danger",
    });
  }

  return items;
}

/** Open Requests per Creative grouping, for the overview row. */
export function requestOverview(
  details: RequestDetail[],
): Record<Exclude<CreativeRequestGroup, "CLOSED">, number> {
  const counts = { NEW: 0, AWAITING_CLIENT: 0, AWAITING_PAYMENT: 0, READY_TO_START: 0 };
  for (const d of details) {
    const group = creativeRequestGroup(d.request.status);
    if (group !== "CLOSED") counts[group] += 1;
  }
  return counts;
}

/** Capacity in use against what the subscription grants right now (D-015). */
export function capacity(services: Service[], subscription: Subscription | null) {
  const limit = subscription
    ? effectiveCapacity(subscription.status, subscription.publishedServiceLimit)
    : 1;
  return { used: usedCapacity(services), limit };
}

/** A Creative with nothing published yet gets the activation checklist (docs/06 §47). */
export function isNewCreative(services: Service[]): boolean {
  return !services.some((s) => s.publishedAt !== null);
}
