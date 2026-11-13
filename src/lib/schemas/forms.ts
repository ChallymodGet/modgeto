/** Form schemas for the V1 flows. Server Actions re-validate with the same schema. */
import { z } from "zod";
import type { Currency } from "@/lib/domain";
import {
  emailSchema,
  httpUrlSchema,
  isoDateSchema,
  moneyInput,
  optionalText,
  passwordSchema,
  percentInput,
  phoneSchema,
  requiredText,
  usernameSchema,
} from "./common";

// ---------------------------------------------------------------- Auth (AUTH-002, AUTH-005)

export const signUpSchema = z.object({
  fullName: requiredText("your full name", 100),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: "Enter the 6-digit code." }),
});

// ---------------------------------------------------------------- Creative profile (PROF-002)

export const creativeProfileSchema = z.object({
  displayName: requiredText("your display name", 60),
  username: usernameSchema,
  professionalTitle: requiredText("your professional title", 80),
  introduction: requiredText("a short introduction", 160),
  location: optionalText(80),
});

export const creativeLinkSchema = z.object({
  type: z.enum(["PORTFOLIO", "LINKEDIN", "BEHANCE", "DRIBBBLE", "GITHUB", "OTHER"]),
  url: httpUrlSchema,
  label: optionalText(40),
});

// ---------------------------------------------------------------- Negotiation (D-008, QTE-001)

const turnaroundSchema = z.object({
  value: z.coerce
    .number()
    .int({ error: "Use a whole number." })
    .min(1, { error: "Enter at least 1." }),
  unit: z.enum(["BUSINESS_DAYS", "CALENDAR_DAYS", "WEEKS"]),
});

export const proposalSchema = (currency: Currency) =>
  z
    .object({
      kind: z.enum(["CHANGES", "QUOTE"]),
      price: moneyInput(currency),
      discount: z
        .discriminatedUnion("kind", [
          z.object({
            kind: z.literal("FIXED"),
            label: requiredText("a discount label", 60),
            amount: moneyInput(currency),
          }),
          z.object({
            kind: z.literal("PERCENT"),
            label: requiredText("a discount label", 60),
            percent: percentInput({ min: 1 }),
          }),
        ])
        .nullable(),
      commitmentPercent: percentInput({ min: 1 }).nullable(),
      turnaround: turnaroundSchema,
      note: optionalText(2_000),
      validUntil: isoDateSchema.nullable(),
    })
    .superRefine((value, ctx) => {
      // "Request Changes" always carries a Creative note (D-008).
      if (value.kind === "CHANGES" && !value.note) {
        ctx.addIssue({ code: "custom", path: ["note"], message: "Explain what changed and why." });
      }
    });

/** Narrow clarification during negotiation only (docs/03 §43). */
export const clarificationSchema = z.object({
  message: requiredText("your message", 2_000),
});

export const closureReasonSchema = z.object({
  reason: optionalText(500),
});

// ---------------------------------------------------------------- External payment (PAY-004, PAY-005, D-028)

export const paymentDeclarationSchema = (currency: Currency) =>
  z.object({
    paymentMethodId: z.string().min(1, { error: "Choose how you paid." }),
    amount: moneyInput(currency),
    paidOn: isoDateSchema,
    reference: optionalText(100),
  });

export const paymentConfirmationSchema = (currency: Currency) =>
  z.object({
    amountReceived: moneyInput(currency),
  });

export const notReceivedSchema = z.object({
  note: requiredText("a short note for the Client", 500),
});

export const paymentAdjustmentSchema = (currency: Currency) =>
  z.object({
    amount: moneyInput(currency),
    reason: requiredText("the reason for this correction", 500),
  });
