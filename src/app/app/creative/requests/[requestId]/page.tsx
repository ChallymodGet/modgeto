import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { CreativeRequestDetail } from "@/features/requests/creative-request-detail";

export const metadata: Metadata = { title: "Request" };

async function Detail({ requestId }: { requestId: string }) {
  const creative = (await getViewer()).creative!;
  const detail = await repositories.requests.getDetail(requestId);
  // Only the Request's Creative sees this view (docs/03 permissions).
  if (!detail || detail.request.creativeId !== creative.userId) notFound();
  const [client, service] = await Promise.all([
    repositories.users.getById(detail.request.clientId),
    repositories.services.getById(detail.request.serviceId),
  ]);
  return (
    <CreativeRequestDetail
      detail={detail}
      clientName={client?.fullName ?? "Client"}
      creativeName={creative.displayName}
      charges={service?.charges ?? []}
    />
  );
}

export default function Page({ params }: PageProps<"/app/creative/requests/[requestId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>{(p) => <Detail requestId={p.requestId} />}</ResolveParams>
    </Suspense>
  );
}
