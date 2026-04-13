import { describe, expect, it } from "vitest";

import { dayNightPeriodAt, dayNightPeriodFromHour } from "./dayNightPeriod";

describe("dayNightPeriodFromHour", () => {
  it("maps night", () => {
    expect(dayNightPeriodFromHour(21)).toBe("night");
    expect(dayNightPeriodFromHour(0)).toBe("night");
    expect(dayNightPeriodFromHour(4)).toBe("night");
  });
  it("maps dawn", () => {
    expect(dayNightPeriodFromHour(5)).toBe("dawn");
    expect(dayNightPeriodFromHour(6)).toBe("dawn");
  });
  it("maps day", () => {
    expect(dayNightPeriodFromHour(7)).toBe("day");
    expect(dayNightPeriodFromHour(12)).toBe("day");
    expect(dayNightPeriodFromHour(16)).toBe("day");
  });
  it("maps dusk", () => {
    expect(dayNightPeriodFromHour(17)).toBe("dusk");
    expect(dayNightPeriodFromHour(19)).toBe("dusk");
  });
});

describe("dayNightPeriodAt", () => {
  it("uses date hours", () => {
    expect(dayNightPeriodAt(new Date("2020-06-01T14:00:00"))).toBe("day");
    expect(dayNightPeriodAt(new Date("2020-06-01T22:00:00"))).toBe("night");
  });
});
