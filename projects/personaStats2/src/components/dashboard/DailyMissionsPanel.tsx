"use client";

import { motion, useReducedMotion } from "framer-motion";

import { DAILY_MISSION_IDS, DAILY_MISSIONS, XP_BUDGET_MISSION_MIN } from "@/data/dailyMissions";
import { sundayWeekStartKey } from "@/lib/callingCardWeek";
import { dateKeyFromDate } from "@/lib/dateKey";
import { completedMissionIdsForDay } from "@/lib/missions";
import { PersonaNavLink } from "@/components/ui/PersonaNavLink";
import { useStore } from "@/store/useStore";

export function DailyMissionsPanel() {
  const logs = useStore((s) => s.activityLogs);
  const callingCard = useStore((s) => s.callingCard);
  const reduceMotion = useReducedMotion();
  const todayKey = dateKeyFromDate(new Date());
  const weekStart = sundayWeekStartKey(new Date());
  const needsCallingCard = callingCard == null || callingCard.weekStartKey !== weekStart;
  const done = completedMissionIdsForDay(logs, todayKey);
  const allComplete = DAILY_MISSION_IDS.every((id) => done.has(id));

  return (
    <section aria-label="Daily missions">
      <h2 className="font-p5-display -rotate-1 mb-4 text-2xl tracking-[0.28em] text-paper">
        DAILY MISSIONS
      </h2>
      <ul className="flex flex-col gap-3">
        {DAILY_MISSIONS.map((m, i) => {
          const complete = done.has(m.id);
          return (
            <motion.li
              key={m.id}
              initial={reduceMotion ? false : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              className={`flex gap-3 border-l-4 px-3 py-2 ${
                complete ? "border-persona-red bg-persona-red/10" : "border-paper/25 bg-black/50"
              }`}
            >
              <span
                className="font-bebas text-xl leading-none text-persona-red"
                aria-hidden
              >
                {complete ? "✓" : "○"}
              </span>
              <div>
                <p className="font-bebas text-lg tracking-wide text-paper">{m.title}</p>
                <p className="font-marker text-xs text-paper/60">
                  {m.id === "xp_budget"
                    ? `Earn ${XP_BUDGET_MISSION_MIN}+ XP today (from logs).`
                    : m.blurb}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
      <p className="font-marker mt-4 border border-dashed border-paper/20 bg-black/40 px-3 py-3 text-[11px] leading-relaxed text-paper/55">
        <span className="font-bebas tracking-[0.2em] text-persona-red">ALL-OUT ATTACK</span> — When{" "}
        <strong className="text-paper/80">all three</strong> missions are complete for today, the{" "}
        <em>next time you claim XP</em> from a finished focus session, the finisher cut-in plays (once
        per day). Use dev +XP or multiple sessions if you still need XP or a second stat category.
      </p>
      {allComplete ? (
        <p className="font-bebas mt-2 text-center text-xs tracking-[0.25em] text-persona-red">
          READY — CLAIM XP TO TRIGGER
        </p>
      ) : null}
      {needsCallingCard ? (
        <p className="font-marker mt-3 text-center text-[11px] text-paper/55">
          <PersonaNavLink
            href="/missions"
            className="font-bebas tracking-[0.15em] text-persona-red underline decoration-persona-red/50 underline-offset-2 hover:text-paper"
          >
            MISSIONS — SEND YOUR CALLING CARD
          </PersonaNavLink>
          <span className="text-paper/45"> (weekly goal, Sun–Sat)</span>
        </p>
      ) : null}
    </section>
  );
}
