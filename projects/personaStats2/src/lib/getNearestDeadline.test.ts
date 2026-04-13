import { describe, expect, it } from "vitest";

import { getNearestDeadline } from "./getNearestDeadline";
import type { CalendarEvent } from "./models";

describe("getNearestDeadline", () => {
  it("returns null when no events and no calling card", () => {
    expect(getNearestDeadline(new Date("2026-06-10T12:00:00"), [], null)).toBe(null);
  });

  it("picks nearest calendar event", () => {
    const events: CalendarEvent[] = [
      { id: "a", title: "Far", dateKey: "2026-06-20" },
      { id: "b", title: "Soon", dateKey: "2026-06-12" },
    ];
    const r = getNearestDeadline(new Date("2026-06-10T12:00:00"), events, null);
    expect(r).not.toBe(null);
    expect(r!.source).toBe("calendar");
    expect(r!.label).toBe("Soon");
    expect(r!.daysUntil).toBe(2);
  });

  it("includes calling card saturday for current week", () => {
    // Sunday 2026-06-07 → Saturday 2026-06-13
    const now = new Date("2026-06-10T12:00:00");
    const cc = { weekStartKey: "2026-06-07", pledge: "Weekly grind" };
    const r = getNearestDeadline(now, [], cc);
    expect(r).not.toBe(null);
    expect(r!.source).toBe("callingCard");
    expect(r!.daysUntil).toBe(3);
    expect(r!.label).toContain("Weekly");
  });

  it("prefers sooner of calendar vs calling card", () => {
    const now = new Date("2026-06-10T12:00:00");
    const cc = { weekStartKey: "2026-06-07", pledge: "Card" };
    const events: CalendarEvent[] = [{ id: "x", title: "Tomorrow", dateKey: "2026-06-11" }];
    const r = getNearestDeadline(now, events, cc);
    expect(r!.source).toBe("calendar");
    expect(r!.daysUntil).toBe(1);
  });
});
