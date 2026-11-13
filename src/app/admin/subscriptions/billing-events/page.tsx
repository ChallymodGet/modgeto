import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Billing events" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Billing events"
        description="Paystack subscription events."
        back={{ href: "/admin/subscriptions", label: "Subscriptions" }}
      />
      <ScreenPlaceholder title="Billing events" phase="Phase 7.18" source="docs/04 §30" />
    </PageContainer>
  );
}
