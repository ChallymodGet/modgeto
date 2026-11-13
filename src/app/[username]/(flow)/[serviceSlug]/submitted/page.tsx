import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/focused-shells";
import { PageContainer } from "@/components/layout/page";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Request submitted", robots: { index: false } };

export default function Page() {
  return (
    <PublicLayout>
      <PageContainer size="narrow">
        <h1 className="mb-6 text-h1 text-foreground">Request submitted</h1>
        <ScreenPlaceholder
          title="Request Submitted"
          phase="Phase 7.6"
          source="docs/06 Request Submitted"
        />
      </PageContainer>
    </PublicLayout>
  );
}
