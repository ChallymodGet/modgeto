/**
 * Creative Dashboard (docs/06 §44–49, docs/04 §8, D-031). What needs the
 * Creative now, in priority order; then Requests, Projects, capacity and
 * quick actions. Stacks by urgency on phones; nothing disappears.
 */
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  Eye,
  Inbox,
  Link2,
  MessageSquareReply,
  Package,
  PlayCircle,
  Plus,
} from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { PageContainer, Section } from "@/components/layout/page";
import { AttentionItem } from "@/components/notifications/activity";
import { ProjectCard } from "@/components/project/project-card";
import { CapacityUsage } from "@/components/subscription/subscription";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CREATIVE_GROUP_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type {
  CreativeProfile,
  PaymentMethod,
  Project,
  RequestDetail,
  Service,
  Subscription,
} from "@/types";
import {
  type AttentionKind,
  attentionItems,
  capacity,
  isNewCreative,
  requestOverview,
} from "./dashboard";
import { ShareLink } from "./share-link";

const ICONS: Record<AttentionKind, ReactNode> = {
  READY_TO_START: <PlayCircle />,
  PAYMENT_TO_CONFIRM: <CircleDollarSign />,
  NEW_REQUEST: <Inbox />,
  CLIENT_RESPONSE: <MessageSquareReply />,
  SERVICE_ISSUE: <CircleAlert />,
  SUBSCRIPTION_ISSUE: <CreditCard />,
};

const GROUP_PARAM = {
  NEW: "new",
  AWAITING_CLIENT: "awaiting-client",
  AWAITING_PAYMENT: "awaiting-payment",
  READY_TO_START: "ready",
} as const;

type Props = {
  creative: CreativeProfile;
  details: RequestDetail[];
  services: Service[];
  projects: Project[];
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  clientNames: Record<string, string>;
  siteUrl: string;
};

function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("flex flex-col gap-4 rounded-xl bg-surface p-5 md:p-6", className)}
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h4 text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function CreativeDashboard({
  creative,
  details,
  services,
  projects,
  subscription,
  paymentMethods,
  clientNames,
  siteUrl,
}: Props) {
  const firstName = creative.displayName.split(" ")[0];
  const link = `${siteUrl.replace(/^https?:\/\//, "")}/${creative.username}`;
  const fullLink = `${siteUrl}/${creative.username}`;
  const attention = attentionItems({ details, services, subscription, clientNames });
  const overview = requestOverview(details);
  const cap = capacity(services, subscription);
  const active = projects.filter((p) => p.status === "ACTIVE");
  const isNew = isNewCreative(services);
  const hasRequests = details.length > 0;

  return (
    <PageContainer className="flex flex-col gap-8 md:gap-10">
      {/* Greeting (D-031) */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-h1 text-foreground">Welcome back, {firstName}</h1>
          <p className="text-body text-foreground-secondary">
            {attention.length > 0
              ? `${attention.length} ${attention.length === 1 ? "thing needs" : "things need"} your attention.`
              : isNew
                ? "Let's get your first Service live."
                : "You're all caught up."}
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <NextLink
            href={`/${creative.username}`}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-body-sm text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Link2 aria-hidden="true" className="size-4 text-primary-text" />
            <span className="truncate">
              {link.split("/")[0]}/
              <span className="font-semibold text-foreground">{creative.username}</span>
            </span>
          </NextLink>
          <ShareLink url={fullLink} size="sm" />
        </div>
      </header>

      {isNew ? (
        <ActivationChecklist
          hasPaymentMethod={paymentMethods.length > 0}
          hasDraft={services.length > 0}
        />
      ) : (
        <>
          {/* Needs attention, by priority (docs/06 §46) */}
          {attention.length > 0 && (
            <Section title="Needs your attention" id="attention">
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {attention.map((a) => (
                  <li key={a.kind} className="flex">
                    <div className="w-full">
                      <AttentionItem
                        icon={ICONS[a.kind]}
                        title={a.title}
                        description={a.description}
                        action={a.action}
                        tone={a.tone}
                        count={a.count}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Request overview */}
          <Section
            title="Requests"
            id="requests"
            actions={
              <ButtonLink href="/app/creative/requests" variant="ghost" size="sm">
                All Requests
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            }
          >
            {hasRequests ? (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(Object.keys(overview) as (keyof typeof overview)[]).map((g) => (
                  <li key={g}>
                    <NextLink
                      href={`/app/creative/requests?group=${GROUP_PARAM[g]}`}
                      className="flex h-full flex-col gap-2 rounded-xl bg-surface p-4 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:p-5"
                    >
                      <span className="text-body-sm text-foreground-secondary">
                        {CREATIVE_GROUP_LABELS[g]}
                      </span>
                      <span className="text-[2.25rem] leading-none text-numeral text-foreground">
                        {overview[g]}
                      </span>
                    </NextLink>
                  </li>
                ))}
              </ul>
            ) : (
              // No-request state: the live link and Copy My Link (docs/06 §48).
              <EmptyState
                headingLevel="h3"
                icon={<Inbox />}
                title="No Requests yet"
                description={`Share your link so Clients can start a Project with you. Requests appear here.`}
                actions={<ShareLink url={fullLink} />}
              />
            )}
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Section
              title="Active Projects"
              id="projects"
              actions={
                active.length > 0 ? (
                  <ButtonLink href="/app/creative/projects" variant="ghost" size="sm">
                    All Projects
                    <ArrowRight aria-hidden="true" />
                  </ButtonLink>
                ) : undefined
              }
            >
              {active.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {active.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <ProjectCard
                        project={p}
                        actor="CREATIVE"
                        counterpart={clientNames[p.clientId] ?? "Client"}
                        href={`/app/creative/projects/${p.id}`}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-surface p-5 text-body-sm text-foreground-secondary">
                  No active Projects. When you start a Project from a Ready to Start Request, it
                  appears here.
                </p>
              )}
            </Section>

            <div className="flex flex-col gap-6">
              <Panel
                title="Service capacity"
                action={
                  <NextLink
                    href="/app/creative/subscription"
                    className="rounded-sm text-label text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    Manage
                  </NextLink>
                }
              >
                <CapacityUsage used={cap.used} limit={cap.limit} />
              </Panel>
              <QuickActions username={creative.username} />
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}

function QuickActions({ username }: { username: string }) {
  const actions = [
    { href: "/app/creative/services/new", label: "Create Service", icon: <Plus /> },
    { href: `/${username}`, label: "View Public Profile", icon: <Eye /> },
    { href: "/app/creative/services", label: "Manage Services", icon: <Package /> },
  ];
  return (
    <Panel title="Quick actions">
      <ul className="flex flex-col gap-1">
        {actions.map((a) => (
          <li key={a.href}>
            <NextLink
              href={a.href}
              className="flex min-h-11 items-center gap-3 rounded-md px-2 text-label text-foreground hover:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus [&_svg]:size-4 [&_svg]:text-foreground-muted"
            >
              {a.icon}
              <span className="flex-1">{a.label}</span>
              <ArrowRight aria-hidden="true" />
            </NextLink>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** New-Creative state (docs/06 §47): a checklist, not empty metrics. */
function ActivationChecklist({
  hasPaymentMethod,
  hasDraft,
}: {
  hasPaymentMethod: boolean;
  hasDraft: boolean;
}) {
  const steps = [
    { done: true, title: "Set up your profile", body: "Your name, title and link are ready." },
    {
      done: hasDraft,
      title: "Create your first Service",
      body: "Packages, pricing, Brief and terms.",
      href: "/app/creative/services/new",
    },
    {
      done: hasPaymentMethod,
      title: "Add a payment method",
      body: "So Clients know how to pay you directly.",
      href: "/app/creative/settings/payment-methods",
    },
    { done: false, title: "Publish your Service", body: "Your first Published Service is free." },
    {
      done: false,
      title: "Share your link",
      body: "Put it in your bio, portfolio or email signature.",
    },
  ];
  const next = steps.find((s) => !s.done);
  return (
    <section
      aria-labelledby="checklist-title"
      className="flex flex-col gap-6 rounded-xl bg-surface p-6 md:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="checklist-title" className="text-h3 text-foreground">
          Get ready for your first Client
        </h2>
        <p className="text-body-sm text-foreground-secondary">
          {steps.filter((s) => s.done).length} of {steps.length} done
        </p>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s) => (
          <li key={s.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                s.done ? "border-success bg-success text-surface" : "border-border-control",
              )}
            >
              {s.done && <BadgeCheck className="size-4" />}
            </span>
            <div className="flex flex-col gap-0.5">
              <p
                className={cn(
                  "text-label",
                  s.done
                    ? "text-foreground-secondary line-through decoration-foreground-muted"
                    : "text-foreground",
                )}
              >
                {s.href && !s.done ? (
                  <NextLink href={s.href} className="underline-offset-4 hover:underline">
                    {s.title}
                  </NextLink>
                ) : (
                  s.title
                )}
                <span className="sr-only">{s.done ? " (done)" : " (to do)"}</span>
              </p>
              <p className="text-body-sm text-foreground-secondary">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      {next?.href && (
        <ButtonLink href={next.href} size="lg" className="self-start">
          {next.title === "Create your first Service" ? "Create Your First Service" : next.title}
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      )}
    </section>
  );
}
