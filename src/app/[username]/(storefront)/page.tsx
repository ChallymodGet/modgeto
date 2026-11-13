import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export default function CreativeProfilePage({ params }: PageProps<"/[username]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <h1 className="mb-6 text-h1 text-foreground">@{p.username}</h1>
            <ScreenPlaceholder
              title="Creative Public Profile"
              phase="Phase 7.1"
              source="docs/04 §33"
            />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
