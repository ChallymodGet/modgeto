import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { ProfileManager } from "@/features/creative-profile/profile-manager";
import { repositories } from "@/features/data";

export const metadata: Metadata = { title: "Public Profile" };

async function Profile() {
  const creative = (await getViewer()).creative!;
  const [services, paymentMethods] = await Promise.all([
    repositories.services.listByCreative(creative.userId),
    repositories.creatives.listPaymentMethods(creative.userId),
  ]);
  return (
    <ProfileManager
      creative={creative}
      services={services}
      paymentMethods={paymentMethods}
      siteUrl={process.env.SITE_URL ?? "https://modgeto.vercel.app"}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Profile />
    </Suspense>
  );
}
