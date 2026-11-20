import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { repositories } from "@/features/data";
import { NewService } from "@/features/services/new-service";

export const metadata: Metadata = { title: "Create Service" };

async function Create() {
  const creative = (await getViewer()).creative!;
  const services = await repositories.services.listByCreative(creative.userId);
  return <NewService creative={creative} displayOrder={services.length + 1} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Create />
    </Suspense>
  );
}
