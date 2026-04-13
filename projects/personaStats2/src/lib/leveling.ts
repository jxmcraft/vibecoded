import { STAT_TYPES, type StatType } from "@/lib/models";

/** Base XP per minute before difficulty multiplier (PRD §3). */
export const BASE_XP_PER_MINUTE = 1;

/**
 * Level from lifetime total XP. PRD §3 (max 99).
 * `Math.log` is natural logarithm.
 */
export function levelFromTotalXp(totalXP: number): number {
  const x = Math.max(0, totalXP);
  return Math.min(99, Math.floor(10 * Math.log(x + 1)));
}

/**
 * Cumulative total XP at which the next rank begins (PRD §3).
 * When current level is `level`, this is the threshold for reaching `level + 1`.
 */
export function xpNextThreshold(level: number): number {
  if (level >= 99) return Math.ceil(Math.exp(99 / 10) - 1);
  return Math.ceil(Math.exp((level + 1) / 10) - 1);
}

/** Minimum total XP such that `levelFromTotalXp(xp) >= targetLevel` (for 0 <= targetLevel <= 99). */
export function xpMinTotalForLevel(targetLevel: number): number {
  if (targetLevel <= 0) return 0;
  return Math.ceil(Math.exp(targetLevel / 10) - 1);
}

/**
 * XP awarded: duration × base per minute × difficulty (PRD §3).
 */
export function xpEarned(
  durationMinutes: number,
  baseXpPerMinute: number,
  difficultyMultiplier: number,
): number {
  const d = Math.max(0, durationMinutes);
  const b = Math.max(0, baseXpPerMinute);
  const m = Math.max(0, difficultyMultiplier);
  return d * b * m;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Progress within the current level toward the next threshold (0–1).
 * At level 99, returns 1.
 */
export function progressFractionTowardNextLevel(totalXP: number): number {
  const level = levelFromTotalXp(totalXP);
  if (level >= 99) return 1;

  const low = xpMinTotalForLevel(level);
  const high = xpNextThreshold(level);
  if (high <= low) return 1;
  return clamp01((totalXP - low) / (high - low));
}

export function emptyStatsRecord(): Record<StatType, { level: number; totalXP: number }> {
  const zero = { level: 0, totalXP: 0 };
  return Object.fromEntries(STAT_TYPES.map((s) => [s, { ...zero }])) as Record<
    StatType,
    { level: number; totalXP: number }
  >;
}
