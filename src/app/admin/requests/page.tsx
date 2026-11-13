import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Requests" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Requests" description="Read-only view of Requests." />
      <ScreenPlaceholder title="Requests" phase="Phase 7.18" source="docs/04 §29" />
    </PageContainer>
  );
}
