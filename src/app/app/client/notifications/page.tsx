import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Notifications" description="Updates on your Requests and Projects." />
      <ScreenPlaceholder title="Notifications" phase="Phase 7.14" source="docs/04 §45" />
    </PageContainer>
  );
}
