import { describe, expect, it } from "vitest";
import { creatives, services } from "@/lib/fixtures";
import {
  blockersFor,
  duplicateService,
  hasChanges,
  moveItem,
  newServiceDraft,
  sectionProgress,
  slugify,
  uniqueSlug,
} from "./builder-model";

const ada = creatives.find((c) => c.userId === "u-ada")!;
const brand = services.find((s) => s.id === "svc-brand-identity")!;
const now = "2026-11-19T10:00:00.000Z";

describe("Service Builder model", () => {
  it("makes URL-safe, unique slugs (SRV-013)", () => {
    expect(slugify("  Brand Identity & Logo! ")).toBe("brand-identity-logo");
    expect(slugify("Café Menu Design")).toBe("cafe-menu-design");
    expect(uniqueSlug("brand-identity", ["brand-identity", "brand-identity-2"])).toBe(
      "brand-identity-3",
    );
    expect(uniqueSlug("", [])).toBe("service");
  });

  it("starts a blank Draft in the Creative's currency", () => {
    const draft = newServiceDraft({ id: "local-1", creative: ada, now, displayOrder: 9 });
    expect(draft.lifecycle).toBe("DRAFT");
    expect(draft.currency).toBe(ada.defaultCurrency);
    expect(draft.deliveryOptions.filter((d) => d.isStandard)).toHaveLength(1);
  });

  it("shows untouched sections as Incomplete, opened ones as Needs attention", () => {
    const draft = newServiceDraft({ id: "local-1", creative: ada, now, displayOrder: 9 });
    const blockers = blockersFor(draft, ada);
    const fresh = sectionProgress(draft, blockers, []);
    expect(fresh.basics).toBe("incomplete");
    expect(fresh["addons-options"]).toBe("optional");
    expect(fresh["work-samples"]).toBe("optional");
    expect(fresh.brief).toBe("optional");
    expect(sectionProgress(draft, blockers, ["basics"]).basics).toBe("attention");
  });

  it("marks a publishable Service complete in every required section", () => {
    const progress = sectionProgress(brand, blockersFor(brand, ada), []);
    expect(Object.values(progress).every((p) => p === "complete")).toBe(true);
  });

  it("duplicates configuration as a Draft without history (SRV-015)", () => {
    const copy = duplicateService(brand, {
      id: "local-2",
      now,
      takenSlugs: services.map((s) => s.slug),
    });
    expect(copy).toMatchObject({
      name: "Brand Identity (copy)",
      slug: "brand-identity-copy",
      lifecycle: "DRAFT",
      publishedAt: null,
      workSamples: [],
    });
    expect(copy.packages).toEqual(brand.packages);
  });

  it("moves items without drag-and-drop (BRF-009)", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
  });

  it("detects changes to money values", () => {
    expect(hasChanges(brand, { ...brand, updatedAt: now })).toBe(false);
    expect(hasChanges(brand, { ...brand, baseAmountMinor: 1n })).toBe(true);
  });
});
