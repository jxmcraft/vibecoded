import { WEEKLY_XP_TARGET } from "@/data/callingCard";
import { dateKeyFromDate, dateKeyFromIsoTimestamp } from "@/lib/dateKey";
import type { ActivityLog, UserState } from "@/lib/models";

/** Local Sunday `YYYY-MM-DD` that starts the week (through Saturday). */
export function sundayWeekStartKey(d: Date): string {
  const day = d.getDay();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return dateKeyFromDate(start);
}

/** The seven local calendar keys from that Sunday through Saturday. */
export function dateKeysForSundayWeek(weekStartKey: string): string[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekStartKey);
  if (!m) return [];
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y, mo, day + i);
    keys.push(dateKeyFromDate(dt));
  }
  return keys;
}

/** Sum granted XP from logs that fall on any day of the Sunday week `weekStartKey`. */
export function totalXpForWeek(
  logs: readonly ActivityLog[],
  weekStartKey: string,
): number {
  const inWeek = new Set(dateKeysForSundayWeek(weekStartKey));
  let sum = 0;
  for (const log of logs) {
    const k = dateKeyFromIsoTimestamp(log.timestamp);
    if (k && inWeek.has(k)) sum += log.xpEarned;
  }
  return sum;
}

export function weekStartKeyBefore(
  weekStartKey: string,
  currentWeekStartKey: string,
): boolean {
  return weekStartKey < currentWeekStartKey;
}

type RolloverSlice = Pick<
  UserState,
  "callingCard" | "lastWeeklyOutcomeWeekStartKey" | "activityLogs"
>;

/**
 * When the pledged week is strictly before the current Sunday week, finalize that week once.
 * Returns patch fields to merge into the store (calling card cleared until user sends again).
 */
export function computeCallingCardRolloverPatch(
  state: RolloverSlice,
  now: Date,
  targetXp: number = WEEKLY_XP_TARGET,
): Partial<
  Pick<
    UserState,
    | "callingCard"
    | "lastWeeklyOutcomeWeekStartKey"
    | "monitoredMode"
    | "pendingWeeklyCallingCardReward"
    | "weeklyRewardForWeekStartKey"
  >
> {
  const currentWeekStart = sundayWeekStartKey(now);
  const cc = state.callingCard;

  if (!cc) {
    return {};
  }

  if (!weekStartKeyBefore(cc.weekStartKey, currentWeekStart)) {
    return {};
  }

  const W = cc.weekStartKey;

  if (state.lastWeeklyOutcomeWeekStartKey === W) {
    return { callingCard: null };
  }

  const xp = totalXpForWeek(state.activityLogs, W);
  const success = xp >= targetXp;

  if (success) {
    return {
      callingCard: null,
      lastWeeklyOutcomeWeekStartKey: W,
      monitoredMode: false,
      pendingWeeklyCallingCardReward: true,
      weeklyRewardForWeekStartKey: W,
    };
  }

  return {
    callingCard: null,
    lastWeeklyOutcomeWeekStartKey: W,
    monitoredMode: true,
    pendingWeeklyCallingCardReward: false,
    weeklyRewardForWeekStartKey: null,
  };
}
