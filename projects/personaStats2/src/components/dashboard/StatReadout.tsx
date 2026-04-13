"use client";

import { motion, useReducedMotion } from "framer-motion";

import { confidantChromeForStat } from "@/data/confidants";
import { rankFromBondXp } from "@/lib/confidantBond";
import { progressFractionTowardNextLevel } from "@/lib/leveling";
import { STAT_TYPES } from "@/lib/models";
import { useStore } from "@/store/useStore";

export function StatReadout() {
  const stats = useStore((s) => s.stats);
  const confidantByStat = useStore((s) => s.confidantByStat);
  const bondXpByStat = useStore((s) => s.bondXpByStat);
  const reduceMotion = useReducedMotion();

  return (
    <ul className="flex flex-col gap-3">
      {STAT_TYPES.map((t, i) => {
        const { level, totalXP } = stats[t];
        const p = progressFractionTowardNextLevel(totalXP);
        const pct = Math.round(p * 100);
        const chrome = confidantChromeForStat(t, confidantByStat);
        const bond = bondXpByStat[t] ?? 0;
        const bondRank = rankFromBondXp(bond);
        const hasLink = confidantByStat[t] != null;
        return (
          <motion.li
            key={t}
            initial={reduceMotion ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.35, ease: "easeOut" }}
            className={`flex flex-col gap-1.5 border-l-4 ${chrome.borderAccentClass} bg-black/55 pl-3 pr-2 py-2`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bebas text-lg uppercase tracking-wide text-paper">
                {t}
              </span>
              <span className={`font-bebas text-xl ${chrome.labelTextClass}`}>LV {level}</span>
            </div>
            <div className="h-2 w-full bg-paper/10">
              <motion.div
                className={`h-full ${chrome.progressClass}`}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, delay: 0.06 * i, ease: "easeOut" }}
              />
            </div>
            {hasLink ? (
              <p className="font-marker text-[10px] text-paper/40">
                Confidant bond rank {bondRank} · {bond} XP
              </p>
            ) : null}
          </motion.li>
        );
      })}
    </ul>
  );
}
