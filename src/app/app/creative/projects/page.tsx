import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Projects" description="Active and completed Projects." />
      <ScreenPlaceholder title="Projects" phase="Phase 7.16" source="docs/04 §13" />
    </PageContainer>
  );
}
