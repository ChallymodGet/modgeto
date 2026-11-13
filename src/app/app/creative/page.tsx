import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="What needs your attention today." />
      <ScreenPlaceholder title="Dashboard" phase="Phase 7.8" source="docs/04 §8" />
    </PageContainer>
  );
}
