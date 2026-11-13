import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("keeps typography roles alongside text colours", () => {
    expect(cn("text-label text-foreground")).toBe("text-label text-foreground");
    expect(cn("text-h4", "text-danger-text")).toBe("text-h4 text-danger-text");
    expect(cn("text-numeral text-foreground")).toBe("text-numeral text-foreground");
  });

  it("lets a later font size replace a role", () => {
    expect(cn("text-body-sm", "text-caption")).toBe("text-caption");
    expect(cn("text-h3", "text-sm")).toBe("text-sm");
  });
});
