import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Audit" };

export default function Page() {
  return (
    <PageContainer>
      <PageHeader title="Audit" description="Every Admin action, with its reason." />
      <ScreenPlaceholder title="Audit" phase="Phase 7.18" source="docs/04 §31" />
    </PageContainer>
  );
}
