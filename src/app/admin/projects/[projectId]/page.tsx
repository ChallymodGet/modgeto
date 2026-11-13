import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Project detail" };

export default function Page({ params }: PageProps<"/admin/projects/[projectId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`Project ${p.projectId}`}
              title="Project detail"
              back={{ href: "/admin/projects", label: "Projects" }}
            />
            <ScreenPlaceholder title="Project detail" phase="Phase 7.18" source="docs/04 §29" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
