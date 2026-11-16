/** Public storefront loaders shared by the profile and Service pages. */
import "server-only";
import { repositories } from "@/features/data";

/** A Creative whose profile can be shown publicly, or null (no private reason is exposed). */
export async function loadPublicCreative(username: string) {
  const creative = await repositories.creatives.getByUsername(username);
  if (!creative) return null;
  const user = await repositories.users.getById(creative.userId);
  if (!user || user.accountStatus === "SUSPENDED" || user.accountStatus === "DELETION_PENDING") {
    return null;
  }
  return { creative, user };
}

export async function loadPublicProfile(username: string) {
  const found = await loadPublicCreative(username);
  if (!found) return null;
  const services = await repositories.services.listPublicByCreative(found.creative.userId);
  return { creative: found.creative, services };
}
