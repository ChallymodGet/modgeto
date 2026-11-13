import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Subscription detail" };

export default function Page({ params }: PageProps<"/admin/subscriptions/[subscriptionId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Subscription ${p.subscriptionId}`}
              title="Subscription detail"
              back={{ href: "/admin/subscriptions", label: "Subscriptions" }}
            />
            <ScreenPlaceholder
              title="Subscription detail"
              phase="Phase 7.18"
              source="docs/04 §30"
            />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
