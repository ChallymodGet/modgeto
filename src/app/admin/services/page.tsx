import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Services" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Services" description="Every Service on the platform." />
      <ScreenPlaceholder title="Services" phase="Phase 7.18" source="docs/04 §28" />
    </PageContainer>
  );
}
