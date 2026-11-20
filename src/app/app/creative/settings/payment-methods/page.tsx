import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/layout/page";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { PaymentMethodsSettings } from "@/features/creative-profile/settings-screens";

export const metadata: Metadata = { title: "Payment methods" };

async function Content() {
  const viewer = await getViewer();
  const creative = viewer.creative!;
  const [paymentMethods, services] = await Promise.all([
    repositories.creatives.listPaymentMethods(creative.userId),
    repositories.services.listByCreative(creative.userId),
  ]);
  return (
    <PaymentMethodsSettings
      creative={creative}
      paymentMethods={paymentMethods}
      services={services}
    />
  );
}

export default function Page() {
  return (
    <Section title="Payment methods">
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </Section>
  );
}
