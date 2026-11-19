import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordScreen } from "@/features/auth/auth-screens";

export const metadata: Metadata = { title: "Choose a new password" };

export default function Page() {
  return (
    // useSearchParams() reads `next`, so the screen renders inside Suspense.
    <Suspense>
      <ResetPasswordScreen />
    </Suspense>
  );
}
