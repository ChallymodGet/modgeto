import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Verify your phone" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-foreground">Verify your phone</h1>
        <p className="text-body text-foreground-secondary">
          Enter the 6-digit code we sent by SMS.
        </p>
      </div>
      <ScreenPlaceholder title="Verify your phone" phase="Phase 7.5" source="docs/06 §4" />
    </div>
  );
}
