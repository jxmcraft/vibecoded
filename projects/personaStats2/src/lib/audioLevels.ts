export const DEFAULT_BGM_VOLUME = 0.35;
export const DEFAULT_SFX_VOLUME = 0.85;

export function clampVolume01(n: unknown, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}
