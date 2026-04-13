import { describe, expect, it } from "vitest";

import type { ActivityLog } from "@/lib/models";

import { allMissionsCompleteForDay, completedMissionIdsForDay } from "./missions";

function localNoonIso(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

function log(
  activityId: string,
  xp: number,
  dayKey: string,
  suffix: string,
): ActivityLog {
  const iso = localNoonIso(dayKey);
  return {
    id: suffix,
    activityId,
    durationMinutes: 30,
    xpEarned: xp,
    timestamp: iso,
  };
}

describe("completedMissionIdsForDay", () => {
  const day = "2026-04-13";

  it("marks log_once with any log today", () => {
    const done = completedMissionIdsForDay([log("walk", 10, day, "1")], day);
    expect(done.has("log_once")).toBe(true);
    expect(done.has("xp_budget")).toBe(false);
  });

  it("marks xp_budget when sum meets threshold", () => {
    const logs: ActivityLog[] = [
      log("walk", 20, day, "1"),
      log("read-light", 25, day, "2"),
    ];
    const done = completedMissionIdsForDay(logs, day);
    expect(done.has("xp_budget")).toBe(true);
  });

  it("marks two_stats when two stat categories are used", () => {
    const logs: ActivityLog[] = [
      log("walk", 5, day, "1"),
      log("read-light", 5, day, "2"),
    ];
    const done = completedMissionIdsForDay(logs, day);
    expect(done.has("two_stats")).toBe(true);
  });
});

describe("allMissionsCompleteForDay", () => {
  const day = "2026-04-13";

  it("is true when all three rules pass", () => {
    const logs: ActivityLog[] = [
      log("walk", 25, day, "1"),
      log("read-light", 20, day, "2"),
    ];
    expect(allMissionsCompleteForDay(logs, day)).toBe(true);
  });

  it("is false when a rule fails", () => {
    const logs: ActivityLog[] = [log("walk", 5, day, "1")];
    expect(allMissionsCompleteForDay(logs, day)).toBe(false);
  });
});
