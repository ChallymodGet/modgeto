/**
 * Service Detail (docs/06 §19–23, docs/04 §34, PUB-002, PUB-009).
 * Helps the Client decide before configuring. Desktop: content beside a
 * sticky summary. Phone: stacked, with a sticky Configure bar.
 */
import { ArrowRight, ChevronLeft, ImageIcon, PauseCircle, ShieldCheck } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { BottomActionBar, PageContainer } from "@/components/layout/page";
import { ResourceUnavailableScreen } from "@/components/layout/state-screens";
import { MoneyDisplay, PriceModifier, ServicePrice } from "@/components/service/price";
import {
  DeliverableList,
  PackageCard,
  RevisionSummary,
  TurnaroundSummary,
} from "@/components/service/scope";
import { ServiceCard } from "@/components/service/service-card";
import { WorkSampleCard } from "@/components/service/work-sample";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney, money } from "@/lib/domain";
import { formatPercent, formatTurnaround } from "@/lib/format";
import type { CreativeProfile, Service } from "@/types";
import { servicePriceSummary, standardTurnaround } from "./model";

type Props = {
  creative: CreativeProfile;
  service: Service;
  /** Null when the Service can't take new Requests right now (no reason shown publicly). */
  configureHref: string | null;
  commitmentBps: number | null;
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 border-t border-border pt-8"
    >
      <h2 id={`${id}-title`} className="text-h3 text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ctaLabel(service: Service) {
  return service.pricingMode === "CUSTOM_QUOTE" ? "Request a Quote" : "Configure This Service";
}

function PausedNotice({ firstName }: { firstName: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-subtle p-4">
      <PauseCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground-muted" />
      <div className="flex flex-col gap-0.5">
        <p className="text-label text-foreground">Not taking new Requests right now</p>
        <p className="text-body-sm text-foreground-secondary">
          You can still read about this Service. Check {firstName}&apos;s profile again soon.
        </p>
      </div>
    </div>
  );
}

export function ServiceDetail({ creative, service, configureHref, commitmentBps }: Props) {
  const firstName = creative.displayName.split(" ")[0];
  const profileHref = `/${creative.username}`;
  const turnaround = standardTurnaround(service) ?? service.packages[0]?.turnaround ?? null;
  const sharedDeliverables = service.deliverables.filter((d) => d.packageId === null);
  const activeAddOns = service.addOns
    .filter((a) => a.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const packages = [...service.packages].sort((a, b) => a.displayOrder - b.displayOrder);
  const rule = service.quantityRules[0];
  const summary = servicePriceSummary(service);
  const termsParagraphs = service.terms.content.split(/\n\s*\n/).filter(Boolean);

  const cta = configureHref ? (
    <ButtonLink href={configureHref} size="lg" fullWidth>
      {ctaLabel(service)}
      <ArrowRight aria-hidden="true" />
    </ButtonLink>
  ) : (
    <PausedNotice firstName={firstName} />
  );

  const summaryCard = (
    <div className="flex flex-col gap-5 rounded-xl bg-surface p-6 shadow-sm">
      <ServicePrice service={service} variant="hero" />
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {turnaround && <TurnaroundSummary turnaround={turnaround} label="Delivery" />}
        <RevisionSummary
          policy={service.revisions.policy}
          additionalRevisionAmountMinor={service.revisions.additionalRevisionAmountMinor}
          currency={service.currency}
        />
      </div>
      {cta}
      {configureHref && (
        <p className="text-caption text-foreground-secondary">
          You&apos;ll see the full price and terms before you submit your Request.
        </p>
      )}
    </div>
  );

  return (
    <PageContainer className="pt-4 md:pt-8">
      {/* Creative context */}
      <NextLink
        href={profileHref}
        className="group/ctx mb-6 inline-flex items-center gap-3 rounded-full py-1 pr-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:mb-8"
      >
        <ChevronLeft
          aria-hidden="true"
          className="size-4 text-foreground-muted transition-transform group-hover/ctx:-translate-x-0.5"
        />
        <Avatar name={creative.displayName} src={creative.avatarUrl} size="sm" decorative />
        <span className="flex flex-col leading-tight">
          <span className="text-label text-foreground">{creative.displayName}</span>
          <span className="text-caption text-foreground-secondary">
            {creative.professionalTitle}
          </span>
        </span>
      </NextLink>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)] lg:gap-12">
        <article className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="text-h1 text-foreground md:text-[clamp(2.5rem,1.6rem+2.4vw,3.5rem)] md:leading-[1.08]">
              {service.name}
            </h1>
            <p className="max-w-2xl text-body-lg text-foreground-secondary">
              {service.shortDescription}
            </p>
          </header>

          {/* Phone and tablet: the summary sits under the title. */}
          <div className="lg:hidden">{summaryCard}</div>

          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-surface-subtle">
            {service.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 images get next/image in Phase 10
              <img src={service.coverImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,var(--primary-subtle),transparent_55%),radial-gradient(circle_at_85%_85%,var(--secondary-subtle),transparent_50%)]"
              >
                <ImageIcon className="size-10 text-foreground-disabled" />
              </div>
            )}
          </div>

          {service.detailedDescription && (
            <p className="max-w-2xl text-body whitespace-pre-line text-foreground">
              {service.detailedDescription}
            </p>
          )}

          {sharedDeliverables.length > 0 && (
            <Section id="included" title="What you get">
              <DeliverableList deliverables={sharedDeliverables} />
            </Section>
          )}

          {packages.length > 0 && (
            <Section id="packages" title="Packages">
              <p className="text-body-sm text-foreground-secondary">
                Each package includes everything above. You&apos;ll choose one when you configure.
              </p>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((p) => (
                  <li key={p.id} className="flex">
                    <PackageCard
                      pkg={p}
                      deliverables={service.deliverables.filter((d) => d.packageId === p.id)}
                      currency={service.currency}
                    />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {summary.kind === "PER_UNIT" && rule && (
            <Section id="pricing" title="Pricing">
              <p className="text-body text-foreground">
                <MoneyDisplay amountMinor={rule.unitAmountMinor} currency={service.currency} /> per{" "}
                {rule.unitName.toLowerCase()}
                <span className="text-foreground-secondary">
                  {" "}
                  ·{" "}
                  {rule.maximum ? `${rule.minimum} to ${rule.maximum}` : `at least ${rule.minimum}`}
                </span>
              </p>
            </Section>
          )}

          {activeAddOns.length > 0 && (
            <Section id="addons" title="Add-ons">
              <p className="text-body-sm text-foreground-secondary">
                Optional extras you can choose when you configure.
              </p>
              <ul className="flex flex-col divide-y divide-border rounded-xl bg-surface">
                {activeAddOns.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <span className="flex flex-col gap-0.5">
                      <span className="text-body-sm font-medium text-foreground">{a.name}</span>
                      {a.description && (
                        <span className="text-body-sm text-foreground-secondary">
                          {a.description}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-body-sm font-medium text-foreground tabular-nums">
                      {formatMoney(money(a.amountMinor, service.currency), { signed: true })}
                      {a.allowsQuantity ? " each" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {service.deliveryOptions.length > 0 && (
            <Section id="delivery" title="Delivery">
              <ul className="flex flex-col gap-3">
                {service.deliveryOptions.map((d) => (
                  <li key={d.id} className="flex items-baseline justify-between gap-4 text-body-sm">
                    <span className="text-foreground">
                      <span className="font-medium">{d.label}</span>
                      <span className="text-foreground-secondary">
                        {" "}
                        · {formatTurnaround(d.turnaround)}
                      </span>
                    </span>
                    <PriceModifier modifier={d.modifier} currency={service.currency} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section id="revisions" title="Revisions">
            <RevisionSummary
              policy={service.revisions.policy}
              additionalRevisionAmountMinor={service.revisions.additionalRevisionAmountMinor}
              currency={service.currency}
            />
          </Section>

          {service.workSamples.length > 0 && (
            <Section id="work" title="Relevant work">
              <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {service.workSamples.map((w) => (
                  <li key={w.id}>
                    <WorkSampleCard sample={w} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section id="terms" title="Key terms">
            <div className="flex flex-col gap-3 rounded-xl bg-surface p-5">
              <p className="flex items-start gap-2 text-body-sm text-foreground">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-foreground-muted"
                />
                <span>
                  {commitmentBps
                    ? `A ${formatPercent(commitmentBps)} commitment is paid directly to ${firstName} before the Project starts.`
                    : "No commitment payment is needed before the Project starts."}{" "}
                  Modgeto does not collect Client Project payments.
                </span>
              </p>
              {termsParagraphs.length > 0 && (
                <details className="group/terms border-t border-border pt-3">
                  <summary className="cursor-pointer rounded-sm text-label text-primary-text marker:text-foreground-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                    Read the full terms
                  </summary>
                  <div className="mt-3 flex flex-col gap-3 text-body-sm text-foreground-secondary">
                    {termsParagraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    <p className="text-caption text-foreground-muted">
                      You&apos;ll review and accept these terms before you submit your Request.
                    </p>
                  </div>
                </details>
              )}
            </div>
          </Section>

          {/* Repeated CTA (docs/06 §20) */}
          {configureHref && (
            <div className="hidden flex-col gap-4 rounded-xl bg-surface p-6 lg:flex">
              <p className="text-h4 text-foreground">Ready to start?</p>
              <div className="max-w-xs">{cta}</div>
            </div>
          )}
        </article>

        <aside aria-label="Service summary" className="hidden min-w-0 lg:block">
          <div className="sticky top-6">{summaryCard}</div>
        </aside>
      </div>

      {configureHref && (
        <BottomActionBar className="justify-between">
          <span className="min-w-0">
            <ServicePrice service={service} />
          </span>
          <ButtonLink href={configureHref} className="shrink-0">
            {service.pricingMode === "CUSTOM_QUOTE" ? "Request a Quote" : "Configure"}
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </BottomActionBar>
      )}
    </PageContainer>
  );
}

/** PUB-009: a useful dead end that routes to the Creative's other Services. */
export function ServiceUnavailable({
  creative,
  others,
}: {
  creative: CreativeProfile;
  others: Service[];
}) {
  const firstName = creative.displayName.split(" ")[0];
  return (
    <PageContainer className="flex flex-col gap-10">
      <ResourceUnavailableScreen
        headingLevel="h1"
        title="This Service isn't available"
        description={`It may have been paused or removed. ${others.length > 0 ? `Here's what ${firstName} offers now.` : `Visit ${firstName}'s profile to see what's next.`}`}
        action={{ href: `/${creative.username}`, label: `View ${firstName}'s profile` }}
      />
      {others.length > 0 && (
        <section aria-labelledby="others-title" className="flex flex-col gap-6">
          <h2 id="others-title" className="text-h3 text-foreground">
            Services from {creative.displayName}
          </h2>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {others.map((s) => (
              <li key={s.id} className="flex">
                <ServiceCard
                  service={s}
                  href={`/${creative.username}/${s.slug}`}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}
