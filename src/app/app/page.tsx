import { redirect } from "next/navigation";
import { CLIENT_HOME, CREATIVE_HOME } from "@/components/layout/nav-items";
import { getViewer } from "@/features/auth/viewer";

/** /app opens the Creative workspace when the user has one, otherwise the Client workspace. */
export default async function AppIndex() {
  const viewer = await getViewer();
  redirect(viewer.creative ? CREATIVE_HOME : CLIENT_HOME);
}
