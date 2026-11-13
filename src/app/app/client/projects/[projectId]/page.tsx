import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Project" };

export default function Page({ params }: PageProps<"/app/client/projects/[projectId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Project ${p.projectId}`}
              title="Project"
              back={{ href: "/app/client/projects", label: "Projects" }}
            />
            <ScreenPlaceholder title="Project" phase="Phase 7.16" source="docs/04 §23 and §50" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
