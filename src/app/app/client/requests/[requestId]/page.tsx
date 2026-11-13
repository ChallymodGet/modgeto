import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Request detail" };

export default function Page({ params }: PageProps<"/app/client/requests/[requestId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Request ${p.requestId}`}
              title="Request detail"
              back={{ href: "/app/client/requests", label: "Requests" }}
            />
            <ScreenPlaceholder title="Request detail" phase="Phase 7.13" source="docs/04 §22" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
