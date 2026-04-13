/**
 * Tracks available for Hideout BGM. Add entries here when you drop new files in `public/audio/`.
 */
export type BgmTrack = {
  id: string;
  label: string;
  /** Path under `public/` */
  src: string;
};

export const BGM_TRACKS: readonly BgmTrack[] = [
  {
    id: "beneath_the_mask",
    label: "Beneath the Mask",
    src: "/audio/beneath_the_mask.mp3",
  },
  {
    id: "hideout_silent",
    label: "Silent loop (placeholder)",
    src: "/audio/hideout-loop.wav",
  },
] as const;

export const DEFAULT_BGM_TRACK_ID = BGM_TRACKS[0]!.id;

export function bgmTrackById(id: string): BgmTrack | undefined {
  return BGM_TRACKS.find((t) => t.id === id);
}

export function bgmSrcForTrackId(id: string): string {
  return bgmTrackById(id)?.src ?? BGM_TRACKS[0]!.src;
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
