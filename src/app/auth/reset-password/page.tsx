import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-foreground">Choose a new password</h1>
        <p className="text-body text-foreground-secondary">Use at least 8 characters.</p>
      </div>
      <ScreenPlaceholder title="Choose a new password" phase="Phase 7.5" source="docs/06 §4" />
    </div>
  );
}
