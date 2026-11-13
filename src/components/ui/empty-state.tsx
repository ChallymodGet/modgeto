import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EmptyStateProps = {
  /** A Lucide icon, rendered decoratively. */
  icon?: ReactNode;
  title: string;
  /** Say why it's empty and what to do next (Brand Guidelines). */
  description?: ReactNode;
  /** One primary action, optionally followed by a secondary one. */
  actions?: ReactNode;
  headingLevel?: "h1" | "h2" | "h3";
  /** `bordered` sits inside a page; `plain` sits inside an existing card. */
  variant?: "bordered" | "plain";
  className?: string;
};

function EmptyState({
  icon,
  title,
  description,
  actions,
  headingLevel: Heading = "h2",
  variant = "bordered",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 px-6 py-12 text-center",
        variant === "bordered" && "rounded-lg border border-dashed border-border-strong bg-surface",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-primary-subtle text-primary-text [&_svg]:size-6"
        >
          {icon}
        </div>
      )}
      <div className="flex max-w-md flex-col gap-1.5">
        <Heading className="text-h4 text-foreground">{title}</Heading>
        {description && <p className="text-body-sm text-foreground-secondary">{description}</p>}
      </div>
      {actions && (
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
          {actions}
        </div>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
