import { dateKeysForSundayWeek, sundayWeekStartKey } from "@/lib/callingCardWeek";
import { dateKeyFromDate, daysBetweenDateKeys } from "@/lib/dateKey";
import type { CalendarEvent, UserState } from "@/lib/models";

export type NearestDeadlineSource = "calendar" | "callingCard";

export type NearestDeadline = {
  daysUntil: number;
  label: string;
  source: NearestDeadlineSource;
};

type Candidate = NearestDeadline & { sortKey: string };

/**
 * Nearest upcoming deadline: minimum days among calendar events (on/after today)
 * and the current week's Calling Card (week ends Saturday local).
 */
export function getNearestDeadline(
  now: Date,
  calendarEvents: readonly CalendarEvent[],
  callingCard: UserState["callingCard"],
): NearestDeadline | null {
  const todayKey = dateKeyFromDate(now);
  const currentWeekStart = sundayWeekStartKey(now);
  const candidates: Candidate[] = [];

  for (const ev of calendarEvents) {
    if (!ev.dateKey || ev.dateKey < todayKey) continue;
    const daysUntil = daysBetweenDateKeys(todayKey, ev.dateKey);
    if (!Number.isFinite(daysUntil) || daysUntil < 0) continue;
    candidates.push({
      daysUntil,
      label: ev.title.trim() || "Event",
      source: "calendar",
      sortKey: `${ev.dateKey}\0${ev.id}`,
    });
  }

  if (callingCard && callingCard.weekStartKey === currentWeekStart) {
    const weekKeys = dateKeysForSundayWeek(currentWeekStart);
    const saturdayKey = weekKeys[6];
    if (saturdayKey && saturdayKey >= todayKey) {
      const daysUntil = daysBetweenDateKeys(todayKey, saturdayKey);
      if (Number.isFinite(daysUntil) && daysUntil >= 0) {
        const pledge = callingCard.pledge.trim();
        const label =
          pledge.length > 28 ? `${pledge.slice(0, 28)}…` : pledge || "Calling card";
        candidates.push({
          daysUntil,
          label,
          source: "callingCard",
          sortKey: `${saturdayKey}\0calling-card`,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return a.sortKey.localeCompare(b.sortKey);
  });

  const win = candidates[0]!;
  return { daysUntil: win.daysUntil, label: win.label, source: win.source };
}
