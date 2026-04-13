"use client";

import { motion, useReducedMotion } from "framer-motion";

import { progressFractionTowardNextLevel } from "@/lib/leveling";
import { STAT_TYPES } from "@/lib/models";
import { useStore } from "@/store/useStore";

export function StatReadout() {
  const stats = useStore((s) => s.stats);
  const reduceMotion = useReducedMotion();

  return (
    <ul className="flex flex-col gap-3">
      {STAT_TYPES.map((t, i) => {
        const { level, totalXP } = stats[t];
        const p = progressFractionTowardNextLevel(totalXP);
        const pct = Math.round(p * 100);
        return (
          <motion.li
            key={t}
            initial={reduceMotion ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.35, ease: "easeOut" }}
            className="flex flex-col gap-1.5 border-l-4 border-persona-red bg-black/55 pl-3 pr-2 py-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bebas text-lg uppercase tracking-wide text-paper">
                {t}
              </span>
              <span className="font-bebas text-xl text-persona-red">LV {level}</span>
            </div>
            <div className="h-2 w-full bg-paper/10">
              <motion.div
                className="h-full bg-persona-red"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, delay: 0.06 * i, ease: "easeOut" }}
              />
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
