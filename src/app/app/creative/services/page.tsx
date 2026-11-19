import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { ServicesScreen } from "@/features/services/services-screen";
import { FIXTURE_NOW } from "@/lib/fixtures/time";

export const metadata: Metadata = { title: "Services" };

async function Services() {
  const viewer = await getViewer();
  const creative = viewer.creative!;
  const [services, subscription] = await Promise.all([
    repositories.services.listByCreative(creative.userId),
    repositories.subscriptions.getForCreative(creative.userId),
  ]);
  return (
    <ServicesScreen
      services={services}
      subscription={subscription}
      creativeId={creative.userId}
      username={creative.username}
      siteUrl={process.env.SITE_URL ?? "https://modgeto.vercel.app"}
      // Fixture clock until real data (Phase 8), so "Updated 3 days ago" is stable.
      now={FIXTURE_NOW.toISOString()}
    />
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Services />
    </Suspense>
  );
}
