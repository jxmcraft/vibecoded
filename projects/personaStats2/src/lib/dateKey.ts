/** Local calendar day as `YYYY-MM-DD`. */
export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateKeyFromIsoTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return dateKeyFromDate(d);
}

function utcDayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** True if `prevKey` is the calendar day immediately before `todayKey` (local dates). */
export function isYesterdayKey(prevKey: string, todayKey: string): boolean {
  if (!prevKey || !todayKey) return false;
  const prev = parseLocalDateKey(prevKey);
  const today = parseLocalDateKey(todayKey);
  if (!prev || !today) return false;
  const diffDays = (utcDayNumber(today) - utcDayNumber(prev)) / 86400000;
  return diffDays === 1;
}

function parseLocalDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/** Whole calendar days from `startKey` to `endKey` (local dates); same day = 0. */
export function daysBetweenDateKeys(startKey: string, endKey: string): number {
  const a = parseLocalDateKey(startKey);
  const b = parseLocalDateKey(endKey);
  if (!a || !b) return Number.NaN;
  return Math.round((utcDayNumber(b) - utcDayNumber(a)) / 86400000);
}
