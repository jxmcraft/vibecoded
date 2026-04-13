import { describe, expect, it } from "vitest";

import { formatCountdownMs, sessionRemainingMs } from "./sessionTimer";

describe("sessionRemainingMs", () => {
  it("is negative after end", () => {
    const end = new Date("2026-01-01T12:00:00.000Z").toISOString();
    const now = new Date("2026-01-01T12:05:00.000Z").getTime();
    expect(sessionRemainingMs(end, now)).toBeLessThan(0);
  });

  it("is positive before end", () => {
    const end = new Date("2026-01-01T12:10:00.000Z").toISOString();
    const now = new Date("2026-01-01T12:05:00.000Z").getTime();
    expect(sessionRemainingMs(end, now)).toBeGreaterThan(0);
  });

  it("returns Infinity for invalid ISO so claim stays blocked", () => {
    expect(sessionRemainingMs("not-a-date", Date.now())).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("formatCountdownMs", () => {
  it("formats mm:ss", () => {
    expect(formatCountdownMs(125000)).toBe("02:05");
    expect(formatCountdownMs(59000)).toBe("00:59");
    expect(formatCountdownMs(0)).toBe("00:00");
  });

  it("handles non-finite", () => {
    expect(formatCountdownMs(Number.POSITIVE_INFINITY)).toBe("—:—");
  });
});
