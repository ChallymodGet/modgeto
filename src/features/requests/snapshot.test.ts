import { describe, expect, it } from "vitest";
import { creatives, services } from "@/lib/fixtures";
import { buildRequestSnapshot, buildScope } from "./snapshot";

const service = services.find((s) => s.id === "svc-brand-identity")!;
const creative = creatives.find((c) => c.userId === service.creativeId)!;
const selection = {
  packageId: "pkg-standard",
  options: { "og-use": ["opt-digital"] },
  deliveryOptionId: undefined,
};
const answers = {
  "q-name": "Bloom & Co",
  "q-about": "A florist.",
  "q-stage": "trading",
  "q-has-logo": "no",
  "q-directions": ["wordmark"],
  "q-values": ["bold"],
};

describe("buildRequestSnapshot (SRV-008, BRF-008)", () => {
  it("refuses an incomplete Brief", () => {
    const result = buildRequestSnapshot(service, creative, selection, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("BRIEF_INCOMPLETE");
  });

  it("captures price, terms, commitment and the visible Brief path", () => {
    const result = buildRequestSnapshot(service, creative, selection, answers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const snap = result.value;
    expect(snap.terms.version).toBe(service.terms.version);
    expect(snap.price.total).not.toBeNull();
    expect(snap.commitment.bps).toBe(5_000);
    // The conditional logo upload is hidden because the answer was "no".
    expect(snap.brief.visibleQuestionIds).not.toContain("q-logo-file");
  });

  it("uses the package's deliverables and timeline unless a faster delivery is chosen", () => {
    const standard = buildScope(service, selection);
    expect(standard.packageName).toBe("Standard");
    expect(standard.turnaround).toEqual(
      service.packages.find((p) => p.id === "pkg-standard")!.turnaround,
    );
    const rush = service.deliveryOptions.find((d) => !d.isStandard)!;
    expect(buildScope(service, { ...selection, deliveryOptionId: rush.id }).turnaround).toEqual(
      rush.turnaround,
    );
  });
});
