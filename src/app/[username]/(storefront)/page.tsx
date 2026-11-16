import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { CreativePublicProfile } from "@/features/creative-profile/public-profile";
import { loadPublicProfile } from "@/features/creative-profile/queries";

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const data = await loadPublicProfile(username);
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
  const data = await loadPublicProfile(username);
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
