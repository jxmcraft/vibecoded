import { describe, expect, it } from "vitest";

import { jitterHz } from "./sfx";

describe("jitterHz", () => {
  it("stays within ±5% over many samples", () => {
    const base = 440;
    for (let i = 0; i < 500; i++) {
      const j = jitterHz(base);
      expect(j).toBeGreaterThanOrEqual(base * 0.95 * (1 - 1e-10));
      expect(j).toBeLessThanOrEqual(base * 1.05 * (1 + 1e-10));
    }
  });
});
