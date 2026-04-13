import { describe, expect, it } from "vitest";

import {
  CONFIDANT_MAX_RANK,
  CONFIDANT_RANK_MIN_BOND,
  applyBondXp,
  bondXpFromStatXp,
  rankFromBondXp,
} from "@/lib/confidantBond";

describe("rankFromBondXp", () => {
  it("starts at rank 1 for zero XP", () => {
    expect(rankFromBondXp(0)).toBe(1);
  });

  it("steps at threshold boundaries", () => {
    expect(rankFromBondXp(CONFIDANT_RANK_MIN_BOND[1] - 1)).toBe(1);
    expect(rankFromBondXp(CONFIDANT_RANK_MIN_BOND[1])).toBe(2);
  });

  it("caps at CONFIDANT_MAX_RANK", () => {
    expect(rankFromBondXp(999_999)).toBe(CONFIDANT_MAX_RANK);
  });
});

describe("bondXpFromStatXp", () => {
  it("returns 0 for non-positive stat XP", () => {
    expect(bondXpFromStatXp(0)).toBe(0);
    expect(bondXpFromStatXp(-1)).toBe(0);
  });

  it("scales stat XP", () => {
    expect(bondXpFromStatXp(100)).toBe(12);
    expect(bondXpFromStatXp(1)).toBe(1);
  });
});

describe("applyBondXp", () => {
  it("returns null rankUp when rank unchanged", () => {
    const { newBondXp, rankUp } = applyBondXp(0, 5);
    expect(newBondXp).toBe(5);
    expect(rankUp).toBeNull();
  });

  it("returns rankUp when crossing a threshold", () => {
    const start = CONFIDANT_RANK_MIN_BOND[1] - 3;
    const { newBondXp, rankUp } = applyBondXp(start, 5);
    expect(newBondXp).toBe(CONFIDANT_RANK_MIN_BOND[1] + 2);
    expect(rankUp).toEqual({ prevRank: 1, newRank: 2 });
  });
});
