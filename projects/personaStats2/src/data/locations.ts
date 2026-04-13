import type { StatType } from "@/lib/models";

/** Meta-map pins: one place per stat (original flavor; not Atlus location names). */
export type MetaLocation = {
  id: string;
  name: string;
  tagline: string;
  stat: StatType;
  /** Full-bleed scene (Tailwind gradient classes) */
  sceneClass: string;
  /** Pin position on the abstract map (viewBox 0–100) */
  mapX: number;
  mapY: number;
};

export const META_LOCATIONS: readonly MetaLocation[] = [
  {
    id: "study-nook",
    name: "Quiet study nook",
    tagline: "Books & focus",
    stat: "Knowledge",
    sceneClass: "bg-gradient-to-br from-slate-900 via-indigo-950 to-black",
    mapX: 22,
    mapY: 28,
  },
  {
    id: "midnight-gym",
    name: "Midnight gym",
    tagline: "Grit & reps",
    stat: "Guts",
    sceneClass: "bg-gradient-to-br from-red-950 via-zinc-950 to-black",
    mapX: 78,
    mapY: 32,
  },
  {
    id: "workbench",
    name: "The workbench",
    tagline: "Tools & craft",
    stat: "Proficiency",
    sceneClass: "bg-gradient-to-br from-amber-950/90 via-neutral-900 to-black",
    mapX: 50,
    mapY: 52,
  },
  {
    id: "community-hall",
    name: "Community hall",
    tagline: "Show up for others",
    stat: "Kindness",
    sceneClass: "bg-gradient-to-br from-emerald-950 via-teal-950 to-black",
    mapX: 28,
    mapY: 72,
  },
  {
    id: "rooftop-lounge",
    name: "Rooftop lounge",
    tagline: "Presence & poise",
    stat: "Charm",
    sceneClass: "bg-gradient-to-br from-fuchsia-950 via-purple-950 to-black",
    mapX: 72,
    mapY: 68,
  },
] as const;

export function findMetaLocationById(id: string): MetaLocation | undefined {
  return META_LOCATIONS.find((l) => l.id === id);
}
