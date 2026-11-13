import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "./page";

/**
 * Awaits route params inside a Suspense boundary. Under Cache Components,
 * params are request data, so dynamic pages render the static shell first
 * and stream the param-dependent part.
 */
export async function ResolveParams<P>({
  params,
  children,
}: {
  params: Promise<P>;
  children: (params: P) => ReactNode;
}) {
  return <>{children(await params)}</>;
}

/** Loading state for a whole page: header lines and two content blocks. */
export function PageSkeleton() {
  return (
    <PageContainer>
      <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
