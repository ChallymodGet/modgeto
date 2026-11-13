import { notFound } from "next/navigation";
import { previewRoutesEnabled } from "@/lib/preview";

/** Creative and Client workspaces (D-039). Hidden in production until launch (D-040). */
export default function WorkspaceLayout({ children }: LayoutProps<"/app">) {
  if (!previewRoutesEnabled()) notFound();
  return children;
}
