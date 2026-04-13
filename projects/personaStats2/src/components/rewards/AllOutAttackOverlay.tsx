"use client";

import { useCallback, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { playPhantomSfx } from "@/lib/sfx";
import { personaButtonJolt } from "@/components/ui/PersonaButton";
import { useStore } from "@/store/useStore";

const AUTO_DISMISS_MS = 2800;

export function AllOutAttackOverlay() {
  const pending = useStore((s) => s.pendingAllOutAttack);
  const pendingDateReveal = useStore((s) => s.pendingDateReveal);
  const lastLevelUp = useStore((s) => s.lastLevelUp);
  const pendingConfidantRankUp = useStore((s) => s.pendingConfidantRankUp);
  const dismiss = useStore((s) => s.dismissAllOutAttack);
  const reduceMotion = useReducedMotion();

  const finish = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const blocked =
    !pending || pendingDateReveal || !!lastLevelUp || !!pendingConfidantRankUp;

  useEffect(() => {
    if (blocked) return;
    playPhantomSfx("allOut");
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
      className="fixed inset-0 z-[10060] flex flex-col items-center justify-center bg-black px-4"
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,0,18,0.45)_0%,transparent_55%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduceMotion ? 0.5 : [0, 1, 0.55] }}
        transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: "easeOut" }}
      />

      <motion.h2
        className="font-bebas text-center text-5xl tracking-[0.25em] text-paper sm:text-7xl"
        initial={reduceMotion ? false : { scale: 0.55, rotate: -10, opacity: 0 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : { scale: [0.55, 1.12, 1], rotate: [-10, 5, -2], opacity: 1 }
        }
        transition={{ duration: reduceMotion ? 0.2 : 0.7, ease: "easeOut" }}
      >
        ALL-OUT
        <br />
        <span className="text-persona-red">ATTACK!</span>
      </motion.h2>

      <motion.p
        className="font-marker mt-8 max-w-md text-center text-lg text-paper/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.35 }}
      >
        Daily missions cleared — you went for the finisher.
      </motion.p>

      <motion.button
        type="button"
        className="mt-10 border-2 border-paper px-8 py-3 font-bebas tracking-[0.3em] text-paper hover:bg-paper hover:text-ink"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: reduceMotion ? 0 : 0.55,
          type: "spring",
          stiffness: 520,
          damping: 28,
        }}
        whileHover={reduceMotion ? undefined : personaButtonJolt.hover}
        whileTap={reduceMotion ? undefined : personaButtonJolt.tap}
        onClick={finish}
      >
        RUSH AGAIN
      </motion.button>
    </motion.div>
  );
}
