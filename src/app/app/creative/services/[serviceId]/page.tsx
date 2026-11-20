import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton, ResolveParams } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { ServiceBuilder } from "@/features/services/service-builder";
import { isLocalId } from "@/features/services/builder-model";

export const metadata: Metadata = { title: "Service Builder" };

async function Builder({ serviceId }: { serviceId: string }) {
  const creative = (await getViewer()).creative!;
  const [base, creativeServices, categories, paymentMethods, subscription] = await Promise.all([
    isLocalId(serviceId) ? null : repositories.services.getById(serviceId),
    repositories.services.listByCreative(creative.userId),
    repositories.services.listCategories(),
    repositories.creatives.listPaymentMethods(creative.userId),
    repositories.subscriptions.getForCreative(creative.userId),
  ]);
  // Only the owning Creative can open a Service in the Builder (SRV-001).
  if (!isLocalId(serviceId) && (!base || base.creativeId !== creative.userId)) notFound();

  return (
    <ServiceBuilder
      serviceId={serviceId}
      base={base}
      creativeServices={creativeServices}
      creative={creative}
      categories={categories}
      paymentMethods={paymentMethods}
      subscription={subscription}
      siteUrl={process.env.SITE_URL ?? "https://modgeto.vercel.app"}
    />
  );
}

export default function Page({ params }: PageProps<"/app/creative/services/[serviceId]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResolveParams params={params}>{(p) => <Builder serviceId={p.serviceId} />}</ResolveParams>
    </Suspense>
  );
}
