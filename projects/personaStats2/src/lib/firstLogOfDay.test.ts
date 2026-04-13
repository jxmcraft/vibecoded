import { describe, expect, it } from "vitest";

import {
  buildDateRevealPayload,
  hasActivityLogOnLocalDate,
  isFirstLogOfLocalDay,
} from "@/lib/firstLogOfDay";
import type { ActivityLog } from "@/lib/models";

function logAt(iso: string): ActivityLog {
  return {
    id: "x",
    activityId: "walk",
    durationMinutes: 15,
    xpEarned: 10,
    timestamp: iso,
  };
}

describe("hasActivityLogOnLocalDate", () => {
  it("returns false for empty logs", () => {
    expect(hasActivityLogOnLocalDate([], "2026-04-13")).toBe(false);
  });

  it("returns true when a log matches the local date key", () => {
    const logs = [logAt(new Date(2026, 3, 13, 15, 0, 0).toISOString())];
    expect(hasActivityLogOnLocalDate(logs, "2026-04-13")).toBe(true);
  });

  it("returns false when logs are only on other local days", () => {
    const logs = [logAt(new Date(2026, 3, 12, 15, 0, 0).toISOString())];
    expect(hasActivityLogOnLocalDate(logs, "2026-04-13")).toBe(false);
  });
});

describe("isFirstLogOfLocalDay", () => {
  it("is true when there is no log on todayKey", () => {
    expect(isFirstLogOfLocalDay([], "2026-04-13")).toBe(true);
    expect(
      isFirstLogOfLocalDay([logAt(new Date(2026, 3, 12, 12, 0, 0).toISOString())], "2026-04-13"),
    ).toBe(true);
  });

  it("is false when a log already exists on todayKey", () => {
    expect(
      isFirstLogOfLocalDay([logAt(new Date(2026, 3, 13, 8, 30, 0).toISOString())], "2026-04-13"),
    ).toBe(false);
  });
});

describe("buildDateRevealPayload", () => {
  it("includes calendar parts for a fixed local date", () => {
    const d = new Date(2026, 5, 1, 12, 0, 0);
    const p = buildDateRevealPayload(d);
    expect(p.year).toBe(2026);
    expect(p.day).toBe(1);
    expect(p.dateKey).toBe("2026-06-01");
    expect(p.month.length).toBeGreaterThan(2);
    expect(p.weekday.length).toBeGreaterThan(2);
  });
});
