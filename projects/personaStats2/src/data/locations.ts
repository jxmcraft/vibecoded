import type { StatType } from "@/lib/models";

/** Raster map under `/public`. */
export const TOKYO_MAP_SRC = "/images/tokyo-map.png";

/** Native pixel dimensions of `tokyo-map.png` (for aspect ratio). */
export const TOKYO_MAP_WIDTH = 1500;
export const TOKYO_MAP_HEIGHT = 982;

/** One P5-flavored station per stat on the Tokyo map (`mapX` / `mapY` are % of map width/height). */
export type MetaLocation = {
  id: string;
  /** Short label for travel chips */
  name: string;
  /** Neighborhood / station area */
  districtName: string;
  /** Landmark in-universe */
  venueName: string;
  /** Legacy one-liner; prefer district + venue in UI */
  tagline: string;
  stat: StatType;
  /** Order for dashed route polyline (geographic sweep) */
  routeOrder: number;
  whyText: string;
  appUsageText: string;
  /** Full-bleed scene tint (under `sceneImageSrc`). */
  sceneClass: string;
  /** Scene art in `/public/images/scenes/`. */
  sceneImageSrc: string;
  /** Pin X as % of map width (0–100). */
  mapX: number;
  /** Pin Y as % of map height (0–100). */
  mapY: number;
};

export const META_LOCATIONS: readonly MetaLocation[] = [
  {
    id: "shinjuku-crossroads",
    name: "Shinjuku",
    districtName: "Shinjuku",
    venueName: "Crossroads / flower shop",
    tagline: "Kindness & care",
    stat: "Kindness",
    routeOrder: 0,
    whyText:
      "Shinjuku is where the protagonist works at the flower shop — the primary way to raise Kindness early. It’s also where you meet Chihaya and Lala-chan, stories that reward empathy.",
    appUsageText:
      "Use for self-care and service: volunteering, gardening, meditation, or checking in on a friend.",
    sceneClass: "bg-gradient-to-br from-emerald-950/55 via-teal-950/45 to-black/75",
    sceneImageSrc: "/images/scenes/shinjuku.png",
    mapX: 30,
    mapY: 25,
  },
  {
    id: "aoyama-shujin",
    name: "Aoyama-Itchome",
    districtName: "Aoyama-Itchome",
    venueName: "Shujin Academy",
    tagline: "Study & grades",
    stat: "Knowledge",
    routeOrder: 1,
    whyText:
      "Your work/study hub: library time and classroom answers to boost your grade, just like in-game.",
    appUsageText:
      "Use for academics, coding, language study, or any deep learning block.",
    sceneClass: "bg-gradient-to-br from-slate-900/70 via-indigo-950/55 to-black/78",
    sceneImageSrc: "/images/scenes/shujin-academy.png",
    mapX: 45,
    mapY: 42,
  },
  {
    id: "shibuya-central",
    name: "Shibuya",
    districtName: "Shibuya",
    venueName: "Central Street",
    tagline: "Guts & the city",
    stat: "Guts",
    routeOrder: 2,
    whyText:
      "Home of the Big Bang Burger challenge, the Velvet Room entrance, and Untouchable — stepping into the pressure of the city.",
    appUsageText:
      "Use when you’re leaving your comfort zone: public speaking, a new gym PR, or killing procrastination.",
    sceneClass: "bg-gradient-to-br from-red-950/60 via-zinc-950/50 to-black/80",
    sceneImageSrc: "/images/scenes/shibuya.png",
    mapX: 34,
    mapY: 45,
  },
  {
    id: "yongen-leblanc",
    name: "Yongen-Jaya",
    districtName: "Yongen-Jaya",
    venueName: "Café Leblanc",
    tagline: "Hands-on craft",
    stat: "Proficiency",
    routeOrder: 3,
    whyText:
      "Leblanc is where Joker crafts tools, brews coffee, and perfects curry — tactile, repeatable skill.",
    appUsageText:
      "Use for cooking, crafting, instruments, DIY, or anything you do with your hands.",
    sceneClass: "bg-gradient-to-br from-amber-950/55 via-neutral-900/50 to-black/78",
    sceneImageSrc: "/images/scenes/leblanc.png",
    mapX: 18,
    mapY: 53,
  },
  {
    id: "akihabara-arcade",
    name: "Akihabara",
    districtName: "Akihabara",
    venueName: "Maid café / arcade",
    tagline: "Charm & presence",
    stat: "Charm",
    routeOrder: 4,
    whyText:
      "Otaku central: the maid café raises Charm through awkward social grace; the arcade is pure cool factor.",
    appUsageText:
      "Use for social polish, grooming, outfits, or building your digital presence and personal brand.",
    sceneClass: "bg-gradient-to-br from-fuchsia-950/55 via-purple-950/50 to-black/80",
    sceneImageSrc: "/images/scenes/akihabara.png",
    mapX: 71,
    mapY: 25,
  },
] as const;

/**
 * SVG path through pins in `routeOrder`, in **map pixel space** (same as `viewBox` 0..W × 0..H)
 * so routes align with `object-cover` map pins placed with % left/top.
 */
export function mapRoutePathD(
  locs: readonly Pick<MetaLocation, "mapX" | "mapY" | "routeOrder">[],
  w: number = TOKYO_MAP_WIDTH,
  h: number = TOKYO_MAP_HEIGHT,
): string {
  const sorted = [...locs].sort((a, b) => a.routeOrder - b.routeOrder);
  if (sorted.length === 0) return "";
  const xy = (xPct: number, yPct: number) => `${(xPct / 100) * w} ${(yPct / 100) * h}`;
  const [first, ...rest] = sorted;
  let d = `M ${xy(first.mapX, first.mapY)}`;
  for (const p of rest) {
    d += ` L ${xy(p.mapX, p.mapY)}`;
  }
  return d;
}

export function findMetaLocationById(id: string): MetaLocation | undefined {
  return META_LOCATIONS.find((l) => l.id === id);
}
