"use client";

/**
 * SIMULATED Service writes for the fixture phase. Phase 8 replaces this with
 * Server Actions and Supabase; screens keep the same shape of calls.
 *
 * - `saved`: the stored version of a Service, overriding the fixture (or a
 *   Service created in this browser, whose id starts with "local-").
 * - `pending`: unpublished edits to a live Service (D-042). They go
 *   live only through Publish changes, so a half-finished edit never reaches
 *   Clients.
 * - `order`: Published Services in profile order (SRV-014).
 * - `visited`: Builder sections the Creative has opened, so untouched sections
 *   read as "Incomplete" rather than "Needs attention".
 */
import { useMemo } from "react";
import { createLocalStore } from "@/lib/local-store";
import type { Service } from "@/types";

export type ServiceStore = {
  saved?: Record<string, Service>;
  pending?: Record<string, Service>;
  order?: string[];
  visited?: Record<string, string[]>;
};

const EMPTY: ServiceStore = {};
const stores = new Map<string, ReturnType<typeof createLocalStore<ServiceStore>>>();

/** One store instance per Creative, so every screen in the tab shares listeners. */
export function serviceStore(creativeId: string) {
  const key = `mg-sim-services:${creativeId}`;
  let store = stores.get(key);
  if (!store) {
    store = createLocalStore<ServiceStore>(key);
    stores.set(key, store);
  }
  return store;
}

export function useServiceStore(creativeId: string) {
  const store = serviceStore(creativeId);
  const value = store.useValue() ?? EMPTY;
  return { value, store };
}

/** Repository Services with this browser's saved versions applied, in profile order. */
export function mergeServices(base: Service[], value: ServiceStore): Service[] {
  const saved = value.saved ?? {};
  const merged = base.map((s) => saved[s.id] ?? s);
  const local = Object.values(saved).filter((s) => !base.some((b) => b.id === s.id));
  const order = value.order ?? [];
  return [...merged, ...local].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.displayOrder - b.displayOrder;
  });
}

export function useMergedServices(base: Service[], creativeId: string) {
  const { value, store } = useServiceStore(creativeId);
  const services = useMemo(() => mergeServices(base, value), [base, value]);
  return { services, value, store };
}

type Store = ReturnType<typeof serviceStore>;

/** Writes the stored version of a Service. Returns false if the browser refused. */
export function saveService(store: Store, service: Service): boolean {
  const current = store.read() ?? {};
  return store.write({ ...current, saved: { ...current.saved, [service.id]: service } });
}

export function savePending(store: Store, service: Service | null, id: string): boolean {
  const current = store.read() ?? {};
  const pending = { ...current.pending };
  if (service) pending[id] = service;
  else delete pending[id];
  return store.write({ ...current, pending });
}

export function setOrder(store: Store, order: string[]) {
  const current = store.read() ?? {};
  return store.write({ ...current, order });
}

export function markVisited(store: Store, serviceId: string, section: string) {
  const current = store.read() ?? {};
  const visited = current.visited?.[serviceId] ?? [];
  if (visited.includes(section)) return;
  store.write({
    ...current,
    visited: { ...current.visited, [serviceId]: [...visited, section] },
  });
}

export { isLocalId, newLocalId } from "./builder-model";
