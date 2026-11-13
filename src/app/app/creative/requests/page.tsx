import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Requests" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Requests" description="New, waiting and ready-to-start Requests." />
      <ScreenPlaceholder title="Requests" phase="Phase 7.12" source="docs/04 §9" />
    </PageContainer>
  );
}
