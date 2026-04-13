/** Velvet Room / Execution Fuse: global XP multiplier after resetting a L99 stat. */

export const MAX_GLOBAL_XP_MULTIPLIER = 2;
export const FUSE_MULTIPLIER_STEP = 1.1;

/**
 * Stat XP actually granted after applying the persisted global multiplier.
 * Base XP comes from `xpEarned` (duration × base/min × difficulty).
 */
export function grantedStatXpFromBase(baseXp: number, globalMultiplier: number): number {
  if (baseXp <= 0) return 0;
  const m = Math.max(0, globalMultiplier);
  const n = Math.round(baseXp * m);
  return Math.max(1, n);
}

export function multiplierAfterExecutionFuse(prev: number): number {
  const p = Math.max(0, prev);
  return Math.min(MAX_GLOBAL_XP_MULTIPLIER, p * FUSE_MULTIPLIER_STEP);
}
