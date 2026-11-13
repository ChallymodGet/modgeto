import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Create Service" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader
        title="Create Service"
        description="Start a new Service. You can save it as a draft at any time."
        back={{ href: "/app/creative/services", label: "Services" }}
      />
      <ScreenPlaceholder title="Create Service" phase="Phase 7.10" source="docs/04 §12" />
    </PageContainer>
  );
}
