import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Projects" description="Projects you have started with Creatives." />
      <ScreenPlaceholder title="Projects" phase="Phase 7.16" source="docs/04 §23" />
    </PageContainer>
  );
}
