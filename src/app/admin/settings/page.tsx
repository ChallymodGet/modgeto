import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Platform Settings" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Platform Settings" description="Platform-wide settings." />
      <ScreenPlaceholder
        title="Platform Settings"
        phase="Phase 7.18"
        source="docs/04 §25, roadmap Q11"
      />
    </PageContainer>
  );
}
