import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { ClientHome } from "@/features/requests/client-home-screen";
import { FIXTURE_NOW } from "@/lib/fixtures/time";

export const metadata: Metadata = { title: "Home" };

async function Home() {
  const { user } = await getViewer();
  const [requests, projects] = await Promise.all([
    repositories.requests.listForClient(user.id),
    repositories.projects.listForClient(user.id),
  ]);
  const details = (
    await Promise.all(requests.map((r) => repositories.requests.getDetail(r.id)))
  ).filter((d): d is NonNullable<typeof d> => d !== null);
  const creativeIds = [
    ...new Set([...requests.map((r) => r.creativeId), ...projects.map((p) => p.creativeId)]),
  ];
  const creativeNames = Object.fromEntries(
    await Promise.all(
      creativeIds.map(
        async (id) =>
          [id, (await repositories.creatives.getByUserId(id))?.displayName ?? "Creative"] as const,
      ),
    ),
  );
  return (
    <ClientHome
      clientId={user.id}
      clientName={user.fullName}
      details={details}
      projects={projects}
      creativeNames={creativeNames}
      now={FIXTURE_NOW.toISOString()}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home />
    </Suspense>
  );
}
