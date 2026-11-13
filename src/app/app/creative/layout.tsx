import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreativeAppShell } from "@/components/layout/app-shells";
import { getViewer } from "@/features/auth/viewer";

export const metadata: Metadata = { title: { template: "%s | Modgeto", default: "Dashboard" } };

export default async function CreativeLayout({ children }: LayoutProps<"/app/creative">) {
  const viewer = await getViewer();
  // Client-only users start Creative onboarding instead (docs/04 §17).
  if (!viewer.creative) redirect("/app/onboarding");
  return <CreativeAppShell viewer={viewer}>{children}</CreativeAppShell>;
}
