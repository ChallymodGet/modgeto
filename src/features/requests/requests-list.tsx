"use client";

/**
 * Requests lists for both actors (docs/04 §9, §21, §46, §47). Groups map
 * several domain states to who must act next; the group lives in the URL so
 * Dashboard and Home links land on the right one. Search covers title, the
 * other person and reference.
 */
import { Inbox, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PageContainer, PageHeader, SectionLayout } from "@/components/layout/page";
import { RequestCard } from "@/components/request/request-summaries";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  type ClientRequestGroup,
  type CreativeRequestGroup,
  type RequestStatus,
  CLIENT_GROUP_LABELS,
  CREATIVE_GROUP_LABELS,
  clientRequestGroup,
  creativeRequestGroup,
} from "@/lib/domain";
import type { RequestDetail } from "@/types";
import { requestView } from "./model";
import { useMergedRequests } from "./simulated-requests";

type Empty = { title: string; description: string };

type ListConfig<G extends string> = {
  actor: "CREATIVE" | "CLIENT";
  base: string;
  title: string;
  description: string;
  order: G[];
  labels: Record<G, string>;
  slugs: Record<G, string>;
  groupOf: (status: RequestStatus) => G;
  closed: G;
  empty: Record<G | "ALL", Empty>;
  /** The other person on each Request. */
  personId: (d: RequestDetail) => string;
  searchHint: string;
};

/** URL slug ↔ group. The Dashboard links use these slugs. */
export const GROUP_SLUGS: Record<CreativeRequestGroup, string> = {
  NEW: "new",
  AWAITING_CLIENT: "awaiting-client",
  AWAITING_PAYMENT: "payment",
  READY_TO_START: "ready",
  CLOSED: "closed",
};

export const CLIENT_GROUP_SLUGS: Record<ClientRequestGroup, string> = {
  ACTION_REQUIRED: "action",
  AWAITING_CREATIVE: "awaiting-creative",
  AWAITING_PAYMENT_CONFIRMATION: "payment",
  READY_TO_START: "ready",
  CLOSED: "closed",
};

const CREATIVE_LIST: ListConfig<CreativeRequestGroup> = {
  actor: "CREATIVE",
  base: "/app/creative/requests",
  title: "Requests",
  description: "Review new Requests, agree terms and confirm payments.",
  order: ["NEW", "AWAITING_CLIENT", "AWAITING_PAYMENT", "READY_TO_START", "CLOSED"],
  labels: CREATIVE_GROUP_LABELS,
  slugs: GROUP_SLUGS,
  groupOf: creativeRequestGroup,
  closed: "CLOSED",
  personId: (d) => d.request.clientId,
  searchHint: "Search by name, Client or reference",
  empty: {
    ALL: {
      title: "No Requests yet",
      description: "When a Client submits a Request from your link, it appears here.",
    },
    NEW: { title: "Nothing new", description: "New Requests appear here for you to review." },
    AWAITING_CLIENT: {
      title: "Nothing waiting on Clients",
      description: "Requests where a Client owes you a reply appear here.",
    },
    AWAITING_PAYMENT: {
      title: "No payments outstanding",
      description: "Requests waiting for a commitment payment appear here.",
    },
    READY_TO_START: {
      title: "Nothing ready to start",
      description:
        "When a Request has everything it needs, it appears here so you can start the Project.",
    },
    CLOSED: {
      title: "No closed Requests",
      description: "Declined, withdrawn and started Requests appear here.",
    },
  },
};

const CLIENT_LIST: ListConfig<ClientRequestGroup> = {
  actor: "CLIENT",
  base: "/app/client/requests",
  title: "Requests",
  description: "Your Requests with Creatives, and what happens next on each.",
  order: [
    "ACTION_REQUIRED",
    "AWAITING_CREATIVE",
    "AWAITING_PAYMENT_CONFIRMATION",
    "READY_TO_START",
    "CLOSED",
  ],
  labels: CLIENT_GROUP_LABELS,
  slugs: CLIENT_GROUP_SLUGS,
  groupOf: clientRequestGroup,
  closed: "CLOSED",
  personId: (d) => d.request.creativeId,
  searchHint: "Search by name, Creative or reference",
  empty: {
    ALL: {
      title: "No Requests yet",
      description: "When you send a Request from a Creative's link, it appears here.",
    },
    ACTION_REQUIRED: {
      title: "Nothing needs you",
      description: "When a Creative sends a proposal, question or payment step, it appears here.",
    },
    AWAITING_CREATIVE: {
      title: "Nothing waiting on Creatives",
      description: "Requests a Creative is reviewing appear here.",
    },
    AWAITING_PAYMENT_CONFIRMATION: {
      title: "No payments waiting",
      description: "Payments you've declared appear here until the Creative confirms them.",
    },
    READY_TO_START: {
      title: "Nothing ready to start",
      description:
        "Requests with everything agreed and paid appear here until the Creative starts the Project.",
    },
    CLOSED: {
      title: "No closed Requests",
      description: "Declined, withdrawn and started Requests appear here.",
    },
  },
};

function RequestsList<G extends string>({
  config,
  details: base,
  names,
  now,
}: {
  config: ListConfig<G>;
  details: RequestDetail[];
  names: Record<string, string>;
  now: string;
}) {
  const details = useMergedRequests(base);
  const params = useSearchParams();
  const slug = params.get("group");
  const group = config.order.find((g) => config.slugs[g] === slug) ?? null;
  const [query, setQuery] = useState("");
  const nowDate = useMemo(() => new Date(now), [now]);
  const groupOf = (d: RequestDetail) => config.groupOf(d.request.status);

  const counts = Object.fromEntries(
    config.order.map((g) => [g, details.filter((d) => groupOf(d) === g).length]),
  ) as Record<G, number>;
  const q = query.trim().toLowerCase();
  const fallback = config.actor === "CREATIVE" ? "Client" : "Creative";
  const name = (d: RequestDetail) => names[config.personId(d)] ?? fallback;
  const shown = details.filter(
    (d) =>
      (group ? groupOf(d) === group : groupOf(d) !== config.closed) &&
      (!q ||
        d.request.title.toLowerCase().includes(q) ||
        d.request.reference.toLowerCase().includes(q) ||
        name(d).toLowerCase().includes(q)),
  );
  const items = [
    { href: config.base, label: "All open", count: details.length - counts[config.closed] },
    ...config.order.map((g) => ({
      href: `${config.base}?group=${config.slugs[g]}`,
      label: config.labels[g],
      count: counts[g],
    })),
  ];
  const empty = config.empty[group ?? "ALL"];

  return (
    <PageContainer>
      <PageHeader title={config.title} description={config.description} />
      <SectionLayout
        label="Request groups"
        items={items}
        currentHref={group ? `${config.base}?group=${slug}` : config.base}
      >
        <div className="flex flex-col gap-5">
          {details.length > 0 && (
            <FormField label="Search Requests" hideLabel className="sm:max-w-sm">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-muted"
                />
                <Input
                  type="search"
                  placeholder={config.searchHint}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </FormField>
          )}
          <p role="status" className="sr-only">
            {shown.length} {shown.length === 1 ? "Request" : "Requests"}
          </p>
          {shown.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={q ? <Search /> : <Inbox />}
              title={q ? "No Requests match" : empty.title}
              description={q ? "Try another name or reference." : empty.description}
            />
          ) : (
            <ul
              className="flex flex-col gap-3"
              aria-label={group ? config.labels[group] : "Open Requests"}
            >
              {shown.map((d) => (
                <li key={d.request.id}>
                  <RequestCard
                    request={d.request}
                    view={requestView(d)}
                    actor={config.actor}
                    counterpart={name(d)}
                    href={`${config.base}/${d.request.id}`}
                    agreedMinor={d.agreement?.agreedPriceMinor ?? null}
                    now={nowDate}
                    headingLevel="h2"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionLayout>
    </PageContainer>
  );
}

type ListProps = { details: RequestDetail[]; now: string };

export function CreativeRequests({
  clientNames,
  ...props
}: ListProps & { clientNames: Record<string, string> }) {
  return <RequestsList config={CREATIVE_LIST} names={clientNames} {...props} />;
}

export function ClientRequests({
  creativeNames,
  ...props
}: ListProps & { creativeNames: Record<string, string> }) {
  return <RequestsList config={CLIENT_LIST} names={creativeNames} {...props} />;
}
