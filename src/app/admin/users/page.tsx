import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Users" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Users" description="Creatives, Clients and suspended accounts." />
      <ScreenPlaceholder title="Users" phase="Phase 7.18" source="docs/04 §27" />
    </PageContainer>
  );
}
