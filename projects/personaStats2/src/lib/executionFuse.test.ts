import { describe, expect, it } from "vitest";

import {
  FUSE_MULTIPLIER_STEP,
  MAX_GLOBAL_XP_MULTIPLIER,
  grantedStatXpFromBase,
  multiplierAfterExecutionFuse,
} from "./executionFuse";

describe("grantedStatXpFromBase", () => {
  it("returns 0 when base is 0", () => {
    expect(grantedStatXpFromBase(0, 2)).toBe(0);
  });

  it("rounds and guarantees at least 1 when base > 0", () => {
    expect(grantedStatXpFromBase(1, 1)).toBe(1);
    expect(grantedStatXpFromBase(10, 1.1)).toBe(11);
    expect(grantedStatXpFromBase(3, 0.2)).toBe(1);
  });
});

describe("multiplierAfterExecutionFuse", () => {
  it("steps by fuse factor until cap", () => {
    let m = 1;
    for (let i = 0; i < 20; i++) {
      m = multiplierAfterExecutionFuse(m);
    }
    expect(m).toBe(MAX_GLOBAL_XP_MULTIPLIER);
  });

  it("does not exceed cap from a high starting value", () => {
    expect(multiplierAfterExecutionFuse(MAX_GLOBAL_XP_MULTIPLIER)).toBe(MAX_GLOBAL_XP_MULTIPLIER);
  });

  it("uses the configured step from 1", () => {
    expect(multiplierAfterExecutionFuse(1)).toBeCloseTo(FUSE_MULTIPLIER_STEP, 10);
  });
});
