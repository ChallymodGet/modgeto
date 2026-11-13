import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-6">
      <div className="flex flex-col gap-1.5 border-b border-border pb-4">
        <h2 id={`${id}-title`} className="text-h3 text-foreground">
          {title}
        </h2>
        {description && (
          <p className="max-w-2xl text-body-sm text-foreground-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function Specimen({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-caption font-medium tracking-wide text-foreground-muted uppercase">
        {label}
      </h3>
      <div className={cn("rounded-lg border border-border bg-surface p-4 md:p-6", className)}>
        {children}
      </div>
    </div>
  );
}
