import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { CreativeRequests } from "@/features/requests/requests-list";
import { FIXTURE_NOW } from "@/lib/fixtures/time";

export const metadata: Metadata = { title: "Requests" };

async function Requests() {
  const creative = (await getViewer()).creative!;
  const requests = await repositories.requests.listForCreative(creative.userId);
  const details = (
    await Promise.all(requests.map((r) => repositories.requests.getDetail(r.id)))
  ).filter((d): d is NonNullable<typeof d> => d !== null);
  const clientIds = [...new Set(requests.map((r) => r.clientId))];
  const clientNames = Object.fromEntries(
    await Promise.all(
      clientIds.map(
        async (id) => [id, (await repositories.users.getById(id))?.fullName ?? "Client"] as const,
      ),
    ),
  );
  return (
    <CreativeRequests details={details} clientNames={clientNames} now={FIXTURE_NOW.toISOString()} />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Requests />
    </Suspense>
  );
}
