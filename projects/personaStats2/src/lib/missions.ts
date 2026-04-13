import { findActivityById } from "@/data/activities";
import { DAILY_MISSION_IDS, XP_BUDGET_MISSION_MIN } from "@/data/dailyMissions";
import { dateKeyFromIsoTimestamp } from "@/lib/dateKey";
import type { ActivityLog } from "@/lib/models";

/** Mission ids satisfied by today's logs (local calendar). */
export function completedMissionIdsForDay(
  logs: readonly ActivityLog[],
  todayKey: string,
): Set<string> {
  const done = new Set<string>();
  const todayLogs = logs.filter((l) => dateKeyFromIsoTimestamp(l.timestamp) === todayKey);

  if (todayLogs.length >= 1) {
    done.add("log_once");
  }

  const xpSum = todayLogs.reduce((acc, l) => acc + l.xpEarned, 0);
  if (xpSum >= XP_BUDGET_MISSION_MIN) {
    done.add("xp_budget");
  }

  const stats = new Set<string>();
  for (const log of todayLogs) {
    const act = findActivityById(log.activityId);
    if (act) stats.add(act.statCategory);
  }
  if (stats.size >= 2) {
    done.add("two_stats");
  }

  return done;
}

export function allMissionsCompleteForDay(
  logs: readonly ActivityLog[],
  todayKey: string,
): boolean {
  const done = completedMissionIdsForDay(logs, todayKey);
  return DAILY_MISSION_IDS.every((id) => done.has(id));
}
