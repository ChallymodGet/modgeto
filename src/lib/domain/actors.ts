/** Who is attempting an action. SYSTEM covers verified webhooks and scheduled jobs. */
export type Actor = "CREATIVE" | "CLIENT" | "ADMIN" | "SYSTEM";
