import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Home" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Home" description="Your Requests and Projects at a glance." />
      <ScreenPlaceholder title="Home" phase="Phase 7.13" source="docs/04 §20" />
    </PageContainer>
  );
}
