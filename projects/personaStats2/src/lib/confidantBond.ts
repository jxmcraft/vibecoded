/** Minimum total bond XP to reach each rank (1-based). Rank 10 is max. */
export const CONFIDANT_RANK_MIN_BOND = [
  0, 40, 100, 200, 350, 550, 800, 1100, 1500, 2000,
] as const;

export const CONFIDANT_MAX_RANK = CONFIDANT_RANK_MIN_BOND.length;

/**
 * Bond XP granted from stat XP on a logged activity (solo confidant link).
 * Tuned so steady play reaches rank-ups over many sessions.
 */
export function bondXpFromStatXp(statXp: number): number {
  if (statXp <= 0) return 0;
  return Math.max(1, Math.round(statXp * 0.12));
}

export function rankFromBondXp(bondXp: number): number {
  let rank = 1;
  for (let i = 1; i < CONFIDANT_RANK_MIN_BOND.length; i++) {
    if (bondXp >= CONFIDANT_RANK_MIN_BOND[i]) rank = i + 1;
    else break;
  }
  return Math.min(rank, CONFIDANT_MAX_RANK);
}

export function applyBondXp(
  prevBondXp: number,
  delta: number,
): { newBondXp: number; rankUp: { prevRank: number; newRank: number } | null } {
  const newBondXp = prevBondXp + delta;
  const prevRank = rankFromBondXp(prevBondXp);
  const newRank = rankFromBondXp(newBondXp);
  const rankUp = newRank > prevRank ? { prevRank, newRank } : null;
  return { newBondXp, rankUp };
}
