import { describe, expect, it } from "vitest";
import { requestDetails, services, subscriptions } from "@/lib/fixtures";
import { attentionItems, capacity, isNewCreative, requestOverview } from "./dashboard";

const forCreative = (id: string) => ({
  details: requestDetails.filter((d) => d.request.creativeId === id),
  services: services.filter((s) => s.creativeId === id),
  subscription: subscriptions.find((s) => s.creativeId === id) ?? null,
  clientNames: { "u-kemi": "Kemi", "u-daniel": "Daniel", "u-priya": "Priya" },
});

describe("Creative Dashboard (docs/06 §44–48)", () => {
  it("orders attention by the docs/06 §46 priority", () => {
    const kinds = attentionItems(forCreative("u-ada")).map((i) => i.kind);
    const order = [
      "READY_TO_START",
      "PAYMENT_TO_CONFIRM",
      "NEW_REQUEST",
      "CLIENT_RESPONSE",
      "SERVICE_ISSUE",
      "SUBSCRIPTION_ISSUE",
    ];
    expect(kinds).toEqual([...kinds].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
    expect(kinds[0]).toBe("READY_TO_START");
  });

  it("keeps new Requests and Client replies separate (D-027)", () => {
    const items = attentionItems(forCreative("u-ada"));
    const fresh = items.find((i) => i.kind === "NEW_REQUEST")!;
    const replies = items.find((i) => i.kind === "CLIENT_RESPONSE")!;
    expect(fresh.count).toBeGreaterThan(0);
    expect(replies.count).toBeGreaterThan(0);
  });

  it("links straight to a Request when there's only one", () => {
    const ready = attentionItems(forCreative("u-ada")).find((i) => i.kind === "READY_TO_START")!;
    expect(ready.count).toBe(1);
    expect(ready.action.href).toMatch(/^\/app\/creative\/requests\/req-/);
  });

  it("flags subscription problems for the Creative only", () => {
    expect(attentionItems(forCreative("u-mira")).map((i) => i.kind)).toContain(
      "SUBSCRIPTION_ISSUE",
    );
  });

  it("summarises open Requests and capacity", () => {
    const overview = requestOverview(forCreative("u-ada").details);
    expect(overview.READY_TO_START).toBe(1);
    expect(capacity(forCreative("u-ada").services, forCreative("u-ada").subscription)).toEqual({
      used: 4,
      limit: 5,
    });
  });

  it("detects a Creative with nothing published", () => {
    expect(isNewCreative(forCreative("u-leo").services)).toBe(true);
    expect(isNewCreative(forCreative("u-ada").services)).toBe(false);
  });
});
