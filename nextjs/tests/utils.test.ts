import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utils Functions", () => {
  describe("cn (className merger)", () => {
    it("should merge class names correctly", () => {
      const result = cn("base-class", "additional-class");
      expect(result).toContain("base-class");
      expect(result).toContain("additional-class");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const result = cn("base", isActive && "active");
      expect(result).toContain("base");
      expect(result).toContain("active");
    });

    it("should ignore falsy values", () => {
      const result = cn("base", false, null, undefined, "valid");
      expect(result).toContain("base");
      expect(result).toContain("valid");
      expect(result).not.toContain("false");
      expect(result).not.toContain("null");
    });
  });
});
