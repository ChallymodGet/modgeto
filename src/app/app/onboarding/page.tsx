import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Become a Creative" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h2 text-foreground">Become a Creative</h1>
      <ScreenPlaceholder
        title="Creative onboarding"
        phase="Phase 7.7"
        source="docs/06 §5, docs/05"
      />
    </div>
  );
}
