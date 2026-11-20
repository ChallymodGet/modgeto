import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/layout/page";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { NotificationSettings } from "@/features/creative-profile/settings-screens";

export const metadata: Metadata = { title: "Notifications" };

async function Content() {
  const viewer = await getViewer();
  const creative = viewer.creative!;
  const paymentMethods = await repositories.creatives.listPaymentMethods(creative.userId);
  return (
    <NotificationSettings
      email={viewer.user.email}
      creative={creative}
      paymentMethods={paymentMethods}
    />
  );
}

export default function Page() {
  return (
    <Section title="Notifications">
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </Section>
  );
}
