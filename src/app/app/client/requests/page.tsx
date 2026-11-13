import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Requests" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Requests" description="Requests you have sent to Creatives." />
      <ScreenPlaceholder title="Requests" phase="Phase 7.13" source="docs/04 §21" />
    </PageContainer>
  );
}
