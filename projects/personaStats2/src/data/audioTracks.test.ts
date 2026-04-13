import { describe, expect, it } from "vitest";

import {
  bgmTracksForShufflePool,
  pickRandomShuffleTrack,
  shufflePoolFromDayNightPeriod,
} from "./audioTracks";

describe("shufflePoolFromDayNightPeriod", () => {
  it("uses night pool only for night", () => {
    expect(shufflePoolFromDayNightPeriod("night")).toBe("night");
    expect(shufflePoolFromDayNightPeriod("day")).toBe("morning");
    expect(shufflePoolFromDayNightPeriod("dawn")).toBe("morning");
    expect(shufflePoolFromDayNightPeriod("dusk")).toBe("morning");
  });
});

describe("bgmTracksForShufflePool", () => {
  it("excludes any-pool tracks", () => {
    const m = bgmTracksForShufflePool("morning");
    expect(m.every((t) => t.pool === "morning")).toBe(true);
    expect(m.some((t) => t.id === "hideout_silent")).toBe(false);
  });
});

describe("pickRandomShuffleTrack", () => {
  it("returns a track from the pool", () => {
    const t = pickRandomShuffleTrack("morning");
    expect(t.pool).toBe("morning");
  });

  it("can exclude an id when another exists", () => {
    const first = pickRandomShuffleTrack("night", null);
    expect(first.pool).toBe("night");
    const again = pickRandomShuffleTrack("night", first.id);
    expect(again.pool).toBe("night");
  });
});
