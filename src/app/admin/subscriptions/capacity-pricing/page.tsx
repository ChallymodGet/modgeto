import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Capacity pricing" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Capacity pricing"
        description="The approved NGN and USD capacity prices."
        back={{ href: "/admin/subscriptions", label: "Subscriptions" }}
      />
      <ScreenPlaceholder title="Capacity pricing" phase="Phase 7.18" source="docs/04 §30, D-001" />
    </PageContainer>
  );
}
