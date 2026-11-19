import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpScreen } from "@/features/auth/auth-screens";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    // useSearchParams() reads `next`, so the screen renders inside Suspense.
    <Suspense>
      <SignUpScreen />
    </Suspense>
  );
}
