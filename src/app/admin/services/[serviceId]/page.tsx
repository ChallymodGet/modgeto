import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Service detail" };

export default function Page({ params }: PageProps<"/admin/services/[serviceId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Service ${p.serviceId}`}
              title="Service detail"
              back={{ href: "/admin/services", label: "Services" }}
            />
            <ScreenPlaceholder title="Service detail" phase="Phase 7.18" source="docs/04 §28" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
