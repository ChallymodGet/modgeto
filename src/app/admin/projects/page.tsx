import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Projects" description="Read-only view of Projects." />
      <ScreenPlaceholder title="Projects" phase="Phase 7.18" source="docs/04 §29" />
    </PageContainer>
  );
}
