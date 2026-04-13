import { describe, expect, it } from "vitest";

import { WEEKLY_XP_TARGET } from "@/data/callingCard";
import type { ActivityLog } from "@/lib/models";

import {
  computeCallingCardRolloverPatch,
  dateKeysForSundayWeek,
  sundayWeekStartKey,
  totalXpForWeek,
  weekStartKeyBefore,
} from "./callingCardWeek";

describe("sundayWeekStartKey", () => {
  it("returns the Sunday on or before the given local date", () => {
    // Wednesday Jan 14, 2026 local
    expect(sundayWeekStartKey(new Date(2026, 0, 14))).toBe("2026-01-11");
    expect(sundayWeekStartKey(new Date(2026, 0, 11))).toBe("2026-01-11");
    expect(sundayWeekStartKey(new Date(2026, 0, 17))).toBe("2026-01-11");
  });
});

describe("dateKeysForSundayWeek", () => {
  it("returns seven consecutive local days from Sunday", () => {
    expect(dateKeysForSundayWeek("2026-01-11")).toEqual([
      "2026-01-11",
      "2026-01-12",
      "2026-01-13",
      "2026-01-14",
      "2026-01-15",
      "2026-01-16",
      "2026-01-17",
    ]);
  });
});

describe("totalXpForWeek", () => {
  it("sums xp only for logs in that week", () => {
    const logs: ActivityLog[] = [
      {
        id: "1",
        activityId: "a",
        durationMinutes: 30,
        xpEarned: 100,
        timestamp: new Date(2026, 0, 12, 10, 0, 0).toISOString(),
      },
      {
        id: "2",
        activityId: "a",
        durationMinutes: 30,
        xpEarned: 50,
        timestamp: new Date(2026, 0, 5, 10, 0, 0).toISOString(),
      },
    ];
    expect(totalXpForWeek(logs, "2026-01-11")).toBe(100);
  });
});

describe("weekStartKeyBefore", () => {
  it("compares ISO date keys lexicographically", () => {
    expect(weekStartKeyBefore("2026-01-04", "2026-01-11")).toBe(true);
    expect(weekStartKeyBefore("2026-01-11", "2026-01-11")).toBe(false);
  });
});

describe("computeCallingCardRolloverPatch", () => {
  it("returns empty when no calling card", () => {
    expect(
      computeCallingCardRolloverPatch(
        {
          callingCard: null,
          lastWeeklyOutcomeWeekStartKey: null,
          activityLogs: [],
        },
        new Date(2026, 0, 14),
      ),
    ).toEqual({});
  });

  it("returns empty when pledge is for the current week", () => {
    expect(
      computeCallingCardRolloverPatch(
        {
          callingCard: { weekStartKey: "2026-01-11", pledge: "Run" },
          lastWeeklyOutcomeWeekStartKey: null,
          activityLogs: [],
        },
        new Date(2026, 0, 14),
      ),
    ).toEqual({});
  });

  it("clears stale card when outcome already recorded", () => {
    const p = computeCallingCardRolloverPatch(
      {
        callingCard: { weekStartKey: "2026-01-04", pledge: "Old" },
        lastWeeklyOutcomeWeekStartKey: "2026-01-04",
        activityLogs: [],
      },
      new Date(2026, 0, 14),
    );
    expect(p).toEqual({ callingCard: null });
  });

  it("marks success and pending reward when XP meets target", () => {
    const logs: ActivityLog[] = [
      {
        id: "1",
        activityId: "a",
        durationMinutes: 60,
        xpEarned: WEEKLY_XP_TARGET,
        timestamp: new Date(2026, 0, 5, 12, 0, 0).toISOString(),
      },
    ];
    const p = computeCallingCardRolloverPatch(
      {
        callingCard: { weekStartKey: "2026-01-04", pledge: "Study" },
        lastWeeklyOutcomeWeekStartKey: null,
        activityLogs: logs,
      },
      new Date(2026, 0, 14),
    );
    expect(p.callingCard).toBeNull();
    expect(p.lastWeeklyOutcomeWeekStartKey).toBe("2026-01-04");
    expect(p.monitoredMode).toBe(false);
    expect(p.pendingWeeklyCallingCardReward).toBe(true);
    expect(p.weeklyRewardForWeekStartKey).toBe("2026-01-04");
  });

  it("marks fail and monitored when XP below target", () => {
    const logs: ActivityLog[] = [
      {
        id: "1",
        activityId: "a",
        durationMinutes: 10,
        xpEarned: 10,
        timestamp: new Date(2026, 0, 5, 12, 0, 0).toISOString(),
      },
    ];
    const p = computeCallingCardRolloverPatch(
      {
        callingCard: { weekStartKey: "2026-01-04", pledge: "Study" },
        lastWeeklyOutcomeWeekStartKey: null,
        activityLogs: logs,
      },
      new Date(2026, 0, 14),
    );
    expect(p.callingCard).toBeNull();
    expect(p.monitoredMode).toBe(true);
    expect(p.pendingWeeklyCallingCardReward).toBe(false);
    expect(p.weeklyRewardForWeekStartKey).toBeNull();
  });
});
