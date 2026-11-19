import { describe, expect, it } from "vitest";
import { requestDetails } from "@/lib/fixtures";
import { clientAwaitingReply, requestView } from "./model";

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
