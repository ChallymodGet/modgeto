import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Categories" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        description="Service categories shown to Creatives and Clients."
        back={{ href: "/admin/services", label: "Services" }}
      />
      <ScreenPlaceholder title="Categories" phase="Phase 7.18" source="docs/04 §28, roadmap Q6" />
    </PageContainer>
  );
}
