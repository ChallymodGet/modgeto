import { describe, expect, it } from "vitest";
import { REQUEST_STATUSES } from "./request";
import {
  availabilityLabel,
  clientRequestGroup,
  clientRequestLabel,
  creativeRequestGroup,
  creativeRequestLabel,
  projectStatusLabel,
  serviceStatusLabel,
} from "./status";

describe("Creative grouping (docs/04 §9, §46, D-006)", () => {
  it("maps every status", () => {
    expect(creativeRequestGroup("SUBMITTED")).toBe("NEW");
    expect(creativeRequestGroup("AWAITING_CLIENT")).toBe("AWAITING_CLIENT");
    expect(creativeRequestGroup("AWAITING_TERMS")).toBe("AWAITING_CLIENT");
    expect(creativeRequestGroup("AWAITING_COMMITMENT")).toBe("AWAITING_PAYMENT");
    expect(creativeRequestGroup("AWAITING_PAYMENT_CONFIRMATION")).toBe("AWAITING_PAYMENT");
    expect(creativeRequestGroup("PARTIALLY_CONFIRMED")).toBe("AWAITING_PAYMENT");
    expect(creativeRequestGroup("READY_TO_START")).toBe("READY_TO_START");
    for (const s of ["CONVERTED_TO_PROJECT", "DECLINED", "WITHDRAWN", "EXPIRED"] as const) {
      expect(creativeRequestGroup(s)).toBe("CLOSED");
    }
  });
});

describe("Client grouping (docs/04 §21, §47, D-006)", () => {
  it("groups by who must act next", () => {
    expect(clientRequestGroup("SUBMITTED")).toBe("AWAITING_CREATIVE");
    expect(clientRequestGroup("AWAITING_CLIENT")).toBe("ACTION_REQUIRED");
    expect(clientRequestGroup("AWAITING_TERMS")).toBe("ACTION_REQUIRED");
    expect(clientRequestGroup("AWAITING_COMMITMENT")).toBe("ACTION_REQUIRED");
    expect(clientRequestGroup("PARTIALLY_CONFIRMED")).toBe("ACTION_REQUIRED");
    expect(clientRequestGroup("AWAITING_PAYMENT_CONFIRMATION")).toBe(
      "AWAITING_PAYMENT_CONFIRMATION",
    );
    expect(clientRequestGroup("READY_TO_START")).toBe("READY_TO_START");
  });
});

describe("labels", () => {
  it("reflect the D-027 reply indicator", () => {
    expect(creativeRequestLabel({ status: "SUBMITTED", awaitingClientReason: null })).toEqual({
      label: "New Request",
      intent: "info",
    });
    expect(
      creativeRequestLabel({
        status: "SUBMITTED",
        awaitingClientReason: null,
        clientAwaitingReply: true,
      }).label,
    ).toBe("Client responded");
    const quote = {
      status: "AWAITING_CLIENT" as const,
      awaitingClientReason: "QUOTE_PROPOSED" as const,
    };
    expect(creativeRequestLabel(quote).label).toBe("Quote sent");
    expect(creativeRequestLabel({ ...quote, clientAwaitingReply: true }).label).toBe(
      "Client asked a question",
    );
    expect(clientRequestLabel(quote).label).toBe("Review proposal");
    expect(clientRequestLabel({ ...quote, clientAwaitingReply: true }).label).toBe(
      "Waiting for a reply",
    );
  });

  it("uses approved payment language and never says Paid (brand guidelines)", () => {
    for (const status of REQUEST_STATUSES) {
      for (const label of [
        creativeRequestLabel({ status, awaitingClientReason: null }).label,
        clientRequestLabel({ status, awaitingClientReason: null }).label,
      ]) {
        expect(label).not.toMatch(/\b(paid|order|gig|job|checkout)\b/i);
        expect(label).not.toMatch(/[A-Z_]{4,}/); // no raw enums
      }
    }
    expect(
      clientRequestLabel({ status: "AWAITING_PAYMENT_CONFIRMATION", awaitingClientReason: null })
        .label,
    ).toBe("Payment declared");
    expect(creativeRequestLabel({ status: "READY_TO_START", awaitingClientReason: null })).toEqual({
      label: "Ready to Start",
      intent: "success",
    });
  });

  it("maps Service, Project and availability to docs/08 §15 intents", () => {
    expect(serviceStatusLabel("PUBLISHED", "NORMAL")).toEqual({
      label: "Published",
      intent: "success",
    });
    expect(serviceStatusLabel("SUBSCRIPTION_INACTIVE", "NORMAL").intent).toBe("warning");
    expect(serviceStatusLabel("PUBLISHED", "PLATFORM_DISABLED")).toEqual({
      label: "Platform disabled",
      intent: "danger",
    });
    expect(projectStatusLabel("ACTIVE").intent).toBe("info");
    expect(projectStatusLabel("COMPLETED").intent).toBe("success");
    expect(availabilityLabel("LIMITED")).toEqual({
      label: "Limited availability",
      intent: "warning",
    });
  });
});

describe("every remaining label", () => {
  it("covers each status for both actors", () => {
    const view = (
      status: (typeof REQUEST_STATUSES)[number],
      reason: "CHANGES_PROPOSED" | "CLARIFICATION_REQUESTED" | null = null,
    ) => ({
      status,
      awaitingClientReason: reason,
    });
    expect(creativeRequestLabel(view("AWAITING_CLIENT", "CHANGES_PROPOSED")).label).toBe(
      "Changes sent",
    );
    expect(creativeRequestLabel(view("AWAITING_CLIENT", "CLARIFICATION_REQUESTED")).label).toBe(
      "Question sent",
    );
    expect(creativeRequestLabel(view("AWAITING_TERMS")).label).toBe("Awaiting Client");
    expect(creativeRequestLabel(view("AWAITING_COMMITMENT")).label).toBe("Awaiting payment");
    expect(creativeRequestLabel(view("AWAITING_PAYMENT_CONFIRMATION")).label).toBe(
      "Payment to confirm",
    );
    expect(creativeRequestLabel(view("PARTIALLY_CONFIRMED")).label).toBe("Partial commitment");
    expect(creativeRequestLabel(view("CONVERTED_TO_PROJECT")).label).toBe("Project started");
    expect(clientRequestLabel(view("SUBMITTED")).label).toBe("Awaiting Creative");
    expect(clientRequestLabel(view("AWAITING_CLIENT", "CHANGES_PROPOSED")).label).toBe(
      "Review changes",
    );
    expect(clientRequestLabel(view("AWAITING_CLIENT", "CLARIFICATION_REQUESTED")).label).toBe(
      "Answer question",
    );
    expect(clientRequestLabel(view("AWAITING_TERMS")).label).toBe("Accept terms");
    expect(clientRequestLabel(view("AWAITING_COMMITMENT")).label).toBe("Commitment payment");
    expect(clientRequestLabel(view("PARTIALLY_CONFIRMED")).label).toBe("Remaining commitment");
    expect(clientRequestLabel(view("READY_TO_START")).label).toBe("Ready to Start");
    expect(clientRequestLabel(view("DECLINED")).intent).toBe("danger");
    expect(clientRequestGroup("WITHDRAWN")).toBe("CLOSED");
    for (const lifecycle of ["DRAFT", "UNAVAILABLE", "ARCHIVED"] as const) {
      expect(serviceStatusLabel(lifecycle, "NORMAL").intent).toBe("neutral");
    }
    expect(availabilityLabel("AVAILABLE").intent).toBe("success");
    expect(availabilityLabel("UNAVAILABLE").intent).toBe("neutral");
  });
});
