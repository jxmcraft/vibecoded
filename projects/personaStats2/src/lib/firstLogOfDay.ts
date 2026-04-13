import { dateKeyFromDate, dateKeyFromIsoTimestamp } from "@/lib/dateKey";
import type { ActivityLog } from "@/lib/models";

export type DateRevealPayload = {
  /** Local calendar key `YYYY-MM-DD` for tests / debugging */
  dateKey: string;
  weekday: string;
  month: string;
  day: number;
  year: number;
};

export function hasActivityLogOnLocalDate(
  logs: readonly ActivityLog[],
  dateKey: string,
): boolean {
  if (!dateKey) return false;
  return logs.some((l) => dateKeyFromIsoTimestamp(l.timestamp) === dateKey);
}

/** True when the next new log would be the first one on `todayKey` (local). */
export function isFirstLogOfLocalDay(
  existingLogs: readonly ActivityLog[],
  todayKey: string,
): boolean {
  return !hasActivityLogOnLocalDate(existingLogs, todayKey);
}

export function buildDateRevealPayload(d: Date): DateRevealPayload {
  const dateKey = dateKeyFromDate(d);
  return {
    dateKey,
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    month: d.toLocaleDateString("en-US", { month: "long" }),
    day: d.getDate(),
    year: d.getFullYear(),
  };
}
