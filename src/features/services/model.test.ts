import { describe, expect, it } from "vitest";
import { services } from "@/lib/fixtures";
import { servicePriceSummary } from "./model";

const byId = (id: string) => services.find((s) => s.id === id)!;

describe("servicePriceSummary (docs/06 §23)", () => {
  it("uses the lowest package for package Services", () => {
    const service = byId("svc-brand-identity");
    const lowest = service.packages.map((p) => p.amountMinor).sort((a, b) => (a < b ? -1 : 1))[0];
    expect(servicePriceSummary(service)).toEqual({ kind: "PACKAGES_FROM", amountMinor: lowest });
  });

  it("labels Starting From as an estimate and Custom Quote without a number", () => {
    expect(servicePriceSummary(byId("svc-landing-page")).kind).toBe("STARTING_FROM");
    expect(servicePriceSummary(byId("svc-design-retainer"))).toEqual({ kind: "QUOTE" });
  });

  it("gives a unit price for quantity Services", () => {
    expect(servicePriceSummary(byId("svc-social-kit"))).toMatchObject({
      kind: "PER_UNIT",
      unitName: "Post design",
    });
  });
});
