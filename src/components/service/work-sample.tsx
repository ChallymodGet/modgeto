/**
 * A work sample: evidence of the Creative's previous work (docs/01 §16.3).
 * Distinct from Brief examples (§16.4). Not a portfolio CMS (PUB-007).
 */
import { ArrowUpRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkSample } from "@/types";

export function WorkSampleCard({ sample, className }: { sample: WorkSample; className?: string }) {
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-subtle">
        {sample.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 images get next/image in Phase 10
          <img
            src={sample.imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover/work:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center bg-[linear-gradient(135deg,var(--primary-subtle),var(--surface-subtle)_55%,var(--secondary-subtle))]"
          >
            <ImageIcon className="size-8 text-foreground-disabled" />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 pt-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-body font-semibold text-foreground">{sample.title}</h3>
          {sample.description && (
            <p className="text-body-sm text-foreground-secondary">{sample.description}</p>
          )}
        </div>
        {sample.externalUrl && (
          <ArrowUpRight
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-foreground-muted"
          />
        )}
      </div>
    </>
  );

  return sample.externalUrl ? (
    <a
      href={sample.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group/work block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
        className,
      )}
    >
      {body}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <article className={cn("group/work", className)}>{body}</article>
  );
}
