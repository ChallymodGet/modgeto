"use client";

/**
 * A tiny localStorage-backed store for fixture-phase drafts, readable with
 * useSyncExternalStore. Phase 9 moves these drafts server-side.
 */
import { useSyncExternalStore } from "react";

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
      value = raw ? (JSON.parse(raw) as T) : null;
    } catch {
      value = null;
    }
    cache = { raw, value };
    return value;
  }

  function write(value: T | null) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage blocked: the draft lives only for this page view.
    }
    listeners.forEach((l) => l());
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
