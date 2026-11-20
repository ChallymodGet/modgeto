import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/layout/page";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { CreativeProfileSettings } from "@/features/creative-profile/settings-screens";

export const metadata: Metadata = { title: "Creative profile" };

async function Content() {
  const viewer = await getViewer();
  return (
    <CreativeProfileSettings
      creative={viewer.creative!}
      siteUrl={process.env.SITE_URL ?? "https://modgeto.vercel.app"}
    />
  );
}

export default function Page() {
  return (
    <Section title="Creative profile">
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </Section>
  );
}
