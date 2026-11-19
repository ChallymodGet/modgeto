import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getViewer } from "@/features/auth/viewer";
import { OnboardingFlow } from "@/features/creative-profile/onboarding-flow";

export const metadata: Metadata = { title: "Set up your Creative profile" };

async function Onboarding() {
  const viewer = await getViewer();
  // Already a Creative: nothing to set up (PROF-001).
  if (viewer.creative) redirect("/app/creative");
  return <OnboardingFlow userId={viewer.user.id} fullName={viewer.user.fullName} />;
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}
