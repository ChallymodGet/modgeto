import { describe, expect, it } from "vitest";
import { requestDetails } from "@/lib/fixtures";
import { clientAwaitingReply, requestHistory, requestView } from "./model";

const detail = (id: string) => requestDetails.find((d) => d.request.id === id)!;

describe("clientAwaitingReply (D-027)", () => {
  it("is true when the Client wrote last during negotiation", () => {
    expect(clientAwaitingReply(detail("req-northwind"))).toBe(true);
    expect(clientAwaitingReply(detail("req-fieldnote"))).toBe(true);
  });

  it("is false when the Creative wrote last or nobody has written", () => {
    expect(clientAwaitingReply(detail("req-atlas"))).toBe(false);
    expect(clientAwaitingReply(detail("req-bloom"))).toBe(false);
  });

  it("is false once negotiation is over", () => {
    expect(clientAwaitingReply(detail("req-tidewater"))).toBe(false);
  });

  it("feeds the status language", () => {
    expect(requestView(detail("req-northwind"))).toMatchObject({
      status: "SUBMITTED",
      clientAwaitingReply: true,
    });
  });
});

describe("a new proposal answers the Client (D-027)", () => {
  it("stops showing a Client reply once the Creative sends a proposal after it", () => {
    const d = structuredClone(detail("req-fieldnote"));
    const last = [...d.responses].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)!;
    d.responses = d.responses.map((x) =>
      x.id === last.id ? { ...x, authorRole: "CLIENT" as const } : x,
    );
    expect(clientAwaitingReply(d)).toBe(!d.proposals.some((p) => p.createdAt > last.createdAt));
    d.proposals = [
      ...d.proposals,
      { ...d.proposals[0], id: "p-new", createdAt: "2099-01-01T00:00:00.000Z" },
    ];
    expect(clientAwaitingReply(d)).toBe(false);
  });
});

describe("requestHistory", () => {
  it("lists what happened, newest first, in the viewer's words", () => {
    const d = requestDetails.find((x) => x.request.id === "req-tidewater")!;
    const h = requestHistory(d, { CREATIVE: "Ada", CLIENT: "Priya" }, "CREATIVE");
    expect(h.at(-1)!.text).toBe("Priya submitted the Request");
    expect(h.some((e) => e.text === "You confirmed a payment received")).toBe(true);
    expect([...h].sort((a, b) => b.at.localeCompare(a.at))).toEqual(h);
  });
});
