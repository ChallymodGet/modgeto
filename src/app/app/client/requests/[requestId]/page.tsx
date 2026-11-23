import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { ClientRequestDetail } from "@/features/requests/client-request-detail";
import { FIXTURE_NOW } from "@/lib/fixtures/time";

export const metadata: Metadata = { title: "Request" };

async function Detail({ requestId }: { requestId: string }) {
  const { user } = await getViewer();
  const detail = await repositories.requests.getDetail(requestId);
  // Only the Request's own Client sees this view.
  if (!detail || detail.request.clientId !== user.id) notFound();
  const [creative, service, methods] = await Promise.all([
    repositories.creatives.getByUserId(detail.request.creativeId),
    repositories.services.getById(detail.request.serviceId),
    repositories.creatives.listPaymentMethods(detail.request.creativeId),
  ]);
  // PAY-003: payment details are for this Request's Client at the payment stage. The screen
  // shows them only then. FIXTURE PHASE: progress made in the browser isn't visible here, so
  // the Service's methods are passed; Phase 8 decides on the server from the stored status.
  const paymentMethods = methods.filter(
    (m) => m.active && (service?.paymentMethodIds ?? []).includes(m.id),
  );
  return (
    <ClientRequestDetail
      detail={detail}
      clientName={user.fullName}
      creativeName={creative?.displayName ?? "The Creative"}
      paymentMethods={paymentMethods}
      today={FIXTURE_NOW.toISOString().slice(0, 10)}
    />
  );
}

export default function Page({ params }: PageProps<"/app/client/requests/[requestId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>{(p) => <Detail requestId={p.requestId} />}</ResolveParams>
    </Suspense>
  );
}
