"use client";

/**
 * A tiny localStorage-backed store for fixture-phase drafts, readable with
 * useSyncExternalStore. Phase 9 moves these drafts server-side.
 */
import { useSyncExternalStore } from "react";

// Money is bigint minor units, which JSON can't hold: tag it on the way out and back.
const replacer = (_: string, v: unknown) => (typeof v === "bigint" ? { $bigint: v.toString() } : v);
const reviver = (_: string, v: unknown) =>
  v !== null && typeof v === "object" && "$bigint" in v && typeof v.$bigint === "string"
    ? BigInt(v.$bigint)
    : v;

export function createLocalStore<T>(key: string) {
  const listeners = new Set<() => void>();
  let cache: { raw: string | null; value: T | null } = { raw: null, value: null };

  function read(): T | null {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      raw = null;
    }
    if (raw === cache.raw) return cache.value;
    let value: T | null = null;
    try {
      value = raw ? (JSON.parse(raw, reviver) as T) : null;
    } catch {
      value = null;
    }
    cache = { raw, value };
    return value;
  }

  /** Returns false when storage is blocked or full, so callers can show "Couldn't save". */
  function write(value: T | null): boolean {
    let saved = true;
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value, replacer));
    } catch {
      saved = false;
    }
    listeners.forEach((l) => l());
    return saved;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  }

  function useValue(): T | null {
    return useSyncExternalStore(subscribe, read, () => null);
  }

  return { read, write, useValue };
}
