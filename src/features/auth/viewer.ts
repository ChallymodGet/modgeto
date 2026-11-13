/**
 * The signed-in person, as the shells and screens see them.
 *
 * Until Supabase Auth arrives (Phase 9) this is a fixture user chosen by
 * DEV_VIEWER (default "u-ada", who is both a Creative and a Client). Set
 * DEV_VIEWER=u-kemi to see a Client-only account.
 */
import "server-only";
import { repositories } from "@/features/data";
import type { CreativeProfile, User } from "@/types";

export type Viewer = {
  user: User;
  /** Present when the user has Creative capability (docs/03 §6). */
  creative: CreativeProfile | null;
  isAdmin: boolean;
  unreadNotifications: number;
};

export async function getViewer(userId = process.env.DEV_VIEWER ?? "u-ada"): Promise<Viewer> {
  const user = await repositories.users.getById(userId);
  if (!user) throw new Error(`Unknown viewer ${userId}`);
  const [creative, isAdmin, unreadNotifications] = await Promise.all([
    repositories.creatives.getByUserId(user.id),
    repositories.admin.isAdmin(user.id),
    repositories.notifications.unreadCount(user.id),
  ]);
  return { user, creative, isAdmin, unreadNotifications };
}

/** The Admin workspace viewer (fixture admin until Phase 9). */
export function getAdminViewer() {
  return getViewer(process.env.DEV_ADMIN ?? "u-admin");
}
