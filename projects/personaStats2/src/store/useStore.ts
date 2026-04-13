import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { findActivityById } from "@/data/activities";
import {
  findConfidantById,
  rankUpChatLine,
  emptyBondXpByStat,
  emptyConfidantPicks,
} from "@/data/confidants";
import { CALLING_CARD_PLEDGE_MAX_LEN, WEEKLY_BONUS_XP_PER_STAT } from "@/data/callingCard";
import { DEFAULT_BGM_TRACK_ID } from "@/data/audioTracks";
import { DAILY_MISSION_IDS } from "@/data/dailyMissions";
import { DEFAULT_BGM_VOLUME, DEFAULT_SFX_VOLUME, clampVolume01 } from "@/lib/audioLevels";
import { computeCallingCardRolloverPatch, sundayWeekStartKey } from "@/lib/callingCardWeek";
import { dateKeyFromDate } from "@/lib/dateKey";
import { applyBondXp, bondXpFromStatXp } from "@/lib/confidantBond";
import {
  grantedStatXpFromBase,
  MAX_GLOBAL_XP_MULTIPLIER,
  multiplierAfterExecutionFuse,
} from "@/lib/executionFuse";
import {
  buildDateRevealPayload,
  isFirstLogOfLocalDay,
  type DateRevealPayload,
} from "@/lib/firstLogOfDay";
import { emptyStatsRecord, levelFromTotalXp, xpEarned, BASE_XP_PER_MINUTE } from "@/lib/leveling";
import {
  STAT_TYPES,
  type ActivityLog,
  type ActivitySessionState,
  type CalendarEvent,
  type DailyMissionState,
  type StatType,
  type UserState,
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
    bgmShuffle: true,
    bgmVolume: DEFAULT_BGM_VOLUME,
    sfxVolume: DEFAULT_SFX_VOLUME,
  },
  activityLogs: [],
  dailyMissionState: emptyMissionState(),
  pendingSession: null,
  confidantByStat: emptyConfidantPicks(),
  bondXpByStat: emptyBondXpByStat(),
  globalXpMultiplier: 1,
  callingCard: null,
  monitoredMode: false,
  lastWeeklyOutcomeWeekStartKey: null,
  pendingWeeklyCallingCardReward: false,
  weeklyRewardForWeekStartKey: null,
  calendarEvents: [],
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

function newCalendarEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  const baseXp = Math.round(xpEarned(d, BASE_XP_PER_MINUTE, activity.difficultyMultiplier));
  const mult = s.globalXpMultiplier ?? 1;
  const xp = grantedStatXpFromBase(baseXp, mult);
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
  /** Incremented to open `TakeActionModal` on Home or Map (see `PhantomBottomDock`). Not persisted. */
  takeActionModalRequest: number;
  bumpTakeActionModalRequest: () => void;
  /** Set by `BgmPlayer` for dashboard “now spinning” when shuffle is on. Not persisted. */
  bgmNowPlayingLabel: string;
  setBgmNowPlayingLabel: (label: string) => void;
  setSettings: (partial: Partial<UserState["settings"]>) => void;
  setConfidantForStat: (stat: StatType, confidantId: string | null) => void;
  executionFuse: (stat: StatType) => boolean;
  addStatXp: (stat: StatType, amount: number) => void;
  startActivitySession: (activityId: string, durationMinutes: number) => StartSessionResult;
  cancelActivitySession: () => void;
  claimActivitySession: () => LogActivityResult;
  clearLastLevelUp: () => void;
  clearDateReveal: () => void;
  clearConfidantRankUp: () => void;
  dismissAllOutAttack: () => void;
  syncCallingCard: () => void;
  sendCallingCard: (pledge: string) => boolean;
  dismissWeeklyCallingCardReward: () => void;
  addCalendarEvent: (input: { title: string; dateKey: string }) => void;
  updateCalendarEvent: (id: string, partial: Partial<Pick<CalendarEvent, "title" | "dateKey">>) => void;
  removeCalendarEvent: (id: string) => void;
};

export const useStore = create<PhantomStore>()(
  persist(
    (set, get) => ({
      ...defaultUserState,
      lastLevelUp: null,
      pendingAllOutAttack: false,
      pendingDateReveal: null,
      pendingConfidantRankUp: null,
      takeActionModalRequest: 0,

      bumpTakeActionModalRequest: () =>
        set((s) => ({ takeActionModalRequest: s.takeActionModalRequest + 1 })),

      bgmNowPlayingLabel: "",

      setBgmNowPlayingLabel: (label) => set({ bgmNowPlayingLabel: label }),

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

      executionFuse: (stat) => {
        const s = get();
        if (levelFromTotalXp(s.stats[stat].totalXP) < 99) return false;
        set({
          stats: {
            ...s.stats,
            [stat]: { totalXP: 0, level: 0 },
          },
          globalXpMultiplier: multiplierAfterExecutionFuse(s.globalXpMultiplier ?? 1),
        });
        return true;
      },

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

      syncCallingCard: () => {
        set((s) => ({ ...computeCallingCardRolloverPatch(s, new Date()) }));
      },

      sendCallingCard: (pledge) => {
        if (get().pendingWeeklyCallingCardReward) return false;
        const trimmed = pledge.trim().slice(0, CALLING_CARD_PLEDGE_MAX_LEN);
        if (!trimmed) return false;
        set((s) => {
          const rollover = computeCallingCardRolloverPatch(s, new Date());
          const w = sundayWeekStartKey(new Date());
          return {
            ...rollover,
            callingCard: { weekStartKey: w, pledge: trimmed },
          };
        });
        return true;
      },

      dismissWeeklyCallingCardReward: () => {
        set((s) => {
          if (!s.pendingWeeklyCallingCardReward) return {};
          const stats = { ...s.stats };
          for (const st of STAT_TYPES) {
            const c = stats[st];
            const totalXP = c.totalXP + WEEKLY_BONUS_XP_PER_STAT;
            stats[st] = { totalXP, level: levelFromTotalXp(totalXP) };
          }
          return {
            stats,
            pendingWeeklyCallingCardReward: false,
            weeklyRewardForWeekStartKey: null,
          };
        });
      },

      addStatXp: (stat, amount) => {
        const n = Math.max(0, amount);
        if (n === 0) return;
        set((s) => {
          const xp = grantedStatXpFromBase(n, s.globalXpMultiplier ?? 1);
          if (xp <= 0) return {};
          const totalXP = s.stats[stat].totalXP + xp;
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
        const logs = applied.patch.activityLogs ?? s.activityLogs;
        const cardPatch = computeCallingCardRolloverPatch(
          {
            callingCard: s.callingCard,
            lastWeeklyOutcomeWeekStartKey: s.lastWeeklyOutcomeWeekStartKey,
            activityLogs: logs,
          },
          new Date(),
        );
        set({ ...applied.patch, ...cardPatch, pendingSession: null });
        return applied.result;
      },

      addCalendarEvent: (input) => {
        const title = input.title.trim();
        const dateKey = input.dateKey.trim();
        if (!title || !DATE_KEY_RE.test(dateKey)) return;
        const ev: CalendarEvent = { id: newCalendarEventId(), title, dateKey };
        set((s) => ({ calendarEvents: [...s.calendarEvents, ev] }));
      },

      updateCalendarEvent: (id, partial) => {
        set((s) => ({
          calendarEvents: s.calendarEvents.map((ev) => {
            if (ev.id !== id) return ev;
            const next = { ...ev, ...partial };
            if (partial.title !== undefined) next.title = partial.title.trim();
            if (partial.dateKey !== undefined) {
              const dk = partial.dateKey.trim();
              if (!DATE_KEY_RE.test(dk)) return ev;
              next.dateKey = dk;
            }
            return next;
          }),
        }));
      },

      removeCalendarEvent: (id) => {
        set((s) => ({
          calendarEvents: s.calendarEvents.filter((ev) => ev.id !== id),
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 10,
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
              bgmShuffle: true,
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
              bgmShuffle: typeof s?.bgmShuffle === "boolean" ? s.bgmShuffle : true,
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
        if (version < 7) {
          const rawStats = p.stats as UserState["stats"] | undefined;
          if (rawStats && typeof rawStats === "object") {
            const nextStats = { ...rawStats } as UserState["stats"];
            for (const st of STAT_TYPES) {
              const cell = nextStats[st];
              if (cell && typeof cell.totalXP === "number") {
                nextStats[st] = {
                  totalXP: cell.totalXP,
                  level: levelFromTotalXp(cell.totalXP),
                };
              }
            }
            p = { ...p, stats: nextStats };
          }
          const g = p.globalXpMultiplier;
          p = {
            ...p,
            globalXpMultiplier:
              typeof g === "number" && Number.isFinite(g) && g > 0
                ? Math.min(MAX_GLOBAL_XP_MULTIPLIER, g)
                : 1,
          };
        }
        if (version < 8) {
          p = {
            ...p,
            callingCard: null,
            monitoredMode: false,
            lastWeeklyOutcomeWeekStartKey: null,
            pendingWeeklyCallingCardReward: false,
            weeklyRewardForWeekStartKey: null,
          };
        }
        if (version < 9) {
          const s = p.settings as (UserState["settings"] & { bgmShuffle?: boolean }) | undefined;
          p = {
            ...p,
            settings: {
              bgmEnabled: s?.bgmEnabled ?? true,
              sfxEnabled: s?.sfxEnabled ?? true,
              rainEnabled: s?.rainEnabled ?? true,
              bgmTrackId:
                typeof s?.bgmTrackId === "string" ? s.bgmTrackId : DEFAULT_BGM_TRACK_ID,
              bgmShuffle: typeof s?.bgmShuffle === "boolean" ? s.bgmShuffle : true,
              bgmVolume: clampVolume01(s?.bgmVolume, DEFAULT_BGM_VOLUME),
              sfxVolume: clampVolume01(s?.sfxVolume, DEFAULT_SFX_VOLUME),
            },
          };
        }
        if (version < 10) {
          const raw = p.calendarEvents;
          p = {
            ...p,
            calendarEvents: Array.isArray(raw)
              ? (raw as CalendarEvent[]).filter(
                  (e) =>
                    e &&
                    typeof e.id === "string" &&
                    typeof e.title === "string" &&
                    typeof e.dateKey === "string",
                )
              : [],
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
        globalXpMultiplier: state.globalXpMultiplier,
        callingCard: state.callingCard,
        monitoredMode: state.monitoredMode,
        lastWeeklyOutcomeWeekStartKey: state.lastWeeklyOutcomeWeekStartKey,
        pendingWeeklyCallingCardReward: state.pendingWeeklyCallingCardReward,
        weeklyRewardForWeekStartKey: state.weeklyRewardForWeekStartKey,
        calendarEvents: state.calendarEvents,
      }),
      skipHydration: true,
    },
  ),
);
