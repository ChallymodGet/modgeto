/**
 * V1 Project card (docs/04 §50). Overview facts only: no tasks, milestones,
 * chat, deliverables or progress tracking (CLAUDE.md §5).
 */
import NextLink from "next/link";
import { MoneyDisplay } from "@/components/service/price";
import { StatusBadge } from "@/components/ui/status-badge";
import { projectStatusLabel } from "@/lib/domain";
import { formatDate, formatTurnaround } from "@/lib/format";
import type { Project } from "@/types";

export function ProjectCard({
  project,
  counterpart,
  actor,
  href,
  headingLevel: Heading = "h3",
}: {
  project: Project;
  counterpart: string;
  actor: "CREATIVE" | "CLIENT";
  href: string;
  headingLevel?: "h2" | "h3";
}) {
  const facts: [string, string][] = [
    ["Started", formatDate(project.startedAt)],
    ["Agreed timeline", formatTurnaround(project.agreedTimeline)],
    ...(project.completedAt
      ? ([["Completed", formatDate(project.completedAt)]] as [string, string][])
      : []),
  ];
  return (
    <article className="group/card relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-caption text-foreground-muted">{project.service.name}</p>
          <Heading className="text-h4 text-foreground">
            <NextLink
              href={href}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {project.title}
            </NextLink>
          </Heading>
          <p className="text-body-sm text-foreground-secondary">
            {actor === "CREATIVE" ? "For" : "With"} {counterpart}
          </p>
        </div>
        <StatusBadge status={projectStatusLabel(project.status)} />
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-caption text-foreground-muted">Agreed price</dt>
          <dd>
            <MoneyDisplay
              amountMinor={project.agreement.agreedPriceMinor}
              currency={project.agreement.currency}
              size="sm"
            />
          </dd>
        </div>
        {facts.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <dt className="text-caption text-foreground-muted">{k}</dt>
            <dd className="text-body-sm font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
