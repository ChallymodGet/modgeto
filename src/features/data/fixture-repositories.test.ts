import { describe, expect, it } from "vitest";
import { fixtureRepositories as repo } from "./fixture-repositories";

describe("fixture repositories", () => {
  it("finds Creatives by username case-insensitively", async () => {
    expect((await repo.creatives.getByUsername(" ADA "))?.userId).toBe("u-ada");
    expect(await repo.creatives.getByUsername("nobody")).toBeNull();
  });

  it("lists only Published and Unavailable, unmoderated Services publicly, in order", async () => {
    const slugs = (await repo.services.listPublicByCreative("u-ada")).map((s) => s.slug);
    expect(slugs).toEqual([
      "brand-identity",
      "landing-page-design",
      "design-retainer",
      "social-media-kit",
    ]);
    expect((await repo.services.listPublicByCreative("u-mira")).map((s) => s.slug)).toEqual([
      "website-copy",
    ]);
    expect(await repo.services.listByCreative("u-ada")).toHaveLength(7);
  });

  it("lists Requests per actor, newest first", async () => {
    const forAda = await repo.requests.listForCreative("u-ada");
    expect(forAda[0].title).toBe("Bloom & Co");
    expect(forAda.every((r) => r.creativeId === "u-ada")).toBe(true);
    // Ada is also a Client of Tunde (docs/03 §6).
    expect((await repo.requests.listForClient("u-ada")).map((r) => r.title)).toEqual([
      "Ada Okafor Studio site",
    ]);
  });

  it("returns full Request detail", async () => {
    const detail = (await repo.requests.getDetail("req-okra"))!;
    expect(detail.request.status).toBe("PARTIALLY_CONFIRMED");
    expect(detail.declarations.map((d) => d.resolution)).toEqual(["NOT_RECEIVED", "CONFIRMED"]);
    expect(await repo.requests.getDetail("missing")).toBeNull();
  });

  it("returns copies, so callers cannot change shared data", async () => {
    const first = (await repo.services.getById("svc-brand-identity"))!;
    first.name = "Changed";
    expect((await repo.services.getById("svc-brand-identity"))!.name).toBe("Brand Identity");
  });

  it("serves subscriptions, prices, notifications and admin views", async () => {
    expect((await repo.subscriptions.getForCreative("u-ada"))?.status).toBe("ACTIVE");
    expect(await repo.subscriptions.listCapacityPrices()).toHaveLength(20);
    expect(await repo.notifications.unreadCount("u-ada")).toBe(3);
    expect(await repo.admin.isAdmin("u-admin")).toBe(true);
    expect(await repo.admin.isAdmin("u-ada")).toBe(false);
    expect((await repo.admin.listAuditEvents())[0].action).toBe("SERVICE_MODERATED");
    expect((await repo.projects.listForCreative("u-ada")).map((p) => p.status).sort()).toEqual([
      "ACTIVE",
      "COMPLETED",
    ]);
  });
});
