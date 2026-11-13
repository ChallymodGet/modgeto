import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Subscriptions" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Subscriptions" description="Creative subscriptions and capacity." />
      <ScreenPlaceholder title="Subscriptions" phase="Phase 7.18" source="docs/04 §30" />
    </PageContainer>
  );
}
