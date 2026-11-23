"use client";

/**
 * Client Home (docs/04 §20): what needs the Client, then active Requests,
 * active Projects and recent activity. Action-led, not a feed.
 */
import {
  CircleDollarSign,
  FileCheck2,
  FileText,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { PageContainer, PageHeader, Panel } from "@/components/layout/page";
import { AttentionItem } from "@/components/notifications/activity";
import { ProjectCard } from "@/components/project/project-card";
import { RequestCard } from "@/components/request/request-summaries";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/format";
import type { Project, RequestDetail } from "@/types";
import {
  type ClientAttentionKind,
  activeRequests,
  clientAttention,
  recentActivity,
} from "./client-home";
import { requestView } from "./model";
import { useMergedProjects, useMergedRequests } from "./simulated-requests";

const ICONS: Record<ClientAttentionKind, ReactNode> = {
  CHANGES: <FileText />,
  QUOTE: <FileText />,
  QUESTION: <MessageCircleQuestion />,
  TERMS: <FileCheck2 />,
  PAYMENT: <CircleDollarSign />,
};

export function ClientHome({
  clientId,
  clientName,
  details: base,
  projects: baseProjects,
  creativeNames,
  now,
}: {
  clientId: string;
  clientName: string;
  details: RequestDetail[];
  projects: Project[];
  creativeNames: Record<string, string>;
  now: string;
}) {
  const details = useMergedRequests(base);
  const projects = useMergedProjects(baseProjects, (p) => p.clientId === clientId).filter(
    (p) => p.status === "ACTIVE",
  );
  const nowDate = useMemo(() => new Date(now), [now]);
  const attention = clientAttention(details, creativeNames, now.slice(0, 10));
  const active = activeRequests(details, attention);
  const activity = recentActivity(details, creativeNames, clientName);
  const firstName = clientName.split(" ")[0];
  const creative = (id: string) => creativeNames[id] ?? "Creative";

  if (details.length === 0 && projects.length === 0) {
    return (
      <PageContainer>
        <PageHeader title={`Welcome, ${firstName}`} />
        <EmptyState
          icon={<Sparkles />}
          title="No Requests yet"
          description="When you send a Request from a Creative's link, you'll follow it here: proposals, terms, payment and the Project."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your Requests and Projects at a glance."
      />
      <div className="flex flex-col gap-8">
        <section aria-labelledby="attention-title" className="flex flex-col gap-4">
          <h2 id="attention-title" className="text-h3 text-foreground">
            Needs your attention
          </h2>
          {attention.length === 0 ? (
            <p className="rounded-xl bg-surface p-5 text-body-sm text-foreground-secondary">
              Nothing needs you right now. We&apos;ll let you know when a Creative replies.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {attention.map((a) => (
                <li key={`${a.kind}-${a.requestId}`}>
                  <AttentionItem
                    icon={ICONS[a.kind]}
                    title={a.title}
                    description={a.description}
                    action={a.action}
                    tone={a.tone}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <Panel
              headingLevel="h2"
              title="Active Requests"
              actions={
                <ButtonLink href="/app/client/requests" variant="ghost" size="sm">
                  All Requests
                </ButtonLink>
              }
            >
              {active.length === 0 ? (
                <p className="text-body-sm text-foreground-secondary">
                  {attention.length > 0
                    ? "Your other open Requests are above."
                    : "No open Requests."}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {active.slice(0, 5).map((d) => (
                    <li key={d.request.id}>
                      <RequestCard
                        request={d.request}
                        view={requestView(d)}
                        actor="CLIENT"
                        counterpart={creative(d.request.creativeId)}
                        href={`/app/client/requests/${d.request.id}`}
                        agreedMinor={d.agreement?.agreedPriceMinor ?? null}
                        now={nowDate}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel
              headingLevel="h2"
              title="Active Projects"
              actions={
                <ButtonLink href="/app/client/projects" variant="ghost" size="sm">
                  All Projects
                </ButtonLink>
              }
            >
              {projects.length === 0 ? (
                <p className="text-body-sm text-foreground-secondary">
                  When a Creative starts your Project, it appears here.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {projects.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <ProjectCard
                        project={p}
                        actor="CLIENT"
                        counterpart={creative(p.creativeId)}
                        href={`/app/client/projects/${p.id}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
          <Panel headingLevel="h2" title="Recent activity" className="self-start">
            <ol className="flex flex-col divide-y divide-border">
              {activity.map((a, i) => (
                <li key={`${a.at}-${i}`} className="flex flex-col gap-0.5 py-3 first:pt-0">
                  <span className="text-body-sm text-foreground">{a.text}</span>
                  <span className="text-caption text-foreground-secondary">
                    {a.requestTitle} · {formatRelative(a.at, nowDate)}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </PageContainer>
  );
}
