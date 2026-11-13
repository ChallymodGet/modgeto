import type { Metadata } from "next";
import { ClientAppShell } from "@/components/layout/app-shells";
import { getViewer } from "@/features/auth/viewer";

export const metadata: Metadata = { title: { template: "%s | Modgeto", default: "Home" } };

export default async function ClientLayout({ children }: LayoutProps<"/app/client">) {
  const viewer = await getViewer();
  return <ClientAppShell viewer={viewer}>{children}</ClientAppShell>;
}
