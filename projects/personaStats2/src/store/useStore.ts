import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { findActivityById } from "@/data/activities";
import {
  findConfidantById,
  rankUpChatLine,
  emptyBondXpByStat,
  emptyConfidantPicks,
} from "@/data/confidants";
import { DEFAULT_BGM_TRACK_ID } from "@/data/audioTracks";
import { DAILY_MISSION_IDS } from "@/data/dailyMissions";
import { DEFAULT_BGM_VOLUME, DEFAULT_SFX_VOLUME, clampVolume01 } from "@/lib/audioLevels";
import { dateKeyFromDate } from "@/lib/dateKey";
import { applyBondXp, bondXpFromStatXp } from "@/lib/confidantBond";
import {
  buildDateRevealPayload,
  isFirstLogOfLocalDay,
  type DateRevealPayload,
} from "@/lib/firstLogOfDay";
import { emptyStatsRecord, levelFromTotalXp, xpEarned, BASE_XP_PER_MINUTE } from "@/lib/leveling";
import type {
  ActivityLog,
  ActivitySessionState,
  DailyMissionState,
  StatType,
  UserState,
} from "@/lib/models";
import { allMissionsCompleteForDay, completedMissionIdsForDay } from "@/lib/missions";
import { streakAfterLog } from "@/lib/streak";

const STORAGE_KEY = "phantom-tracker-user-state";
const LOG_CAP = 200;
const DURATION_MIN = 1;
const DURATION_MAX = 240;

const emptyMissionState = (): DailyMissionState => ({
  dateKey: "",
  completedIds: [],
  allOutAttackShownForDate: null,
});

const defaultUserState: UserState = {
  stats: emptyStatsRecord(),
  streak: { current: 0, longest: 0, lastLogDate: null },
  settings: {
    bgmEnabled: true,
    sfxEnabled: true,
    rainEnabled: true,
    bgmTrackId: DEFAULT_BGM_TRACK_ID,
    bgmVolume: DEFAULT_BGM_VOLUME,
    sfxVolume: DEFAULT_SFX_VOLUME,
  },
  activityLogs: [],
  dailyMissionState: emptyMissionState(),
  pendingSession: null,
  confidantByStat: emptyConfidantPicks(),
  bondXpByStat: emptyBondXpByStat(),
};

export type LogActivityResult =
  | {
      ok: true;
      xpEarned: number;
      leveledUp: boolean;
      stat: StatType;
      prevLevel: number;
      newLevel: number;
      triggerAllOutAttack: boolean;
    }
  | { ok: false; reason: string };

export type StartSessionResult = { ok: true } | { ok: false; reason: string };

function newLogId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rolloverMissionState(dm: DailyMissionState, todayKey: string): DailyMissionState {
  if (dm.dateKey === todayKey) return dm;
  return {
    dateKey: todayKey,
    completedIds: [],
    allOutAttackShownForDate: null,
  };
}

type ApplyLogInput = UserState & { pendingAllOutAttack: boolean };

export type ConfidantRankUpPayload = {
  confidantId: string;
  displayName: string;
  shortName: string;
  stat: StatType;
  prevRank: number;
  newRank: number;
  /** IM-style one-liner (Phase 7 in-app “text”) */
  chatLine: string;
};

function applyActivityLog(
  s: ApplyLogInput,
  activityId: string,
  durationMinutes: number,
):
  | {
      ok: true;
      patch: Pick<
        UserState,
        | "stats"
        | "activityLogs"
        | "streak"
        | "dailyMissionState"
        | "bondXpByStat"
      > & {
        lastLevelUp: { stat: StatType; from: number; to: number } | null;
        pendingAllOutAttack: boolean;
        pendingDateReveal: DateRevealPayload | null;
        pendingConfidantRankUp: ConfidantRankUpPayload | null;
      };
      result: LogActivityResult;
    }
  | { ok: false; reason: string } {
  const activity = findActivityById(activityId);
  if (!activity) {
    return { ok: false, reason: "Unknown activity" };
  }

  const d = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(durationMinutes)));
  const xp = Math.round(xpEarned(d, BASE_XP_PER_MINUTE, activity.difficultyMultiplier));
  if (xp <= 0) {
    return { ok: false, reason: "No XP for that duration" };
  }

  const stat = activity.statCategory;
  const now = new Date();
  const todayKey = dateKeyFromDate(now);
  const timestamp = now.toISOString();

  const prevLevel = s.stats[stat].level;
  const totalXP = s.stats[stat].totalXP + xp;
  const newLevel = levelFromTotalXp(totalXP);
  const leveledUp = newLevel > prevLevel;

  const log: ActivityLog = {
    id: newLogId(),
    activityId,
    durationMinutes: d,
    xpEarned: xp,
    timestamp,
  };

  const activityLogs = [log, ...s.activityLogs].slice(0, LOG_CAP);

  let dailyMissionState = rolloverMissionState(s.dailyMissionState, todayKey);
  const completedSet = completedMissionIdsForDay(activityLogs, todayKey);
  dailyMissionState = {
    ...dailyMissionState,
    completedIds: DAILY_MISSION_IDS.filter((id) => completedSet.has(id)),
  };

  const allDone = allMissionsCompleteForDay(activityLogs, todayKey);
  const triggerAllOutAttack =
    allDone && dailyMissionState.allOutAttackShownForDate !== todayKey;

  const result: LogActivityResult = {
    ok: true,
    xpEarned: xp,
    leveledUp,
    stat,
    prevLevel,
    newLevel,
    triggerAllOutAttack,
  };

  const pendingDateReveal = isFirstLogOfLocalDay(s.activityLogs, todayKey)
    ? buildDateRevealPayload(now)
    : null;

  let bondXpByStat = s.bondXpByStat;
  let pendingConfidantRankUp: ConfidantRankUpPayload | null = null;

  const pickId = s.confidantByStat[stat];
  const partner = pickId ? findConfidantById(pickId) : undefined;
  if (partner && partner.stat === stat) {
    const delta = bondXpFromStatXp(xp);
    const prevBond = s.bondXpByStat[stat] ?? 0;
    const { newBondXp, rankUp } = applyBondXp(prevBond, delta);
    bondXpByStat = { ...s.bondXpByStat, [stat]: newBondXp };

    if (rankUp) {
      pendingConfidantRankUp = {
        confidantId: partner.id,
        displayName: partner.displayName,
        shortName: partner.shortName,
        stat,
        prevRank: rankUp.prevRank,
        newRank: rankUp.newRank,
        chatLine: rankUpChatLine(partner.shortName, rankUp.newRank, stat),
      };
    }
  }

  return {
    ok: true,
    patch: {
      stats: {
        ...s.stats,
        [stat]: { totalXP, level: newLevel },
      },
      activityLogs,
      streak: streakAfterLog(s.streak, todayKey),
      dailyMissionState,
      lastLevelUp: leveledUp ? { stat, from: prevLevel, to: newLevel } : null,
      pendingAllOutAttack: triggerAllOutAttack ? true : s.pendingAllOutAttack,
      pendingDateReveal,
      bondXpByStat,
      pendingConfidantRankUp,
    },
    result,
  };
}

type PhantomStore = UserState & {
  lastLevelUp: { stat: StatType; from: number; to: number } | null;
  pendingAllOutAttack: boolean;
  pendingDateReveal: DateRevealPayload | null;
  pendingConfidantRankUp: ConfidantRankUpPayload | null;
  setSettings: (partial: Partial<UserState["settings"]>) => void;
  setConfidantForStat: (stat: StatType, confidantId: string | null) => void;
  addStatXp: (stat: StatType, amount: number) => void;
  startActivitySession: (activityId: string, durationMinutes: number) => StartSessionResult;
  cancelActivitySession: () => void;
  claimActivitySession: () => LogActivityResult;
  clearLastLevelUp: () => void;
  clearDateReveal: () => void;
  clearConfidantRankUp: () => void;
  dismissAllOutAttack: () => void;
};

export const useStore = create<PhantomStore>()(
  persist(
    (set, get) => ({
      ...defaultUserState,
      lastLevelUp: null,
      pendingAllOutAttack: false,
      pendingDateReveal: null,
      pendingConfidantRankUp: null,

      setSettings: (partial) =>
        set((s) => {
          const next = { ...s.settings, ...partial };
          if (partial.bgmVolume !== undefined) {
            next.bgmVolume = clampVolume01(partial.bgmVolume, DEFAULT_BGM_VOLUME);
          }
          if (partial.sfxVolume !== undefined) {
            next.sfxVolume = clampVolume01(partial.sfxVolume, DEFAULT_SFX_VOLUME);
          }
          return { settings: next };
        }),

      clearLastLevelUp: () => set({ lastLevelUp: null }),

      clearDateReveal: () => set({ pendingDateReveal: null }),

      clearConfidantRankUp: () => set({ pendingConfidantRankUp: null }),

      setConfidantForStat: (stat, confidantId) =>
        set((s) => {
          if (confidantId === null) {
            return {
              confidantByStat: { ...s.confidantByStat, [stat]: null },
            };
          }
          const c = findConfidantById(confidantId);
          if (!c || c.stat !== stat) return {};
          return {
            confidantByStat: { ...s.confidantByStat, [stat]: confidantId },
          };
        }),

      dismissAllOutAttack: () => {
        const todayKey = dateKeyFromDate(new Date());
        set((s) => ({
          pendingAllOutAttack: false,
          dailyMissionState: {
            ...s.dailyMissionState,
            allOutAttackShownForDate: todayKey,
          },
        }));
      },

      addStatXp: (stat, amount) => {
        const n = Math.max(0, amount);
        if (n === 0) return;
        set((s) => {
          const totalXP = s.stats[stat].totalXP + n;
          return {
            stats: {
              ...s.stats,
              [stat]: { totalXP, level: levelFromTotalXp(totalXP) },
            },
            lastLevelUp: null,
          };
        });
      },

      startActivitySession: (activityId, durationMinutes) => {
        if (get().pendingSession) {
          return { ok: false, reason: "A session is already running" };
        }
        const activity = findActivityById(activityId);
        if (!activity) {
          return { ok: false, reason: "Unknown activity" };
        }
        const d = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(durationMinutes)));
        const started = Date.now();
        const endsAt = started + d * 60 * 1000;
        const session: ActivitySessionState = {
          activityId,
          durationMinutes: d,
          startedAtIso: new Date(started).toISOString(),
          endsAtIso: new Date(endsAt).toISOString(),
        };
        set({ pendingSession: session });
        return { ok: true };
      },

      cancelActivitySession: () => set({ pendingSession: null }),

      claimActivitySession: () => {
        const session = get().pendingSession;
        if (!session) {
          return { ok: false, reason: "No active session" };
        }
        if (Date.now() < new Date(session.endsAtIso).getTime()) {
          return { ok: false, reason: "Timer not finished" };
        }

        const s = get();
        const applied = applyActivityLog(
          { ...s, pendingAllOutAttack: s.pendingAllOutAttack },
          session.activityId,
          session.durationMinutes,
        );
        if (!applied.ok) {
          return applied;
        }
        set({ ...applied.patch, pendingSession: null });
        return applied.result;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persisted, version) => {
        let p = persisted as Partial<UserState> & Record<string, unknown>;
        if (version < 2) {
          p = {
            ...p,
            activityLogs: Array.isArray(p.activityLogs) ? p.activityLogs : [],
            dailyMissionState:
              p.dailyMissionState && typeof p.dailyMissionState === "object"
                ? (p.dailyMissionState as DailyMissionState)
                : emptyMissionState(),
          };
        }
        if (version < 3) {
          p = {
            ...p,
            pendingSession:
              p.pendingSession && typeof p.pendingSession === "object"
                ? (p.pendingSession as ActivitySessionState)
                : null,
          };
        }
        if (version < 4) {
          const prev = p.settings as
            | (Partial<UserState["settings"]> & { bgmTrackId?: string })
            | undefined;
          p = {
            ...p,
            settings: {
              bgmEnabled: prev?.bgmEnabled ?? true,
              sfxEnabled: prev?.sfxEnabled ?? true,
              rainEnabled: prev?.rainEnabled ?? true,
              bgmTrackId:
                typeof prev?.bgmTrackId === "string"
                  ? prev.bgmTrackId
                  : DEFAULT_BGM_TRACK_ID,
              bgmVolume: DEFAULT_BGM_VOLUME,
              sfxVolume: DEFAULT_SFX_VOLUME,
            },
          };
        }
        if (version < 5) {
          const s = p.settings as UserState["settings"] | undefined;
          p = {
            ...p,
            settings: {
              bgmEnabled: s?.bgmEnabled ?? true,
              sfxEnabled: s?.sfxEnabled ?? true,
              rainEnabled: s?.rainEnabled ?? true,
              bgmTrackId:
                typeof s?.bgmTrackId === "string" ? s.bgmTrackId : DEFAULT_BGM_TRACK_ID,
              bgmVolume: clampVolume01(s?.bgmVolume, DEFAULT_BGM_VOLUME),
              sfxVolume: clampVolume01(s?.sfxVolume, DEFAULT_SFX_VOLUME),
            },
          };
        }
        if (version < 6) {
          p = {
            ...p,
            confidantByStat: emptyConfidantPicks(),
            bondXpByStat: emptyBondXpByStat(),
          };
        }
        return p as unknown;
      },
      partialize: (state) => ({
        stats: state.stats,
        streak: state.streak,
        settings: state.settings,
        activityLogs: state.activityLogs,
        dailyMissionState: state.dailyMissionState,
        pendingSession: state.pendingSession,
        confidantByStat: state.confidantByStat,
        bondXpByStat: state.bondXpByStat,
      }),
      skipHydration: true,
    },
  ),
);
