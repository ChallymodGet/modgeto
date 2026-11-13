import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-foreground">Reset your password</h1>
        <p className="text-body text-foreground-secondary">
          We will email you a link to choose a new password.
        </p>
      </div>
      <ScreenPlaceholder title="Reset your password" phase="Phase 7.5" source="docs/06 §4" />
    </div>
  );
}
