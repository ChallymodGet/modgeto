"use client";

/**
 * SIMULATED Creative profile writes for the fixture phase: public
 * information, availability, links, business preferences and payment
 * methods. Phase 8 replaces this with Server Actions; screens keep the same
 * calls. The Service Builder reads it too, so a payment method added in
 * Settings is offered there straight away.
 */
import { useMemo } from "react";
import { createLocalStore } from "@/lib/local-store";
import type { CreativeProfile, PaymentMethod } from "@/types";

export type EditableProfile = Pick<
  CreativeProfile,
  | "displayName"
  | "professionalTitle"
  | "introduction"
  | "about"
  | "location"
  | "avatarUrl"
  | "disciplines"
  | "availability"
  | "availabilityNote"
  | "defaultCurrency"
  | "defaultCommitmentBps"
  | "links"
>;

type ProfileStore = {
  profile?: Partial<EditableProfile>;
  /** The full list once the Creative has changed it in this browser. */
  paymentMethods?: PaymentMethod[];
  /** Email on/off per notification event (D-043). Missing means on. */
  emailPreferences?: Record<string, boolean>;
};

const EMPTY: ProfileStore = {};
const stores = new Map<string, ReturnType<typeof createLocalStore<ProfileStore>>>();

function profileStore(userId: string) {
  const key = `mg-sim-profile:${userId}`;
  let store = stores.get(key);
  if (!store) {
    store = createLocalStore<ProfileStore>(key);
    stores.set(key, store);
  }
  return store;
}

/** The Creative and their payment methods with this browser's changes applied. */
export function useCreativeProfile(base: CreativeProfile, baseMethods: PaymentMethod[]) {
  const store = profileStore(base.userId);
  const value = store.useValue() ?? EMPTY;
  const creative = useMemo(() => ({ ...base, ...value.profile }), [base, value.profile]);
  const paymentMethods = value.paymentMethods ?? baseMethods;

  /** Returns false if the browser refused to save. */
  const saveProfile = (patch: Partial<EditableProfile>) => {
    const current = store.read() ?? {};
    return store.write({ ...current, profile: { ...current.profile, ...patch } });
  };
  const savePaymentMethods = (methods: PaymentMethod[]) => {
    const current = store.read() ?? {};
    return store.write({ ...current, paymentMethods: methods });
  };

  const emailPreferences = value.emailPreferences ?? {};
  const saveEmailPreference = (event: string, on: boolean) => {
    const current = store.read() ?? {};
    return store.write({
      ...current,
      emailPreferences: { ...current.emailPreferences, [event]: on },
    });
  };

  return {
    creative,
    paymentMethods,
    emailPreferences,
    saveProfile,
    savePaymentMethods,
    saveEmailPreference,
  };
}
