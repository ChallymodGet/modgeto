import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { loadPublicCreative } from "@/features/creative-profile/queries";
import { repositories } from "@/features/data";
import { ConfigurationFlow } from "@/features/requests/configuration-flow";
import { isPubliclyVisible, serviceCommitmentBps } from "@/features/services/model";
import { newRequestBlock } from "@/lib/domain";

export const metadata: Metadata = { title: "Configure your Project", robots: { index: false } };

async function Configure({ username, slug }: { username: string; slug: string }) {
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
  // No commissioning flow while Requests are paused (PUB-009); the Service page explains.
  if (blocked) redirect(base);

  return (
    <ConfigurationFlow
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

export default function ConfigurePage({
  params,
}: PageProps<"/[username]/[serviceSlug]/configure">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => <Configure username={p.username} slug={p.serviceSlug} />}
      </ResolveParams>
    </Suspense>
  );
}
