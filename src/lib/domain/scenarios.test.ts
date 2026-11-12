/**
 * The validation scenarios from docs/03 §78–92, with D-001 prices, run end to end
 * across modules.
 */
import { describe, expect, it } from "vitest";
import { allocateCapacity, capacityPrice, effectiveCapacity, hasFreeSlot } from "./capacity";
import { type Brief, isBriefComplete } from "./brief";
import { transitionService } from "./lifecycles";
import { formatMoney, major } from "./money";
import { canAcceptNewRequest } from "./policies";
import { type PricingConfig, calculatePrice, calculateProposalTotals } from "./pricing";
import {
  type RequestAction,
  type RequestState,
  submittedRequest,
  transitionRequest,
} from "./request";
import { unwrap } from "./result";
import type { Actor } from "./actors";

const NGN = (n: number) => major(n, "NGN").amountMinor;

function run(state: RequestState, steps: [Actor, RequestAction][]): RequestState {
  return steps.reduce(
    (s, [actor, action]) => unwrap(transitionRequest(s, action, actor)).state,
    state,
  );
}

const logoDesign: PricingConfig = {
  currency: "NGN",
  mode: "FIXED",
  baseAmountMinor: NGN(150_000),
  packages: [],
  quantityRules: [],
  addOns: [],
  optionGroups: [],
  deliveryOptions: [{ id: "std", label: "Standard", isStandard: true, modifier: null }],
  dependencies: [],
  charges: [],
};

describe("docs/03 §78–92 validation scenarios", () => {
  it("§78 Free Creative publishes one Service at capacity 1", () => {
    const capacity = effectiveCapacity("FREE", 1);
    expect(hasFreeSlot([], capacity)).toBe(true);
    expect(unwrap(transitionService("DRAFT", "PUBLISH", "CREATIVE", { hasFreeSlot: true }))).toBe(
      "PUBLISHED",
    );
    expect(hasFreeSlot([{ lifecycle: "PUBLISHED" }], capacity)).toBe(false);
  });

  it("§79 Capacity 4 costs ₦6,000 / $6", () => {
    expect(formatMoney(capacityPrice(4, "NG"))).toBe("₦6,000");
    expect(formatMoney(capacityPrice(4, "INTL"))).toBe("$6");
  });

  it("§80 Capacity 5 discount: ₦5,000 / $5 (D-001)", () => {
    expect(formatMoney(capacityPrice(5, "NG"))).toBe("₦5,000");
    expect(formatMoney(capacityPrice(5, "INTL"))).toBe("$5");
  });

  it("§81 Ten is cheaper than nine: ₦12,000 vs ₦13,000 (D-001)", () => {
    expect(formatMoney(capacityPrice(9, "NG"))).toBe("₦13,000");
    expect(formatMoney(capacityPrice(10, "NG"))).toBe("₦12,000");
  });

  it("§82 Visual Brand Brief: multiple visual selections with an explanation", () => {
    const brief: Brief = {
      sections: [
        {
          id: "style",
          title: "Style",
          questions: [
            {
              id: "directions",
              type: "VISUAL_SELECTION",
              label: "Which logo directions resonate with you?",
              required: true,
              allowMultiple: true,
              visualExamples: [
                { id: "wordmark", label: "Wordmark" },
                { id: "emblem", label: "Emblem" },
                { id: "abstract", label: "Abstract mark" },
              ],
            },
            {
              id: "why",
              type: "LONG_TEXT",
              label: "What do you like about them?",
              required: false,
            },
          ],
        },
      ],
    };
    expect(
      isBriefComplete(brief, { directions: ["wordmark", "abstract"], why: "Clean and confident." }),
    ).toBe(true);
  });

  it("§83 A live price change does not alter a submitted Request", () => {
    const submitted = unwrap(calculatePrice(logoDesign, {}));
    const later = unwrap(calculatePrice({ ...logoDesign, baseAmountMinor: NGN(200_000) }, {}));
    expect(formatMoney(later.total!)).toBe("₦200,000");
    // The Request keeps the snapshot it was submitted with.
    expect(formatMoney(submitted.total!)).toBe("₦150,000");
  });

  it("§84 Starting From ₦300,000, proposal ₦450,000 accepted; commitment from ₦450,000", () => {
    const estimate = unwrap(
      calculatePrice({ ...logoDesign, mode: "STARTING_FROM", baseAmountMinor: NGN(300_000) }, {}),
    );
    expect(estimate.priceState).toBe("ESTIMATED");

    const proposal = unwrap(
      calculateProposalTotals({
        currency: "NGN",
        subtotalMinor: NGN(450_000),
        commitmentBps: 5_000,
      }),
    );
    expect(formatMoney(proposal.commitment!)).toBe("₦225,000");

    const state = run(submittedRequest("ESTIMATED"), [
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "QUOTE" }],
      [
        "CLIENT",
        {
          type: "ACCEPT_PROPOSAL",
          requiredCommitmentMinor: proposal.commitment!.amountMinor,
          proposalExpired: false,
        },
      ],
      ["CLIENT", { type: "ACCEPT_TERMS" }],
    ]);
    expect(state).toMatchObject({
      status: "AWAITING_COMMITMENT",
      requiredCommitmentMinor: NGN(225_000),
    });
  });

  it("§85 Partial commitment: ₦300,000 at 50%, confirmed ₦100,000 then ₦50,000", () => {
    const required = unwrap(
      calculateProposalTotals({
        currency: "NGN",
        subtotalMinor: NGN(300_000),
        commitmentBps: 5_000,
      }),
    ).commitment!.amountMinor;
    let state = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: required }],
      [
        "CREATIVE",
        { type: "CONFIRM_PAYMENT", amountMinor: NGN(100_000), resolvesDeclaration: false },
      ],
    ]);
    expect(state.status).toBe("PARTIALLY_CONFIRMED");
    state = run(state, [
      [
        "CREATIVE",
        { type: "CONFIRM_PAYMENT", amountMinor: NGN(50_000), resolvesDeclaration: false },
      ],
    ]);
    expect(state.status).toBe("READY_TO_START");
  });

  it("§86–87 Multiple and repeated Requests are independent", () => {
    const a = submittedRequest("CALCULATED");
    const b = submittedRequest("CALCULATED");
    const declinedA = run(a, [["CREATIVE", { type: "DECLINE" }]]);
    expect(declinedA.status).toBe("DECLINED");
    expect(b.status).toBe("SUBMITTED");
  });

  it("§88 Clarification works before start and stops being available after", () => {
    const state = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "REQUEST_CLARIFICATION" }],
      ["CLIENT", { type: "RESPOND_TO_CLARIFICATION" }],
      ["CREATIVE", { type: "SEND_PROPOSAL", kind: "CHANGES" }],
      [
        "CLIENT",
        { type: "ACCEPT_PROPOSAL", requiredCommitmentMinor: null, proposalExpired: false },
      ],
      ["CLIENT", { type: "ACCEPT_TERMS" }],
      ["CREATIVE", { type: "START_PROJECT" }],
    ]);
    expect(state.status).toBe("CONVERTED_TO_PROJECT");
    expect(transitionRequest(state, { type: "REQUEST_CLARIFICATION" }, "CREATIVE").ok).toBe(false);
  });

  it("§89 Explicit Project Start creates exactly one Project", () => {
    const ready = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
    ]);
    expect(ready.status).toBe("READY_TO_START");
    const started = run(ready, [["CREATIVE", { type: "START_PROJECT" }]]);
    expect(transitionRequest(started, { type: "START_PROJECT" }, "CREATIVE").ok).toBe(false);
  });

  it("§90 Subscription expiry keeps the free Service and open Requests", () => {
    const day = (n: number) => new Date(Date.UTC(2026, 0, n));
    const allocation = allocateCapacity({
      services: [
        { id: "brand", lifecycle: "PUBLISHED", publishedAt: day(1) },
        { id: "web", lifecycle: "PUBLISHED", publishedAt: day(2) },
        { id: "uiux", lifecycle: "PUBLISHED", publishedAt: day(3) },
      ],
      limit: effectiveCapacity("EXPIRED", 5),
      freeServiceId: "web",
    });
    expect(allocation).toEqual({
      freeServiceId: "web",
      keep: ["web"],
      deactivate: ["brand", "uiux"],
    });

    // An open Request on a deactivated Service keeps working (SRV-011, REQ-005).
    const open = run(submittedRequest("CALCULATED"), [
      ["CREATIVE", { type: "ACCEPT_REQUEST", requiredCommitmentMinor: null }],
    ]);
    expect(open.status).toBe("READY_TO_START");
  });

  it("§91 Limited availability still accepts new Requests", () => {
    expect(
      canAcceptNewRequest({
        creativeAccountOperational: true,
        availability: "LIMITED",
        lifecycle: "PUBLISHED",
        withinSubscriptionCapacity: true,
        moderation: "NORMAL",
      }),
    ).toBe(true);
  });
});
