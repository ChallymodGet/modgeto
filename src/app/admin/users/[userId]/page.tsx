import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "User detail" };

export default function Page({ params }: PageProps<"/admin/users/[userId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => (
          <PageContainer>
            <PageHeader
              eyebrow={`User ${p.userId}`}
              title="User detail"
              back={{ href: "/admin/users", label: "Users" }}
            />
            <ScreenPlaceholder title="User detail" phase="Phase 7.18" source="docs/04 §27" />
          </PageContainer>
        )}
      </ResolveParams>
    </Suspense>
  );
}
