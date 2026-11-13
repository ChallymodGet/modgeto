import { AuthLayout } from "@/components/layout/focused-shells";

/** Creative onboarding is a focused task without workspace navigation. */
export default function OnboardingLayout({ children }: LayoutProps<"/app/onboarding">) {
  return <AuthLayout>{children}</AuthLayout>;
}
