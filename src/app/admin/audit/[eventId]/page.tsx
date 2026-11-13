import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Audit event" };

export default function Page({ params }: PageProps<"/admin/audit/[eventId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Event ${p.eventId}`}
              title="Audit event"
              back={{ href: "/admin/audit", label: "Audit" }}
            />
            <ScreenPlaceholder title="Audit event" phase="Phase 7.18" source="docs/04 §31" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
