"use client";

import { useEffect, useId, useMemo, useState } from "react";

import {
  CALLING_CARD_PLEDGE_MAX_LEN,
  WEEKLY_BONUS_XP_PER_STAT,
  WEEKLY_XP_TARGET,
} from "@/data/callingCard";
import { dateKeyFromDate } from "@/lib/dateKey";
import {
  dateKeysForSundayWeek,
  sundayWeekStartKey,
  totalXpForWeek,
} from "@/lib/callingCardWeek";
import { playPhantomSfx } from "@/lib/sfx";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

function formatDateKeyShort(key: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CallingCardPanel() {
  const labelId = useId();
  const logs = useStore((s) => s.activityLogs);
  const callingCard = useStore((s) => s.callingCard);
  const monitoredMode = useStore((s) => s.monitoredMode);
  const pendingWeeklyCallingCardReward = useStore((s) => s.pendingWeeklyCallingCardReward);
  const syncCallingCard = useStore((s) => s.syncCallingCard);
  const sendCallingCard = useStore((s) => s.sendCallingCard);

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    syncCallingCard();
  }, [syncCallingCard]);

  const now = new Date();
  const todayKey = dateKeyFromDate(now);
  const currentWeekStart = sundayWeekStartKey(now);
  const isSunday = now.getDay() === 0;

  const weekKeys = useMemo(() => dateKeysForSundayWeek(currentWeekStart), [currentWeekStart]);
  const weekEndKey = weekKeys[6] ?? currentWeekStart;
  const weekRangeLabel = `${formatDateKeyShort(currentWeekStart)} – ${formatDateKeyShort(weekEndKey)}`;

  const weekXp = useMemo(
    () => totalXpForWeek(logs, currentWeekStart),
    [logs, currentWeekStart],
  );

  const pledgeMatchesWeek =
    callingCard != null && callingCard.weekStartKey === currentWeekStart;
  const progress = Math.min(1, weekXp / WEEKLY_XP_TARGET);
  const pct = Math.round(progress * 100);

  const handleSend = () => {
    setSendError(null);
    if (pendingWeeklyCallingCardReward) {
      setSendError("Claim your weekly bonus first (finisher overlay).");
      return;
    }
    const ok = sendCallingCard(draft);
    if (!ok) {
      setSendError("Enter a goal (non-empty text).");
      return;
    }
    playPhantomSfx("callingCardSend");
    setDraft("");
  };

  return (
    <section aria-labelledby={labelId} className="border-2 border-paper/20 bg-black/40 px-4 py-4">
      <h2 id={labelId} className="font-p5-display -rotate-1 text-2xl tracking-[0.28em] text-paper">
        CALLING CARD
      </h2>
      <p className="font-marker mt-2 text-xs text-paper/55">
        Each <strong className="text-paper/75">Sunday week</strong> (Sun–Sat), send yourself a major
        goal. Earn <strong className="text-persona-red">{WEEKLY_XP_TARGET}+ XP</strong> that week
        (from claims) to clear it — massive finisher +{" "}
        <strong className="text-paper/80">+{WEEKLY_BONUS_XP_PER_STAT} XP every stat</strong> on
        success. Miss the target and the UI goes under <strong className="text-amber-400/90">surveillance</strong>{" "}
        until you nail the next card.
      </p>
      {isSunday ? (
        <p className="font-bebas mt-2 text-xs tracking-widest text-amber-300/90">
          SUNDAY — IDEAL DAY TO DROP YOUR CARD
        </p>
      ) : null}
      {monitoredMode ? (
        <p className="font-marker mt-2 border border-amber-500/40 bg-amber-950/30 px-2 py-2 text-xs text-amber-200/90">
          Monitored mode active. Send a new card this week and hit the XP target to clear the alert.
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <p className="font-bebas text-xs tracking-widest text-paper/50">CURRENT WEEK</p>
        <p className="font-bebas text-sm text-paper">{weekRangeLabel}</p>
        <div className="mt-2">
          <div className="flex justify-between font-bebas text-xs text-paper/60">
            <span>WEEKLY XP</span>
            <span>
              {weekXp} / {WEEKLY_XP_TARGET}
            </span>
          </div>
          <div
            className="mt-1 h-2 overflow-hidden border border-paper/25 bg-black/60"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={WEEKLY_XP_TARGET}
            aria-valuenow={weekXp}
            aria-label="XP progress toward weekly calling card target"
          >
            <div
              className="h-full bg-persona-red transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {pledgeMatchesWeek ? (
        <div className="mt-4 border border-dashed border-persona-red/50 bg-persona-red/5 px-3 py-3">
          <p className="font-bebas text-xs tracking-widest text-persona-red">ACTIVE PLEDGE</p>
          <p className="font-marker mt-1 text-sm text-paper/90">{callingCard.pledge}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <label htmlFor="calling-card-pledge" className="font-bebas text-xs tracking-widest text-paper/50">
            YOUR GOAL (THIS WEEK)
          </label>
          <textarea
            id="calling-card-pledge"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={CALLING_CARD_PLEDGE_MAX_LEN}
            className="w-full resize-y border-2 border-paper/30 bg-black px-3 py-2 font-marker text-sm text-paper outline-none focus:border-persona-red focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            placeholder="e.g. Ship the MVP draft, train 4 days, sleep before midnight…"
          />
          <PersonaButton type="button" variant="primary" className="font-p5-display" onClick={handleSend}>
            SEND CALLING CARD
          </PersonaButton>
          {sendError ? (
            <p className="font-marker text-sm text-persona-red" role="alert">
              {sendError}
            </p>
          ) : null}
        </div>
      )}

      <p className="font-marker mt-3 text-[10px] text-paper/40">Today (local): {todayKey}</p>
    </section>
  );
}
