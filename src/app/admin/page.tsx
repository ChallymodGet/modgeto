import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Overview" description="What needs attention across the platform." />
      <ScreenPlaceholder title="Overview" phase="Phase 7.18" source="docs/04 §26" />
    </PageContainer>
  );
}
