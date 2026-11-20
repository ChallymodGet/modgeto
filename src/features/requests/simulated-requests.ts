"use client";

/**
 * SIMULATED Request writes for the fixture phase. The commands themselves are
 * real (request-actions.ts runs the domain state machine); only storage is
 * simulated, in this browser, until Phase 8 Server Actions. Both the Creative
 * and Client screens read it, so a proposal sent as Ada shows up for Kemi in
 * the same browser.
 */
import { useMemo } from "react";
import { createLocalStore } from "@/lib/local-store";
import type { Project, RequestDetail } from "@/types";
import type { CommandResult } from "./request-actions";

type RequestStore = {
  details?: Record<string, RequestDetail>;
  /** Projects started in this browser, picked up by the Projects screens. */
  projects?: Record<string, Project>;
};

const EMPTY: RequestStore = {};
const store = createLocalStore<RequestStore>("mg-sim-request-details");

export function useRequestStore() {
  return store.useValue() ?? EMPTY;
}

/** Repository details with this browser's saved versions applied, newest first. */
export function useMergedRequests(base: RequestDetail[]): RequestDetail[] {
  const value = useRequestStore();
  return useMemo(
    () =>
      base
        .map((d) => value.details?.[d.request.id] ?? d)
        .sort((a, b) => b.request.submittedAt.localeCompare(a.request.submittedAt)),
    [base, value.details],
  );
}

export function useMergedRequest(base: RequestDetail): RequestDetail {
  return useRequestStore().details?.[base.request.id] ?? base;
}

/** Saves a command's result. Returns false if the browser refused. */
export function saveResult(result: CommandResult): boolean {
  const current = store.read() ?? {};
  return store.write({
    ...current,
    details: { ...current.details, [result.detail.request.id]: result.detail },
    projects: result.project
      ? { ...current.projects, [result.project.id]: result.project }
      : current.projects,
  });
}
