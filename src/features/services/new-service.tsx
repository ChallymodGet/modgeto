"use client";

/**
 * Create Service: makes a blank Draft and opens the Builder on Basics.
 * Drafts need no paid capacity (SRV-002). SIMULATED until Phase 8.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { CreativeProfile } from "@/types";
import { newServiceDraft } from "./builder-model";
import { newLocalId, saveService, serviceStore } from "./simulated-services";

export function NewService({
  creative,
  displayOrder,
}: {
  creative: CreativeProfile;
  displayOrder: number;
}) {
  const router = useRouter();
  const created = useRef(false);
  useEffect(() => {
    // Strict Mode runs effects twice in development: create exactly one Draft.
    if (created.current) return;
    created.current = true;
    const id = newLocalId();
    const now = new Date().toISOString();
    saveService(
      serviceStore(creative.userId),
      newServiceDraft({ id, creative, now, displayOrder }),
    );
    router.replace(`/app/creative/services/${id}?section=basics`);
  }, [creative, displayOrder, router]);

  return (
    <p role="status" className="p-6 text-body text-foreground-secondary">
      Creating your Service…
    </p>
  );
}
