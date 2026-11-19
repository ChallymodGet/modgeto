"use client";

/**
 * SIMULATED Request submission for the fixture phase. Phase 8 replaces this
 * with a Server Action that validates the Service, scope, Brief and identity,
 * stores the snapshot and notifies the Creative (docs/06 §42).
 *
 * Idempotent (CFG-006): the same key always returns the same Request, so
 * double taps, retries and refreshes never create duplicates.
 */
const KEY = "mg-sim-requests";

type Submitted = {
  reference: string;
  serviceName: string;
  creativeName: string;
  submittedAt: string;
};

function load(): Record<string, Submitted> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, Submitted>;
  } catch {
    return {};
  }
}

export async function submitRequest(input: {
  idempotencyKey: string;
  serviceName: string;
  creativeName: string;
}): Promise<{ ok: true; request: Submitted; duplicate: boolean }> {
  await new Promise((r) => setTimeout(r, 900));
  const all = load();
  const existing = all[input.idempotencyKey];
  if (existing) return { ok: true, request: existing, duplicate: true };
  const request: Submitted = {
    reference: `MG-${1100 + Object.keys(all).length}`,
    serviceName: input.serviceName,
    creativeName: input.creativeName,
    submittedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...all, [input.idempotencyKey]: request }));
  } catch {
    // Storage blocked: the confirmation still shows.
  }
  return { ok: true, request, duplicate: false };
}
