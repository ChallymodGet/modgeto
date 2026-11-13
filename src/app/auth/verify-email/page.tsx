import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Verify your email" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-foreground">Verify your email</h1>
        <p className="text-body text-foreground-secondary">We sent a link to your email address.</p>
      </div>
      <ScreenPlaceholder title="Verify your email" phase="Phase 7.5" source="docs/06 §4" />
    </div>
  );
}
