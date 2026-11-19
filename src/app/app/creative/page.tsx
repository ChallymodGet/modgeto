import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { CreativeDashboard } from "@/features/creative-profile/creative-dashboard";
import { repositories } from "@/features/data";

export const metadata: Metadata = { title: "Dashboard" };

async function Dashboard() {
  const viewer = await getViewer();
  const creative = viewer.creative!;
  const [requests, services, projects, subscription, paymentMethods] = await Promise.all([
    repositories.requests.listForCreative(creative.userId),
    repositories.services.listByCreative(creative.userId),
    repositories.projects.listForCreative(creative.userId),
    repositories.subscriptions.getForCreative(creative.userId),
    repositories.creatives.listPaymentMethods(creative.userId),
  ]);
  const details = (
    await Promise.all(requests.map((r) => repositories.requests.getDetail(r.id)))
  ).filter((d): d is NonNullable<typeof d> => d !== null);
  const clientIds = [
    ...new Set([...requests.map((r) => r.clientId), ...projects.map((p) => p.clientId)]),
  ];
  const clientNames = Object.fromEntries(
    await Promise.all(
      clientIds.map(
        async (id) => [id, (await repositories.users.getById(id))?.fullName ?? "Client"] as const,
      ),
    ),
  );

  return (
    <CreativeDashboard
      creative={creative}
      details={details}
      services={services}
      projects={projects}
      subscription={subscription}
      paymentMethods={paymentMethods}
      clientNames={clientNames}
      siteUrl={process.env.SITE_URL ?? "https://modgeto.vercel.app"}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
