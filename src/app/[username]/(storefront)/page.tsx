import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { CreativePublicProfile } from "@/features/creative-profile/public-profile";
import { repositories } from "@/features/data";

/** Profiles of suspended or unknown accounts are simply not found (no private reasons). */
async function loadProfile(username: string) {
  const creative = await repositories.creatives.getByUsername(username);
  if (!creative) return null;
  const user = await repositories.users.getById(creative.userId);
  if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "DELETION_PENDING") {
    return null;
  }
  const services = await repositories.services.listPublicByCreative(creative.userId);
  return { creative, services };
}

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) return { title: "Page not found" };
  const { creative } = data;
  return {
    title: `${creative.displayName}, ${creative.professionalTitle}`,
    description: creative.introduction,
    openGraph: {
      title: `${creative.displayName} on Modgeto`,
      description: creative.introduction,
      type: "profile",
    },
  };
}

async function Profile({ username }: { username: string }) {
  const data = await loadProfile(username);
  if (!data) notFound();
  return <CreativePublicProfile creative={data.creative} services={data.services} />;
}

export default function CreativeProfilePage({ params }: PageProps<"/[username]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>{(p) => <Profile username={p.username} />}</ResolveParams>
    </Suspense>
  );
}
