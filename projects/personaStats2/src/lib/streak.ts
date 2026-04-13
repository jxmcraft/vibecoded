import { isYesterdayKey } from "@/lib/dateKey";

export type StreakSlice = {
  current: number;
  longest: number;
  lastLogDate: string | null;
};

/**
 * Updates streak when a log occurs on calendar day `todayKey` (`YYYY-MM-DD` local).
 * `lastLogDate` in state is the last day (key) the user logged at least once.
 */
export function streakAfterLog(
  streak: StreakSlice,
  todayKey: string,
): StreakSlice {
  const { current, longest, lastLogDate } = streak;

  if (lastLogDate === todayKey) {
    return { current, longest, lastLogDate: todayKey };
  }

  if (lastLogDate == null) {
    const next = 1;
    return {
      current: next,
      longest: Math.max(longest, next),
      lastLogDate: todayKey,
    };
  }

  if (isYesterdayKey(lastLogDate, todayKey)) {
    const next = current + 1;
    return {
      current: next,
      longest: Math.max(longest, next),
      lastLogDate: todayKey,
    };
  }

  const next = 1;
  return {
    current: next,
    longest: Math.max(longest, next),
    lastLogDate: todayKey,
  };
}
