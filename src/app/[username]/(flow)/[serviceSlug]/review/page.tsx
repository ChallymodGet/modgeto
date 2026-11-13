import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfigurationShell } from "@/components/layout/flow-shells";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { ScreenPlaceholder } from "@/components/layout/state-screens";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Review and submit", robots: { index: false } };

export default function Page({ params }: PageProps<"/[username]/[serviceSlug]/review">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => {
          const base = `/${p.username}/${p.serviceSlug}`;
          return (
            <ConfigurationShell
              back={{ href: base, label: "Back to Service" }}
              steps={[
                { label: "Configure", href: `${base}/configure` },
                { label: "Brief", href: `${base}/brief` },
                { label: "Review", href: `${base}/review` },
              ]}
              currentStep={2}
              summary={
                <Card>
                  <p className="text-label text-foreground">Price summary</p>
                  <p className="text-body-sm text-foreground-muted">Built in Phase 7.3.</p>
                </Card>
              }
            >
              <h1 className="mb-6 text-h2 text-foreground">Review and submit</h1>
              <ScreenPlaceholder
                title="Review and submit"
                phase="Phase 7.6"
                source="docs/06 Request Review"
              />
            </ConfigurationShell>
          );
        }}
      </ResolveParams>
    </Suspense>
  );
}
