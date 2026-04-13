/** Local-time buckets for profile backdrop palette (Phase 5). */
export type DayNightPeriod = "dawn" | "day" | "dusk" | "night";

/**
 * @param hour — 0–23 from `Date.getHours()` in the user's local timezone
 */
export function dayNightPeriodFromHour(hour: number): DayNightPeriod {
  const h = Math.floor(hour) % 24;
  if (h >= 20 || h < 5) return "night";
  if (h < 7) return "dawn";
  if (h < 17) return "day";
  return "dusk";
}

export function dayNightPeriodAt(date: Date = new Date()): DayNightPeriod {
  return dayNightPeriodFromHour(date.getHours());
}
