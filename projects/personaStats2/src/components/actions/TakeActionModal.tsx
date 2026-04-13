"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { ACTIVITIES, findActivityById } from "@/data/activities";
import { BASE_XP_PER_MINUTE, xpEarned } from "@/lib/leveling";
import { formatCountdownMs, sessionRemainingMs } from "@/lib/sessionTimer";
import type { Activity } from "@/lib/models";
import { playPhantomSfx } from "@/lib/sfx";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { useStore, type LogActivityResult } from "@/store/useStore";

type TakeActionModalProps = {
  open: boolean;
  onClose: () => void;
};

const DURATION_MIN = 1;
const DURATION_MAX = 240;
const CHIPS = [15, 30, 60] as const;

const GROUPED_ACTIVITIES = (() => {
  const m = new Map<string, Activity[]>();
  for (const a of ACTIVITIES) {
    const list = m.get(a.statCategory) ?? [];
    list.push(a);
    m.set(a.statCategory, list);
  }
  return m;
})();

export function TakeActionModal({ open, onClose }: TakeActionModalProps) {
  const pendingSession = useStore((s) => s.pendingSession);
  const startActivitySession = useStore((s) => s.startActivitySession);
  const cancelActivitySession = useStore((s) => s.cancelActivitySession);
  const claimActivitySession = useStore((s) => s.claimActivitySession);

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [activityId, setActivityId] = useState<string>(ACTIVITIES[0]?.id ?? "");
  const [duration, setDuration] = useState<number>(30);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [formError, setFormError] = useState<string | null>(null);

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === activityId),
    [activityId],
  );

  const sessionActivity = useMemo(
    () => (pendingSession ? findActivityById(pendingSession.activityId) : undefined),
    [pendingSession],
  );

  const previewXp = useMemo(() => {
    if (!activity) return 0;
    const d = Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(duration)));
    return Math.round(xpEarned(d, BASE_XP_PER_MINUTE, activity.difficultyMultiplier));
  }, [activity, duration]);

  const remainingMs = useMemo(() => {
    if (!pendingSession) return 0;
    return sessionRemainingMs(pendingSession.endsAtIso, nowTick);
  }, [pendingSession, nowTick]);

  const canClaim = pendingSession != null && remainingMs <= 0;

  useEffect(() => {
    if (!open || !pendingSession) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [open, pendingSession]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const startSession = useCallback(() => {
    setFormError(null);
    const res = startActivitySession(activityId, duration);
    if (!res.ok) {
      setFormError(res.reason);
    } else {
      playPhantomSfx("startSession");
    }
  }, [activityId, duration, startActivitySession]);

  const abortSession = useCallback(() => {
    cancelActivitySession();
  }, [cancelActivitySession]);

  const claim = useCallback(() => {
    setFormError(null);
    const res: LogActivityResult = claimActivitySession();
    if (res.ok) {
      playPhantomSfx("claim");
      handleClose();
    } else if (res.reason !== "Timer not finished") {
      setFormError(res.reason);
    }
  }, [claimActivitySession, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 pt-10 pb-16 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[min(85vh,720px)] w-full max-w-lg overflow-y-auto border-4 border-persona-red bg-ink p-6 shadow-[12px_12px_0_0_rgba(230,0,18,0.35)] outline-none"
      >
        <div className="mb-6 space-y-3 border-b border-paper/15 pb-5">
          <h2
            id={titleId}
            className="font-p5-display text-3xl leading-tight tracking-[0.18em] text-paper"
          >
            TAKE ACTION
          </h2>
          <p className="font-marker max-w-prose text-sm leading-relaxed text-persona-red">
            {pendingSession
              ? "Focus timer is running. XP unlocks only after the countdown reaches zero."
              : "Start a timed session. No XP until the clock finishes."}
          </p>
        </div>

        {pendingSession ? (
          <div className="mt-6 space-y-5">
            <div className="border-2 border-paper/25 bg-black/60 px-4 py-4">
              <p className="font-bebas text-xs tracking-widest text-paper/60">SESSION</p>
              <p className="font-bebas text-2xl text-paper">
                {sessionActivity?.name ?? pendingSession.activityId}
              </p>
              <p className="font-marker mt-1 text-xs text-paper/50">
                {pendingSession.durationMinutes} min · ×
                {sessionActivity?.difficultyMultiplier ?? "?"}
              </p>
            </div>

            <div
              className="border border-dashed border-persona-red/70 bg-persona-red/15 px-4 py-6 text-center"
              aria-live="polite"
            >
              <p className="font-bebas text-xs tracking-[0.35em] text-paper/70">
                {canClaim ? "TIME UP" : "REMAINING"}
              </p>
              <p className="font-bebas mt-2 text-5xl tabular-nums text-persona-red sm:text-6xl">
                {canClaim ? "00:00" : formatCountdownMs(remainingMs)}
              </p>
            </div>

            <p className="text-center text-[11px] uppercase tracking-wider text-paper/45">
              Timer uses your device clock — leaving this screen does not pause it.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div>
              <label className="font-bebas text-xs tracking-widest text-paper/70">
                ACTIVITY
              </label>
              <select
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                className="mt-2 w-full border-2 border-paper/30 bg-black px-3 py-2 font-bebas text-lg text-paper outline-none focus:border-persona-red"
              >
                {[...GROUPED_ACTIVITIES.entries()].map(([stat, acts]) => (
                  <optgroup key={stat} label={stat.toUpperCase()}>
                    {acts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (×{a.difficultyMultiplier})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="duration-input"
                className="font-bebas text-xs tracking-widest text-paper/70"
              >
                MINUTES ({DURATION_MIN}–{DURATION_MAX})
              </label>
              <input
                id="duration-input"
                type="number"
                min={DURATION_MIN}
                max={DURATION_MAX}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-2 w-full border-2 border-paper/30 bg-black px-3 py-2 font-bebas text-xl text-paper outline-none focus:border-persona-red"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {CHIPS.map((m) => (
                  <PersonaButton
                    key={m}
                    type="button"
                    variant="chip"
                    onClick={() => setDuration(m)}
                  >
                    {m}m
                  </PersonaButton>
                ))}
              </div>
            </div>

            <div className="border border-dashed border-persona-red/60 bg-persona-red/10 px-4 py-3">
              <p className="font-bebas text-xs tracking-widest text-paper/60">PREVIEW (AFTER TIMER)</p>
              <p className="font-bebas text-2xl text-persona-red">+{previewXp} XP</p>
            </div>
          </div>
        )}

        {formError ? (
          <p className="mt-4 text-center font-marker text-sm text-persona-red" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4">
          {pendingSession && !canClaim ? (
            <p className="text-center font-bebas text-xs tracking-widest text-paper/45">
              Claim appears when the timer finishes.
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
          {pendingSession ? (
            <>
              <PersonaButton type="button" variant="ghost" onClick={abortSession}>
                ABORT SESSION
              </PersonaButton>
              <PersonaButton type="button" variant="secondary" onClick={handleClose}>
                CLOSE
              </PersonaButton>
              {canClaim ? (
                <PersonaButton type="button" variant="primary" onClick={claim}>
                  CLAIM XP
                </PersonaButton>
              ) : null}
            </>
          ) : (
            <>
              <PersonaButton type="button" variant="secondary" onClick={handleClose}>
                CANCEL
              </PersonaButton>
              <PersonaButton
                type="button"
                variant="primary"
                onClick={startSession}
                disabled={!activity}
              >
                START FOCUS TIMER
              </PersonaButton>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
