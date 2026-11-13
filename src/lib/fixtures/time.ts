/** A fixed "now" so fixtures and screenshots are stable. */
export const FIXTURE_NOW = new Date("2026-11-10T09:00:00.000Z");

/** ISO timestamp `days` before FIXTURE_NOW, plus optional hours. */
export function daysAgo(days: number, hours = 0): string {
  return new Date(FIXTURE_NOW.getTime() - days * 86_400_000 + hours * 3_600_000).toISOString();
}

export function daysFromNow(days: number): string {
  return daysAgo(-days);
}

/** Adds hours to an ISO timestamp. */
export function plusHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();
}
