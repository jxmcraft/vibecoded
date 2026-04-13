import { describe, expect, it } from "vitest";

import { META_LOCATIONS, TOKYO_MAP_HEIGHT, TOKYO_MAP_WIDTH, mapRoutePathD } from "./locations";

describe("mapRoutePathD", () => {
  it("connects pins in routeOrder in map pixel space", () => {
    const d = mapRoutePathD(META_LOCATIONS);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.includes(" L ")).toBe(true);
    const sorted = [...META_LOCATIONS].sort((a, b) => a.routeOrder - b.routeOrder);
    const x0 = (sorted[0]!.mapX / 100) * TOKYO_MAP_WIDTH;
    const y0 = (sorted[0]!.mapY / 100) * TOKYO_MAP_HEIGHT;
    const afterM = d.slice(2).split(" L ")[0] ?? "";
    const [sx, sy] = afterM.split(" ");
    expect(Number(sx)).toBeCloseTo(x0);
    expect(Number(sy)).toBeCloseTo(y0);
  });
});
