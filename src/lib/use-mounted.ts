"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server rendering and hydration, true once running in the
 * browser. Forms seeded from browser storage wait for it, so their starting
 * values are the saved ones rather than the server's.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
