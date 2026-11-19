/**
 * Authentication limits and safe return paths (AUTH-004, docs/05 §36).
 * OTP values are D-041 (implementation ruling, awaiting confirmation).
 */

export const OTP_LENGTH = 6;
/** A code stops working after this long. */
export const OTP_EXPIRY_MINUTES = 10;
/** Wrong guesses allowed per code before a new one is needed. */
export const OTP_MAX_ATTEMPTS = 5;
/** Wait before another code can be sent. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
/** Email verification and password reset links. */
export const EMAIL_LINK_EXPIRY_HOURS = 24;

/**
 * Where to send someone after authentication. Only same-site paths are
 * allowed, so a crafted link can't bounce users to another site.
 */
export function safeNext(next: string | null | undefined, fallback = "/app"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  // Never loop back into the auth flow itself.
  if (next.startsWith("/auth")) return fallback;
  return next;
}

/** Keeps `next` on links between auth screens. */
export function withNext(path: string, next: string | null | undefined): string {
  const safe = next ? safeNext(next, "") : "";
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
}

/** "Submitting a Request" when returning to Review, so the screens can explain why. */
export function authContext(next: string | null | undefined): "SUBMIT_REQUEST" | "GENERAL" {
  return safeNext(next, "").endsWith("/review") ? "SUBMIT_REQUEST" : "GENERAL";
}
