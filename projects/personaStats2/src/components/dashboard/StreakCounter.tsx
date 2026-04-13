"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useStore } from "@/store/useStore";

export function StreakCounter() {
  const streak = useStore((s) => s.streak);
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="relative border-4 border-dashed border-paper bg-ink px-6 py-5 shadow-[8px_8px_0_0_#E60012]"
    >
      <div
        className="pointer-events-none absolute inset-1 border-2 border-persona-red/40"
        aria-hidden
      />
      <p className="font-marker text-center text-sm tracking-widest text-persona-red">
        STREAK
      </p>
      <div className="mt-3 flex items-end justify-center gap-10 font-bebas">
        <div className="text-center">
          <p className="text-xs tracking-[0.35em] text-paper/60">NOW</p>
          <p className="text-5xl leading-none text-paper">{streak.current}</p>
        </div>
        <div className="text-center">
          <p className="text-xs tracking-[0.35em] text-paper/60">BEST</p>
          <p className="text-4xl leading-none text-persona-red">{streak.longest}</p>
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-paper/45">
        Streak updates when you finish the timer and claim XP
      </p>
    </motion.div>
  );
}
