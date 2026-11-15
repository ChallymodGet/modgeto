/**
 * Creative Public Profile (docs/04 §33, docs/06 §14–18, PUB-001–009).
 * A commissioning storefront, not a portfolio CMS (PUB-007). Services are
 * the dominant content; the primary action appears before them on phones.
 */
import { ArrowDown, ArrowRight, Globe, MapPin, PauseCircle } from "lucide-react";
import { ServiceCard } from "@/components/service/service-card";
import { WorkSampleCard } from "@/components/service/work-sample";
import { PageContainer } from "@/components/layout/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { availabilityLabel } from "@/lib/domain";
import type { CreativeLinkType, CreativeProfile, Discipline, Service } from "@/types";

const DISCIPLINES: Record<Discipline, string> = {
  DESIGN: "Design",
  DEVELOPMENT: "Development",
  WRITING: "Writing",
  MOTION_MEDIA: "Motion and Media",
};

const LINK_LABELS: Record<CreativeLinkType, string> = {
  PORTFOLIO: "Portfolio",
  LINKEDIN: "LinkedIn",
  BEHANCE: "Behance",
  DRIBBBLE: "Dribbble",
  GITHUB: "GitHub",
  OTHER: "Website",
};

/** "behance.net/example-ada" for display; the full URL stays in the link. */
function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}

export function CreativePublicProfile({
  creative,
  services,
}: {
  creative: CreativeProfile;
  services: Service[];
}) {
  const firstName = creative.displayName.split(" ")[0];
  const accepting = creative.availability !== "UNAVAILABLE";
  const samples = services
    .flatMap((s) => s.workSamples)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 6);
  const links = [...creative.links].sort((a, b) => a.displayOrder - b.displayOrder);
  const serviceHref = (s: Service) => `/${creative.username}/${s.slug}`;
  // One Service: the CTA goes straight to it. Several: to the list (docs/06 §17).
  const startHref = services.length === 1 ? serviceHref(services[0]) : "#services";
  const hasServices = services.length > 0;

  return (
    <>
      {/* Hero */}
      <div className="relative isolate overflow-hidden">
        {/* Controlled Indigo and Cyan accent (docs/08 §16); decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[36rem] rounded-full bg-[radial-gradient(circle,var(--primary-subtle)_0%,transparent_65%)] md:right-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-24 right-[30%] -z-10 hidden size-[22rem] rounded-full bg-[radial-gradient(circle,var(--secondary-subtle)_0%,transparent_65%)] lg:block"
        />
        <PageContainer className="pt-6 pb-12 md:pt-12 md:pb-16">
          <section aria-labelledby="creative-name" className="flex max-w-3xl flex-col gap-6">
            <Avatar name={creative.displayName} src={creative.avatarUrl} size="xl" decorative />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={availabilityLabel(creative.availability)} size="md" />
                {creative.availability === "LIMITED" && creative.availabilityNote && (
                  <span className="text-body-sm text-foreground-secondary">
                    {creative.availabilityNote}
                  </span>
                )}
              </div>
              <h1
                id="creative-name"
                className="text-h1 text-foreground md:text-[clamp(2.75rem,1.6rem+3vw,4rem)] md:leading-[1.05] md:tracking-[-0.03em]"
              >
                {creative.displayName}
              </h1>
              <p className="text-h3 font-normal text-foreground-secondary">
                {creative.professionalTitle}
              </p>
            </div>
            <p className="text-body-lg text-foreground">{creative.introduction}</p>
            <ul className="flex flex-wrap items-center gap-2" aria-label="Details">
              {creative.location && (
                <li className="flex items-center gap-1.5 pr-2 text-body-sm text-foreground-secondary">
                  <MapPin aria-hidden="true" className="size-4 text-foreground-muted" />
                  {creative.location}
                </li>
              )}
              {creative.disciplines.map((d) => (
                <li key={d}>
                  <Badge tone="outline" size="md">
                    {DISCIPLINES[d]}
                  </Badge>
                </li>
              ))}
            </ul>

            {accepting ? (
              hasServices && (
                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <ButtonLink href={startHref} size="lg" className="sm:w-auto">
                    Start a Project
                    {services.length === 1 ? (
                      <ArrowRight aria-hidden="true" />
                    ) : (
                      <ArrowDown aria-hidden="true" />
                    )}
                  </ButtonLink>
                  <p className="text-body-sm text-foreground-secondary">
                    {services.length === 1
                      ? "Configure the Service and share your Brief."
                      : "Choose a Service, configure it and share your Brief."}
                  </p>
                </div>
              )
            ) : (
              // Unavailable: the profile stays visible, new Requests are paused (PUB-004).
              <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
                <PauseCircle
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-foreground-muted"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-label text-foreground">Not taking new Requests right now</p>
                  <p className="text-body-sm text-foreground-secondary">
                    You can still look at {firstName}&apos;s Services and work. Check back soon.
                  </p>
                </div>
              </div>
            )}
          </section>
        </PageContainer>
      </div>

      <PageContainer className="flex flex-col gap-16 pt-0 pb-16 md:gap-20 md:pb-24">
        {/* Services: the dominant content (docs/04 §33) */}
        <section
          id="services"
          aria-labelledby="services-title"
          className="flex scroll-mt-6 flex-col gap-6"
        >
          <div className="flex flex-col gap-1.5">
            <h2 id="services-title" className="text-h2 text-foreground">
              Services
            </h2>
            {hasServices && (
              <p className="text-body text-foreground-secondary">
                {accepting
                  ? "Choose a Service to see what's included and start a Project."
                  : "What " + firstName + " offers. New Requests are paused for now."}
              </p>
            )}
          </div>
          {hasServices ? (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((s) => (
                <li key={s.id} className="flex">
                  <ServiceCard service={s} href={serviceHref(s)} className="w-full" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              headingLevel="h3"
              title="No Services yet"
              description={`${firstName} hasn't published any Services yet. Check back soon.`}
            />
          )}
        </section>

        {/* Selected Work: only when samples exist (docs/06 §18) */}
        {samples.length > 0 && (
          <section aria-labelledby="work-title" className="flex flex-col gap-6">
            <h2 id="work-title" className="text-h2 text-foreground">
              Selected work
            </h2>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((w) => (
                <li key={w.id}>
                  <WorkSampleCard sample={w} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {(creative.about || links.length > 0) && (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
            {creative.about && (
              <section aria-labelledby="about-title" className="flex flex-col gap-4">
                <h2 id="about-title" className="text-h2 text-foreground">
                  About
                </h2>
                <p className="max-w-2xl text-body-lg whitespace-pre-line text-foreground-secondary">
                  {creative.about}
                </p>
              </section>
            )}
            {links.length > 0 && (
              <section aria-labelledby="links-title" className="flex flex-col gap-4">
                <h2 id="links-title" className="text-h3 text-foreground">
                  Elsewhere
                </h2>
                <ul className="flex flex-col divide-y divide-border rounded-xl bg-surface">
                  {links.map((l) => (
                    <li key={l.id}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link flex min-h-14 items-center gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                      >
                        <Globe
                          aria-hidden="true"
                          className="size-4 shrink-0 text-foreground-muted"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-label text-foreground">
                            {l.label ?? LINK_LABELS[l.type]}
                          </span>
                          <span className="truncate text-caption text-foreground-secondary">
                            {shortUrl(l.url)}
                          </span>
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 -rotate-45 text-foreground-muted transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                        />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Repeated CTA (docs/06 §15) */}
        {accepting && services.length > 1 && (
          <section
            aria-labelledby="cta-title"
            className="flex flex-col items-start gap-4 rounded-xl bg-foreground px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10"
          >
            <div className="flex flex-col gap-1">
              <h2 id="cta-title" className="text-h3 text-surface">
                Ready to start working with {firstName}?
              </h2>
              <p className="text-body text-surface/80">
                Pick a Service, tell {firstName} about your Project, and see the price before you
                submit.
              </p>
            </div>
            <ButtonLink href="#services" variant="secondary" size="lg" className="shrink-0">
              Choose a Service
            </ButtonLink>
          </section>
        )}
      </PageContainer>
    </>
  );
}
