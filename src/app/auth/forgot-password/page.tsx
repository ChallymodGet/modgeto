import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordScreen } from "@/features/auth/auth-screens";

export const metadata: Metadata = { title: "Reset your password" };

export default function Page() {
  return (
    // useSearchParams() reads `next`, so the screen renders inside Suspense.
    <Suspense>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
