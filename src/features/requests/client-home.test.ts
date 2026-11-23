import { describe, expect, it } from "vitest";
import { requestDetails } from "@/lib/fixtures";
import { activeRequests, clientAttention, recentActivity } from "./client-home";

const forClient = (id: string) => requestDetails.filter((d) => d.request.clientId === id);
const names = { "u-ada": "Ada Okafor", "u-tunde": "Tunde Bello" };
const today = "2026-11-10";

describe("Client Home (docs/04 §20)", () => {
  it("lists what needs the Client in the docs/04 §20 order", () => {
    const kinds = clientAttention(forClient("u-kemi"), names, today).map((i) => i.kind);
    const order = ["CHANGES", "QUOTE", "QUESTION", "TERMS", "PAYMENT"];
    expect(kinds).toEqual([...kinds].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
    expect(kinds).toContain("CHANGES");
    expect(kinds).toContain("PAYMENT");
  });

  it("covers quotes, questions and terms", () => {
    const all = [...forClient("u-priya"), ...forClient("u-daniel")];
    const kinds = clientAttention(all, names, today).map((i) => i.kind);
    expect(kinds).toEqual(expect.arrayContaining(["QUESTION", "TERMS"]));
  });

  it("links every item straight to the right section of its Request", () => {
    for (const item of clientAttention(forClient("u-kemi"), names, today)) {
      expect(item.action.href.startsWith(`/app/client/requests/${item.requestId}#`)).toBe(true);
    }
  });

  it("keeps attention items out of the active list, and closed Requests out of both", () => {
    const details = forClient("u-kemi");
    const attention = clientAttention(details, names, today);
    const active = activeRequests(details, attention);
    expect(active.some((d) => attention.some((a) => a.requestId === d.request.id))).toBe(false);
    expect(
      active.some((d) =>
        ["CONVERTED_TO_PROJECT", "DECLINED", "WITHDRAWN"].includes(d.request.status),
      ),
    ).toBe(false);
  });

  it("shows recent activity newest first in the Client's words", () => {
    const activity = recentActivity(forClient("u-kemi"), names, "Kemi Adeyemi");
    expect(activity.length).toBeGreaterThan(0);
    expect([...activity].sort((a, b) => b.at.localeCompare(a.at))).toEqual(activity);
    expect(activity.some((a) => a.text.startsWith("You "))).toBe(true);
  });
});
