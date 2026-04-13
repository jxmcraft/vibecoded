import type { DayNightPeriod } from "@/lib/dayNightPeriod";

/**
 * Tracks available for Hideout BGM. Register entries when you add files under `public/audio/`.
 */
export type BgmPool = "morning" | "night" | "any";

export type BgmTrack = {
  id: string;
  label: string;
  /** Path under `public/` */
  src: string;
  /** Shuffle draws only from `morning` / `night` by local time; `any` is settings / manual only. */
  pool: BgmPool;
};

/** Typographic apostrophe in filename on disk (U+2019). */
const IT_S_GOING_DOWN = "/audio/morning/hype/It\u2019s_Going_Down_Now.mp3";

export const BGM_TRACKS: readonly BgmTrack[] = [
  {
    id: "beneath_the_mask",
    label: "Beneath the Mask",
    src: "/audio/morning/chill/beneath_the_mask.mp3",
    pool: "morning",
  },
  {
    id: "beneath_the_mask_night",
    label: "Beneath the Mask (night)",
    src: "/audio/night/chill/beneath_the_mask.mp3",
    pool: "night",
  },
  {
    id: "color_your_night",
    label: "Color Your Night",
    src: "/audio/morning/chill/Color_Your_Night.mp3",
    pool: "morning",
  },
  {
    id: "memories_of_you",
    label: "Memories of You",
    src: "/audio/morning/chill/Memories_of_You.mp3",
    pool: "morning",
  },
  {
    id: "full_moon_full_life",
    label: "Full Moon Full Life",
    src: "/audio/morning/hype/Full_Moon_Full_Life.mp3",
    pool: "morning",
  },
  {
    id: "its_going_down_now",
    label: "It's Going Down Now",
    src: IT_S_GOING_DOWN,
    pool: "morning",
  },
  {
    id: "hideout_silent",
    label: "Silent loop (placeholder)",
    src: "/audio/hideout-loop.wav",
    pool: "any",
  },
] as const;

export const DEFAULT_BGM_TRACK_ID = BGM_TRACKS[0]!.id;

export function bgmTrackById(id: string): BgmTrack | undefined {
  return BGM_TRACKS.find((t) => t.id === id);
}

export function bgmSrcForTrackId(id: string): string {
  return bgmTrackById(id)?.src ?? BGM_TRACKS[0]!.src;
}

/** Dawn / day / dusk use the morning audio folder; `night` uses the night folder. */
export function shufflePoolFromDayNightPeriod(period: DayNightPeriod): "morning" | "night" {
  return period === "night" ? "night" : "morning";
}

export function bgmTracksForShufflePool(pool: "morning" | "night"): readonly BgmTrack[] {
  return BGM_TRACKS.filter((t) => t.pool === pool);
}

export function pickRandomShuffleTrack(
  pool: "morning" | "night",
  excludeId?: string | null,
): BgmTrack {
  const list = bgmTracksForShufflePool(pool);
  const candidates =
    excludeId != null && excludeId !== "" ? list.filter((t) => t.id !== excludeId) : [...list];
  const pickFrom = candidates.length > 0 ? candidates : list;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)]!;
}

/** Cycle to the next track in the list (wrap). */
export function nextBgmTrackId(currentId: string): string {
  const i = BGM_TRACKS.findIndex((t) => t.id === currentId);
  const next = (i >= 0 ? i + 1 : 0) % BGM_TRACKS.length;
  return BGM_TRACKS[next]!.id;
}

/** Previous track (wrap). */
export function prevBgmTrackId(currentId: string): string {
  const i = BGM_TRACKS.findIndex((t) => t.id === currentId);
  const prev = (i <= 0 ? BGM_TRACKS.length : i) - 1;
  return BGM_TRACKS[prev]!.id;
}
