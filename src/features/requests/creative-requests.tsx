"use client";

/**
 * Creative Requests (docs/04 §9, §46). Groups map several domain states to
 * what the Creative needs to do; the group lives in the URL so Dashboard
 * links land on the right one. Search covers title, Client and reference.
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
  type CreativeRequestGroup,
  CREATIVE_GROUP_LABELS,
  creativeRequestGroup,
} from "@/lib/domain";
import type { RequestDetail } from "@/types";
import { requestView } from "./model";
import { useMergedRequests } from "./simulated-requests";

const BASE = "/app/creative/requests";

/** URL slug ↔ group. The Dashboard links use these slugs. */
export const GROUP_SLUGS: Record<CreativeRequestGroup, string> = {
  NEW: "new",
  AWAITING_CLIENT: "awaiting-client",
  AWAITING_PAYMENT: "payment",
  READY_TO_START: "ready",
  CLOSED: "closed",
};
const ORDER: CreativeRequestGroup[] = [
  "NEW",
  "AWAITING_CLIENT",
  "AWAITING_PAYMENT",
  "READY_TO_START",
  "CLOSED",
];

const EMPTY: Record<CreativeRequestGroup | "ALL", { title: string; description: string }> = {
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
};

export function CreativeRequests({
  details: base,
  clientNames,
  now,
}: {
  details: RequestDetail[];
  clientNames: Record<string, string>;
  now: string;
}) {
  const details = useMergedRequests(base);
  const params = useSearchParams();
  const slug = params.get("group");
  const group = ORDER.find((g) => GROUP_SLUGS[g] === slug) ?? null;
  const [query, setQuery] = useState("");
  const nowDate = useMemo(() => new Date(now), [now]);

  const counts = Object.fromEntries(
    ORDER.map((g) => [
      g,
      details.filter((d) => creativeRequestGroup(d.request.status) === g).length,
    ]),
  ) as Record<CreativeRequestGroup, number>;
  const q = query.trim().toLowerCase();
  const name = (d: RequestDetail) => clientNames[d.request.clientId] ?? "Client";
  const shown = details.filter(
    (d) =>
      (group
        ? creativeRequestGroup(d.request.status) === group
        : creativeRequestGroup(d.request.status) !== "CLOSED") &&
      (!q ||
        d.request.title.toLowerCase().includes(q) ||
        d.request.reference.toLowerCase().includes(q) ||
        name(d).toLowerCase().includes(q)),
  );
  const open = details.length - counts.CLOSED;
  const items = [
    { href: BASE, label: "All open", count: open },
    ...ORDER.map((g) => ({
      href: `${BASE}?group=${GROUP_SLUGS[g]}`,
      label: CREATIVE_GROUP_LABELS[g],
      count: counts[g],
    })),
  ];
  const empty = EMPTY[group ?? "ALL"];

  return (
    <PageContainer>
      <PageHeader
        title="Requests"
        description="Review new Requests, agree terms and confirm payments."
      />
      <SectionLayout
        label="Request groups"
        items={items}
        currentHref={group ? `${BASE}?group=${slug}` : BASE}
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
                  placeholder="Search by name, Client or reference"
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
              aria-label={group ? CREATIVE_GROUP_LABELS[group] : "Open Requests"}
            >
              {shown.map((d) => (
                <li key={d.request.id}>
                  <RequestCard
                    request={d.request}
                    view={requestView(d)}
                    actor="CREATIVE"
                    counterpart={name(d)}
                    href={`${BASE}/${d.request.id}`}
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
