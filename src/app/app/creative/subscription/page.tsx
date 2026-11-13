import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Subscription" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Subscription" description="Your Service capacity and billing." />
      <ScreenPlaceholder title="Subscription" phase="Phase 7.15" source="docs/04 §15, D-001" />
    </PageContainer>
  );
}
