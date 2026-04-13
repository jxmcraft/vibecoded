"use client";

import { useReducedMotion } from "framer-motion";

import { useStore } from "@/store/useStore";

/**
 * Subtle “surveillance” strip when a pledged week missed the XP target.
 */
export function MonitoredChrome() {
  const monitored = useStore((s) => s.monitoredMode);
  const reduceMotion = useReducedMotion();

  if (!monitored) return null;

  return (
    <>
      <div className="h-9 w-full shrink-0" aria-hidden />
      <div
        className="pointer-events-none fixed left-0 right-0 top-0 z-[45] border-b-2 border-amber-500/70 bg-black/85 px-3 py-1.5 text-center motion-safe:shadow-[0_0_12px_rgba(245,158,11,0.35)]"
        role="status"
        aria-live="polite"
      >
        <p className="font-p5-display text-[10px] tracking-[0.35em] text-amber-400 motion-safe:animate-pulse motion-reduce:animate-none">
          SURVEILLANCE — ROUTINE INTEGRITY LOW — COMPLETE YOUR NEXT CALLING CARD
        </p>
        {reduceMotion ? null : (
          <div
            className="mx-auto mt-1 h-px max-w-md bg-gradient-to-r from-transparent via-amber-500/60 to-transparent motion-safe:animate-pulse"
            aria-hidden
          />
        )}
      </div>
    </>
  );
}
