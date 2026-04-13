import { STAT_TYPES, type StatType } from "@/lib/models";

export type ConfidantDef = {
  id: string;
  displayName: string;
  /** Short name for chat bubbles */
  shortName: string;
  stat: StatType;
  /** Tailwind classes for borders / chrome (StatReadout etc.) */
  borderAccentClass: string;
  /** Tailwind text color for radar labels */
  labelTextClass: string;
};

export const CONFIDANTS: readonly ConfidantDef[] = [
  {
    id: "c-muse",
    displayName: "The Muse",
    shortName: "Muse",
    stat: "Knowledge",
    borderAccentClass: "border-sky-400",
    labelTextClass: "text-sky-300",
  },
  {
    id: "c-archivist",
    displayName: "The Archivist",
    shortName: "Archivist",
    stat: "Knowledge",
    borderAccentClass: "border-violet-400",
    labelTextClass: "text-violet-300",
  },
  {
    id: "c-iron",
    displayName: "Iron Coach",
    shortName: "Coach",
    stat: "Guts",
    borderAccentClass: "border-orange-500",
    labelTextClass: "text-orange-400",
  },
  {
    id: "c-nightrunner",
    displayName: "Night Runner",
    shortName: "Runner",
    stat: "Guts",
    borderAccentClass: "border-rose-400",
    labelTextClass: "text-rose-300",
  },
  {
    id: "c-artisan",
    displayName: "Quiet Artisan",
    shortName: "Artisan",
    stat: "Proficiency",
    borderAccentClass: "border-amber-400",
    labelTextClass: "text-amber-300",
  },
  {
    id: "c-operator",
    displayName: "The Operator",
    shortName: "Operator",
    stat: "Proficiency",
    borderAccentClass: "border-lime-400",
    labelTextClass: "text-lime-300",
  },
  {
    id: "c-neighbor",
    displayName: "Good Neighbor",
    shortName: "Neighbor",
    stat: "Kindness",
    borderAccentClass: "border-emerald-400",
    labelTextClass: "text-emerald-300",
  },
  {
    id: "c-mediator",
    displayName: "The Mediator",
    shortName: "Mediator",
    stat: "Kindness",
    borderAccentClass: "border-teal-400",
    labelTextClass: "text-teal-300",
  },
  {
    id: "c-debut",
    displayName: "Opening Act",
    shortName: "Debut",
    stat: "Charm",
    borderAccentClass: "border-fuchsia-400",
    labelTextClass: "text-fuchsia-300",
  },
  {
    id: "c-showrunner",
    displayName: "The Showrunner",
    shortName: "Showrunner",
    stat: "Charm",
    borderAccentClass: "border-pink-400",
    labelTextClass: "text-pink-300",
  },
] as const;

export function findConfidantById(id: string): ConfidantDef | undefined {
  return CONFIDANTS.find((c) => c.id === id);
}

export function confidantsForStat(stat: StatType): readonly ConfidantDef[] {
  return CONFIDANTS.filter((c) => c.stat === stat);
}

export function rankUpChatLine(
  shortName: string,
  newRank: number,
  stat: StatType,
): string {
  return `${shortName}: Rank ${newRank} — your ${stat} grind didn’t go unnoticed.`;
}

export function confidantChromeForStat(
  stat: StatType,
  confidantByStat: Record<StatType, string | null>,
): { borderAccentClass: string; labelTextClass: string; progressClass: string } {
  const id = confidantByStat[stat];
  if (!id) {
    return {
      borderAccentClass: "border-persona-red",
      labelTextClass: "text-white",
      progressClass: "bg-persona-red",
    };
  }
  const c = findConfidantById(id);
  if (!c || c.stat !== stat) {
    return {
      borderAccentClass: "border-persona-red",
      labelTextClass: "text-white",
      progressClass: "bg-persona-red",
    };
  }
  const progressMap: Record<string, string> = {
    "border-sky-400": "bg-sky-400",
    "border-violet-400": "bg-violet-400",
    "border-orange-500": "bg-orange-500",
    "border-rose-400": "bg-rose-400",
    "border-amber-400": "bg-amber-400",
    "border-lime-400": "bg-lime-400",
    "border-emerald-400": "bg-emerald-400",
    "border-teal-400": "bg-teal-400",
    "border-fuchsia-400": "bg-fuchsia-400",
    "border-pink-400": "bg-pink-400",
  };
  return {
    borderAccentClass: c.borderAccentClass,
    labelTextClass: c.labelTextClass,
    progressClass: progressMap[c.borderAccentClass] ?? "bg-persona-red",
  };
}

export function emptyConfidantPicks(): Record<StatType, string | null> {
  return STAT_TYPES.reduce(
    (acc, t) => {
      acc[t] = null;
      return acc;
    },
    {} as Record<StatType, string | null>,
  );
}

export function emptyBondXpByStat(): Record<StatType, number> {
  return STAT_TYPES.reduce(
    (acc, t) => {
      acc[t] = 0;
      return acc;
    },
    {} as Record<StatType, number>,
  );
}
