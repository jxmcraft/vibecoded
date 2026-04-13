import { describe, expect, it } from "vitest";

import {
  BASE_XP_PER_MINUTE,
  levelFromTotalXp,
  progressFractionTowardNextLevel,
  xpEarned,
  xpMinTotalForLevel,
  xpNextThreshold,
} from "./leveling";

describe("levelFromTotalXp", () => {
  it("is 0 at zero XP", () => {
    expect(levelFromTotalXp(0)).toBe(0);
  });

  it("never exceeds 99", () => {
    expect(levelFromTotalXp(Number.MAX_SAFE_INTEGER)).toBe(99);
    expect(levelFromTotalXp(1e300)).toBe(99);
  });

  it("is monotonic non-decreasing in totalXP", () => {
    let prev = -1;
    for (let x = 0; x <= 5000; x += 17) {
      const L = levelFromTotalXp(x);
      expect(L).toBeGreaterThanOrEqual(prev);
      prev = L;
    }
  });
});

describe("xpNextThreshold and level bands", () => {
  it("crossing xpNextThreshold(L) reaches at least level L+1 for L < 99", () => {
    for (let L = 0; L < 99; L += 7) {
      const x = xpNextThreshold(L);
      expect(levelFromTotalXp(x)).toBeGreaterThanOrEqual(L + 1);
    }
  });

  it("xpMinTotalForLevel aligns with levelFromTotalXp", () => {
    for (let target = 1; target < 99; target += 11) {
      const x = xpMinTotalForLevel(target);
      expect(levelFromTotalXp(x)).toBeGreaterThanOrEqual(target);
      if (x > 0) {
        expect(levelFromTotalXp(x - 1)).toBeLessThan(target);
      }
    }
  });
});

describe("progressFractionTowardNextLevel", () => {
  it("is 1 at level 99", () => {
    const x = xpMinTotalForLevel(99);
    expect(levelFromTotalXp(x)).toBe(99);
    expect(progressFractionTowardNextLevel(x)).toBe(1);
  });

  it("stays within 0 and 1", () => {
    for (let x = 0; x < 8000; x += 31) {
      const p = progressFractionTowardNextLevel(x);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe("xpEarned", () => {
  it("scales by duration, base, and difficulty", () => {
    expect(xpEarned(60, BASE_XP_PER_MINUTE, 1.0)).toBe(60);
    expect(xpEarned(60, BASE_XP_PER_MINUTE, 1.5)).toBe(90);
    expect(xpEarned(30, BASE_XP_PER_MINUTE, 2.0)).toBe(60);
    expect(xpEarned(20, BASE_XP_PER_MINUTE, 3.0)).toBe(60);
  });

  it("treats negative duration as 0", () => {
    expect(xpEarned(-5, BASE_XP_PER_MINUTE, 2.0)).toBe(0);
  });
});
