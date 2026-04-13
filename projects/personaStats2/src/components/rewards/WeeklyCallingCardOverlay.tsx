"use client";

import { useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { playPhantomSfx } from "@/lib/sfx";
import { personaButtonJolt } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

const AUTO_DISMISS_MS = 3200;

export function WeeklyCallingCardOverlay() {
  const pending = useStore((s) => s.pendingWeeklyCallingCardReward);
  const pendingDateReveal = useStore((s) => s.pendingDateReveal);
  const lastLevelUp = useStore((s) => s.lastLevelUp);
  const pendingConfidantRankUp = useStore((s) => s.pendingConfidantRankUp);
  const pendingAllOutAttack = useStore((s) => s.pendingAllOutAttack);
  const dismiss = useStore((s) => s.dismissWeeklyCallingCardReward);
  const reduceMotion = useReducedMotion();

  const finish = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const blocked =
    !pending ||
    !!pendingDateReveal ||
    !!lastLevelUp ||
    !!pendingConfidantRankUp ||
    pendingAllOutAttack;

  useEffect(() => {
    if (blocked) return;
    playPhantomSfx("callingCardVictory");
    const t = window.setTimeout(finish, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [blocked, finish]);

  useEffect(() => {
    if (blocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocked, finish]);

  if (blocked) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[10061] flex flex-col items-center justify-center bg-black px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
      role="status"
      aria-live="assertive"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,200,80,0.35)_0%,transparent_55%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduceMotion ? 0.45 : [0, 1, 0.5] }}
        transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: "easeOut" }}
      />

      <motion.h2
        className="font-bebas text-center text-4xl tracking-[0.2em] text-paper sm:text-6xl"
        initial={reduceMotion ? false : { scale: 0.6, rotate: -6, opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : { scale: [0.6, 1.08, 1], rotate: [-6, 4, 0], opacity: 1 }
        }
        transition={{ duration: reduceMotion ? 0.2 : 0.75, ease: "easeOut" }}
      >
        CALLING CARD
        <br />
        <span className="text-amber-300">DELIVERED</span>
      </motion.h2>

      <motion.p
        className="font-marker mt-8 max-w-md text-center text-lg text-paper/85"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.25, duration: 0.35 }}
      >
        You hit the weekly XP target. Bonus parameters incoming — the heist continues.
      </motion.p>

      <motion.button
        type="button"
        className="mt-10 border-2 border-amber-400/80 px-8 py-3 font-bebas tracking-[0.3em] text-amber-100 hover:bg-amber-400/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: reduceMotion ? 0 : 0.5,
          type: "spring",
          stiffness: 520,
          damping: 28,
        }}
        whileHover={reduceMotion ? undefined : personaButtonJolt.hover}
        whileTap={reduceMotion ? undefined : personaButtonJolt.tap}
        onClick={finish}
      >
        TAKE THE BONUS
      </motion.button>
    </motion.div>
  );
}
