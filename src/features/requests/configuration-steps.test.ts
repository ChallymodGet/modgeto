import { describe, expect, it } from "vitest";
import { validateSelection } from "@/lib/domain";
import { toPricingConfig } from "@/features/services/model";
import { services } from "@/lib/fixtures";
import { configurationSteps, initialSelection, stepForIssue } from "./configuration-steps";

const byId = (id: string) => services.find((s) => s.id === id)!;

describe("configuration steps (docs/06 §25)", () => {
  it("includes only steps with something to choose", () => {
    expect(configurationSteps(byId("svc-brand-identity")).map((s) => s.id)).toEqual([
      "scope",
      "customise",
      "delivery",
    ]);
    expect(configurationSteps(byId("svc-design-retainer")).map((s) => s.label)).toEqual(["Scope"]);
    expect(configurationSteps(byId("svc-social-kit"))[0].label).toBe("Quantity");
  });

  it("starts from default quantities and standard delivery, never a paid choice", () => {
    const service = byId("svc-brand-identity");
    const selection = initialSelection(service);
    expect(selection.packageId).toBeUndefined();
    expect(selection.addOns).toBeUndefined();
    expect(selection.deliveryOptionId).toBe(service.deliveryOptions.find((d) => d.isStandard)!.id);
  });

  it("assigns each problem to its step", () => {
    const service = byId("svc-brand-identity");
    const issues = validateSelection(toPricingConfig(service), {
      ...initialSelection(service),
      addOns: { "ao-social": 1 },
    });
    const steps = issues.map((i) => [i.code, stepForIssue(i, service)]);
    expect(steps).toContainEqual(["PACKAGE_REQUIRED", "scope"]);
    expect(steps).toContainEqual(["OPTION_REQUIRED", "customise"]);
    expect(steps).toContainEqual(["MISSING_PREREQUISITE", "customise"]);
  });
});
