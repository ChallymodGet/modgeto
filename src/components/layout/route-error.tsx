"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

/**
 * Error boundary content for a route segment. Shows a friendly message and a
 * retry, never raw error text (Brand Guidelines).
 */
export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replaced by structured logging in Phase 11.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 md:py-20">
      <ErrorState
        headingLevel="h1"
        title="Something went wrong"
        description="This page didn't load. Try again, and if it keeps happening, contact support."
        onRetry={reset}
      />
    </div>
  );
}
