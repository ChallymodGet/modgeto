import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-foreground">Sign in</h1>
        <p className="text-body text-foreground-secondary">Welcome back.</p>
      </div>
      <ScreenPlaceholder title="Sign in" phase="Phase 7.5" source="docs/06 §4" />
    </div>
  );
}
