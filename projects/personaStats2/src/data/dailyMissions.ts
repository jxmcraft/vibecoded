export const DAILY_MISSION_IDS = ["log_once", "xp_budget", "two_stats"] as const;

export type DailyMissionId = (typeof DAILY_MISSION_IDS)[number];

export const XP_BUDGET_MISSION_MIN = 40;

export const DAILY_MISSIONS: readonly {
  id: DailyMissionId;
  title: string;
  blurb: string;
}[] = [
  {
    id: "log_once",
    title: "FIRST STRIKE",
    blurb: "Log at least one action today.",
  },
  {
    id: "xp_budget",
    title: "MOMENTUM",
    blurb: `Earn ${XP_BUDGET_MISSION_MIN}+ XP from today's logs.`,
  },
  {
    id: "two_stats",
    title: "BALANCED GROWTH",
    blurb: "Train at least two different stats today.",
  },
];
