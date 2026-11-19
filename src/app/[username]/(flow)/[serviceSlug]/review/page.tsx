import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { loadPublicCreative } from "@/features/creative-profile/queries";
import { repositories } from "@/features/data";
import { ReviewFlow } from "@/features/requests/review-flow";
import { isPubliclyVisible, serviceCommitmentBps } from "@/features/services/model";
import { newRequestBlock } from "@/lib/domain";

export const metadata: Metadata = {
  title: "Review your Project Request",
  robots: { index: false },
};

async function Review({ username, slug }: { username: string; slug: string }) {
  const found = await loadPublicCreative(username);
  if (!found) notFound();
  const { creative, user } = found;
  const base = `/${creative.username}/${slug}`;
  const service = await repositories.services.getBySlug(creative.userId, slug);
  if (!service || !isPubliclyVisible(service)) redirect(base);
  // Revalidate the Service before submission (docs/05 §19).
  const blocked = newRequestBlock({
    creativeAccountOperational: user.accountStatus === "ACTIVE",
    moderation: service.moderation,
    availability: creative.availability,
    lifecycle: service.lifecycle,
    withinSubscriptionCapacity: true,
  });
  if (blocked) redirect(base);

  return (
    <ReviewFlow
      service={service}
      creative={{
        displayName: creative.displayName,
        username: creative.username,
        avatarUrl: creative.avatarUrl,
        professionalTitle: creative.professionalTitle,
      }}
      commitmentBps={serviceCommitmentBps(service, creative)}
      serviceHref={base}
      configureHref={`${base}/configure`}
      briefHref={`${base}/brief`}
      reviewHref={`${base}/review`}
      submittedHref={`${base}/submitted`}
    />
  );
}

export default function ReviewPage({ params }: PageProps<"/[username]/[serviceSlug]/review">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>
        {(p) => <Review username={p.username} slug={p.serviceSlug} />}
      </ResolveParams>
    </Suspense>
  );
}
