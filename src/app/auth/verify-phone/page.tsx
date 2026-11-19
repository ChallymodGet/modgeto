import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyPhoneScreen } from "@/features/auth/auth-screens";

export const metadata: Metadata = { title: "Verify your phone" };

export default function Page() {
  return (
    // useSearchParams() reads `next`, so the screen renders inside Suspense.
    <Suspense>
      <VerifyPhoneScreen />
    </Suspense>
  );
}
