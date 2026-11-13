import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminAppShell } from "@/components/layout/admin-shell";
import { getAdminViewer } from "@/features/auth/viewer";
import { previewRoutesEnabled } from "@/lib/preview";

export const metadata: Metadata = {
  title: { template: "%s | Modgeto Admin", default: "Overview" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!previewRoutesEnabled()) notFound();
  const viewer = await getAdminViewer();
  if (!viewer.isAdmin) notFound();
  return (
    <AdminAppShell name={viewer.user.fullName} email={viewer.user.email}>
      {children}
    </AdminAppShell>
  );
}
