import { CircleDollarSign, Inbox } from "lucide-react";
import type { Metadata } from "next";
import NextLink from "next/link";
import {
  AttentionItem,
  NotificationItem,
  StatusTimeline,
} from "@/components/notifications/activity";
import {
  CommitmentProgress,
  PaymentInstructions,
  PaymentRecord,
} from "@/components/payment/payment";
import { ProjectCard } from "@/components/project/project-card";
import { ProposalCard, ProposalComparison } from "@/components/request/proposals";
import { RequestStatus } from "@/components/request/request-status";
import { RequestCard, RequestSummary, ScopeSummary } from "@/components/request/request-summaries";
import {
  CommitmentSummary,
  EstimatedPrice,
  PriceBreakdown,
  PriceDifference,
  ServicePrice,
} from "@/components/service/price";
import { PackageCard } from "@/components/service/scope";
import { ServiceCard } from "@/components/service/service-card";
import {
  CapacityPrice,
  CapacityUsage,
  SubscriptionStatus,
} from "@/components/subscription/subscription";
import { Button } from "@/components/ui/button";
import { repositories } from "@/features/data";
import { serviceCommitmentBps } from "@/features/services/model";
import { formatMoney, money } from "@/lib/domain";
import { FIXTURE_NOW } from "@/lib/fixtures/time";
import { ShowcaseSection, Specimen } from "../_demos/section";
import {
  BriefDemo,
  ConfigurationDemo,
  NegotiationDemo,
  PaymentFormsDemo,
  SubscriptionDemo,
} from "../_demos/product-interactive";

export const metadata: Metadata = { title: "Product components" };

const contents = [
  ["service", "Service and pricing"],
  ["configuration", "Configuration"],
  ["brief", "Brief"],
  ["request", "Requests and proposals"],
  ["payment", "Payment"],
  ["subscription", "Subscription"],
  ["activity", "Projects and activity"],
] as const;

/** Product components (docs/07 §24–30) rendered with fixture data through the repositories. */
export default async function ProductComponentsPage() {
  const ada = (await repositories.creatives.getByUsername("ada"))!;
  const services = await repositories.services.listByCreative(ada.userId);
  const byId = (id: string) => services.find((s) => s.id === id)!;
  const brand = byId("svc-brand-identity");
  const landing = byId("svc-landing-page");
  const retainer = byId("svc-design-retainer");
  const social = byId("svc-social-kit");
  const requests = await repositories.requests.listForCreative(ada.userId);
  const projects = await repositories.projects.listForCreative(ada.userId);
  const detail = (id: string) => repositories.requests.getDetail(id).then((d) => d!);
  const [fieldnote, northwind, lumen, okra, tidewater] = await Promise.all(
    ["req-fieldnote", "req-northwind", "req-lumen", "req-okra", "req-tidewater"].map(detail),
  );
  const methods = await repositories.creatives.listPaymentMethods(ada.userId);
  const notifications = await repositories.notifications.listForUser(ada.userId);
  const clientIds = [
    ...new Set([...requests.map((r) => r.clientId), ...projects.map((p) => p.clientId)]),
  ];
  const clientNames = Object.fromEntries(
    await Promise.all(
      clientIds.map(async (id) => [
        id,
        (await repositories.users.getById(id))?.fullName ?? "Client",
      ]),
    ),
  ) as Record<string, string>;
  const names = { CREATIVE: ada.displayName, CLIENT: clientNames[northwind.request.clientId] };

  const [previousProposal, liveProposal] = fieldnote.proposals;
  const firstPackage = brand.packages[0];
  const pkgDeliverables = (pid: string) =>
    brand.deliverables.filter((d) => d.packageId === null || d.packageId === pid);
  const today = FIXTURE_NOW.toISOString().slice(0, 10);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 md:px-8">
          <p className="text-caption font-medium tracking-wide text-primary-text uppercase">
            Internal
          </p>
          <h1 className="text-h1 text-foreground">Product components</h1>
          <p className="max-w-2xl text-body text-foreground-secondary">
            Service, pricing, Brief, Request, payment, subscription and activity components,
            rendered with fixture data. See also the{" "}
            <NextLink
              href="/dev/components"
              className="font-medium text-primary-text underline underline-offset-4"
            >
              generic primitives
            </NextLink>
            .
          </p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-10 md:px-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Showcase contents" className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <ul className="relative flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1">
            {contents.map(([id, label]) => (
              <li key={id} className="shrink-0">
                <a
                  href={`#${id}`}
                  className="flex h-10 items-center rounded-full border border-border bg-surface px-4 text-label whitespace-nowrap text-foreground-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:rounded-md lg:border-0 lg:bg-transparent lg:px-3"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex min-w-0 flex-col gap-16">
          <ShowcaseSection
            id="service"
            title="Service and pricing"
            description="Exact, estimated and quote prices are always labelled differently. Custom Quote never shows a number."
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <ServiceCard service={brand} href="#service" />
              <ServiceCard service={landing} href="#service" />
              <ServiceCard service={retainer} href="#service" />
            </div>
            <Specimen
              label="Creative workspace card (shows status)"
              className="grid gap-6 md:grid-cols-2"
            >
              <ServiceCard
                service={social}
                href="#service"
                manage={{
                  actions: (
                    <>
                      <Button size="sm" variant="secondary">
                        Edit Service
                      </Button>
                      <Button size="sm" variant="ghost">
                        Preview
                      </Button>
                    </>
                  ),
                }}
              />
              <ServiceCard service={byId("svc-pitch-deck")} href="#service" manage={{}} />
            </Specimen>
            <Specimen label="Headline price by pricing mode" className="grid gap-8 sm:grid-cols-2">
              {[brand, landing, social, retainer].map((s) => (
                <div key={s.id} className="flex flex-col gap-2">
                  <p className="text-caption text-foreground-muted">
                    {s.pricingMode.replace("_", " ").toLowerCase()}
                  </p>
                  <ServicePrice service={s} variant="hero" />
                </div>
              ))}
            </Specimen>
            <div className="grid gap-6 md:grid-cols-2">
              <PackageCard
                pkg={firstPackage}
                deliverables={pkgDeliverables(firstPackage.id)}
                currency={brand.currency}
              />
              <PackageCard
                pkg={brand.packages.find((p) => p.recommended) ?? brand.packages[1]}
                deliverables={pkgDeliverables(
                  (brand.packages.find((p) => p.recommended) ?? brand.packages[1]).id,
                )}
                currency={brand.currency}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Specimen label="Estimated price">
                <EstimatedPrice
                  amountMinor={landing.baseAmountMinor!}
                  currency={landing.currency}
                />
              </Specimen>
              <Specimen label="Price difference">
                <PriceDifference
                  previousMinor={previousProposal.totalMinor}
                  proposedMinor={57_000_000n}
                  currency="NGN"
                />
              </Specimen>
              <Specimen label="Commitment summary" className="flex flex-col gap-6">
                <CommitmentSummary bps={5_000} amountMinor={12_500_000n} currency="NGN" />
                <CommitmentSummary bps={null} amountMinor={null} currency="USD" />
              </Specimen>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Specimen label="Breakdown: Starting From (estimate)">
                <PriceBreakdown
                  breakdown={
                    northwind.request.snapshot.price.priceState === "ESTIMATED"
                      ? northwind.request.snapshot.price
                      : fieldnote.request.snapshot.price
                  }
                />
              </Specimen>
              <Specimen label="Breakdown: Custom Quote">
                <PriceBreakdown
                  breakdown={(await detail("req-fieldnote-retainer")).request.snapshot.price}
                />
              </Specimen>
            </div>
          </ShowcaseSection>

          <ShowcaseSection
            id="configuration"
            title="Configuration"
            description="Real radio and checkbox groups under every card; the summary recalculates with the domain pricing engine."
          >
            <ConfigurationDemo
              service={brand}
              quantityService={social}
              commitmentBps={serviceCommitmentBps(brand, ada)}
            />
          </ShowcaseSection>

          <ShowcaseSection
            id="brief"
            title="Brief"
            description="All ten question types, one-level conditional questions, section validation that moves focus to the first problem, and uploads with progress, retry and remove. Name a file with 'fail' to see a failed upload."
          >
            <BriefDemo service={brand} />
          </ShowcaseSection>

          <ShowcaseSection id="request" title="Requests and proposals">
            <div className="grid gap-4 lg:grid-cols-2">
              {requests.slice(0, 4).map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  actor="CREATIVE"
                  counterpart={clientNames[r.clientId]}
                  href="#request"
                  now={FIXTURE_NOW}
                />
              ))}
            </div>
            <Specimen label="Status banners (each actor)" className="flex flex-col gap-3">
              <RequestStatus
                variant="banner"
                actor="CREATIVE"
                counterpart="Kemi"
                view={{ status: "AWAITING_PAYMENT_CONFIRMATION", awaitingClientReason: null }}
              />
              <RequestStatus
                variant="banner"
                actor="CLIENT"
                counterpart="Ada"
                view={{ status: "AWAITING_CLIENT", awaitingClientReason: "QUOTE_PROPOSED" }}
              />
              <RequestStatus
                variant="banner"
                actor="CLIENT"
                counterpart="Ada"
                view={{ status: "READY_TO_START", awaitingClientReason: null }}
              />
            </Specimen>
            <Specimen label="Request summary and scope">
              <div className="flex flex-col gap-6">
                <RequestSummary
                  request={tidewater.request}
                  actor="CREATIVE"
                  counterpart={clientNames[tidewater.request.clientId]}
                />
                <ScopeSummary
                  scope={tidewater.request.snapshot.scope}
                  currency="NGN"
                  lines={tidewater.request.snapshot.price.lines}
                />
              </div>
            </Specimen>
            <div className="grid gap-6 lg:grid-cols-2">
              <ProposalCard
                proposal={liveProposal}
                actions={
                  <>
                    <Button variant="secondary">Decline proposal</Button>
                    <Button>Accept proposal</Button>
                  </>
                }
              />
              <ProposalCard proposal={previousProposal} />
            </div>
            <Specimen label="Proposal comparison">
              <ProposalComparison
                currency="NGN"
                previous={{
                  totalMinor: 45_000_000n,
                  turnaround: { value: 2, unit: "WEEKS" },
                  commitmentBps: 4_000,
                  commitmentAmountMinor: 18_000_000n,
                  deliverables: ["Landing page design", "Framer build"],
                }}
                proposed={{
                  totalMinor: liveProposal.totalMinor,
                  turnaround: liveProposal.turnaround,
                  commitmentBps: liveProposal.commitmentBps,
                  commitmentAmountMinor: liveProposal.commitmentAmountMinor,
                  deliverables: ["Landing page design", "Framer build", "Page copy"],
                }}
              />
            </Specimen>
            <NegotiationDemo
              responses={northwind.responses}
              names={names}
              terms={northwind.request.snapshot.terms}
            />
          </ShowcaseSection>

          <ShowcaseSection
            id="payment"
            title="Payment"
            description="Modgeto never collects Client Project payments. A declaration is not a confirmation; only the Creative confirms what arrived."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Specimen label="Payment instructions">
                <PaymentInstructions
                  methods={methods}
                  amountDueMinor={19_000_000n}
                  currency="NGN"
                  reference={lumen.request.reference}
                  creativeName={ada.displayName}
                />
              </Specimen>
              <div className="flex flex-col gap-6">
                <Specimen label="Commitment progress">
                  <div className="flex flex-col gap-6">
                    <CommitmentProgress
                      requiredMinor={okra.request.requiredCommitmentMinor ?? 0n}
                      confirmedMinor={okra.request.confirmedMinor}
                      currency="NGN"
                    />
                    <CommitmentProgress
                      requiredMinor={11_200_000n}
                      confirmedMinor={11_200_000n}
                      currency="NGN"
                    />
                  </div>
                </Specimen>
                <Specimen label="Payment record">
                  <PaymentRecord
                    declarations={okra.declarations}
                    confirmations={okra.confirmations}
                    adjustments={okra.adjustments}
                  />
                </Specimen>
              </div>
            </div>
            <PaymentFormsDemo methods={methods} declaration={lumen.declarations[0]} today={today} />
          </ShowcaseSection>

          <ShowcaseSection
            id="subscription"
            title="Subscription"
            description="The approved D-001 prices. 5 Services cost less than 4 and 10 cost less than 9, and both points are called out."
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Specimen label="Capacity price" className="flex flex-col gap-4">
                <CapacityPrice limit={1} market="NG" />
                <CapacityPrice limit={5} market="NG" />
                <CapacityPrice limit={10} market="INTL" />
              </Specimen>
              <Specimen label="Capacity usage" className="flex flex-col gap-6">
                <CapacityUsage used={3} limit={5} />
                <CapacityUsage used={4} limit={2} />
              </Specimen>
              <Specimen label="Subscription status" className="flex flex-col gap-6">
                <SubscriptionStatus
                  status="ACTIVE"
                  limit={5}
                  scheduledLimit={3}
                  periodEnd="2026-12-01T00:00:00Z"
                  graceEndsAt={null}
                  cancelAtPeriodEnd={false}
                />
                <SubscriptionStatus
                  status="PAST_DUE"
                  limit={5}
                  scheduledLimit={null}
                  periodEnd={null}
                  graceEndsAt="2026-11-17T00:00:00Z"
                  cancelAtPeriodEnd={false}
                />
              </Specimen>
            </div>
            <SubscriptionDemo
              services={services
                .filter((s) => s.lifecycle === "PUBLISHED" || s.lifecycle === "UNAVAILABLE")
                .map((s) => ({ id: s.id, name: s.name, publishedAt: s.publishedAt }))}
              freeServiceId={ada.selectedFreeServiceId}
            />
          </ShowcaseSection>

          <ShowcaseSection
            id="activity"
            title="Projects and activity"
            description="V1 Projects show agreed facts only: no tasks, milestones, chat or deliverables."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  actor="CREATIVE"
                  counterpart={clientNames[p.clientId]}
                  href="#activity"
                />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AttentionItem
                icon={<Inbox />}
                title="New Requests"
                description="Review the Brief and respond."
                action={{ href: "#activity", label: "Review Requests" }}
                count={2}
              />
              <AttentionItem
                icon={<CircleDollarSign />}
                tone="warning"
                title="Payment to confirm"
                description="Kemi says they've paid for Lumen Studio."
                action={{ href: "#activity", label: "Confirm payment" }}
                count={1}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Specimen label="Notifications" className="p-0 md:p-0">
                <div className="divide-y divide-border">
                  {notifications.slice(0, 4).map((n) => (
                    <NotificationItem key={n.id} notification={n} now={FIXTURE_NOW} />
                  ))}
                </div>
              </Specimen>
              <Specimen label="Status timeline">
                <StatusTimeline
                  events={[
                    {
                      id: "1",
                      label: "Request submitted",
                      at: okra.request.submittedAt,
                      state: "done",
                    },
                    { id: "2", label: "Quote accepted", state: "done" },
                    { id: "3", label: "Terms accepted", state: "done" },
                    {
                      id: "4",
                      label: "Commitment confirmed",
                      description: `${formatMoney(money(okra.request.confirmedMinor, "NGN"))} of ${formatMoney(money(okra.request.requiredCommitmentMinor ?? 0n, "NGN"))} confirmed so far.`,
                      state: "current",
                    },
                    { id: "5", label: "Ready to Start", state: "upcoming" },
                  ]}
                />
              </Specimen>
            </div>
          </ShowcaseSection>
        </main>
      </div>
    </div>
  );
}
