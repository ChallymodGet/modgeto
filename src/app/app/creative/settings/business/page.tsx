import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/layout/page";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { BusinessPreferences } from "@/features/creative-profile/settings-screens";

export const metadata: Metadata = { title: "Business preferences" };

async function Content() {
  const viewer = await getViewer();
  const creative = viewer.creative!;
  const [paymentMethods, services] = await Promise.all([
    repositories.creatives.listPaymentMethods(creative.userId),
    repositories.services.listByCreative(creative.userId),
  ]);
  return (
    <BusinessPreferences creative={creative} paymentMethods={paymentMethods} services={services} />
  );
}

export default function Page() {
  return (
    <Section title="Business preferences">
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </Section>
  );
}
