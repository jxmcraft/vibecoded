export type Point2 = { x: number; y: number };

/** Five vertices on a circle, clockwise from top (-90°). */
export function pentagonRing(
  cx: number,
  cy: number,
  radius: number,
  startAngleRad = -Math.PI / 2,
): Point2[] {
  const pts: Point2[] = [];
  for (let i = 0; i < 5; i++) {
    const a = startAngleRad + (i * 2 * Math.PI) / 5;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

/** Map level 0–99 to a radius scale with a small floor so zero is still visible. */
export function levelToRadiusNorm(level: number): number {
  const t = Math.min(99, Math.max(0, level)) / 99;
  return 0.12 + 0.88 * t;
}

/** SVG polygon `points` string for the stat pentagon (same vertex order as STAT_TYPES). */
export function radarPolygonPointsString(
  cx: number,
  cy: number,
  outerRadius: number,
  levels: readonly number[],
): string {
  return levels
    .map((lv, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const r = outerRadius * levelToRadiusNorm(lv);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(" ");
}

/** Label position just outside the outer ring. */
export function labelAnchor(cx: number, cy: number, outerRadius: number, index: number): Point2 {
  const a = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
  const r = outerRadius + 22;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
