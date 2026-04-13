"use client";

import { motion, useReducedMotion } from "framer-motion";

import { useRouteWipe } from "@/components/providers/routeWipeContext";

/** Diagonal sweep: closed (invisible) → full screen. */
const COVER_FROM = "polygon(0 100%, 0 100%, 0 100%, 0 100%)";
const COVER_TO = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";

/** Full screen → swept off to the top-right (reveals route below). */
const REVEAL_TO = "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)";

const DURATION_COVER = 0.4;
const DURATION_REVEAL = 0.36;

const wipeClassName =
  "pointer-events-none fixed inset-0 z-9500 bg-[linear-gradient(127deg,#000000_0%,#000000_42%,#e60012_42%,#e60012_100%)]";

export function RouteWipeLayer() {
  const { phase, onCoverComplete, onRevealComplete, onEntryRevealComplete } =
    useRouteWipe();
  const reduceMotion = useReducedMotion();

  if (phase === "idle") return null;

  const duration = reduceMotion ? 0.08 : DURATION_COVER;
  const durationReveal = reduceMotion ? 0.08 : DURATION_REVEAL;

  if (phase === "covering") {
    return (
      <motion.div
        key="cover"
        className={wipeClassName}
        initial={{ clipPath: COVER_FROM }}
        animate={{ clipPath: COVER_TO }}
        transition={{ duration, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => {
          onCoverComplete();
        }}
        style={{ willChange: "clip-path" }}
        aria-hidden
      />
    );
  }

  const onRevealDone = phase === "revealing" ? onRevealComplete : onEntryRevealComplete;

  return (
    <motion.div
      key={phase === "revealing" ? "reveal" : "entry-reveal"}
      className={wipeClassName}
      initial={{ clipPath: COVER_TO }}
      animate={{ clipPath: REVEAL_TO }}
      transition={{ duration: durationReveal, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        onRevealDone();
      }}
      style={{ willChange: "clip-path" }}
      aria-hidden
    />
  );
}
