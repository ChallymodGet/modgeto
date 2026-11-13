import { notFound } from "next/navigation";
import { previewRoutesEnabled } from "@/lib/preview";

/** Creative storefronts at the root (D-021). Hidden in production until launch (D-040). */
export default function UsernameLayout({ children }: LayoutProps<"/[username]">) {
  if (!previewRoutesEnabled()) notFound();
  return children;
}
