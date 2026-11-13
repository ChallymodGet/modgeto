import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export default function ServiceDetailPage({ params }: PageProps<"/[username]/[serviceSlug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              title={p.serviceSlug}
              back={{ href: `/${p.username}`, label: `@${p.username}` }}
            />
            <ScreenPlaceholder title="Service Detail" phase="Phase 7.2" source="docs/04 §34" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
