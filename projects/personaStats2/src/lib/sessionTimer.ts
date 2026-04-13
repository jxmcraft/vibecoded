/** Milliseconds remaining until `endsAtIso`; negative if already elapsed. Invalid ISO → +Infinity so claim stays blocked. */
export function sessionRemainingMs(endsAtIso: string, nowMs: number = Date.now()): number {
  const end = new Date(endsAtIso).getTime();
  if (Number.isNaN(end)) return Number.POSITIVE_INFINITY;
  return end - nowMs;
}

export function formatCountdownMs(ms: number): string {
  if (!Number.isFinite(ms)) return "—:—";
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
