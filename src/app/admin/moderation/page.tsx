import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Moderation" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Moderation" description="Reports and platform-disabled content." />
      <ScreenPlaceholder title="Moderation" phase="Phase 7.18" source="docs/04 §31" />
    </PageContainer>
  );
}
