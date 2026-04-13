import { describe, expect, it } from "vitest";

import { dateKeyFromDate } from "@/lib/dateKey";
import { streakAfterLog } from "@/lib/streak";

describe("streakAfterLog", () => {
  it("starts at 1 from empty", () => {
    const next = streakAfterLog(
      { current: 0, longest: 0, lastLogDate: null },
      "2026-04-10",
    );
    expect(next).toEqual({ current: 1, longest: 1, lastLogDate: "2026-04-10" });
  });

  it("does not increment on the same calendar day", () => {
    const next = streakAfterLog(
      { current: 3, longest: 5, lastLogDate: "2026-04-10" },
      "2026-04-10",
    );
    expect(next).toEqual({ current: 3, longest: 5, lastLogDate: "2026-04-10" });
  });

  it("increments when logging the day after last log", () => {
    const next = streakAfterLog(
      { current: 2, longest: 2, lastLogDate: "2026-04-10" },
      "2026-04-11",
    );
    expect(next).toEqual({ current: 3, longest: 3, lastLogDate: "2026-04-11" });
  });

  it("resets to 1 after a gap", () => {
    const next = streakAfterLog(
      { current: 4, longest: 4, lastLogDate: "2026-04-08" },
      "2026-04-11",
    );
    expect(next).toEqual({ current: 1, longest: 4, lastLogDate: "2026-04-11" });
  });

  it("extends longest when current surpasses it", () => {
    const next = streakAfterLog(
      { current: 0, longest: 2, lastLogDate: null },
      "2026-01-01",
    );
    expect(next.longest).toBe(2);
    const day2 = streakAfterLog(next, "2026-01-02");
    expect(day2.longest).toBe(2);
    const day3 = streakAfterLog(day2, "2026-01-03");
    expect(day3).toEqual({ current: 3, longest: 3, lastLogDate: "2026-01-03" });
  });
});

describe("isYesterdayKey (via streak integration)", () => {
  it("treats consecutive local dates as yesterday", () => {
    const a = new Date(2026, 3, 10);
    const b = new Date(2026, 3, 11);
    const ka = dateKeyFromDate(a);
    const kb = dateKeyFromDate(b);
    const next = streakAfterLog({ current: 1, longest: 1, lastLogDate: ka }, kb);
    expect(next.current).toBe(2);
  });
});
