import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/layout/page";
import { PageSkeleton } from "@/components/layout/route-helpers";
import { getViewer } from "@/features/auth/viewer";
import { AccountSecurity } from "@/features/creative-profile/settings-screens";

export const metadata: Metadata = { title: "Account and security" };

async function Content() {
  const viewer = await getViewer();
  return <AccountSecurity user={viewer.user} />;
}

export default function Page() {
  return (
    <Section title="Account and security">
      <Suspense fallback={<PageSkeleton />}>
        <Content />
      </Suspense>
    </Section>
  );
}
