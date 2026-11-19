"use client";

/**
 * SIMULATED authentication for the fixture phase (D-022). Nothing here talks
 * to a server. Phase 9 replaces every function with a Server Action backed by
 * Supabase Auth (email/password) and Termii (phone OTP), keeping these
 * signatures so the screens don't change.
 *
 * Simulation rules, so every state can be seen:
 * - Sign-in fails when the password is "wrong-password".
 * - The phone code is always 123456; any other code counts as a wrong attempt.
 */
import { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } from "./policy";

const KEY = "mg-sim-auth";

type Pending = {
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  otp?: { sentAt: number; attemptsLeft: number };
};

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

function load(): Pending | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

function store(p: Pending) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage blocked: the simulation simply doesn't remember between pages.
  }
}

export type AuthResult = { ok: true } | { ok: false; message: string };

export function pendingAccount(): Pick<Pending, "email" | "phone" | "fullName"> | null {
  const p = load();
  return p ? { email: p.email, phone: p.phone, fullName: p.fullName } : null;
}

export async function signUp(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResult> {
  await delay();
  store({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    emailVerified: false,
    phoneVerified: false,
  });
  return { ok: true };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  await delay();
  if (input.password === "wrong-password") {
    return {
      ok: false,
      message: "That email and password don't match. Try again or reset your password.",
    };
  }
  return { ok: true };
}

export async function resendVerificationEmail(): Promise<AuthResult> {
  await delay(400);
  return { ok: true };
}

/** Stands in for opening the emailed link. */
export async function simulateEmailLinkOpened(): Promise<AuthResult> {
  await delay(300);
  const p = load();
  if (p) store({ ...p, emailVerified: true });
  return { ok: true };
}

export async function sendPhoneCode(): Promise<AuthResult> {
  await delay(400);
  const p = load() ?? {
    fullName: "",
    email: "",
    phone: "",
    emailVerified: true,
    phoneVerified: false,
  };
  store({ ...p, otp: { sentAt: Date.now(), attemptsLeft: OTP_MAX_ATTEMPTS } });
  return { ok: true };
}

export type OtpResult =
  | { ok: true }
  | { ok: false; reason: "WRONG_CODE"; attemptsLeft: number }
  | { ok: false; reason: "EXPIRED" | "TOO_MANY_ATTEMPTS" | "NO_CODE" };

export async function verifyPhoneCode(code: string): Promise<OtpResult> {
  await delay(500);
  const p = load();
  if (!p?.otp) return { ok: false, reason: "NO_CODE" };
  if (Date.now() - p.otp.sentAt > OTP_EXPIRY_MINUTES * 60_000)
    return { ok: false, reason: "EXPIRED" };
  if (p.otp.attemptsLeft <= 0) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  if (code === "123456") {
    store({ ...p, phoneVerified: true, otp: undefined });
    return { ok: true };
  }
  const attemptsLeft = p.otp.attemptsLeft - 1;
  store({ ...p, otp: { ...p.otp, attemptsLeft } });
  return attemptsLeft <= 0
    ? { ok: false, reason: "TOO_MANY_ATTEMPTS" }
    : { ok: false, reason: "WRONG_CODE", attemptsLeft };
}

export async function requestPasswordReset(): Promise<AuthResult> {
  await delay();
  return { ok: true };
}

export async function resetPassword(): Promise<AuthResult> {
  await delay();
  return { ok: true };
}
