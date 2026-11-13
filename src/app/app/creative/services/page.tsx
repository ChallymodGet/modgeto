import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Services" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Services" description="Package what you offer and choose what is live." />
      <ScreenPlaceholder title="Services" phase="Phase 7.9" source="docs/04 §11" />
    </PageContainer>
  );
}
