/**
 * Field schemas shared by forms (React Hook Form) and Server Actions (D-023).
 * Business rules come from lib/domain so the two can never disagree.
 * Error copy follows the Brand Guidelines: say what to do, never blame.
 */
import { z } from "zod";
import {
  type Currency,
  type UsernameProblem,
  normalizeUsername,
  parseMoney,
  percentToBps,
  validateUsername,
} from "@/lib/domain";

export const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, { error: `Enter ${label}.` })
    .max(max, { error: `Keep ${label} under ${max} characters.` });

export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, { error: `Keep this under ${max} characters.` })
    .transform((v) => (v.length === 0 ? null : v));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter an email address like name@example.com." }));

/**
 * The PRD sets no password policy. 8–72 characters: 8 is a common minimum,
 * 72 is the bcrypt limit Supabase Auth applies.
 */
export const passwordSchema = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(72, { error: "Use 72 characters or fewer." });

/** E.164, e.g. +2348031234567 (AUTH-004). Local-format conversion arrives with Termii in Phase 9. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .pipe(
    z.string().regex(/^\+[1-9]\d{7,14}$/, {
      error: "Enter your number with the country code, like +234 803 123 4567.",
    }),
  );

const USERNAME_MESSAGES: Record<UsernameProblem, string> = {
  LENGTH: "Use 3 to 30 characters.",
  CHARACTERS: "Use lowercase letters, numbers and hyphens only.",
  HYPHEN_EDGE: "Start and end with a letter or number.",
  RESERVED: "That username isn't available. Try another.",
};

export const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .superRefine((value, ctx) => {
    const problem = validateUsername(value);
    if (problem) ctx.addIssue({ code: "custom", message: USERNAME_MESSAGES[problem] });
  });

export const httpUrlSchema = z
  .string()
  .trim()
  .pipe(z.url({ protocol: /^https?$/, error: "Enter a full link starting with https://." }));

/** Text input → minor units (bigint). Never parses through floating point. */
export const moneyInput = (currency: Currency, { allowZero = false } = {}) =>
  z.string().transform((value, ctx) => {
    const parsed = parseMoney(value, currency);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: "Enter an amount, like 150,000." });
      return z.NEVER;
    }
    if (!allowZero && parsed.amountMinor === 0n) {
      ctx.addIssue({ code: "custom", message: "Enter an amount above zero." });
      return z.NEVER;
    }
    return parsed.amountMinor;
  });

/** "12.5" → 1250 basis points. */
export const percentInput = ({ min = 0 } = {}) =>
  z.string().transform((value, ctx) => {
    const bps = percentToBps(value);
    if (bps === null || bps < min) {
      ctx.addIssue({ code: "custom", message: `Enter a percentage from ${min / 100} to 100.` });
      return z.NEVER;
    }
    return bps;
  });

/** YYYY-MM-DD calendar date. */
export const isoDateSchema = z.iso.date({ error: "Enter a date." });
