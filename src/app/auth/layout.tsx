import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthLayout } from "@/components/layout/focused-shells";
import { previewRoutesEnabled } from "@/lib/preview";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthRouteLayout({ children }: LayoutProps<"/auth">) {
  if (!previewRoutesEnabled()) notFound();
  return <AuthLayout>{children}</AuthLayout>;
}
