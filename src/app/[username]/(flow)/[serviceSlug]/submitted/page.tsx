import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicLayout } from "@/components/layout/focused-shells";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { loadPublicCreative } from "@/features/creative-profile/queries";
import { repositories } from "@/features/data";
import { serviceCommitmentBps } from "@/features/services/model";
import { RequestSubmitted } from "@/features/requests/submitted";

export const metadata: Metadata = { title: "Project Request submitted", robots: { index: false } };

async function Submitted({ username, slug }: { username: string; slug: string }) {
  const found = await loadPublicCreative(username);
  if (!found) notFound();
  const { creative } = found;
  const service = await repositories.services.getBySlug(creative.userId, slug);
  if (!service) notFound();
  return (
    <RequestSubmitted
      creativeName={creative.displayName}
      creativeUsername={creative.username}
      serviceName={service.name}
      pricingMode={service.pricingMode}
      hasCommitment={serviceCommitmentBps(service, creative) !== null}
    />
  );
}

export default function SubmittedPage({
  params,
}: PageProps<"/[username]/[serviceSlug]/submitted">) {
  return (
    <PublicLayout>
      <Suspense fallback={<PageSkeleton />}>
        <ResolveParams params={params}>
          {(p) => <Submitted username={p.username} slug={p.serviceSlug} />}
        </ResolveParams>
      </Suspense>
    </PublicLayout>
  );
}
