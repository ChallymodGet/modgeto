import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { loadPublicCreative } from "@/features/creative-profile/queries";
import { repositories } from "@/features/data";
import { isPubliclyVisible, serviceCommitmentBps } from "@/features/services/model";
import { ServiceDetail, ServiceUnavailable } from "@/features/services/service-detail";
import { newRequestBlock } from "@/lib/domain";

async function load(username: string, slug: string) {
  const found = await loadPublicCreative(username);
  if (!found) return null;
  const service = await repositories.services.getBySlug(found.creative.userId, slug);
  if (!service) return { ...found, service: null };
  return { ...found, service };
}

export async function generateMetadata({
  params,
}: PageProps<"/[username]/[serviceSlug]">): Promise<Metadata> {
  const { username, serviceSlug } = await params;
  const data = await load(username, serviceSlug);
  if (!data?.service || !isPubliclyVisible(data.service)) return { title: "Service not available" };
  const { service, creative } = data;
  return {
    title: `${service.name} by ${creative.displayName}`,
    description: service.shortDescription,
    openGraph: {
      title: `${service.name} by ${creative.displayName}`,
      description: service.shortDescription,
    },
  };
}

async function Detail({ username, slug }: { username: string; slug: string }) {
  const data = await load(username, slug);
  if (!data) notFound();
  const { creative, user, service } = data;

  if (!service || !isPubliclyVisible(service)) {
    const others = await repositories.services.listPublicByCreative(creative.userId);
    return (
      <ServiceUnavailable
        creative={creative}
        others={others.filter((s) => s.lifecycle === "PUBLISHED")}
      />
    );
  }

  // The reason stays internal; the page only knows whether Requests are open (CLAUDE.md §12).
  const blocked = newRequestBlock({
    creativeAccountOperational: user.accountStatus === "ACTIVE",
    moderation: service.moderation,
    availability: creative.availability,
    lifecycle: service.lifecycle,
    withinSubscriptionCapacity: true,
  });

  return (
    <ServiceDetail
      creative={creative}
      service={service}
      configureHref={blocked ? null : `/${creative.username}/${service.slug}/configure`}
      commitmentBps={serviceCommitmentBps(service, creative)}
    />
  );
}

export default function ServiceDetailPage({ params }: PageProps<"/[username]/[serviceSlug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => <Detail username={p.username} slug={p.serviceSlug} />}
      </ResolveParams>
    </Suspense>
  );
}
