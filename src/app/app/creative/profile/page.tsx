import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Public Profile" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Public Profile" description="How Clients see you at your link." />
      <ScreenPlaceholder title="Public Profile" phase="Phase 7.11" source="docs/04 §14" />
    </PageContainer>
  );
}
