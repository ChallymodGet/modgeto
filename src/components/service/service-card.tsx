import { ArrowRight, Clock, ImageIcon } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { standardTurnaround } from "@/features/services/model";
import { serviceStatusLabel } from "@/lib/domain";
import { formatTurnaround } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";
import { ServicePrice } from "./price";

/** Lifecycle status in the Creative's own language (docs/08 §15). Never shown publicly. */
export function ServiceStatusBadge({
  service,
  className,
}: {
  service: Pick<Service, "lifecycle" | "moderation">;
  className?: string;
}) {
  return (
    <StatusBadge
      status={serviceStatusLabel(service.lifecycle, service.moderation)}
      className={className}
    />
  );
}

type ServiceCardProps = {
  service: Service;
  href: string;
  /** Creative workspace view: shows the lifecycle status and an actions slot. */
  manage?: { actions?: ReactNode };
  headingLevel?: "h2" | "h3";
  className?: string;
};

/**
 * Service card (docs/06 §16): cover, name, short description, pricing state,
 * turnaround and a View Service link. The whole card is one link target,
 * with the name as its accessible name.
 */
export function ServiceCard({
  service,
  href,
  manage,
  headingLevel: Heading = "h3",
  className,
}: ServiceCardProps) {
  const turnaround = standardTurnaround(service) ?? service.packages[0]?.turnaround ?? null;
  const muted =
    service.lifecycle === "SUBSCRIPTION_INACTIVE" || service.moderation === "PLATFORM_DISABLED";

  return (
    <article
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-xl bg-surface transition-shadow duration-200",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus",
        "hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-subtle">
        {service.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 images get next/image in Phase 10
          <img
            src={service.coverImageUrl}
            alt=""
            className={cn(
              "size-full object-cover transition-transform duration-300 group-hover/card:scale-[1.02] motion-reduce:transition-none",
              muted && "opacity-60 grayscale",
            )}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,var(--primary-subtle),transparent_60%),radial-gradient(circle_at_80%_80%,var(--secondary-subtle),transparent_55%)]"
          >
            <ImageIcon className="size-8 text-foreground-disabled" />
          </div>
        )}
        {manage && (
          <ServiceStatusBadge service={service} className="absolute top-3 left-3 shadow-sm" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          <Heading className="text-h4 text-foreground">
            <NextLink
              href={href}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {service.name}
            </NextLink>
          </Heading>
          <p className="line-clamp-2 text-body-sm text-foreground-secondary">
            {service.shortDescription}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-1">
          <ServicePrice service={service} />
          {turnaround && (
            <span className="flex items-center gap-1.5 text-body-sm text-foreground-secondary">
              <Clock aria-hidden="true" className="size-4 text-foreground-muted" />
              {formatTurnaround(turnaround)}
            </span>
          )}
        </div>
        {manage?.actions ? (
          // Actions sit above the stretched link so they stay clickable.
          <div className="relative z-10 flex flex-wrap gap-2 border-t border-border pt-3">
            {manage.actions}
          </div>
        ) : (
          <span
            aria-hidden="true"
            className="flex items-center gap-1 text-label text-primary-text transition-transform group-hover/card:translate-x-0.5"
          >
            View Service
            <ArrowRight className="size-4" />
          </span>
        )}
      </div>
    </article>
  );
}
