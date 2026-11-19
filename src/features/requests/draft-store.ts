"use client";

/**
 * The Client's draft configuration and Brief answers while they move between
 * Configure, Brief and Review.
 *
 * Fixture-phase stand-in: drafts live in this browser's localStorage. Phase 9
 * replaces this with server-side drafts under Supabase anonymous sign-in, so
 * Guest progress survives sign-up and verification (D-024, CLAUDE.md §6).
 * Selections hold only ids and whole numbers, so they serialise as JSON.
 */
import { useSyncExternalStore } from "react";
import type { Answers, Selection } from "@/lib/domain";

export type Draft = {
  selection: Selection;
  answers: Answers;
  /** Names and sizes of uploaded files by asset id, so they show again on return. */
  files?: Record<string, { name: string; sizeBytes: number }>;
  /** One key per draft, so repeated submits create one Request (CFG-006). */
  idempotencyKey?: string;
  /** Service.updatedAt the Client last reviewed, to detect changes (CFG-007). */
  validatedAgainstServiceAt: string;
  updatedAt: string;
};

const key = (serviceId: string) => `mg-draft:${serviceId}`;
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: Draft | null }>();

function read(serviceId: string): Draft | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key(serviceId));
  } catch {
    // Storage can be blocked (private mode); the draft then lives only in memory.
    raw = memory.get(serviceId) ?? null;
  }
  const cached = cache.get(serviceId);
  if (cached && cached.raw === raw) return cached.value;
  let value: Draft | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as Draft;
    } catch {
      value = null;
    }
  }
  cache.set(serviceId, { raw, value });
  return value;
}

const memory = new Map<string, string>();

export function saveDraft(serviceId: string, draft: Omit<Draft, "updatedAt">) {
  const raw = JSON.stringify({ ...draft, updatedAt: new Date().toISOString() });
  try {
    window.localStorage.setItem(key(serviceId), raw);
  } catch {
    memory.set(serviceId, raw);
  }
  listeners.forEach((l) => l());
}

export function clearDraft(serviceId: string) {
  try {
    window.localStorage.removeItem(key(serviceId));
  } catch {
    memory.delete(serviceId);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved draft for a Service, or null. Null during server render. */
export function useDraft(serviceId: string): Draft | null {
  return useSyncExternalStore(
    subscribe,
    () => read(serviceId),
    () => null,
  );
}
