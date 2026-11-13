"use client";

import { cn } from "@/lib/utils";
import { CircleAlert, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

type ErrorStateProps = {
  title?: string;
  /** Say what failed and what the person can do. Never show raw error text. */
  description?: ReactNode;
  /** Renders a "Try again" button. */
  onRetry?: () => void;
  retrying?: boolean;
  /** Extra actions, such as a link back. */
  actions?: ReactNode;
  headingLevel?: "h2" | "h3";
  /** `inline` is a compact banner inside a section. */
  variant?: "block" | "inline";
  className?: string;
};

/** Load or action failure. Announced as an alert when it appears. */
function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Check your connection and try again.",
  onRetry,
  retrying,
  actions,
  headingLevel: Heading = "h2",
  variant = "block",
  className,
}: ErrorStateProps) {
  const retry = onRetry && (
    <Button
      variant="secondary"
      size={variant === "inline" ? "sm" : "md"}
      onClick={onRetry}
      loading={retrying}
    >
      <RotateCw aria-hidden="true" />
      Try again
    </Button>
  );

  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col gap-3 rounded-lg border border-danger-border bg-danger-subtle p-4 sm:flex-row sm:items-start",
          className,
        )}
      >
        <CircleAlert aria-hidden="true" className="size-5 shrink-0 text-danger" />
        <div className="flex flex-1 flex-col gap-1">
          <Heading className="text-label text-foreground">{title}</Heading>
          <p className="text-body-sm text-foreground-secondary">{description}</p>
        </div>
        {(retry || actions) && (
          <div className="flex flex-wrap gap-2">
            {retry}
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-danger-subtle text-danger"
      >
        <CircleAlert className="size-6" />
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <Heading className="text-h4 text-foreground">{title}</Heading>
        <p className="text-body-sm text-foreground-secondary">{description}</p>
      </div>
      {(retry || actions) && (
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row">
          {retry}
          {actions}
        </div>
      )}
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
