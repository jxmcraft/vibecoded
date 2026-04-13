"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { playPhantomSfx } from "@/lib/sfx";
import { PersonaButton } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

const AUTO_MS = 2800;

export function ConfidantRankUpOverlay() {
  const pending = useStore((s) => s.pendingConfidantRankUp);
  const lastLevelUp = useStore((s) => s.lastLevelUp);
  const pendingDateReveal = useStore((s) => s.pendingDateReveal);
  const clearConfidantRankUp = useStore((s) => s.clearConfidantRankUp);
  const reduceMotion = useReducedMotion();

  const blocked = !!pendingDateReveal || !!lastLevelUp;

  useEffect(() => {
    if (!pending || blocked) return;
    playPhantomSfx("confidantRankUp");
    const t = window.setTimeout(() => clearConfidantRankUp(), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [pending, blocked, clearConfidantRankUp]);

  if (!pending || blocked) return null;

  const { displayName, stat, prevRank, newRank, chatLine } = pending;

  return (
    <motion.div
      className="fixed inset-0 z-[10052] flex items-center justify-center bg-black/85 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.35 }}
      role="status"
      aria-live="polite"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) clearConfidantRankUp();
      }}
    >
      <motion.div
        className="max-w-md border-4 border-persona-red bg-ink px-8 py-10 text-center shadow-[10px_10px_0_0_rgba(255,255,255,0.12)]"
        initial={reduceMotion ? false : { scale: 0.9, rotate: -2, opacity: 0 }}
        animate={{ scale: 1, rotate: -1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <p className="font-marker text-persona-red">CONFIDANT RANK UP</p>
        <p className="font-bebas mt-4 text-3xl tracking-widest text-paper">{displayName}</p>
        <p className="font-bebas mt-2 text-xl text-paper/70">{stat}</p>
        <p className="font-bebas mt-4 text-2xl text-persona-red">
          {prevRank} → {newRank}
        </p>
        <p className="mt-4 border-l-2 border-persona-red/60 pl-3 text-left font-marker text-sm leading-relaxed text-paper/85">
          {chatLine}
        </p>
        <p className="font-marker mt-3 text-xs text-paper/50">
          The guild notices consistency — your bond deepened.
        </p>
        <PersonaButton
          type="button"
          variant="secondary"
          onClick={() => clearConfidantRankUp()}
          className="mt-8 border-paper/40 text-sm"
        >
          OK
        </PersonaButton>
      </motion.div>
    </motion.div>
  );
}
