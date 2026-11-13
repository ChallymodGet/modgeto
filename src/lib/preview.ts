/**
 * Unfinished product areas (/app, /admin, /auth, storefronts) and /dev are
 * served in development, and in production only when ENABLE_DEV_ROUTES=true
 * (D-040). The prelaunch landing page is always public.
 */
export function previewRoutesEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_ROUTES === "true";
}
