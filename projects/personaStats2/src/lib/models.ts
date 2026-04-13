export type StatType =
  | "Knowledge"
  | "Guts"
  | "Proficiency"
  | "Kindness"
  | "Charm";

export const STAT_TYPES: readonly StatType[] = [
  "Knowledge",
  "Guts",
  "Proficiency",
  "Kindness",
  "Charm",
] as const;

export interface DailyMissionState {
  /** Local `YYYY-MM-DD` this block applies to; rolls over when the day changes. */
  dateKey: string;
  completedIds: string[];
  /** When set to today's key, All-Out Attack already played today. */
  allOutAttackShownForDate: string | null;
}

/** In-progress focus session — XP is granted only after `endsAtIso` (wall clock). */
export interface ActivitySessionState {
  activityId: string;
  durationMinutes: number;
  startedAtIso: string;
  endsAtIso: string;
}

export interface UserState {
  stats: Record<StatType, { level: number; totalXP: number }>;
  streak: { current: number; longest: number; lastLogDate: string | null };
  settings: {
    bgmEnabled: boolean;
    sfxEnabled: boolean;
    rainEnabled: boolean;
    /** Key into `BGM_TRACKS` in `src/data/audioTracks.ts`. */
    bgmTrackId: string;
    /** 0–1, applied to `<audio>` volume while BGM is playing. */
    bgmVolume: number;
    /** 0–1 master multiplier for Web Audio SFX. */
    sfxVolume: number;
  };
  activityLogs: ActivityLog[];
  dailyMissionState: DailyMissionState;
  /** When set, user must wait until the timer ends before claiming XP. */
  pendingSession: ActivitySessionState | null;
  /** Solo confidant (Thieves Guild MVP): chosen partner id per stat, or null. */
  confidantByStat: Record<StatType, string | null>;
  /** Bond XP toward confidant rank for that stat (decoupled from which face is picked). */
  bondXpByStat: Record<StatType, number>;
}

export interface Activity {
  id: string;
  name: string;
  statCategory: StatType;
  difficultyMultiplier: 1.0 | 1.5 | 2.0 | 3.0;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  durationMinutes: number;
  xpEarned: number;
  timestamp: string;
}
