import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInScreen } from "@/features/auth/auth-screens";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return (
    // useSearchParams() reads `next`, so the screen renders inside Suspense.
    <Suspense>
      <SignInScreen />
    </Suspense>
  );
}
