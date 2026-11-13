import { describe, expect, it } from "vitest";
import {
  creativeProfileSchema,
  emailSchema,
  moneyInput,
  paymentDeclarationSchema,
  percentInput,
  phoneSchema,
  proposalSchema,
  signUpSchema,
  usernameSchema,
} from "./index";

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error!.issues[0].message;

describe("field schemas", () => {
  it("normalises email and checks its shape", () => {
    expect(emailSchema.parse("  Ada@Example.com ")).toBe("ada@example.com");
    expect(firstError(emailSchema.safeParse("ada@"))).toMatch(/email address/);
  });

  it("accepts E.164 phones, stripping spaces and dashes (AUTH-004)", () => {
    expect(phoneSchema.parse("+234 803-123-4567")).toBe("+2348031234567");
    expect(firstError(phoneSchema.safeParse("08031234567"))).toMatch(/country code/);
  });

  it("applies the domain username rules with friendly messages", () => {
    expect(usernameSchema.parse("Ada-Okafor")).toBe("ada-okafor");
    expect(firstError(usernameSchema.safeParse("admin"))).toBe(
      "That username isn't available. Try another.",
    );
    expect(firstError(usernameSchema.safeParse("ab"))).toBe("Use 3 to 30 characters.");
  });

  it("parses money to minor units without floats", () => {
    expect(moneyInput("NGN").parse("150,000.50")).toBe(15_000_050n);
    expect(firstError(moneyInput("NGN").safeParse("0"))).toBe("Enter an amount above zero.");
    expect(moneyInput("NGN", { allowZero: true }).parse("0")).toBe(0n);
    expect(firstError(moneyInput("USD").safeParse("12.345"))).toMatch(/Enter an amount/);
  });

  it("parses percentages to basis points", () => {
    expect(percentInput().parse("12.5")).toBe(1_250);
    expect(firstError(percentInput({ min: 100 }).safeParse("0.5"))).toMatch(/from 1 to 100/);
  });
});

describe("form schemas", () => {
  it("validates sign up", () => {
    const ok = signUpSchema.safeParse({
      fullName: "Kemi Adeyemi",
      email: "kemi@example.com",
      phone: "+2348021112233",
      password: "correct-horse",
    });
    expect(ok.success).toBe(true);
    expect(
      firstError(
        signUpSchema.safeParse({
          fullName: " ",
          email: "x@example.com",
          phone: "+2348021112233",
          password: "longenough",
        }),
      ),
    ).toBe("Enter your full name.");
    expect(
      firstError(
        signUpSchema.safeParse({
          fullName: "A",
          email: "x@example.com",
          phone: "+2348021112233",
          password: "short",
        }),
      ),
    ).toBe("Use at least 8 characters.");
  });

  it("validates the Creative profile (PROF-002)", () => {
    const parsed = creativeProfileSchema.parse({
      displayName: "Ada Okafor",
      username: "Ada",
      professionalTitle: "Brand designer",
      introduction: "I design brands.",
      location: "",
    });
    expect(parsed).toMatchObject({ username: "ada", location: null });
  });

  it("requires a note for Request Changes (D-008)", () => {
    const base = {
      price: "520000",
      discount: null,
      commitmentPercent: "50",
      turnaround: { value: "3", unit: "WEEKS" },
      note: "",
      validUntil: null,
    };
    const changes = proposalSchema("NGN").safeParse({ ...base, kind: "CHANGES" });
    expect(changes.success).toBe(false);
    expect(changes.error!.issues[0].path).toEqual(["note"]);

    const quote = proposalSchema("NGN").parse({ ...base, kind: "QUOTE" });
    expect(quote).toMatchObject({
      price: 52_000_000n,
      commitmentPercent: 5_000,
      turnaround: { value: 3 },
    });
  });

  it("parses a percentage discount on a proposal", () => {
    const parsed = proposalSchema("NGN").parse({
      kind: "QUOTE",
      price: "520000",
      discount: { kind: "PERCENT", label: "Returning Client", percent: "5" },
      commitmentPercent: null,
      turnaround: { value: 2, unit: "WEEKS" },
      note: "Renewed.",
      validUntil: "2026-11-20",
    });
    expect(parsed.discount).toEqual({ kind: "PERCENT", label: "Returning Client", percent: 500 });
  });

  it("validates a payment declaration (PAY-004)", () => {
    const parsed = paymentDeclarationSchema("NGN").parse({
      paymentMethodId: "pm-ada-bank",
      amount: "190,000",
      paidOn: "2026-11-09",
      reference: "TRF-88213",
    });
    expect(parsed.amount).toBe(19_000_000n);
    expect(
      firstError(
        paymentDeclarationSchema("NGN").safeParse({
          paymentMethodId: "",
          amount: "1",
          paidOn: "2026-11-09",
          reference: "",
        }),
      ),
    ).toBe("Choose how you paid.");
  });
});
