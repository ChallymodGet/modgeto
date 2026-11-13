import type { Metadata } from "next";
import { ScreenPlaceholder } from "@/components/layout/state-screens";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-h2 text-foreground">Create your account</h1>
        <p className="text-body text-foreground-secondary">
          We will verify your email address and phone number.
        </p>
      </div>
      <ScreenPlaceholder title="Create your account" phase="Phase 7.5" source="docs/06 §4" />
    </div>
  );
}
