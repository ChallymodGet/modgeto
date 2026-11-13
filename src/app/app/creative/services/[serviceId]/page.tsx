import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Service Builder" };

export default function Page({ params }: PageProps<"/app/creative/services/[serviceId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Service ${p.serviceId}`}
              title="Service Builder"
              back={{ href: "/app/creative/services", label: "Services" }}
            />
            <ScreenPlaceholder
              title="Service Builder"
              phase="Phase 7.10"
              source="docs/04 §12 and §37"
            />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
