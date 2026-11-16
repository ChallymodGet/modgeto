import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { loadPublicCreative } from "@/features/creative-profile/queries";
import { repositories } from "@/features/data";
import { BriefFlow } from "@/features/requests/brief-flow";
import { isPubliclyVisible, serviceCommitmentBps } from "@/features/services/model";
import { newRequestBlock } from "@/lib/domain";

export const metadata: Metadata = { title: "Project Brief", robots: { index: false } };

async function Brief({ username, slug }: { username: string; slug: string }) {
  const found = await loadPublicCreative(username);
  if (!found) notFound();
  const { creative, user } = found;
  const base = `/${creative.username}/${slug}`;
  const service = await repositories.services.getBySlug(creative.userId, slug);
  if (!service || !isPubliclyVisible(service)) redirect(base);
  const blocked = newRequestBlock({
    creativeAccountOperational: user.accountStatus === "ACTIVE",
    moderation: service.moderation,
    availability: creative.availability,
    lifecycle: service.lifecycle,
    withinSubscriptionCapacity: true,
  });
  if (blocked) redirect(base);

  return (
    <BriefFlow
      service={service}
      creativeName={creative.displayName}
      commitmentBps={serviceCommitmentBps(service, creative)}
      serviceHref={base}
      configureHref={`${base}/configure`}
      briefHref={`${base}/brief`}
      reviewHref={`${base}/review`}
    />
  );
}

export default function BriefPage({ params }: PageProps<"/[username]/[serviceSlug]/brief">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => <Brief username={p.username} slug={p.serviceSlug} />}
      </ResolveParams>
    </Suspense>
  );
}
