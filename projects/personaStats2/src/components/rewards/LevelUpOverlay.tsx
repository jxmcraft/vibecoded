"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { playPhantomSfx } from "@/lib/sfx";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

const AUTO_MS = 2500;

export function LevelUpOverlay() {
  const lastLevelUp = useStore((s) => s.lastLevelUp);
  const clearLastLevelUp = useStore((s) => s.clearLastLevelUp);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!lastLevelUp) return;
    playPhantomSfx("levelUp");
    const t = window.setTimeout(() => clearLastLevelUp(), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [lastLevelUp, clearLastLevelUp]);

  if (!lastLevelUp) return null;

  const { stat, from, to } = lastLevelUp;

  return (
    <motion.div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/85 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.35 }}
      role="status"
      aria-live="polite"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) clearLastLevelUp();
      }}
    >
      <motion.div
        className="max-w-md border-4 border-persona-red bg-ink px-8 py-10 text-center shadow-[10px_10px_0_0_rgba(255,255,255,0.12)]"
        initial={reduceMotion ? false : { scale: 0.88, rotate: -2, opacity: 0 }}
        animate={{ scale: 1, rotate: -1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <p className="font-marker text-persona-red">LEVEL UP</p>
        <p className="font-bebas mt-4 text-4xl tracking-widest text-paper">{stat}</p>
        <p className="font-bebas mt-2 text-2xl text-persona-red">
          {from} → {to}
        </p>
        <p className="font-marker mt-4 text-sm text-paper/70">
          Your parameter surged. Keep the pressure on.
        </p>
        <PersonaButton
          type="button"
          variant="secondary"
          onClick={() => clearLastLevelUp()}
          className="mt-8 border-paper/40 text-sm"
        >
          OK
        </PersonaButton>
      </motion.div>
    </motion.div>
  );
}
