import { describe, expect, it } from "vitest";
import { authContext, safeNext, withNext } from "./policy";

describe("safeNext (docs/05 §36)", () => {
  it("allows same-site paths", () => {
    expect(safeNext("/ada/brand-identity/review")).toBe("/ada/brand-identity/review");
    expect(safeNext("/app/client/requests?tab=1")).toBe("/app/client/requests?tab=1");
  });

  it("rejects anything that could leave the site", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "/a\nb",
    ]) {
      expect(safeNext(bad)).toBe("/app");
    }
  });

  it("never returns into the auth flow and falls back when empty", () => {
    expect(safeNext("/auth/sign-in")).toBe("/app");
    expect(safeNext(null, "/x")).toBe("/x");
  });

  it("carries next between auth screens", () => {
    expect(withNext("/auth/sign-in", "/ada/x/review")).toBe(
      "/auth/sign-in?next=%2Fada%2Fx%2Freview",
    );
    expect(withNext("/auth/sign-in", "https://evil.example")).toBe("/auth/sign-in");
  });

  it("knows when the person is submitting a Request", () => {
    expect(authContext("/ada/brand-identity/review")).toBe("SUBMIT_REQUEST");
    expect(authContext("/app")).toBe("GENERAL");
  });
});
