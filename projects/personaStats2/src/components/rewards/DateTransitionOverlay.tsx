"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { playPhantomSfx } from "@/lib/sfx";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

const AUTO_MS = 3200;

export function DateTransitionOverlay() {
  const pendingDateReveal = useStore((s) => s.pendingDateReveal);
  const clearDateReveal = useStore((s) => s.clearDateReveal);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!pendingDateReveal) return;
    playPhantomSfx("dateReveal");
    const t = window.setTimeout(() => clearDateReveal(), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [pendingDateReveal, clearDateReveal]);

  if (!pendingDateReveal) return null;

  const { weekday, month, day, year } = pendingDateReveal;

  return (
    <motion.div
      className="fixed inset-0 z-[10055] flex items-start justify-start bg-black/75 p-4 pt-8 sm:p-8 sm:pt-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.35 }}
      role="status"
      aria-live="polite"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) clearDateReveal();
      }}
    >
      <motion.div
        className="max-w-md border-4 border-persona-red bg-black px-6 py-8 shadow-[12px_12px_0_0_rgba(255,255,255,0.14)] sm:px-10 sm:py-10"
        initial={reduceMotion ? false : { x: -48, rotate: -3, opacity: 0 }}
        animate={{ x: 0, rotate: -1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
      >
        <p className="font-p5-display text-xs tracking-[0.35em] text-persona-red">TODAY</p>
        <p className="font-bebas mt-2 text-5xl tabular-nums leading-none tracking-widest text-paper sm:text-6xl">
          {month} {day}
        </p>
        <p className="font-p5-display mt-3 text-lg tracking-[0.2em] text-paper/90 sm:text-xl">
          {weekday}
        </p>
        <p className="font-bebas mt-2 text-2xl tracking-widest text-paper/50">{year}</p>
        <p className="font-marker mt-6 text-sm text-paper/65">
          First log of the day — another step on the calendar.
        </p>
        <PersonaButton
          type="button"
          variant="secondary"
          onClick={() => clearDateReveal()}
          className="mt-8 border-paper/40 text-sm"
        >
          OK
        </PersonaButton>
      </motion.div>
    </motion.div>
  );
}
